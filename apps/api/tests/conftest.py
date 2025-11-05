"""
Pytest configuration and shared fixtures for TQT backend tests.
"""

import pytest
import pandas as pd
import polars as pl
from pathlib import Path
from typing import Generator
import sys

# Add apps/api directory to path BEFORE pytest does its import magic
def pytest_configure(config):
    """Configure pytest before test collection."""
    API_DIR = Path(__file__).parent.parent
    if str(API_DIR) not in sys.path:
        sys.path.insert(0, str(API_DIR))
    print(f"[PYTEST_CONFIGURE] Added {API_DIR} to sys.path")


# Import FastAPI components after path is set
try:
    from main import app
    from fastapi.testclient import TestClient
except ImportError as e:
    print(f"[PYTEST] ⚠️  Could not import FastAPI app: {e}")
    app = None
    TestClient = None


# ============================================================================
# FastAPI Test Client
# ============================================================================

@pytest.fixture(scope="session")
def test_client() -> Generator[TestClient, None, None]:
    """
    FastAPI test client for integration tests.
    
    Usage:
        def test_endpoint(test_client):
            response = test_client.get("/api/candles")
            assert response.status_code == 200
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def api_base_url() -> str:
    """Base URL for API endpoints."""
    return "http://testserver"


# ============================================================================
# Test Data Paths
# ============================================================================

@pytest.fixture(scope="session")
def test_data_dir() -> Path:
    """Directory containing test data fixtures."""
    return Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def sample_data_dir() -> Path:
    """Directory containing sample historical data."""
    return ROOT_DIR / "apps" / "api" / "data" / "historical"


# ============================================================================
# Common Test Parameters
# ============================================================================

@pytest.fixture
def default_symbol() -> str:
    """Default trading symbol for tests."""
    return "BTC-PERP"


@pytest.fixture
def default_timeframe() -> str:
    """Default timeframe for tests."""
    return "1h"


@pytest.fixture
def test_symbols() -> list[str]:
    """List of symbols for parametrized tests."""
    return ["BTC-PERP", "ETH-PERP", "SOL-PERP"]


@pytest.fixture
def test_timeframes() -> list[str]:
    """List of timeframes for parametrized tests."""
    return ["1m", "5m", "15m", "1h", "4h", "1d"]


# ============================================================================
# Pandas/Polars DataFrame Fixtures
# ============================================================================

@pytest.fixture
def empty_ohlcv_pandas() -> pd.DataFrame:
    """Empty OHLCV DataFrame with correct schema."""
    return pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])


@pytest.fixture
def empty_ohlcv_polars() -> pl.DataFrame:
    """Empty OHLCV Polars DataFrame with correct schema."""
    return pl.DataFrame({
        'timestamp': [],
        'open': [],
        'high': [],
        'low': [],
        'close': [],
        'volume': []
    })


@pytest.fixture
def single_candle_pandas() -> pd.DataFrame:
    """Single candle for edge case testing."""
    return pd.DataFrame([{
        'timestamp': 1704067200,  # 2024-01-01 00:00:00
        'open': 30000.0,
        'high': 30100.0,
        'low': 29900.0,
        'close': 30050.0,
        'volume': 100.0
    }])


@pytest.fixture
def single_candle_polars() -> pl.DataFrame:
    """Single candle for edge case testing (Polars)."""
    return pl.DataFrame({
        'timestamp': [1704067200],
        'open': [30000.0],
        'high': [30100.0],
        'low': [29900.0],
        'close': [30050.0],
        'volume': [100.0]
    })


# ============================================================================
# Volume Profile Test Data
# ============================================================================

@pytest.fixture
def sample_volume_profile_response() -> dict:
    """
    Sample Volume Profile API response structure.
    Use this to validate API response format.
    """
    return {
        "symbol": "BTC-PERP",
        "timeframe": "1h",
        "timestamp_start": 1704067200,
        "timestamp_end": 1704153600,
        "candle_count": 24,
        "poc": {
            "price": 30000.0,
            "volume": 1500.0,
            "index": 50
        },
        "value_area": {
            "high": 30500.0,
            "low": 29500.0,
            "volume_pct": 0.70,
            "range_pct": 3.33
        },
        "lvn_zones": [
            {
                "price": 29800.0,
                "volume": 50.0,
                "range_low": 29750.0,
                "range_high": 29850.0,
                "is_gap": True
            }
        ],
        "hvn_zones": [
            {
                "price": 30000.0,
                "volume": 1500.0,
                "range_low": 29900.0,
                "range_high": 30100.0
            }
        ],
        "profile_data": [
            {"price": 29000.0, "volume": 100.0},
            {"price": 29500.0, "volume": 500.0},
            {"price": 30000.0, "volume": 1500.0},
            {"price": 30500.0, "volume": 800.0},
            {"price": 31000.0, "volume": 200.0},
        ],
        "total_volume": 3100.0,
        "avg_volume": 620.0
    }


# ============================================================================
# Market State Test Data
# ============================================================================

@pytest.fixture
def sample_market_state_response() -> dict:
    """
    Sample Market State API response structure.
    """
    return {
        "symbol": "BTC-PERP",
        "timeframe": "1h",
        "state": "BALANCE",
        "confidence": 0.85,
        "range": {
            "high": 30000.0,
            "low": 29000.0,
            "duration_bars": 30,
            "width_pct": 3.33
        },
        "breakout": None,
        "value_area_width_pct": 3.5,
        "time_in_range_pct": 0.75,
        "volume_profile": {
            "poc": 29500.0,
            "vah": 29800.0,
            "val": 29200.0
        }
    }


# ============================================================================
# Validation Helpers
# ============================================================================

@pytest.fixture
def validate_ohlcv_schema():
    """
    Helper function to validate OHLCV DataFrame schema.
    
    Usage:
        def test_data(validate_ohlcv_schema):
            df = load_data()
            validate_ohlcv_schema(df)
    """
    def _validate(df: pd.DataFrame | pl.DataFrame) -> None:
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        
        if isinstance(df, pd.DataFrame):
            assert all(col in df.columns for col in required_cols), \
                f"Missing columns. Required: {required_cols}, Got: {list(df.columns)}"
        elif isinstance(df, pl.DataFrame):
            assert all(col in df.columns for col in required_cols), \
                f"Missing columns. Required: {required_cols}, Got: {df.columns}"
        else:
            raise TypeError(f"Expected pd.DataFrame or pl.DataFrame, got {type(df)}")
    
    return _validate


@pytest.fixture
def validate_volume_profile():
    """
    Helper to validate Volume Profile data structure.
    """
    def _validate(profile: dict) -> None:
        # Check required keys
        required_keys = ['poc', 'value_area', 'profile_data']
        assert all(key in profile for key in required_keys), \
            f"Missing keys in profile: {set(required_keys) - set(profile.keys())}"
        
        # Validate POC
        assert 'price' in profile['poc']
        assert 'volume' in profile['poc']
        assert profile['poc']['volume'] > 0
        
        # Validate Value Area
        va = profile['value_area']
        assert va['high'] > va['low'], "VAH must be greater than VAL"
        assert 0 < va['volume_pct'] <= 1.0, "Volume percentage must be between 0 and 1"
        
        # Validate profile data
        assert len(profile['profile_data']) > 0, "Profile data cannot be empty"
        assert all('price' in p and 'volume' in p for p in profile['profile_data'])
    
    return _validate


@pytest.fixture
def validate_market_state():
    """
    Helper to validate Market State data structure.
    """
    def _validate(state: dict) -> None:
        # Check state type
        valid_states = ['BALANCE', 'TRENDING_UP', 'TRENDING_DOWN', 'FAILED_BREAKOUT']
        assert state['state'] in valid_states, \
            f"Invalid state: {state['state']}. Must be one of {valid_states}"
        
        # Check confidence
        assert 0.0 <= state['confidence'] <= 1.0, \
            f"Confidence must be between 0 and 1, got {state['confidence']}"
        
        # If BALANCE, must have range
        if state['state'] == 'BALANCE':
            assert state['range'] is not None, "BALANCE state must have range"
            assert state['range']['high'] > state['range']['low']
        
        # If TRENDING, must have breakout
        if state['state'] in ['TRENDING_UP', 'TRENDING_DOWN']:
            assert state['breakout'] is not None, "TRENDING state must have breakout info"
    
    return _validate


# ============================================================================
# Performance Benchmarking
# ============================================================================

@pytest.fixture
def benchmark_threshold():
    """
    Performance thresholds for various operations.
    """
    return {
        'volume_profile_1k_bars': 0.2,    # 200ms for 1K bars
        'volume_profile_10k_bars': 0.5,   # 500ms for 10K bars
        'market_state': 0.1,              # 100ms
        'api_response': 1.0,              # 1s max for any API call
    }


# ============================================================================
# Cleanup
# ============================================================================

@pytest.fixture(autouse=True)
def cleanup_test_artifacts():
    """
    Automatically clean up any test artifacts after each test.
    """
    yield
    # Cleanup code here if needed
    pass

