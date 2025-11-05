"""
Integration tests for Market State API endpoint.
"""

import pytest
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))


@pytest.mark.integration
@pytest.mark.api
@pytest.mark.asyncio
class TestMarketStateAPI:
    """Integration tests for /api/market_state endpoint."""
    
    async def test_get_market_state_success(self, test_client):
        """
        Test Case 3.2.1: GET /api/market_state - Success
        
        GIVEN: Valid symbol and timeframe
        WHEN: GET /api/market_state
        THEN: Should return current market state
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/market_state",
            params={"symbol": "BTC-PERP", "tf": "1h"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate state
        valid_states = ["BALANCE", "TRENDING_UP", "TRENDING_DOWN", "FAILED_BREAKOUT"]
        assert data["state"] in valid_states
        
        # Validate confidence
        assert 0.0 <= data["confidence"] <= 1.0
    
    async def test_balance_state_has_range(self, test_client):
        """
        If state is BALANCE, must have range info.
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/market_state",
            params={"symbol": "BTC-PERP", "tf": "1h"}
        )
        
        data = response.json()
        
        if data["state"] == "BALANCE":
            assert data["range"] is not None
            assert data["range"]["high"] > data["range"]["low"]
    
    async def test_trending_state_has_breakout(self, test_client):
        """
        If state is TRENDING, must have breakout info.
        """
        pytest.skip("API endpoint not yet implemented")
        
        response = test_client.get(
            "/api/market_state",
            params={"symbol": "BTC-PERP", "tf": "1h"}
        )
        
        data = response.json()
        
        if data["state"] in ["TRENDING_UP", "TRENDING_DOWN"]:
            assert data["breakout"] is not None
            assert "price" in data["breakout"]
            assert "timestamp" in data["breakout"]



