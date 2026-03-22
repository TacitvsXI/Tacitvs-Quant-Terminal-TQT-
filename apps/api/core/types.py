"""
Core data types for TQT trading system.
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum


# ============================================================================
# Market State Types
# ============================================================================

class MarketState(str, Enum):
    """Market state classification."""
    BALANCE = "BALANCE"
    TRENDING_UP = "TRENDING_UP"
    TRENDING_DOWN = "TRENDING_DOWN"
    FAILED_BREAKOUT = "FAILED_BREAKOUT"
    UNKNOWN = "UNKNOWN"


# ============================================================================
# Volume Profile Types
# ============================================================================

@dataclass
class POC:
    """Point of Control - price level with highest volume."""
    price: float
    volume: float
    index: int  # Index in the original data


@dataclass
class ValueArea:
    """Value Area - price range containing ~70% of volume."""
    high: float  # VAH - Value Area High
    low: float   # VAL - Value Area Low
    volume_pct: float  # Actual percentage of volume (should be ~0.70)
    range_pct: float   # Range width as % of price


@dataclass
class VolumeNode:
    """A volume concentration or gap zone."""
    price: float
    volume: float
    range_low: float
    range_high: float
    is_gap: bool = False  # True for LVN, False for HVN


@dataclass
class VolumeProfile:
    """Complete Volume Profile analysis result."""
    poc: POC
    value_area: ValueArea
    lvn_zones: list[VolumeNode]  # Low Volume Nodes
    hvn_zones: list[VolumeNode]  # High Volume Nodes
    profile_data: list[dict]  # [{"price": float, "volume": float}, ...]
    total_volume: float
    avg_volume: float
    candle_count: int
    timestamp_start: int
    timestamp_end: int


# ============================================================================
# Market State Detection Types
# ============================================================================

@dataclass
class Range:
    """Price range boundaries."""
    high: float
    low: float
    duration_bars: int
    width_pct: float


@dataclass
class Breakout:
    """Breakout event details."""
    price: float
    timestamp: int
    volume_ratio: float  # Volume surge compared to average
    direction: str  # 'up' or 'down'


@dataclass
class MarketStateResult:
    """Market state detection result."""
    state: MarketState
    confidence: float  # 0.0 to 1.0
    range: Optional[Range] = None
    breakout: Optional[Breakout] = None
    value_area_width_pct: Optional[float] = None
    time_in_range_pct: Optional[float] = None
    volume_profile: Optional[dict] = None  # POC, VAH, VAL for reference


# ============================================================================
# Trading Setup Types
# ============================================================================

@dataclass
class SetupSignal:
    """Trading setup signal."""
    setup_type: str  # 'TREND_CONTINUATION' or 'FAILED_BREAKOUT'
    direction: str   # 'LONG' or 'SHORT'
    entry_price: float
    stop_loss: float
    take_profit: float
    risk_reward: float
    confidence: float
    timestamp: int
    reasoning: str


@dataclass
class Position:
    """Active trading position."""
    symbol: str
    direction: str
    entry_price: float
    size: float
    stop_loss: float
    take_profit: float
    current_price: float
    pnl: float
    pnl_pct: float
    timestamp_open: int

















