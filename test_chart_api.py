#!/usr/bin/env python3
"""
Test script for Chart API endpoints
"""

import requests
import json

API_BASE = "http://localhost:8080"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{API_BASE}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")

def test_available_data():
    """Test available data endpoint"""
    print("🔍 Testing available data endpoint...")
    response = requests.get(f"{API_BASE}/api/candles/available")
    print(f"   Status: {response.status_code}")
    data = response.json()
    print(f"   Symbols: {data.get('symbols', [])}")
    print(f"   Timeframes: {data.get('timeframes', [])}\n")

def test_candles():
    """Test candles endpoint"""
    print("🔍 Testing candles endpoint...")
    params = {
        "symbol": "BTC-PERP",
        "tf": "1d",
        "limit": 10
    }
    response = requests.get(f"{API_BASE}/api/candles", params=params)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        candles = response.json()
        print(f"   Returned {len(candles)} candles")
        if candles:
            print(f"   First candle: {json.dumps(candles[0], indent=2)}")
            print(f"   Last candle: {json.dumps(candles[-1], indent=2)}")
    else:
        print(f"   Error: {response.text}\n")

def test_indicators():
    """Test indicators endpoint"""
    print("🔍 Testing indicators endpoint...")
    params = {
        "symbol": "BTC-PERP",
        "tf": "1d",
        "indicator": "rsi",
        "length": 14,
        "limit": 10
    }
    response = requests.get(f"{API_BASE}/api/indicators", params=params)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Returned {len(data)} data points")
        if data:
            print(f"   First point: {json.dumps(data[0], indent=2)}")
            print(f"   Last point: {json.dumps(data[-1], indent=2)}")
    else:
        print(f"   Error: {response.text}\n")

def test_available_indicators():
    """Test available indicators endpoint"""
    print("🔍 Testing available indicators endpoint...")
    response = requests.get(f"{API_BASE}/api/indicators/available")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   Available indicators:")
        for ind in data.get('indicators', []):
            print(f"      - {ind['name']} ({ind['id']}): {ind['description']}")
    else:
        print(f"   Error: {response.text}\n")

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 TACITVS QUANT TERMINAL - Chart API Tests")
    print("=" * 60)
    print()
    
    try:
        test_health()
        test_available_data()
        test_candles()
        test_indicators()
        test_available_indicators()
        
        print("=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API")
        print("   Make sure the API is running on http://localhost:8080")
        print("   Run: cd apps/api && python main.py")
    except Exception as e:
        print(f"❌ Error: {e}")

