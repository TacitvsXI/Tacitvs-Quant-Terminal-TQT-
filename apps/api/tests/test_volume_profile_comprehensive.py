"""
Comprehensive tests for Volume Profile Calculator
"""
import sys
from pathlib import Path

# Add apps/api to path
API_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(API_DIR))

import pytest
from fixtures.market_scenarios import create_balanced_market, create_trending_market
from core.analysis.volume_profile import VolumeProfileCalculator


class TestVolumeProfilePOC:
    """Tests for POC calculation"""
    
    def test_poc_basic(self):
        """POC should be at price with highest volume"""
        data = create_balanced_market(center_price=30000.0, range_pct=2.0, bars=50)
        calculator = VolumeProfileCalculator(data)
        poc = calculator.calculate_poc()
        
        assert poc.price is not None
        assert poc.volume > 0
        assert 29000 <= poc.price <= 31000
        print(f"✅ POC: ${poc.price:.2f}, Volume: {poc.volume:.2f}")
    
    def test_poc_is_highest_volume(self):
        """POC volume should be highest in profile"""
        data = create_balanced_market(bars=50)
        calculator = VolumeProfileCalculator(data)
        profile = calculator.calculate()
        
        # POC should have max volume
        max_volume_in_profile = max(p['volume'] for p in profile.profile_data)
        assert profile.poc.volume == max_volume_in_profile
        print(f"✅ POC has max volume: {profile.poc.volume:.2f}")


class TestVolumeProfileValueArea:
    """Tests for Value Area calculation"""
    
    def test_value_area_contains_70_percent(self):
        """Value Area should contain ~70% of volume"""
        data = create_balanced_market(bars=100)
        calculator = VolumeProfileCalculator(data)
        va = calculator.calculate_value_area(percentage=0.70)
        
        # Check volume percentage is close to 70% (allow some tolerance due to binning)
        assert 0.68 <= va.volume_pct <= 0.73, f"VA has {va.volume_pct:.2%}, expected ~70%"
        print(f"✅ Value Area: {va.volume_pct:.1%} of volume")
    
    def test_value_area_boundaries(self):
        """VAH should be > POC > VAL"""
        data = create_balanced_market(bars=50)
        calculator = VolumeProfileCalculator(data)
        poc = calculator.calculate_poc()
        va = calculator.calculate_value_area()
        
        assert va.high > poc.price > va.low, \
            f"Expected VAH({va.high}) > POC({poc.price}) > VAL({va.low})"
        print(f"✅ VA: High=${va.high:.2f}, POC=${poc.price:.2f}, Low=${va.low:.2f}")
    
    def test_value_area_range(self):
        """Value Area should have reasonable range width"""
        data = create_balanced_market(center_price=30000, range_pct=2.0, bars=50)
        calculator = VolumeProfileCalculator(data)
        va = calculator.calculate_value_area()
        
        # Range should be reasonable (not too narrow or wide)
        assert va.high > va.low
        assert va.range_pct < 10.0, f"VA range {va.range_pct:.1%}% seems too wide"
        print(f"✅ VA range: {va.range_pct:.2f}%")


class TestVolumeProfileLVN:
    """Tests for Low Volume Nodes identification"""
    
    def test_identify_lvn_zones(self):
        """Should identify low volume zones"""
        # Trending market has LVN in middle (gap)
        data = create_trending_market(
            start_price=29000.0,
            end_price=32000.0,
            bars=30,
            with_pullbacks=True
        )
        
        calculator = VolumeProfileCalculator(data)
        lvn_zones = calculator.identify_lvn(threshold=0.3)
        
        # Should find at least some LVN zones
        assert len(lvn_zones) >= 1, "Should find at least one LVN zone"
        
        # Each LVN should have volume < 30% of average
        for zone in lvn_zones:
            assert zone.volume < calculator.avg_volume * 0.3
            assert zone.is_gap is True
        
        print(f"✅ Found {len(lvn_zones)} LVN zones")
    
    def test_lvn_has_range(self):
        """Each LVN should have price range"""
        data = create_trending_market(bars=30)
        calculator = VolumeProfileCalculator(data)
        lvn_zones = calculator.identify_lvn()
        
        if len(lvn_zones) > 0:
            zone = lvn_zones[0]
            assert zone.range_high > zone.range_low
            assert zone.price >= zone.range_low
            assert zone.price <= zone.range_high
            print(f"✅ LVN range: ${zone.range_low:.2f} - ${zone.range_high:.2f}")


class TestVolumeProfileHVN:
    """Tests for High Volume Nodes identification"""
    
    def test_identify_hvn_zones(self):
        """Should identify high volume concentration zones"""
        data = create_balanced_market(bars=50)
        calculator = VolumeProfileCalculator(data)
        hvn_zones = calculator.identify_hvn(threshold=1.5)
        
        # Should find HVN zones
        assert len(hvn_zones) >= 1, "Should find at least one HVN zone"
        
        # Each HVN should have volume > 150% of average
        for zone in hvn_zones:
            assert zone.volume > calculator.avg_volume * 1.5
            assert zone.is_gap is False
        
        print(f"✅ Found {len(hvn_zones)} HVN zones")
    
    def test_poc_in_hvn(self):
        """POC should be part of HVN zones"""
        data = create_balanced_market(bars=50)
        calculator = VolumeProfileCalculator(data)
        poc = calculator.calculate_poc()
        hvn_zones = calculator.identify_hvn(threshold=1.5)
        
        # POC price should be in one of the HVN zones
        poc_in_hvn = any(
            zone.range_low <= poc.price <= zone.range_high 
            for zone in hvn_zones
        )
        assert poc_in_hvn, "POC should be within an HVN zone"
        print(f"✅ POC is within HVN zones")


class TestVolumeProfileComplete:
    """Tests for complete profile calculation"""
    
    def test_calculate_full_profile(self):
        """Should return complete VolumeProfile object"""
        data = create_balanced_market(bars=50)
        calculator = VolumeProfileCalculator(data)
        profile = calculator.calculate()
        
        # Check all components exist
        assert profile.poc is not None
        assert profile.value_area is not None
        assert isinstance(profile.lvn_zones, list)
        assert isinstance(profile.hvn_zones, list)
        assert len(profile.profile_data) > 0
        assert profile.total_volume > 0
        assert profile.avg_volume > 0
        assert profile.candle_count == 50
        
        print(f"✅ Complete profile calculated:")
        print(f"   POC: ${profile.poc.price:.2f}")
        print(f"   VA: ${profile.value_area.low:.2f} - ${profile.value_area.high:.2f}")
        print(f"   LVN zones: {len(profile.lvn_zones)}")
        print(f"   HVN zones: {len(profile.hvn_zones)}")
        print(f"   Total volume: {profile.total_volume:.2f}")
    
    def test_profile_data_format(self):
        """Profile data should have correct format"""
        data = create_balanced_market(bars=50)
        calculator = VolumeProfileCalculator(data)
        profile = calculator.calculate()
        
        # Check profile_data format
        assert len(profile.profile_data) > 0
        for item in profile.profile_data:
            assert 'price' in item
            assert 'volume' in item
            assert isinstance(item['price'], (int, float))
            assert isinstance(item['volume'], (int, float))
        
        print(f"✅ Profile data format valid ({len(profile.profile_data)} bins)")


class TestVolumeProfileFixedRange:
    """Tests for Fixed Range Volume Profile"""
    
    def test_fixed_range_profile(self):
        """Should calculate profile for specific time range"""
        data = create_balanced_market(bars=30)
        calculator = VolumeProfileCalculator(data)
        
        # Get last 5 bars as "impulse"
        start_ts = int(data['timestamp'].iloc[-5])
        end_ts = int(data['timestamp'].iloc[-1])
        
        frvp = calculator.calculate_fixed_range(start_ts, end_ts)
        
        assert frvp.candle_count == 5
        assert frvp.timestamp_start == start_ts
        assert frvp.timestamp_end == end_ts
        
        print(f"✅ Fixed range profile: {frvp.candle_count} candles")
    
    def test_fixed_range_differs_from_full(self):
        """Fixed range profile should differ from full profile"""
        data = create_balanced_market(bars=30)
        calculator = VolumeProfileCalculator(data)
        
        # Full profile
        full_profile = calculator.calculate()
        
        # Range profile (last 10 bars)
        start_ts = int(data['timestamp'].iloc[-10])
        end_ts = int(data['timestamp'].iloc[-1])
        range_profile = calculator.calculate_fixed_range(start_ts, end_ts)
        
        # POC should be different (unless by chance)
        # At least candle count should differ
        assert range_profile.candle_count != full_profile.candle_count
        print(f"✅ Fixed range POC: ${range_profile.poc.price:.2f}")
        print(f"   Full profile POC: ${full_profile.poc.price:.2f}")


class TestVolumeProfileEdgeCases:
    """Edge cases and error handling"""
    
    def test_empty_dataframe_raises_error(self):
        """Empty DataFrame should raise ValueError"""
        import pandas as pd
        empty_df = pd.DataFrame(columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
        
        with pytest.raises(ValueError, match="DataFrame cannot be empty"):
            VolumeProfileCalculator(empty_df)
        
        print("✅ Empty DataFrame raises ValueError")
    
    def test_single_candle(self):
        """Should handle single candle"""
        import pandas as pd
        single = pd.DataFrame([{
            'timestamp': 1704067200,
            'open': 30000.0,
            'high': 30100.0,
            'low': 29900.0,
            'close': 30050.0,
            'volume': 100.0
        }])
        
        calculator = VolumeProfileCalculator(single)
        profile = calculator.calculate()
        
        # POC should be around the candle's price
        assert 29900 <= profile.poc.price <= 30100
        print(f"✅ Single candle handled: POC=${profile.poc.price:.2f}")
    
    def test_polars_dataframe_support(self):
        """Should accept Polars DataFrame"""
        import polars as pl
        from fixtures.market_scenarios import to_polars
        
        pandas_data = create_balanced_market(bars=50)
        polars_data = to_polars(pandas_data)
        
        calculator = VolumeProfileCalculator(polars_data)
        profile = calculator.calculate()
        
        assert profile.poc.price is not None
        print(f"✅ Polars DataFrame supported: POC=${profile.poc.price:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

