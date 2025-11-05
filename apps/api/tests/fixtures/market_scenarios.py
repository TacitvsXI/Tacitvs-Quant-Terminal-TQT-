"""
Market scenario fixtures for testing Volume Profile and Market State detection.

These fixtures create realistic market data scenarios:
- Balanced markets (range-bound)
- Trending markets (breakouts)
- Failed breakouts
- Impulse movements
"""

import pandas as pd
import polars as pl
import numpy as np
from datetime import datetime, timedelta
from typing import Literal


def create_balanced_market(
    center_price: float = 30000.0,
    range_pct: float = 2.0,
    bars: int = 50,
    timeframe: str = "1h",
    noise: float = 0.5
) -> pd.DataFrame:
    """
    Create a balanced (range-bound) market.
    
    Market characteristics:
    - Price oscillates around center_price
    - Range width = center_price ± range_pct%
    - Volume concentrated near center (POC)
    - 70%+ of bars within range
    
    Args:
        center_price: Center of the range
        range_pct: Range width as percentage (e.g., 2.0 = ±2%)
        bars: Number of candles
        timeframe: Timeframe string (for timestamp calculation)
        noise: Random noise factor (0-1)
    
    Returns:
        pd.DataFrame with OHLCV data
    """
    np.random.seed(42)
    
    # Calculate range boundaries
    range_width = center_price * (range_pct / 100)
    low_bound = center_price - range_width
    high_bound = center_price + range_width
    
    # Generate timestamps
    tf_minutes = _parse_timeframe_minutes(timeframe)
    start_time = datetime(2024, 1, 1)
    timestamps = [int((start_time + timedelta(minutes=i * tf_minutes)).timestamp()) 
                  for i in range(bars)]
    
    data = []
    for i, ts in enumerate(timestamps):
        # Oscillate around center with mean reversion
        position = (i % 20) / 20  # Cycle position
        base_price = low_bound + (high_bound - low_bound) * (0.3 + 0.4 * np.sin(position * 2 * np.pi))
        
        # Add noise
        price_noise = np.random.normal(0, center_price * 0.001 * noise)
        close_price = base_price + price_noise
        
        # Generate OHLC
        candle_range = center_price * 0.003  # 0.3% candle range
        open_price = close_price + np.random.uniform(-candle_range/2, candle_range/2)
        high_price = max(open_price, close_price) + np.random.uniform(0, candle_range/2)
        low_price = min(open_price, close_price) - np.random.uniform(0, candle_range/2)
        
        # Volume concentrated near center (POC)
        distance_from_center = abs(close_price - center_price) / range_width
        base_volume = 100.0
        volume = base_volume * (1.5 - distance_from_center) * np.random.uniform(0.8, 1.2)
        
        data.append({
            'timestamp': ts,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': round(volume, 2)
        })
    
    return pd.DataFrame(data)


def create_trending_market(
    start_price: float = 29000.0,
    end_price: float = 32000.0,
    bars: int = 30,
    timeframe: str = "1h",
    with_pullbacks: bool = True
) -> pd.DataFrame:
    """
    Create a trending market (breakout + continuation).
    
    Market characteristics:
    - Clear directional movement
    - Higher highs and higher lows (uptrend) or vice versa
    - Volume surge at breakout
    - Optional pullbacks to LVN zones
    
    Args:
        start_price: Initial price
        end_price: Final price
        bars: Number of candles
        timeframe: Timeframe string
        with_pullbacks: Include realistic pullbacks
    
    Returns:
        pd.DataFrame with OHLCV data
    """
    np.random.seed(42)
    
    direction = 1 if end_price > start_price else -1
    price_move = end_price - start_price
    
    # Generate timestamps
    tf_minutes = _parse_timeframe_minutes(timeframe)
    start_time = datetime(2024, 1, 1)
    timestamps = [int((start_time + timedelta(minutes=i * tf_minutes)).timestamp()) 
                  for i in range(bars)]
    
    data = []
    current_price = start_price
    
    for i, ts in enumerate(timestamps):
        # Progress through the move
        progress = i / (bars - 1)
        
        # Add pullbacks
        if with_pullbacks and i > 0:
            # Pullback every 8-10 bars
            pullback_cycle = (i % 9) / 9
            pullback_amplitude = abs(price_move) * 0.15 * np.sin(pullback_cycle * np.pi)
            current_price = start_price + (price_move * progress) - (pullback_amplitude * direction)
        else:
            current_price = start_price + (price_move * progress)
        
        # Add noise
        noise = np.random.normal(0, abs(price_move) * 0.01)
        close_price = current_price + noise
        
        # Generate OHLC
        candle_range = abs(price_move) * 0.02
        open_price = close_price - direction * candle_range * np.random.uniform(0.3, 0.7)
        
        if direction > 0:  # Uptrend
            high_price = max(open_price, close_price) + candle_range * np.random.uniform(0.1, 0.3)
            low_price = min(open_price, close_price) - candle_range * np.random.uniform(0, 0.1)
        else:  # Downtrend
            high_price = max(open_price, close_price) + candle_range * np.random.uniform(0, 0.1)
            low_price = min(open_price, close_price) - candle_range * np.random.uniform(0.1, 0.3)
        
        # Volume: surge at breakout (first 5 bars), normal afterwards
        base_volume = 100.0
        if i < 5:  # Breakout volume
            volume = base_volume * np.random.uniform(2.0, 3.0)
        elif with_pullbacks and (i % 9) in [4, 5]:  # Pullback volume
            volume = base_volume * np.random.uniform(0.6, 0.8)
        else:  # Normal volume
            volume = base_volume * np.random.uniform(0.9, 1.2)
        
        data.append({
            'timestamp': ts,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': round(volume, 2)
        })
    
    return pd.DataFrame(data)


def create_failed_breakout(
    balance_center: float = 30000.0,
    balance_range_pct: float = 2.0,
    balance_bars: int = 30,
    breakout_bars: int = 5,
    breakout_distance_pct: float = 1.5,
    direction: Literal['up', 'down'] = 'up',
    timeframe: str = "1h"
) -> pd.DataFrame:
    """
    Create a failed breakout scenario (key for Setup 2).
    
    Market characteristics:
    - Initial balance/range
    - Breakout attempt (exceeds range)
    - Failure: price returns inside range (reclaim)
    - Volume dies on breakout
    
    Args:
        balance_center: Center of initial balance
        balance_range_pct: Width of balance range
        balance_bars: Number of bars in balance
        breakout_bars: Number of bars in breakout attempt
        breakout_distance_pct: How far breakout goes beyond range
        direction: Breakout direction ('up' or 'down')
        timeframe: Timeframe string
    
    Returns:
        pd.DataFrame with OHLCV data (balance + breakout + reclaim)
    """
    # Phase 1: Create balance
    balance_data = create_balanced_market(
        center_price=balance_center,
        range_pct=balance_range_pct,
        bars=balance_bars,
        timeframe=timeframe
    )
    
    # Calculate range boundaries
    range_width = balance_center * (balance_range_pct / 100)
    high_bound = balance_center + range_width
    low_bound = balance_center - range_width
    
    # Phase 2: Breakout attempt
    breakout_target = (high_bound + balance_center * (breakout_distance_pct / 100)) if direction == 'up' \
                      else (low_bound - balance_center * (breakout_distance_pct / 100))
    
    last_timestamp = balance_data['timestamp'].iloc[-1]
    tf_minutes = _parse_timeframe_minutes(timeframe)
    
    breakout_data = []
    for i in range(breakout_bars):
        ts = last_timestamp + (i + 1) * tf_minutes * 60
        
        # Price gradually moves to breakout target
        progress = (i + 1) / breakout_bars
        current_price = (high_bound if direction == 'up' else low_bound) + \
                        (breakout_target - (high_bound if direction == 'up' else low_bound)) * progress
        
        # Generate OHLC
        close_price = current_price
        candle_range = balance_center * 0.005
        
        if direction == 'up':
            open_price = close_price - candle_range * 0.5
            high_price = close_price + candle_range * 0.3
            low_price = open_price - candle_range * 0.2
        else:
            open_price = close_price + candle_range * 0.5
            high_price = open_price + candle_range * 0.2
            low_price = close_price - candle_range * 0.3
        
        # Volume: high initially, dies out
        volume = 120.0 * (1.5 - progress)  # Decreasing volume
        
        breakout_data.append({
            'timestamp': ts,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': round(volume, 2)
        })
    
    # Phase 3: Reclaim (return inside range)
    reclaim_bars = 5
    reclaim_target = balance_center  # Return to center
    
    last_breakout_ts = breakout_data[-1]['timestamp']
    reclaim_data = []
    
    for i in range(reclaim_bars):
        ts = last_breakout_ts + (i + 1) * tf_minutes * 60
        
        progress = (i + 1) / reclaim_bars
        current_price = breakout_target + (reclaim_target - breakout_target) * progress
        
        close_price = current_price
        candle_range = balance_center * 0.008
        
        if direction == 'up':  # Reclaim down
            open_price = close_price + candle_range * 0.5
            high_price = open_price + candle_range * 0.2
            low_price = close_price - candle_range * 0.3
        else:  # Reclaim up
            open_price = close_price - candle_range * 0.5
            high_price = close_price + candle_range * 0.3
            low_price = open_price - candle_range * 0.2
        
        # Volume surges on reclaim
        volume = 100.0 * (1.0 + progress)
        
        reclaim_data.append({
            'timestamp': ts,
            'open': round(open_price, 2),
            'high': round(high_price, 2),
            'low': round(low_price, 2),
            'close': round(close_price, 2),
            'volume': round(volume, 2)
        })
    
    # Combine all phases
    full_data = pd.concat([
        balance_data,
        pd.DataFrame(breakout_data),
        pd.DataFrame(reclaim_data)
    ], ignore_index=True)
    
    return full_data


def create_breakout_scenario(
    balance_range: tuple[float, float] = (29000.0, 30000.0),
    balance_bars: int = 30,
    breakout_direction: Literal['up', 'down'] = 'up',
    breakout_target: float = 31500.0,
    breakout_bars: int = 10,
    timeframe: str = "1h"
) -> pd.DataFrame:
    """
    Create a complete breakout scenario (balance → breakout → trend).
    Useful for testing TRENDING_UP/DOWN state detection.
    
    Args:
        balance_range: (low, high) of initial balance
        balance_bars: Number of bars in balance
        breakout_direction: Direction of breakout
        breakout_target: Target price after breakout
        breakout_bars: Number of bars in breakout move
        timeframe: Timeframe string
    
    Returns:
        pd.DataFrame with complete breakout scenario
    """
    balance_center = sum(balance_range) / 2
    range_pct = ((balance_range[1] - balance_range[0]) / balance_center) * 100
    
    # Create balance phase
    balance_data = create_balanced_market(
        center_price=balance_center,
        range_pct=range_pct / 2,  # Convert to ±%
        bars=balance_bars,
        timeframe=timeframe
    )
    
    # Create trending phase
    start_price = balance_range[1] if breakout_direction == 'up' else balance_range[0]
    trend_data = create_trending_market(
        start_price=start_price,
        end_price=breakout_target,
        bars=breakout_bars,
        timeframe=timeframe,
        with_pullbacks=True
    )
    
    # Adjust timestamps
    last_balance_ts = balance_data['timestamp'].iloc[-1]
    tf_minutes = _parse_timeframe_minutes(timeframe)
    trend_data['timestamp'] = trend_data['timestamp'].apply(
        lambda x: last_balance_ts + (x - trend_data['timestamp'].iloc[0]) + tf_minutes * 60
    )
    
    # Combine
    full_data = pd.concat([balance_data, trend_data], ignore_index=True)
    return full_data


# ============================================================================
# Helper Functions
# ============================================================================

def _parse_timeframe_minutes(tf: str) -> int:
    """Convert timeframe string to minutes."""
    mapping = {
        '1m': 1,
        '5m': 5,
        '15m': 15,
        '1h': 60,
        '4h': 240,
        '1d': 1440
    }
    return mapping.get(tf, 60)


def to_polars(df: pd.DataFrame) -> pl.DataFrame:
    """Convert pandas DataFrame to Polars."""
    return pl.from_pandas(df)


# ============================================================================
# Convenience Functions
# ============================================================================

def get_balanced_market_fixture(format: Literal['pandas', 'polars'] = 'pandas'):
    """Get balanced market fixture in specified format."""
    df = create_balanced_market()
    return df if format == 'pandas' else to_polars(df)


def get_trending_market_fixture(format: Literal['pandas', 'polars'] = 'pandas'):
    """Get trending market fixture in specified format."""
    df = create_trending_market()
    return df if format == 'pandas' else to_polars(df)


def get_failed_breakout_fixture(format: Literal['pandas', 'polars'] = 'pandas'):
    """Get failed breakout fixture in specified format."""
    df = create_failed_breakout()
    return df if format == 'pandas' else to_polars(df)



