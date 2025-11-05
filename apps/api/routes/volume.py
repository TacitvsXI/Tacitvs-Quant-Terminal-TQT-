"""
Volume Analysis API Routes
Provides CVD (Cumulative Volume Delta) and other volume metrics
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
import polars as pl
import numpy as np
from pathlib import Path
import sys

# Add root to path
ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

router = APIRouter()

# Data directory
DATA_DIR = ROOT_DIR / "data" / "historical"
API_DATA_DIR = ROOT_DIR / "apps" / "api" / "data" / "historical"


def calculate_volume_delta(df: pl.DataFrame) -> np.ndarray:
    """
    Calculate volume delta (buy volume - sell volume).
    
    Heuristic approach:
    - If close > open: bullish candle, assign positive volume
    - If close < open: bearish candle, assign negative volume
    - If close == open: neutral, assign 0
    
    More sophisticated approach (Weis Wave):
    - Buy volume = volume * (close - low) / (high - low)
    - Sell volume = volume * (high - close) / (high - low)
    """
    close_prices = df['close'].to_numpy()
    open_prices = df['open'].to_numpy()
    high_prices = df['high'].to_numpy()
    low_prices = df['low'].to_numpy()
    volumes = df['volume'].to_numpy()
    
    # Weis Wave method (more accurate)
    delta = np.zeros(len(df))
    
    for i in range(len(df)):
        high = high_prices[i]
        low = low_prices[i]
        close = close_prices[i]
        volume = volumes[i]
        
        if high == low:  # Doji or no range
            # Use simple method
            if close >= open_prices[i]:
                delta[i] = volume
            else:
                delta[i] = -volume
        else:
            # Weis Wave method
            range_size = high - low
            buy_volume = volume * (close - low) / range_size
            sell_volume = volume * (high - close) / range_size
            delta[i] = buy_volume - sell_volume
    
    return delta


def calculate_cvd(volume_delta: np.ndarray) -> np.ndarray:
    """Calculate Cumulative Volume Delta."""
    return np.cumsum(volume_delta)


@router.get("/cvd")
async def get_cvd(
    symbol: str = Query(..., description="Symbol (e.g., BTC-PERP)"),
    tf: str = Query("1d", description="Timeframe"),
    limit: int = Query(15000, ge=1, le=50000, description="Number of data points"),
) -> List[Dict[str, Any]]:
    """
    Calculate CVD (Cumulative Volume Delta) for a symbol.
    
    CVD shows the cumulative difference between buy and sell volume.
    Rising CVD = buying pressure
    Falling CVD = selling pressure
    
    Args:
        symbol: Market symbol (BTC-PERP, ETH-PERP, SOL-PERP)
        tf: Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
        limit: Number of data points to return
        
    Returns:
        List of CVD values with timestamps
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
        
        # Read data
        df = pl.read_parquet(file_path)
        
        # Verify required columns
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            raise HTTPException(
                status_code=500,
                detail=f"Missing columns in data: {missing_cols}"
            )
        
        # Sort by time and take last N candles
        df = df.sort('timestamp').tail(limit)
        
        # Convert timestamp to Unix seconds if needed
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
        
        # Calculate volume delta
        volume_delta = calculate_volume_delta(df)
        
        # Calculate CVD
        cvd = calculate_cvd(volume_delta)
        
        # Get timestamps
        timestamps = df['timestamp'].to_numpy()
        
        # Build response
        result = []
        for i in range(len(timestamps)):
            result.append({
                'time': int(timestamps[i]),
                'value': float(cvd[i]),
                'delta': float(volume_delta[i]),  # Also include delta for reference
            })
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating CVD: {str(e)}"
        )


@router.get("/volume-profile")
async def get_volume_profile(
    symbol: str = Query(..., description="Symbol (e.g., BTC-PERP)"),
    tf: str = Query("1d", description="Timeframe"),
    limit: int = Query(1000, ge=1, le=10000, description="Number of candles"),
    bins: int = Query(50, ge=10, le=200, description="Number of price levels"),
) -> Dict[str, Any]:
    """
    Calculate Volume Profile - volume distribution across price levels.
    
    Shows where most trading activity occurred.
    
    Args:
        symbol: Market symbol
        tf: Timeframe
        limit: Number of candles to analyze
        bins: Number of price levels to create
        
    Returns:
        Volume profile data with price levels and volumes
    """
    try:
        # Try primary data directory first
        file_path = DATA_DIR / symbol / f"{tf}.parquet"
        
        if not file_path.exists():
            file_path = API_DATA_DIR / symbol / f"{tf}.parquet"
        
        if not file_path.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Data not found for {symbol} on {tf} timeframe"
            )
        
        # Read data
        df = pl.read_parquet(file_path)
        df = df.tail(limit)
        
        # Get price range
        min_price = df['low'].min()
        max_price = df['high'].max()
        
        # Create price bins
        price_levels = np.linspace(min_price, max_price, bins + 1)
        volume_at_level = np.zeros(bins)
        
        # Distribute volume across price levels for each candle
        for row in df.iter_rows(named=True):
            low = row['low']
            high = row['high']
            volume = row['volume']
            
            # Find which bins this candle overlaps
            for i in range(bins):
                bin_low = price_levels[i]
                bin_high = price_levels[i + 1]
                
                # Check overlap
                overlap_low = max(low, bin_low)
                overlap_high = min(high, bin_high)
                
                if overlap_high > overlap_low:
                    # Calculate overlap percentage
                    overlap = (overlap_high - overlap_low) / (high - low) if high > low else 1.0
                    volume_at_level[i] += volume * overlap
        
        # Build response
        profile = []
        for i in range(bins):
            profile.append({
                'price': float((price_levels[i] + price_levels[i + 1]) / 2),
                'volume': float(volume_at_level[i]),
            })
        
        # Find POC (Point of Control) - price level with highest volume
        max_volume_idx = np.argmax(volume_at_level)
        poc_price = (price_levels[max_volume_idx] + price_levels[max_volume_idx + 1]) / 2
        
        return {
            'profile': profile,
            'poc': float(poc_price),
            'total_volume': float(df['volume'].sum()),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating volume profile: {str(e)}"
        )


