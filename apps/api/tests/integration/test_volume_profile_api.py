"""
Integration tests for Volume Profile API endpoints.

Tests /api/volume_profile endpoint with real FastAPI client.
"""

import pytest
from httpx import AsyncClient
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))


@pytest.mark.integration
@pytest.mark.api
@pytest.mark.asyncio
class TestVolumeProfileAPI:
    """Integration tests for /api/volume_profile endpoint."""
    
    async def test_get_volume_profile_success(self, test_client):
        """
        Test Case 3.1.1: GET /api/volume_profile - Success
        
        GIVEN: Valid symbol and timeframe
        WHEN: GET /api/volume_profile
        THEN: Should return 200 with complete volume profile
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/volume_profile",
            params={
                "symbol": "BTC-PERP",
                "tf": "1h",
                "range_type": "day",
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert "poc" in data
        assert "value_area" in data
        assert "lvn_zones" in data
        assert "hvn_zones" in data
        assert "profile_data" in data
        
        # Validate POC
        assert isinstance(data["poc"]["price"], (int, float))
        assert data["poc"]["volume"] > 0
        
        # Validate Value Area
        assert data["value_area"]["high"] > data["value_area"]["low"]
        assert 0.6 <= data["value_area"]["volume_pct"] <= 0.8
        
        # Validate profile data
        assert len(data["profile_data"]) > 0
        assert all("price" in item and "volume" in item for item in data["profile_data"])
    
    async def test_get_volume_profile_fixed_range(self, test_client):
        """
        Test Case 3.1.2: GET /api/volume_profile - Fixed Range
        
        GIVEN: Specific time range
        WHEN: GET with start/end timestamps
        THEN: Should return profile for that range only
        """
        pytest.skip("API endpoint not yet implemented")
        
        import time
        now = int(time.time())
        start_time = now - 3600 * 5  # Last 5 hours
        end_time = now
        
        response = test_client.get(
            "/api/volume_profile",
            params={
                "symbol": "BTC-PERP",
                "tf": "5m",
                "range_type": "fixed",
                "start_time": start_time,
                "end_time": end_time,
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["timestamp_start"] == start_time
        assert data["timestamp_end"] == end_time
        assert data["candle_count"] <= 60  # Max 5h / 5m
    
    async def test_get_volume_profile_missing_symbol(self, test_client):
        """
        Test Case 3.1.3: Error - Missing Symbol
        
        GIVEN: Request without symbol
        WHEN: GET /api/volume_profile
        THEN: Should return 422 validation error
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get("/api/volume_profile")
        assert response.status_code == 422
    
    async def test_get_volume_profile_invalid_symbol(self, test_client):
        """
        Test Case 3.1.3: Error - Invalid Symbol
        
        GIVEN: Non-existent symbol
        WHEN: GET /api/volume_profile
        THEN: Should return 404
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/volume_profile",
            params={"symbol": "INVALID-PERP", "tf": "1h"}
        )
        assert response.status_code == 404
    
    async def test_get_volume_profile_invalid_timeframe(self, test_client):
        """
        Test Case 3.1.3: Error - Invalid Timeframe
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/volume_profile",
            params={"symbol": "BTC-PERP", "tf": "999h"}
        )
        assert response.status_code == 422
    
    async def test_get_volume_profile_all_symbols(self, test_client, test_symbols):
        """
        Test with all supported symbols.
        """
        pytest.skip("API endpoint not yet implemented")
        
        for symbol in test_symbols:
            response = test_client.get(
                "/api/volume_profile",
                params={"symbol": symbol, "tf": "1h"}
            )
            assert response.status_code == 200, f"Failed for {symbol}"
    
    async def test_get_volume_profile_all_timeframes(self, test_client, test_timeframes):
        """
        Test with all supported timeframes.
        """
        pytest.skip("API endpoint not yet implemented")
        
        for tf in test_timeframes:
            response = test_client.get(
                "/api/volume_profile",
                params={"symbol": "BTC-PERP", "tf": tf}
            )
            assert response.status_code == 200, f"Failed for {tf}"


@pytest.mark.integration
@pytest.mark.api
@pytest.mark.asyncio
class TestVolumeProfileValidation:
    """Validation tests for Volume Profile responses."""
    
    async def test_response_schema_validation(self, test_client, validate_volume_profile):
        """
        Validate that response matches expected schema.
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/volume_profile",
            params={"symbol": "BTC-PERP", "tf": "1h"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Use validation fixture
        validate_volume_profile(data)
    
    async def test_poc_is_in_profile_data(self, test_client):
        """
        POC price should exist in profile_data.
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/volume_profile",
            params={"symbol": "BTC-PERP", "tf": "1h"}
        )
        
        data = response.json()
        poc_price = data["poc"]["price"]
        profile_prices = [p["price"] for p in data["profile_data"]]
        
        assert poc_price in profile_prices or \
               any(abs(p - poc_price) < 0.01 for p in profile_prices)



