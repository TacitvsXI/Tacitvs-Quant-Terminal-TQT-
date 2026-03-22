# 📊 Chart Implementation - Lightweight Charts Integration

## Overview

Интеграция Lightweight Charts от TradingView в Tacitvs Quant Terminal для визуализации свечных графиков, индикаторов и аналитики.

## 🎯 Features

- ✅ **Candlestick Charts** - полноценные свечные графики с OHLCV данными
- ✅ **Multiple Timeframes** - 1m, 5m, 15m, 1h, 4h, 1d
- ✅ **Technical Indicators** - RSI, EMA, SMA, Bollinger Bands
- ✅ **Real-time Updates** - готово к интеграции WebSocket для live-данных
- ✅ **Dark Theme** - в стиле TQT (sci-fi dashboard)
- ✅ **Fast Performance** - использует Polars для обработки больших датасетов

## 📦 Components

### 1. Frontend Components

#### `Chart.tsx`
Основной компонент для отображения графика.

```typescript
<Chart
  symbol="BTC-PERP"
  timeframe="1d"
  candles={candles}
  indicators={indicators}
  height={500}
/>
```

**Props:**
- `symbol` - символ рынка (BTC-PERP, ETH-PERP, etc.)
- `timeframe` - таймфрейм (1m, 5m, 15m, 1h, 4h, 1d)
- `candles` - массив свечей с OHLCV
- `indicators` - массив индикаторов для наложения
- `height` - высота графика в пикселях

#### `ChartPanel.tsx`
Полноценная панель с селекторами символов, таймфреймов и индикаторов.

```typescript
<ChartPanel />
```

**Features:**
- Выбор символа (BTC-PERP, ETH-PERP, SOL-PERP)
- Переключение таймфреймов
- Добавление индикаторов
- Кнопка обновления данных
- Обработка ошибок

### 2. API Endpoints

#### `/api/candles`
Получение исторических OHLCV данных.

**Request:**
```http
GET /api/candles?symbol=BTC-PERP&tf=1d&limit=1000
```

**Response:**
```json
[
  {
    "time": 1698624000,
    "open": 34500.0,
    "high": 35200.0,
    "low": 34100.0,
    "close": 34800.0,
    "volume": 1250000
  }
]
```

**Parameters:**
- `symbol` (required) - Market symbol
- `tf` (default: "1d") - Timeframe
- `limit` (default: 1000, max: 10000) - Number of candles

#### `/api/indicators`
Расчет технических индикаторов.

**Request:**
```http
GET /api/indicators?symbol=BTC-PERP&tf=1d&indicator=rsi&length=14&limit=1000
```

**Response:**
```json
[
  {
    "time": 1698624000,
    "value": 65.4
  }
]
```

**Supported Indicators:**
- `rsi` - Relative Strength Index
- `ema` - Exponential Moving Average
- `sma` - Simple Moving Average
- `bbands` - Bollinger Bands (returns upper, middle, lower)

#### `/api/candles/available`
Список доступных символов и таймфреймов.

**Response:**
```json
{
  "symbols": ["BTC-PERP", "ETH-PERP", "SOL-PERP"],
  "timeframes": ["1m", "5m", "15m", "1h", "4h", "1d"]
}
```

#### `/api/indicators/available`
Список доступных индикаторов с описаниями.

**Response:**
```json
{
  "indicators": [
    {
      "id": "rsi",
      "name": "RSI",
      "description": "Relative Strength Index",
      "default_period": 14,
      "min_period": 2,
      "max_period": 100
    }
  ]
}
```

### 3. API Client (`lib/api.ts`)

```typescript
import { fetchCandles, fetchIndicator } from '@/lib/api';

// Fetch candles
const candles = await fetchCandles('BTC-PERP', '1d', 1000);

// Fetch indicator
const rsiData = await fetchIndicator('BTC-PERP', '1d', 'rsi', 14, 1000);
```

## 🚀 Quick Start

### 1. Start API Server

```bash
cd apps/api
python main.py
```

API будет доступен на `http://localhost:8080`

### 2. Start Frontend

```bash
cd apps/ui
npm run dev
```

UI будет доступен на `http://localhost:3000`

### 3. Navigate to LAB

Откройте `http://localhost:3000/LAB` и увидите график с:
- Выбором символа
- Переключением таймфреймов
- Добавлением индикаторов

## 🧪 Testing

### Test API Endpoints

```bash
python test_chart_api.py
```

Этот скрипт проверит:
- Health endpoint
- Доступные данные
- Загрузку свечей
- Расчет индикаторов

### Manual Testing

1. **Test Candles:**
   ```bash
   curl "http://localhost:8080/api/candles?symbol=BTC-PERP&tf=1d&limit=10"
   ```

2. **Test Indicators:**
   ```bash
   curl "http://localhost:8080/api/indicators?symbol=BTC-PERP&tf=1d&indicator=rsi&length=14&limit=10"
   ```

## 📊 Data Format

### Candles (OHLCV)
```typescript
interface Candle {
  time: number;      // Unix timestamp (seconds)
  open: number;      // Open price
  high: number;      // High price
  low: number;       // Low price
  close: number;     // Close price
  volume: number;    // Volume
}
```

### Indicators
```typescript
interface IndicatorData {
  time: number;      // Unix timestamp (seconds)
  value: number;     // Indicator value
}
```

### Bollinger Bands
```typescript
interface BBandsData {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}
```

## 🎨 Styling

График использует цветовую схему TQT:

- **Background:** `#0B0F16` (темный металл)
- **Grid Lines:** `#1B2230` (subtle)
- **Up Candles:** `#2D8EDF` (синий)
- **Down Candles:** `#6243DD` (фиолетовый)
- **Crosshair:** `#7FB7FF` (акцент)
- **Indicators:** Различные цвета (#8AFF00, #FF6B35, #FFA500)

## 🔧 Configuration

### Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080

# Backend
# API конфигурируется в main.py
```

### Customization

#### Add New Indicator

1. **Backend** - добавьте функцию расчета в `routes/indicators.py`:
```python
def calculate_macd(close: np.ndarray, fast: int, slow: int):
    # Your calculation
    return macd_line
```

2. **Frontend** - добавьте в список `AVAILABLE_INDICATORS`:
```typescript
{ id: 'macd', name: 'MACD', color: '#00FF00', length: 12 }
```

#### Add New Timeframe

1. Убедитесь что данные существуют в `data/historical/{SYMBOL}/{TF}.parquet`
2. Добавьте в `AVAILABLE_TIMEFRAMES` на фронтенде
3. API автоматически поддержит новый таймфрейм

## 🚀 Performance Optimization

### Data Pipeline

1. **Storage:** Parquet files (compressed, columnar)
2. **Reading:** Polars (10-100x faster than pandas)
3. **Downsampling:** Limit candles to 1000-5000 max
4. **Caching:** Consider Redis for frequently accessed data

### Chart Performance

- Lightweight Charts оптимизирован для миллионов точек
- Auto-downsampling на больших таймфреймах
- Lazy loading индикаторов

## 🔮 Future Enhancements

### 1. Live Data via WebSocket

```python
# Backend
@router.websocket("/ws/ticks")
async def stream_ticks(ws: WebSocket):
    await ws.accept()
    while True:
        tick = await get_latest_tick()
        await ws.send_json(tick)
```

```typescript
// Frontend
const ws = new WebSocket('ws://localhost:8080/ws/ticks');
ws.onmessage = (e) => {
  const tick = JSON.parse(e.data);
  candleSeries.update(tick);
};
```

### 2. Drawing Tools

- Horizontal lines (support/resistance)
- Trendlines
- Fibonacci retracements
- Trade markers (entry/exit)

### 3. Multiple Chart Panes

- Volume на отдельной панели
- RSI/MACD внизу
- Синхронизация crosshair между панелями

### 4. Backtesting Visualization

- Отображение трейдов на графике
- Equity curve overlay
- Drawdown visualization
- Trade statistics sidebar

### 5. Advanced Indicators

- Custom indicators from strategy
- Machine learning predictions
- Volume profile
- Order flow heatmap

## 📚 Resources

- [Lightweight Charts Docs](https://tradingview.github.io/lightweight-charts/)
- [Polars Documentation](https://pola-rs.github.io/polars/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🐛 Troubleshooting

### API Not Returning Data

1. Check that Parquet files exist in `data/historical/{SYMBOL}/`
2. Verify timestamp format (should be Unix seconds or milliseconds)
3. Check API logs for errors

### Chart Not Rendering

1. Open browser console for errors
2. Verify candles array is not empty
3. Check that timestamps are valid Unix timestamps
4. Ensure lightweight-charts is installed: `npm list lightweight-charts`

### Indicator Calculation Errors

1. Check that enough data points exist (period + 50 minimum)
2. Verify close prices are valid numbers
3. Look for NaN values in data

## ✅ Summary

Вы получили:
- 📊 Профессиональный график уровня Quant-платформы
- 🎯 REST API для OHLCV и индикаторов
- 🚀 Blazing fast data pipeline (Polars)
- 🎨 Dark sci-fi дизайн в стиле TQT
- 📈 Готовую базу для backtesting visualization
- 🔌 Легкую интеграцию с вашими стратегиями

**Next Step:** Интеграция с бэктестом для отображения трейдов на графике! 🎯

