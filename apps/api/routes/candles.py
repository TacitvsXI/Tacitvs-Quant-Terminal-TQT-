"""
Candles API Routes
Provides historical OHLCV data for charting
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import polars as pl
from pathlib import Path
import sys

# Add root to path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

router = APIRouter()

# Data directory
DATA_DIR = ROOT_DIR / "data" / "historical"
API_DATA_DIR = ROOT_DIR / "apps" / "api" / "data" / "historical"


@router.get("/candles")
async def get_candles(
    symbol: str = Query(..., description="Symbol (e.g., BTC-PERP)"),
    tf: str = Query("1d", description="Timeframe (1m, 5m, 15m, 1h, 4h, 1d)"),
    limit: int = Query(15000, ge=1, le=50000, description="Number of candles"),
) -> List[Dict[str, Any]]:
    """
    Get historical OHLCV candles for a symbol.
    
    Args:
        symbol: Market symbol (BTC-PERP, ETH-PERP, SOL-PERP)
        tf: Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
        limit: Number of candles to return (default 15000, max 50000)
        
    Returns:
        List of candles with time, open, high, low, close, volume
    """
    try:
        # Try primary data directory first
        file_path = DATA_DIR / symbol / f"{tf}.parquet"
        
        # Fallback to API data directory
        if not file_path.exists():
            file_path = API_DATA_DIR / symbol / f"{tf}.parquet"
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Data not found for {symbol} on {tf} timeframe"
            )
        
        # Read with Polars (blazing fast! 🔥)
        df = pl.read_parquet(file_path)
        
        # Ensure required columns exist
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            raise HTTPException(
                status_code=500,
                detail=f"Missing columns in data: {missing_cols}"
            )
        
        # Take last N candles and sort by time
        df = df.tail(limit).sort('timestamp')
        
        # Convert timestamp to Unix seconds (for Lightweight Charts)
        # Handle datetime, milliseconds, or seconds
        timestamp_col = df['timestamp']
        
        # Check if it's a datetime type
        if timestamp_col.dtype in [pl.Datetime, pl.Date]:
            # Convert datetime to Unix timestamp (seconds)
            df = df.with_columns(
                (pl.col('timestamp').dt.epoch(time_unit='s')).alias('timestamp')
            )
        # Check if it's milliseconds (value > year 2033 in seconds)
        elif timestamp_col.dtype in [pl.Int64, pl.Int32, pl.UInt64, pl.UInt32]:
            max_val = timestamp_col.max()
            if max_val and max_val > 1_000_000_000_000:  # Milliseconds (>2001 in ms)
                df = df.with_columns(
                    (pl.col('timestamp') // 1000).alias('timestamp')
                )
        
        # Convert to dict for JSON response
        candles = df.select([
            pl.col('timestamp').alias('time'),
            'open',
            'high', 
            'low',
            'close',
            'volume'
        ]).to_dicts()
        
        return candles
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading candles: {str(e)}"
        )


@router.get("/candles/available")
async def get_available_data() -> Dict[str, Any]:
    """
    Get list of available symbols and timeframes.
    
    Returns:
        Dictionary with available markets and timeframes
    """
    available = {
        "symbols": [],
        "timeframes": ["1m", "5m", "15m", "1h", "4h", "1d"]
    }
    
    # Scan data directory
    if DATA_DIR.exists():
        for symbol_dir in DATA_DIR.iterdir():
            if symbol_dir.is_dir():
                available["symbols"].append(symbol_dir.name)
    
    # Also check API data directory
    if API_DATA_DIR.exists():
        for symbol_dir in API_DATA_DIR.iterdir():
            if symbol_dir.is_dir() and symbol_dir.name not in available["symbols"]:
                available["symbols"].append(symbol_dir.name)
    
    return available

