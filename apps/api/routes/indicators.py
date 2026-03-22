"""
Indicators API Routes
Provides technical indicators (RSI, EMA, SMA, etc.)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
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


def calculate_rsi(close: np.ndarray, period: int = 14) -> np.ndarray:
    """Calculate RSI indicator."""
    deltas = np.diff(close)
    seed = deltas[:period + 1]
    up = seed[seed >= 0].sum() / period
    down = -seed[seed < 0].sum() / period
    
    if down == 0:
        return np.full(len(close), 100.0)
    
    rs = up / down
    rsi = np.zeros_like(close)
    rsi[:period] = np.nan
    rsi[period] = 100. - 100. / (1. + rs)
    
    for i in range(period + 1, len(close)):
        delta = deltas[i - 1]
        
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta
        
        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period
        
        if down == 0:
            rsi[i] = 100.
        else:
            rs = up / down
            rsi[i] = 100. - 100. / (1. + rs)
    
    return rsi


def calculate_ema(data: np.ndarray, period: int) -> np.ndarray:
    """Calculate EMA indicator."""
    ema = np.zeros_like(data, dtype=float)
    ema[:period] = np.nan
    
    # First EMA is SMA
    ema[period - 1] = np.mean(data[:period])
    
    # Calculate multiplier
    multiplier = 2.0 / (period + 1)
    
    # Calculate EMA
    for i in range(period, len(data)):
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
    
    return ema


def calculate_sma(data: np.ndarray, period: int) -> np.ndarray:
    """Calculate SMA indicator."""
    sma = np.full(len(data), np.nan)
    
    for i in range(period - 1, len(data)):
        sma[i] = np.mean(data[i - period + 1:i + 1])
    
    return sma


def calculate_bbands(close: np.ndarray, period: int = 20, std_dev: float = 2.0) -> Dict[str, np.ndarray]:
    """Calculate Bollinger Bands."""
    sma = calculate_sma(close, period)
    
    std = np.full(len(close), np.nan)
    for i in range(period - 1, len(close)):
        std[i] = np.std(close[i - period + 1:i + 1])
    
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)
    
    return {
        'upper': upper,
        'middle': sma,
        'lower': lower
    }


@router.get("/indicators")
async def get_indicator(
    symbol: str = Query(..., description="Symbol (e.g., BTC-PERP)"),
    tf: str = Query("1d", description="Timeframe"),
    indicator: str = Query("rsi", description="Indicator type (rsi, ema, sma, bbands)"),
    length: int = Query(14, ge=2, le=500, description="Indicator period/length"),
    limit: int = Query(15000, ge=1, le=50000, description="Number of data points"),
) -> List[Dict[str, Any]]:
    """
    Calculate and return technical indicator data.
    
    Args:
        symbol: Market symbol (BTC-PERP, ETH-PERP, SOL-PERP)
        tf: Timeframe (1m, 5m, 15m, 1h, 4h, 1d)
        indicator: Indicator type (rsi, ema, sma, bbands)
        length: Period/length for the indicator
        limit: Number of data points to return
        
    Returns:
        List of indicator values with timestamps
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
        
        if 'close' not in df.columns:
            raise HTTPException(
                status_code=500,
                detail="Close price column not found in data"
            )
        
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
        
        # Convert to numpy for calculations
        close_prices = df['close'].to_numpy()
        timestamps = df['timestamp'].to_numpy()
        
        # Calculate indicator
        indicator_lower = indicator.lower()
        
        if indicator_lower == 'rsi':
            values = calculate_rsi(close_prices, period=length)
        
        elif indicator_lower == 'ema':
            values = calculate_ema(close_prices, period=length)
        
        elif indicator_lower == 'sma':
            values = calculate_sma(close_prices, period=length)
        
        elif indicator_lower == 'bbands':
            bbands = calculate_bbands(close_prices, period=length)
            
            # Return all three bands
            result = []
            for i in range(len(timestamps)):
                if not np.isnan(bbands['middle'][i]):
                    # Convert timestamp
                    time = int(timestamps[i])
                    if time > 2000000000000:
                        time = time // 1000
                    
                    result.append({
                        'time': time,
                        'upper': float(bbands['upper'][i]),
                        'middle': float(bbands['middle'][i]),
                        'lower': float(bbands['lower'][i]),
                    })
            
            return result[-limit:]
        
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown indicator: {indicator}. Available: rsi, ema, sma, bbands"
            )
        
        # Build response (skip NaN values)
        result = []
        for i in range(len(values)):
            if not np.isnan(values[i]):
                result.append({
                    'time': int(timestamps[i]),
                    'value': float(values[i])
                })
        
        # Return last N values
        return result[-limit:]
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating indicator: {str(e)}"
        )


@router.get("/indicators/available")
async def get_available_indicators() -> Dict[str, Any]:
    """
    Get list of available indicators.
    
    Returns:
        Dictionary with available indicators and their descriptions
    """
    return {
        "indicators": [
            {
                "id": "rsi",
                "name": "RSI",
                "description": "Relative Strength Index",
                "default_period": 14,
                "min_period": 2,
                "max_period": 100
            },
            {
                "id": "ema",
                "name": "EMA",
                "description": "Exponential Moving Average",
                "default_period": 20,
                "min_period": 2,
                "max_period": 500
            },
            {
                "id": "sma",
                "name": "SMA",
                "description": "Simple Moving Average",
                "default_period": 20,
                "min_period": 2,
                "max_period": 500
            },
            {
                "id": "bbands",
                "name": "Bollinger Bands",
                "description": "Bollinger Bands (3 lines: upper, middle, lower)",
                "default_period": 20,
                "min_period": 2,
                "max_period": 100
            }
        ]
    }

