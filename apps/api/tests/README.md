# 🧪 TQT Backend Tests

Testing suite for TQT backend (FastAPI + Python).

## 📂 Structure

```
tests/
├── conftest.py                 # Shared fixtures and pytest configuration
├── fixtures/
│   └── market_scenarios.py     # Market data generators (balanced, trending, failed breakout)
├── unit/
│   ├── analysis/
│   │   └── test_volume_profile_calculator.py
│   └── strategy/
│       └── test_market_state_detector.py
└── integration/
    ├── test_volume_profile_api.py
    └── test_market_state_api.py
```

## 🚀 Running Tests

### Install dependencies
```bash
cd apps/api
pip install pytest pytest-asyncio pytest-cov httpx
```

### Run all tests
```bash
pytest
```

### Run specific test files
```bash
# Volume Profile unit tests
pytest tests/unit/analysis/test_volume_profile_calculator.py -v

# Market State unit tests
pytest tests/unit/strategy/test_market_state_detector.py -v

# API integration tests
pytest tests/integration/test_volume_profile_api.py -v
```

### Run by marker
```bash
# Only unit tests
pytest -m unit

# Only integration tests
pytest -m integration

# Only Volume Profile related tests
pytest -m volume_profile

# Only Market State related tests
pytest -m market_state
```

### With coverage
```bash
pytest --cov=core --cov-report=html
```

Then open `htmlcov/index.html` in browser.

### Verbose output
```bash
pytest -v -s
```

## 📊 Test Markers

Tests are marked for easy filtering:

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (API, database)
- `@pytest.mark.slow` - Slow running tests
- `@pytest.mark.asyncio` - Async tests
- `@pytest.mark.volume_profile` - Volume Profile tests
- `@pytest.mark.market_state` - Market State tests
- `@pytest.mark.api` - API endpoint tests

## 🎯 Coverage Goals

- **Unit tests**: >90% coverage
- **Integration tests**: All API endpoints covered
- **Overall**: >80% code coverage

## 📝 Writing New Tests

### Unit Test Template

```python
import pytest
from pathlib import Path
import sys

ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

@pytest.mark.unit
def test_something():
    # GIVEN
    data = create_test_data()
    
    # WHEN
    result = function_under_test(data)
    
    # THEN
    assert result == expected_value
```

### Integration Test Template

```python
import pytest

@pytest.mark.integration
@pytest.mark.asyncio
async def test_api_endpoint(test_client):
    # WHEN
    response = test_client.get("/api/endpoint", params={"key": "value"})
    
    # THEN
    assert response.status_code == 200
    data = response.json()
    assert "expected_key" in data
```

## 🛠️ Fixtures

### Available Fixtures

From `conftest.py`:
- `test_client` - FastAPI test client
- `default_symbol` - Default symbol ("BTC-PERP")
- `default_timeframe` - Default timeframe ("1h")
- `validate_ohlcv_schema` - OHLCV validation helper
- `validate_volume_profile` - Volume Profile validation helper
- `validate_market_state` - Market State validation helper

From `fixtures/market_scenarios.py`:
- `create_balanced_market()` - Generate range-bound market data
- `create_trending_market()` - Generate trending market data
- `create_failed_breakout()` - Generate failed breakout scenario
- `create_breakout_scenario()` - Generate complete breakout

### Using Fixtures

```python
def test_with_fixture(default_symbol, validate_volume_profile):
    # Use fixture values
    assert default_symbol == "BTC-PERP"
    
    # Use validation helpers
    profile = calculate_profile(...)
    validate_volume_profile(profile)
```

## 🐛 Debugging

### Run with debugger
```bash
pytest --pdb
```

### Show print statements
```bash
pytest -s
```

### Run last failed tests
```bash
pytest --lf
```

### Stop on first failure
```bash
pytest -x
```

## 📈 Performance Testing

Performance benchmarks are in `conftest.py`:

```python
benchmark_threshold = {
    'volume_profile_1k_bars': 0.2,   # 200ms
    'volume_profile_10k_bars': 0.5,  # 500ms
    'market_state': 0.1,             # 100ms
}
```

Performance tests are marked with `@pytest.mark.slow`.

## 🔄 CI/CD

Tests run automatically on:
- Push to main branch
- Pull requests
- Manual trigger

GitHub Actions workflow: `.github/workflows/test.yml`

## 📚 Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/)

















