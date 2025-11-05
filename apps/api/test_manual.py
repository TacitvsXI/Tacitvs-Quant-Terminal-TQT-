import sys
sys.path.insert(0, '.')
sys.path.insert(0, 'tests')

from fixtures.market_scenarios import create_balanced_market
from core.analysis.volume_profile import VolumeProfileCalculator

# Test POC calculation
print("🧪 Testing Volume Profile Calculator...")
data = create_balanced_market(center_price=30000.0, range_pct=2.0, bars=50)
print(f"✅ Created test data: {len(data)} bars")

calculator = VolumeProfileCalculator(data)
print(f"✅ Calculator initialized")

poc = calculator.calculate_poc()
print(f"✅ POC calculated: ${poc.price:.2f}, Volume: {poc.volume:.2f}")

assert poc.price is not None
assert poc.volume > 0
assert 29000 <= poc.price <= 31000

print("✅ ALL ASSERTIONS PASSED!")
print(f"   POC Price: ${poc.price:.2f}")
print(f"   POC Volume: {poc.volume:.2f}")
print(f"   POC Index: {poc.index}")
