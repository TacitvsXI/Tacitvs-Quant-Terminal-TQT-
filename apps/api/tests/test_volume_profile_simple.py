"""
Simple working test for Volume Profile Calculator
"""
import sys
from pathlib import Path

# Add apps/api to path BEFORE any imports  
# __file__ is tests/test_volume_profile_simple.py
# So parent.parent is apps/api
API_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(API_DIR))

import pytest
from fixtures.market_scenarios import create_balanced_market
from core.analysis.volume_profile import VolumeProfileCalculator


def test_poc_calculation_works():
    """Test that POC calculation works correctly"""
    # Create test data
    data = create_balanced_market(center_price=30000.0, range_pct=2.0, bars=50)
    
    # Calculate POC
    calculator = VolumeProfileCalculator(data)
    poc = calculator.calculate_poc()
    
    # Verify results
    assert poc.price is not None, "POC price should not be None"
    assert poc.volume > 0, "POC volume should be positive"
    assert 29000 <= poc.price <= 31000, f"POC price {poc.price} should be within range [29000, 31000]"
    
    print(f"✅ POC: ${poc.price:.2f}, Volume: {poc.volume:.2f}")


if __name__ == "__main__":
    test_poc_calculation_works()
    print("✅ Test passed!")

