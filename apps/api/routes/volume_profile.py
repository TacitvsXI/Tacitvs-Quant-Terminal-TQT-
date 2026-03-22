"""
Volume Profile API endpoints.

Provides Volume Profile analysis for trading symbols.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
import polars as pl
from pathlib import Path

from core.analysis.volume_profile import VolumeProfileCalculator
from core.types import VolumeProfile

router = APIRouter()

# Data directories
API_DATA_DIR = Path(__file__).parent.parent / "data" / "historical"


@router.get("/volume_profile")
async def get_volume_profile(
    symbol: str = Query(..., description="Symbol (e.g., BTC-PERP)"),
    tf: str = Query("1h", description="Timeframe (1m, 5m, 15m, 1h, 4h, 1d)"),
    range_type: str = Query("day", description="Range type: 'day', 'session', or 'fixed'"),
    start_time: Optional[int] = Query(None, description="Start timestamp for fixed range"),
    end_time: Optional[int] = Query(None, description="End timestamp for fixed range"),
    limit: int = Query(1000, ge=100, le=50000, description="Number of candles for session"),
) -> Dict[str, Any]:
    """
    Get Volume Profile for a symbol.
    
    Returns POC, Value Area (VAH/VAL), LVN zones, HVN zones, and profile data.
    
    Range types:
    - 'day': Last 24h of data
    - 'session': Last N candles (use limit parameter)
    - 'fixed': Specific time range (requires start_time and end_time)
    """
    # Load data - try both directory structures
    file_path = API_DATA_DIR / symbol / f"{tf}.parquet"
    if not file_path.exists():
        # Try alternative format
        file_path = API_DATA_DIR / f"{symbol.replace('-', '_').lower()}_{tf}.parquet"
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Data not found for {symbol} on {tf} timeframe"
        )
    
    try:
        df = pl.read_parquet(file_path)
        
        # Validate columns
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        missing = [col for col in required_cols if col not in df.columns]
        if missing:
            raise HTTPException(
                status_code=500,
                detail=f"Missing columns: {missing}"
            )
        
        # Convert timestamp if needed
        timestamp_col = df['timestamp']
        if timestamp_col.dtype in [pl.Datetime, pl.Date]:
            df = df.with_columns(
                (pl.col('timestamp').dt.epoch(time_unit='s')).alias('timestamp')
            )
        elif timestamp_col.dtype in [pl.Int64, pl.Int32, pl.UInt64, pl.UInt32]:
            max_val = timestamp_col.max()
            if max_val and max_val > 2000000000000:
                df = df.with_columns(
                    (pl.col('timestamp') // 1000).alias('timestamp')
                )
        
        # Filter data based on range_type
        if range_type == "fixed":
            if start_time is None or end_time is None:
                raise HTTPException(
                    status_code=400,
                    detail="start_time and end_time required for fixed range"
                )
            df = df.filter(
                (pl.col('timestamp') >= start_time) & 
                (pl.col('timestamp') <= end_time)
            )
        elif range_type == "day":
            # Last 24 hours
            latest_ts = df['timestamp'].max()
            day_ago = latest_ts - (24 * 3600)
            df = df.filter(pl.col('timestamp') >= day_ago)
        elif range_type == "session":
            # Last N candles
            df = df.tail(limit)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid range_type: {range_type}"
            )
        
        if len(df) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No data found for specified range"
            )
        
        # Calculate Volume Profile
        calculator = VolumeProfileCalculator(df.to_pandas())
        profile = calculator.calculate()
        
        # Format response
        response = {
            "symbol": symbol,
            "timeframe": tf,
            "range_type": range_type,
            "timestamp_start": profile.timestamp_start,
            "timestamp_end": profile.timestamp_end,
            "candle_count": profile.candle_count,
            "poc": {
                "price": float(profile.poc.price),
                "volume": float(profile.poc.volume),
                "index": int(profile.poc.index)
            },
            "value_area": {
                "high": float(profile.value_area.high),
                "low": float(profile.value_area.low),
                "volume_pct": float(profile.value_area.volume_pct),
                "range_pct": float(profile.value_area.range_pct)
            },
            "lvn_zones": [
                {
                    "price": float(zone.price),
                    "volume": float(zone.volume),
                    "range_low": float(zone.range_low),
                    "range_high": float(zone.range_high),
                    "is_gap": zone.is_gap
                }
                for zone in profile.lvn_zones
            ],
            "hvn_zones": [
                {
                    "price": float(zone.price),
                    "volume": float(zone.volume),
                    "range_low": float(zone.range_low),
                    "range_high": float(zone.range_high)
                }
                for zone in profile.hvn_zones
            ],
            "profile_data": profile.profile_data,
            "total_volume": float(profile.total_volume),
            "avg_volume": float(profile.avg_volume)
        }
        
        return response
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating Volume Profile: {str(e)}"
        )

