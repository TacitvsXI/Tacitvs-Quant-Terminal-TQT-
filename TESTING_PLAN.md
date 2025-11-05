# 🧪 TQT Testing Plan - Test-Driven Development

> **Философия**: Write tests first, then implement. Each feature must have clear expected outcomes.

**Дата создания**: 1 ноября 2025  
**Подход**: TDD (Test-Driven Development)  
**Coverage цель**: >90% для критических компонентов

---

## 📐 Testing Pyramid

```
                    ┌─────────────┐
                    │   E2E (5%)  │  - UI интеграция, user flows
                    └─────────────┘
                  ┌───────────────────┐
                  │ Integration (15%) │  - API endpoints, database
                  └───────────────────┘
              ┌─────────────────────────────┐
              │    Unit Tests (80%)         │  - Логика, расчеты, utils
              └─────────────────────────────┘
```

---

# 🎯 PHASE 1: Volume Profile & Market State Testing

## Overview

Эта фаза тестирует **фундаментальные расчеты** стратегии:
- Volume Profile (POC, VAH/VAL, LVN/HVN)
- Market State Detection (Balance vs Trending)
- Интеграция с существующими данными

---

## 🧮 1. Volume Profile Calculator - Unit Tests

### 1.1 Test Suite: `test_volume_profile_calculator.py`

**Цель**: Убедиться, что расчеты Volume Profile математически корректны

#### Test Case 1.1.1: Calculate POC (Point of Control)
```python
def test_calculate_poc_basic():
    """
    GIVEN: OHLCV data with known volume distribution
    WHEN: Calculate POC
    THEN: POC should be at price level with highest volume
    
    Expected:
    - POC price identified correctly
    - POC volume equals max volume in profile
    - POC index within valid range
    """
    # Test data
    data = create_sample_ohlcv(
        prices=[100, 101, 102, 101, 100],
        volumes=[10, 20, 50, 30, 15]  # Max at 102
    )
    
    profile = VolumeProfileCalculator(data)
    poc = profile.calculate_poc()
    
    assert poc.price == 102
    assert poc.volume == 50
    assert 0 <= poc.index < len(data)
```

#### Test Case 1.1.2: Calculate Value Area (70% volume)
```python
def test_calculate_value_area():
    """
    GIVEN: Volume profile with known distribution
    WHEN: Calculate Value Area (70% of volume)
    THEN: VAH and VAL should contain 70% of total volume
    
    Expected:
    - Value Area contains ~70% of total volume (within 1%)
    - VAH > POC > VAL
    - VA is continuous range
    """
    data = create_uniform_distribution(
        price_range=(90, 110),
        total_volume=1000
    )
    
    profile = VolumeProfileCalculator(data)
    va = profile.calculate_value_area(percentage=0.7)
    
    assert 0.69 <= va.volume_percentage <= 0.71
    assert va.high > profile.poc.price > va.low
    assert va.high > va.low
```

#### Test Case 1.1.3: Identify LVN (Low Volume Nodes)
```python
def test_identify_lvn_zones():
    """
    GIVEN: Volume profile with clear gaps (low volume areas)
    WHEN: Identify LVN zones
    THEN: Should detect price levels with <30% of average volume
    
    Expected:
    - LVN zones detected at sparse areas
    - Each LVN has price range [low, high]
    - LVN volume < threshold
    """
    data = create_profile_with_gaps(
        hvn_prices=[100, 110],  # High volume at 100 and 110
        lvn_prices=[105]        # Gap at 105
    )
    
    profile = VolumeProfileCalculator(data)
    lvn_zones = profile.identify_lvn(threshold=0.3)
    
    assert len(lvn_zones) >= 1
    assert any(104 <= zone.price <= 106 for zone in lvn_zones)
    assert all(zone.volume < profile.avg_volume * 0.3 for zone in lvn_zones)
```

#### Test Case 1.1.4: Identify HVN (High Volume Nodes)
```python
def test_identify_hvn_zones():
    """
    GIVEN: Volume profile with concentration zones
    WHEN: Identify HVN zones
    THEN: Should detect price levels with >150% of average volume
    
    Expected:
    - HVN zones at high activity areas
    - POC is always part of HVN
    - HVN volume > threshold
    """
    data = create_clustered_distribution(
        clusters=[(100, 200), (110, 300)],  # Two high volume clusters
        background_volume=50
    )
    
    profile = VolumeProfileCalculator(data)
    hvn_zones = profile.identify_hvn(threshold=1.5)
    
    assert len(hvn_zones) >= 2
    assert profile.poc.price in [zone.price for zone in hvn_zones]
    assert all(zone.volume > profile.avg_volume * 1.5 for zone in hvn_zones)
```

#### Test Case 1.1.5: Fixed Range Volume Profile (FRVP)
```python
def test_fixed_range_volume_profile():
    """
    GIVEN: OHLCV data and specific price range
    WHEN: Calculate FRVP for that range only
    THEN: Profile should only include candles within range
    
    Expected:
    - Only candles in [start_time, end_time] included
    - POC/VA calculated only for subset
    - Results differ from full dataset profile
    """
    full_data = create_sample_ohlcv(days=30)
    
    # Create profile for last impulse (last 5 candles)
    impulse_start = full_data.index[-5]
    impulse_end = full_data.index[-1]
    
    profile = VolumeProfileCalculator(full_data)
    frvp = profile.calculate_fixed_range(impulse_start, impulse_end)
    full_profile = profile.calculate()
    
    assert frvp.candle_count == 5
    assert frvp.poc.price != full_profile.poc.price  # Should differ
    assert frvp.value_area != full_profile.value_area
```

#### Test Case 1.1.6: Edge Cases & Error Handling
```python
def test_volume_profile_edge_cases():
    """
    Test edge cases that could break the calculator
    """
    # Empty data
    with pytest.raises(ValueError):
        VolumeProfileCalculator(pd.DataFrame()).calculate()
    
    # Single candle
    single = create_sample_ohlcv(bars=1)
    profile = VolumeProfileCalculator(single).calculate()
    assert profile.poc.price == single['close'].iloc[0]
    
    # All same price (no range)
    flat = create_flat_market(price=100, bars=100)
    profile = VolumeProfileCalculator(flat).calculate()
    assert profile.value_area.high == profile.value_area.low
    
    # Zero volume candles
    zero_vol = create_sample_ohlcv(bars=10)
    zero_vol.loc[5, 'volume'] = 0
    profile = VolumeProfileCalculator(zero_vol).calculate()
    assert profile.poc.price != zero_vol.loc[5, 'close']  # Should skip 0-vol
```

### Expected Test Coverage: Volume Profile Calculator
- ✅ POC calculation: 100%
- ✅ Value Area (VAH/VAL): 100%
- ✅ LVN/HVN identification: 100%
- ✅ Fixed Range profiles: 100%
- ✅ Edge cases: 100%

---

## 🔍 2. Market State Detector - Unit Tests

### 2.1 Test Suite: `test_market_state_detector.py`

**Цель**: Корректно определять состояние рынка (Balance/Trending)

#### Test Case 2.1.1: Detect Balance (Range Market)
```python
def test_detect_balance_state():
    """
    GIVEN: Price data oscillating in tight range (±2% for >20 bars)
    WHEN: Analyze market state
    THEN: Should detect BALANCE state
    
    Expected:
    - State = MarketState.BALANCE
    - Range boundaries identified [low, high]
    - Value Area width < threshold (e.g., <5% of price)
    - Time in range > 70% of bars
    """
    data = create_range_market(
        center=30000,
        range_pct=2.0,  # ±2% oscillation
        bars=50
    )
    
    detector = MarketStateDetector(data)
    state = detector.analyze()
    
    assert state.type == MarketState.BALANCE
    assert state.range_low is not None
    assert state.range_high is not None
    assert (state.range_high - state.range_low) / state.range_low < 0.05
    assert state.time_in_range_pct > 0.70
```

#### Test Case 2.1.2: Detect Trending Up (Breakout Upward)
```python
def test_detect_trending_up():
    """
    GIVEN: Price breaking out of balance and moving up with momentum
    WHEN: Analyze market state
    THEN: Should detect TRENDING_UP state
    
    Expected:
    - State = MarketState.TRENDING_UP
    - Breakout point identified
    - Price > previous range high
    - Volume surge on breakout
    """
    data = create_breakout_scenario(
        balance_range=(29000, 30000),
        balance_bars=30,
        breakout_direction='up',
        breakout_target=31500,
        breakout_bars=10
    )
    
    detector = MarketStateDetector(data)
    state = detector.analyze()
    
    assert state.type == MarketState.TRENDING_UP
    assert state.breakout_price > 30000
    assert state.impulse_strength > 1.0  # Strong momentum
    assert state.volume_ratio > 1.5  # Volume surge
```

#### Test Case 2.1.3: Detect Trending Down
```python
def test_detect_trending_down():
    """
    GIVEN: Price breaking out of balance and moving down
    WHEN: Analyze market state
    THEN: Should detect TRENDING_DOWN state
    """
    data = create_breakout_scenario(
        balance_range=(29000, 30000),
        balance_bars=30,
        breakout_direction='down',
        breakout_target=27500,
        breakout_bars=10
    )
    
    detector = MarketStateDetector(data)
    state = detector.analyze()
    
    assert state.type == MarketState.TRENDING_DOWN
    assert state.breakout_price < 29000
    assert state.impulse_strength > 1.0
```

#### Test Case 2.1.4: Detect Failed Breakout (Reclaim)
```python
def test_detect_failed_breakout():
    """
    GIVEN: Price breaks range, but returns back inside (reclaim)
    WHEN: Analyze market state
    THEN: Should detect FAILED_BREAKOUT state
    
    Expected:
    - State = MarketState.FAILED_BREAKOUT
    - Breakout attempt identified
    - Reclaim point identified
    - Return inside previous range
    """
    data = create_failed_breakout_scenario(
        balance_range=(29000, 30000),
        breakout_attempt=30500,  # Tried to break up
        reclaim_price=29800      # Returned inside range
    )
    
    detector = MarketStateDetector(data)
    state = detector.analyze()
    
    assert state.type == MarketState.FAILED_BREAKOUT
    assert state.breakout_attempt.price > 30000
    assert state.reclaim.price < 30000  # Back inside
    assert state.reclaim.timestamp > state.breakout_attempt.timestamp
```

#### Test Case 2.1.5: Transition Detection (Balance → Trending)
```python
def test_state_transition():
    """
    GIVEN: Data stream with state change
    WHEN: Continuously analyze state
    THEN: Should detect exact transition point
    
    Expected:
    - Initial state = BALANCE
    - After breakout: state = TRENDING
    - Transition timestamp accurate
    """
    detector = MarketStateDetector()
    
    # Feed balance data
    for candle in create_range_market(bars=30):
        state = detector.update(candle)
        assert state.type == MarketState.BALANCE
    
    # Feed breakout
    breakout_idx = None
    for idx, candle in enumerate(create_impulse_move(bars=10)):
        state = detector.update(candle)
        if state.type == MarketState.TRENDING_UP:
            breakout_idx = idx
            break
    
    assert breakout_idx is not None
    assert breakout_idx < 5  # Detected within first 5 bars
```

### Expected Test Coverage: Market State Detector
- ✅ Balance detection: 100%
- ✅ Trending detection: 100%
- ✅ Failed breakout: 100%
- ✅ State transitions: 100%

---

## 🌐 3. API Integration Tests

### 3.1 Test Suite: `test_volume_profile_api.py`

**Цель**: API endpoints работают корректно и возвращают валидные данные

#### Test Case 3.1.1: GET /api/volume_profile - Success
```python
@pytest.mark.asyncio
async def test_get_volume_profile_success(test_client):
    """
    GIVEN: Valid symbol and timeframe with existing data
    WHEN: GET /api/volume_profile
    THEN: Should return 200 with complete volume profile
    
    Expected Response:
    {
      "symbol": "BTC-PERP",
      "timeframe": "1h",
      "timestamp_start": 1234567890,
      "timestamp_end": 1234567890,
      "poc": {"price": 30000, "volume": 1500},
      "value_area": {"high": 30500, "low": 29500, "volume_pct": 0.70},
      "lvn_zones": [{"price": 29800, "volume": 50, "is_gap": true}],
      "hvn_zones": [{"price": 30000, "volume": 1500}],
      "profile_data": [
        {"price": 29000, "volume": 100},
        {"price": 29100, "volume": 150},
        ...
      ]
    }
    """
    response = await test_client.get(
        "/api/volume_profile",
        params={
            "symbol": "BTC-PERP",
            "tf": "1h",
            "range_type": "day",  # Last 24h
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
    
    # Validate LVN zones
    assert isinstance(data["lvn_zones"], list)
    if len(data["lvn_zones"]) > 0:
        assert "price" in data["lvn_zones"][0]
        assert "volume" in data["lvn_zones"][0]
    
    # Validate profile data
    assert len(data["profile_data"]) > 0
    assert all("price" in item and "volume" in item for item in data["profile_data"])
```

#### Test Case 3.1.2: GET /api/volume_profile - Fixed Range
```python
@pytest.mark.asyncio
async def test_get_volume_profile_fixed_range(test_client):
    """
    GIVEN: Specific time range (impulse movement)
    WHEN: GET /api/volume_profile with start/end timestamps
    THEN: Should return profile for that range only
    """
    now = int(time.time())
    start_time = now - 3600 * 5  # Last 5 hours (impulse)
    end_time = now
    
    response = await test_client.get(
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
    assert data["candle_count"] <= 60  # Max 5h / 5m = 60 candles
```

#### Test Case 3.1.3: GET /api/volume_profile - Error Cases
```python
@pytest.mark.asyncio
async def test_get_volume_profile_errors(test_client):
    """
    Test error handling for invalid requests
    """
    # Missing symbol
    response = await test_client.get("/api/volume_profile")
    assert response.status_code == 422  # Validation error
    
    # Invalid symbol
    response = await test_client.get(
        "/api/volume_profile",
        params={"symbol": "INVALID", "tf": "1h"}
    )
    assert response.status_code == 404
    
    # Invalid timeframe
    response = await test_client.get(
        "/api/volume_profile",
        params={"symbol": "BTC-PERP", "tf": "999h"}
    )
    assert response.status_code == 422
    
    # Invalid range
    response = await test_client.get(
        "/api/volume_profile",
        params={
            "symbol": "BTC-PERP",
            "tf": "1h",
            "start_time": 9999999999,  # Future
            "end_time": 1000000000,    # Past
        }
    )
    assert response.status_code == 400  # Bad request
```

### 3.2 Test Suite: `test_market_state_api.py`

#### Test Case 3.2.1: GET /api/market_state - Success
```python
@pytest.mark.asyncio
async def test_get_market_state_success(test_client):
    """
    GIVEN: Valid symbol and timeframe
    WHEN: GET /api/market_state
    THEN: Should return current market state
    
    Expected Response:
    {
      "symbol": "BTC-PERP",
      "timeframe": "1h",
      "state": "BALANCE",  // or TRENDING_UP, TRENDING_DOWN, FAILED_BREAKOUT
      "confidence": 0.85,
      "range": {
        "high": 30000,
        "low": 29000,
        "duration_bars": 30
      },
      "breakout": null,  // Only if trending
      "value_area_width_pct": 3.5,
      "time_in_range_pct": 0.75
    }
    """
    response = await test_client.get(
        "/api/market_state",
        params={"symbol": "BTC-PERP", "tf": "1h"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate state
    assert data["state"] in [
        "BALANCE",
        "TRENDING_UP",
        "TRENDING_DOWN",
        "FAILED_BREAKOUT"
    ]
    
    # Validate confidence
    assert 0.0 <= data["confidence"] <= 1.0
    
    # If balance, should have range
    if data["state"] == "BALANCE":
        assert data["range"] is not None
        assert data["range"]["high"] > data["range"]["low"]
    
    # If trending, should have breakout info
    if data["state"] in ["TRENDING_UP", "TRENDING_DOWN"]:
        assert data["breakout"] is not None
        assert "price" in data["breakout"]
        assert "timestamp" in data["breakout"]
```

### Expected Test Coverage: API Tests
- ✅ Volume Profile endpoint: 100%
- ✅ Market State endpoint: 100%
- ✅ Error handling: 100%

---

## 🎨 4. Frontend Integration Tests

### 4.1 Test Suite: `VolumeProfileChart.test.tsx`

**Цель**: UI компонент корректно отображает Volume Profile

#### Test Case 4.1.1: Render Volume Profile Histogram
```typescript
describe('VolumeProfileChart', () => {
  it('should render volume profile histogram correctly', async () => {
    const mockProfile = {
      poc: { price: 30000, volume: 1500 },
      value_area: { high: 30500, low: 29500 },
      profile_data: [
        { price: 29000, volume: 100 },
        { price: 29500, volume: 500 },
        { price: 30000, volume: 1500 },
        { price: 30500, volume: 800 },
        { price: 31000, volume: 200 },
      ]
    };
    
    render(<VolumeProfileChart data={mockProfile} />);
    
    // Check histogram rendered
    const bars = screen.getAllByTestId('volume-bar');
    expect(bars).toHaveLength(5);
    
    // Check POC highlighted
    const pocBar = screen.getByTestId('volume-bar-poc');
    expect(pocBar).toHaveStyle({ backgroundColor: 'var(--accent)' });
    
    // Check Value Area shaded
    const vaArea = screen.getByTestId('value-area-overlay');
    expect(vaArea).toBeInTheDocument();
  });
});
```

#### Test Case 4.1.2: POC/VAH/VAL Lines Overlay on Main Chart
```typescript
it('should overlay POC/VAH/VAL lines on main chart', async () => {
  const mockProfile = {
    poc: { price: 30000 },
    value_area: { high: 30500, low: 29500 },
  };
  
  render(
    <ChartPanel>
      <Chart candles={mockCandles} />
      <VolumeProfileOverlay profile={mockProfile} />
    </ChartPanel>
  );
  
  // Check lines added to chart
  await waitFor(() => {
    expect(screen.getByTestId('poc-line')).toBeInTheDocument();
    expect(screen.getByTestId('vah-line')).toBeInTheDocument();
    expect(screen.getByTestId('val-line')).toBeInTheDocument();
  });
  
  // Check line positions
  const pocLine = screen.getByTestId('poc-line');
  expect(pocLine).toHaveAttribute('data-price', '30000');
});
```

#### Test Case 4.1.3: LVN Zones Highlighting
```typescript
it('should highlight LVN zones on chart', async () => {
  const mockProfile = {
    lvn_zones: [
      { price: 29800, volume: 50, range_low: 29750, range_high: 29850 }
    ]
  };
  
  render(<Chart candles={mockCandles} volumeProfile={mockProfile} />);
  
  // Check LVN zone rendered
  const lvnZone = screen.getByTestId('lvn-zone-0');
  expect(lvnZone).toBeInTheDocument();
  expect(lvnZone).toHaveClass('lvn-highlight');
  
  // Check zone covers correct price range
  expect(lvnZone).toHaveAttribute('data-price-low', '29750');
  expect(lvnZone).toHaveAttribute('data-price-high', '29850');
});
```

### 4.2 Test Suite: `MarketStatePanel.test.tsx`

#### Test Case 4.2.1: Display Market State Badge
```typescript
it('should display current market state with correct styling', () => {
  const mockState = {
    state: 'BALANCE',
    confidence: 0.85,
    range: { high: 30000, low: 29000 }
  };
  
  render(<MarketStatePanel state={mockState} />);
  
  // Check badge displayed
  const badge = screen.getByTestId('market-state-badge');
  expect(badge).toHaveTextContent('BALANCE');
  expect(badge).toHaveClass('state-balance');
  
  // Check confidence displayed
  expect(screen.getByText(/85%/)).toBeInTheDocument();
  
  // Check range displayed
  expect(screen.getByText(/29000.*30000/)).toBeInTheDocument();
});
```

#### Test Case 4.2.2: Update State in Real-time
```typescript
it('should update state when market transitions', async () => {
  const { rerender } = render(
    <MarketStatePanel state={{ state: 'BALANCE' }} />
  );
  
  expect(screen.getByText('BALANCE')).toBeInTheDocument();
  
  // Simulate state change
  rerender(<MarketStatePanel state={{ state: 'TRENDING_UP' }} />);
  
  await waitFor(() => {
    expect(screen.getByText('TRENDING_UP')).toBeInTheDocument();
  });
  
  // Check styling updated
  const badge = screen.getByTestId('market-state-badge');
  expect(badge).toHaveClass('state-trending-up');
});
```

### Expected Test Coverage: Frontend Tests
- ✅ Volume Profile rendering: 100%
- ✅ Market State display: 100%
- ✅ User interactions: 100%

---

## 📊 5. End-to-End Tests

### 5.1 Test Suite: `volume_profile_e2e.spec.ts` (Playwright)

#### Test Case 5.1.1: Complete User Flow
```typescript
test('User can view and interact with Volume Profile', async ({ page }) => {
  // 1. Navigate to chart page
  await page.goto('http://localhost:3000/LAB');
  
  // 2. Enable Volume Profile
  await page.click('[data-testid="toggle-volume-profile"]');
  
  // 3. Wait for data to load
  await page.waitForSelector('[data-testid="volume-profile-histogram"]');
  
  // 4. Verify Volume Profile displayed
  const histogram = await page.locator('[data-testid="volume-profile-histogram"]');
  expect(await histogram.isVisible()).toBeTruthy();
  
  // 5. Verify POC line on main chart
  const pocLine = await page.locator('[data-testid="poc-line"]');
  expect(await pocLine.isVisible()).toBeTruthy();
  
  // 6. Hover over volume bar - should show tooltip
  await page.hover('[data-testid="volume-bar-poc"]');
  await page.waitForSelector('[data-testid="volume-tooltip"]');
  const tooltip = await page.textContent('[data-testid="volume-tooltip"]');
  expect(tooltip).toContain('POC');
  
  // 7. Change timeframe - profile should update
  await page.selectOption('[data-testid="timeframe-selector"]', '15m');
  await page.waitForResponse(/\/api\/volume_profile/);
  
  // 8. Verify profile updated
  // (POC should be different for different timeframe)
});
```

### Expected Test Coverage: E2E Tests
- ✅ User can enable/disable Volume Profile
- ✅ Data loads and displays correctly
- ✅ Interactions work (hover, click)
- ✅ Updates on timeframe change

---

## 🎯 Acceptance Criteria for PHASE 1

### Volume Profile Implementation ✅

**Математическая корректность**:
- [ ] POC идентифицируется на уровне максимального объема
- [ ] Value Area содержит 70±1% от общего объема
- [ ] VAH > POC > VAL всегда
- [ ] LVN zones имеют объем < 30% среднего
- [ ] HVN zones имеют объем > 150% среднего

**API Performance**:
- [ ] `/api/volume_profile` отвечает < 200ms для 1000 баров
- [ ] `/api/volume_profile` отвечает < 500ms для 10000 баров
- [ ] Поддерживает Fixed Range для любого интервала

**UI/UX**:
- [ ] Histogram отображается справа от графика
- [ ] POC/VAH/VAL линии видны на main chart
- [ ] LVN зоны выделены цветом
- [ ] Tooltip показывает детали при hover
- [ ] Toggle включения/выключения работает

**Integration**:
- [ ] Работает со всеми таймфреймами (1m, 5m, 15m, 1h, 4h, 1d)
- [ ] Работает со всеми символами (BTC, ETH, SOL)
- [ ] Данные обновляются при смене symbol/timeframe
- [ ] Совместимо с существующими indicators

### Market State Detection ✅

**Detection Accuracy**:
- [ ] BALANCE определяется при range < 5% на 20+ барах
- [ ] TRENDING определяется при пробое range + volume surge
- [ ] FAILED_BREAKOUT определяется при reclaim в течение 5 баров
- [ ] Confidence score корректно отражает уверенность

**API Performance**:
- [ ] `/api/market_state` отвечает < 100ms
- [ ] State обновляется в реальном времени

**UI/UX**:
- [ ] State badge показывает текущее состояние
- [ ] Цветовая кодировка понятна (зеленый=trending up, красный=trending down, желтый=balance)
- [ ] Range boundaries отображаются на графике
- [ ] Confidence level виден

---

## 🧪 Test Data Fixtures

### Fixture 1: Balanced Market
```python
# fixtures/balanced_market.py
def create_balanced_market_fixture():
    """
    Creates realistic balanced market data:
    - 50 bars oscillating in 29000-30000 range
    - Volume concentrated at 29500 (POC)
    - Clear Value Area 29300-29700
    """
    return pd.DataFrame({
        'timestamp': [...],
        'open': [...],
        'high': [...],
        'low': [...],
        'close': [...],
        'volume': [...]
    })
```

### Fixture 2: Trending Market (Breakout)
```python
def create_trending_market_fixture():
    """
    Creates breakout scenario:
    - 30 bars in balance (29000-30000)
    - Volume surge at bar 31
    - 20 bars trending up to 32000
    - Clear LVN at 30500 (pullback zone)
    """
    pass
```

### Fixture 3: Failed Breakout
```python
def create_failed_breakout_fixture():
    """
    Creates failed breakout:
    - Balance at 29000-30000
    - Breakout attempt to 30500 (bar 31-33)
    - Reclaim back under 30000 (bar 34)
    - Volume dies on breakout
    """
    pass
```

---

## 🚀 Running Tests

### Setup Test Environment
```bash
# Install test dependencies
cd apps/api
pip install pytest pytest-asyncio pytest-cov httpx

cd apps/ui
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @playwright/test
```

### Run Unit Tests
```bash
# Backend
cd apps/api
pytest tests/unit/test_volume_profile_calculator.py -v
pytest tests/unit/test_market_state_detector.py -v

# Frontend
cd apps/ui
npm test -- VolumeProfileChart.test.tsx
```

### Run Integration Tests
```bash
# API tests
cd apps/api
pytest tests/integration/test_volume_profile_api.py -v
pytest tests/integration/test_market_state_api.py -v
```

### Run E2E Tests
```bash
cd apps/ui
npx playwright test volume_profile_e2e.spec.ts
```

### Coverage Report
```bash
# Backend
cd apps/api
pytest --cov=core --cov-report=html tests/

# Frontend
cd apps/ui
npm test -- --coverage
```

---

## 📋 Pre-Implementation Checklist

Перед началом имплементации убедись:

- [ ] Все test cases написаны и reviewed
- [ ] Test data fixtures созданы
- [ ] Test environment настроен
- [ ] CI/CD pipeline готов (GitHub Actions)
- [ ] Acceptance criteria понятны и согласованы
- [ ] Test coverage targets определены (>90% для critical)

---

## ✅ Definition of Done (DoD) для Phase 1

**Backend**:
- [ ] Все unit tests pass (100% coverage для calculator)
- [ ] Все integration tests pass
- [ ] API documentation обновлена (OpenAPI spec)
- [ ] Performance benchmarks выполнены
- [ ] Code review пройден

**Frontend**:
- [ ] Все component tests pass
- [ ] E2E tests pass
- [ ] Responsive design проверен (mobile/tablet/desktop)
- [ ] Accessibility проверен (ARIA labels)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

**Integration**:
- [ ] Backend + Frontend работают вместе
- [ ] Real-time updates работают
- [ ] Error handling корректен
- [ ] Loading states реализованы

**Documentation**:
- [ ] User guide обновлен (как использовать Volume Profile)
- [ ] Developer docs обновлены
- [ ] Test documentation актуальна

---

## 📝 Next Steps

После успешного прохождения всех тестов Phase 1:

1. ✅ Code review
2. ✅ Merge to main branch
3. ✅ Deploy to staging
4. ✅ User acceptance testing
5. ✅ Deploy to production
6. 🚀 Start Phase 2 (Order Flow & Signals)

---

**Last Updated**: November 1, 2025  
**Status**: Ready for implementation  
**Estimated Duration**: 1-2 weeks (TDD approach)




