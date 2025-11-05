# 🎯 TQT Trading Strategy Implementation Roadmap

> **Цель**: Реализация автоматизированной торговой стратегии BTC/USDC на базе Auction Market Theory с визуализацией и управлением через веб-интерфейс

**Дата создания**: 1 ноября 2025  
**Биржа**: Hyperliquid (BTC-PERP)  
**Архитектура**: Backend (Python/FastAPI) + Frontend (Next.js/React)

---

## ✅ Что уже реализовано (DONE)

### 📊 Визуализация и UI
- [x] **Базовый интерфейс TQT**
  - Next.js 15 с Turbopack
  - Современный UI с тремя темами (neon, matrix, blackops)
  - Адаптивная система тем с CSS-переменными
  - Аудио-фидбек для действий пользователя
  
- [x] **Система графиков (Lightweight Charts v4.2.3)**
  - Candlestick chart с динамическим обновлением
  - Поддержка нескольких таймфреймов (1m, 5m, 15m, 1h, 4h, 1d)
  - Dynamic theme-aware colors
  - Responsive design с автоматическим resize
  
- [x] **CVD (Cumulative Volume Delta)**
  - Отдельный histogram chart
  - API endpoint `/api/cvd`
  - Визуализация давления покупателей/продавцов
  - Переключатель показа/скрытия
  
- [x] **Технические индикаторы**
  - RSI (Relative Strength Index)
  - EMA (Exponential Moving Average)
  - SMA (Simple Moving Average)
  - Bollinger Bands
  - API endpoint `/api/indicators`
  
- [x] **Контролы и управление**
  - Селектор символов (BTC-PERP, ETH-PERP, SOL-PERP)
  - Селектор таймфреймов
  - Селектор индикаторов
  - Селектор количества баров (1K - 50K)
  - Refresh data button

- [x] **Telemetry Strip (Live)**
  - Динамический статус API (ONLINE/OFFLINE)
  - Real-time latency измерение (автопинг каждые 5 сек)
  - Feed status (LIVE/OFFLINE)
  - Системное время

### 🔧 Backend API
- [x] **FastAPI сервер**
  - Health check endpoint
  - CORS настроен для фронтенда
  - Структура роутов (candles, indicators, volume)
  
- [x] **Data endpoints**
  - `/api/candles` - OHLCV данные (до 50K баров)
  - `/api/indicators` - расчет индикаторов
  - `/api/cvd` - Cumulative Volume Delta
  
- [x] **Данные хранение**
  - Parquet файлы для исторических данных
  - Polars для быстрой обработки
  - Поддержка BTC-PERP, ETH-PERP, SOL-PERP
  - Несколько таймфреймов (1m, 5m, 15m, 1h, 4h, 1d)

### 📚 Документация
- [x] Стратегия описана (strategy.md)
- [x] План имплементации (implementation.md)
- [x] Quick start guides
- [x] API documentation

---

## 🚧 Что нужно сделать (TODO)

### **PHASE 1: Market Context & Volume Profile** 🔴 HIGH PRIORITY

#### 1.1 Volume Profile Implementation
**Статус**: ❌ Не начато  
**Важность**: 🔴 КРИТИЧНО (основа стратегии)

**Задачи**:
- [ ] **Backend: Volume Profile Calculator**
  - [ ] Создать `/core/analysis/volume_profile.py`
  - [ ] Расчет Fixed Range Volume Profile (FRVP)
  - [ ] Определение POC (Point of Control)
  - [ ] Определение Value Area (VA, VAH, VAL)
  - [ ] Определение HVN (High Volume Nodes)
  - [ ] Определение LVN (Low Volume Nodes)
  - [ ] API endpoint: `/api/volume_profile`
  
- [ ] **Frontend: Volume Profile Display**
  - [ ] Компонент `VolumeProfileChart.tsx`
  - [ ] Горизонтальный histogram справа от графика цены
  - [ ] Overlay POC/VAH/VAL линии на main chart
  - [ ] Highlight LVN зоны цветом
  - [ ] Toggle показа/скрытия профиля
  
**Зависимости**: Требуется для определения уровней входа (LVN)

#### 1.2 Market State Detection
**Статус**: ❌ Не начато  
**Важность**: 🔴 КРИТИЧНО

**Задачи**:
- [ ] **Backend: Market State Analyzer**
  - [ ] Создать `/core/strategy/market_state.py`
  - [ ] Определение баланса (Balance) vs дисбаланса (Out-of-balance)
  - [ ] Определение пробоя диапазона
  - [ ] Определение возврата в диапазон (Reclaim)
  - [ ] Расчет ширины Value Area
  - [ ] API endpoint: `/api/market_state`
  
- [ ] **Frontend: Market State Indicator**
  - [ ] Компонент `MarketStatePanel.tsx`
  - [ ] Показывать текущий state: BALANCE / TRENDING UP / TRENDING DOWN
  - [ ] Показывать последний диапазон (High/Low баланса)
  - [ ] Цветовая кодировка состояния
  
**Зависимости**: Требуется для фильтрации сетапов

---

### **PHASE 2: Order Flow & Execution Signals** 🟠 MEDIUM-HIGH PRIORITY

#### 2.1 Enhanced CVD & Delta Analysis
**Статус**: 🟡 Частично (basic CVD есть)  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Улучшить CVD calculation**
  - [ ] Использовать реальные trade ticks (если доступно из Hyperliquid)
  - [ ] Определение aggressive buy/sell
  - [ ] Divergence detection (цена vs CVD)
  - [ ] Spike detection в дельте
  
- [ ] **Frontend: CVD Enhancements**
  - [ ] Добавить zero-line baseline
  - [ ] Highlight спайки дельты
  - [ ] Divergence markers
  - [ ] Tooltip с деталями дельты

#### 2.2 VWAP с отклонениями
**Статус**: ❌ Не начато  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Backend: VWAP Calculator**
  - [ ] Расчет VWAP (volume-weighted average price)
  - [ ] Расчет стандартных отклонений (±1σ, ±2σ, ±3σ)
  - [ ] Anchored VWAP (от начала дня/сессии)
  - [ ] Добавить в `/api/indicators`
  
- [ ] **Frontend: VWAP Display**
  - [ ] Линии VWAP bands на main chart
  - [ ] Разные цвета для разных σ
  - [ ] Toggle показа bands

#### 2.3 Footprint Chart (Optional - Advanced)
**Статус**: ❌ Не начато  
**Важность**: 🟡 СРЕДНЯЯ (можно отложить)

**Задачи**:
- [ ] Исследовать доступность order book data из Hyperliquid
- [ ] Footprint/Cluster chart component
- [ ] Bid/Ask volume по ценам
- [ ] Imbalance detection

**Примечание**: Может потребоваться WebSocket stream из Hyperliquid для реал-тайм data

---

### **PHASE 3: Trading Setups Implementation** 🟠 MEDIUM PRIORITY

#### 3.1 Setup 1: Trend Continuation
**Статус**: ❌ Не начато  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Backend: Trend Continuation Logic**
  - [ ] Создать `/core/strategy/setups/trend_continuation.py`
  - [ ] Detect impulse movement (пробой из баланса)
  - [ ] Build impulse Volume Profile
  - [ ] Find LVN within impulse
  - [ ] Wait for pullback to LVN
  - [ ] Check CVD confirmation
  - [ ] Calculate entry/stop/target
  
- [ ] **Frontend: Trend Setup Display**
  - [ ] Компонент `TrendSetupPanel.tsx`
  - [ ] Показывать активные setups
  - [ ] Отметка impulse range на графике
  - [ ] Отметка LVN entry zone
  - [ ] Линии stop-loss и take-profit
  - [ ] Status: WAITING / TRIGGERED / IN POSITION

#### 3.2 Setup 2: Failed Breakout (Mean Reversion)
**Статус**: ❌ Не начато  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Backend: Failed Breakout Logic**
  - [ ] Создать `/core/strategy/setups/failed_breakout.py`
  - [ ] Detect balance range
  - [ ] Detect breakout attempt
  - [ ] Detect failed breakout (reclaim)
  - [ ] Wait for second touch
  - [ ] Check CVD reversal confirmation
  - [ ] Calculate entry/stop/target (к POC баланса)
  
- [ ] **Frontend: Failed Breakout Display**
  - [ ] Компонент `FailedBreakoutPanel.tsx`
  - [ ] Отметка balance range
  - [ ] Отметка failed breakout
  - [ ] Entry zone highlight
  - [ ] Target к POC

---

### **PHASE 4: Risk Management & Position Management** 🟢 MEDIUM PRIORITY

#### 4.1 Risk Calculator
**Статус**: ❌ Не начато  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Backend: Risk Manager**
  - [ ] Создать `/core/risk/position_sizer.py`
  - [ ] Расчет размера позиции (0.25-0.5% риска)
  - [ ] Risk:Reward ratio calculator (минимум 2:1)
  - [ ] Validation правил риска
  - [ ] Daily/Weekly loss limits
  
- [ ] **Frontend: Risk Dashboard**
  - [ ] Показывать текущий риск на сделку
  - [ ] Показывать доступный capital
  - [ ] Показывать дневную P&L
  - [ ] Показывать лимиты (2% day, 5% week)

#### 4.2 Position Tracker
**Статус**: ❌ Не начато  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Backend: Position Manager**
  - [ ] Трекинг открытых позиций
  - [ ] Текущая P&L
  - [ ] Stop-loss monitoring
  - [ ] Take-profit monitoring
  - [ ] Break-even adjustment logic
  
- [ ] **Frontend: Position Panel**
  - [ ] Компонент `PositionPanel.tsx`
  - [ ] Показывать открытые позиции
  - [ ] Entry price, current price, P&L
  - [ ] Stop и Target уровни
  - [ ] Manual close button

---

### **PHASE 5: Hyperliquid Integration** 🔴 HIGH PRIORITY

#### 5.1 Hyperliquid API Integration
**Статус**: 🟡 Частично (есть data fetcher для истории)  
**Важность**: 🔴 КРИТИЧНО для live trading

**Задачи**:
- [ ] **Real-time Data Stream**
  - [ ] WebSocket connection к Hyperliquid
  - [ ] Stream live candles
  - [ ] Stream live trades (для CVD)
  - [ ] Stream order book updates
  - [ ] Reconnection logic
  - [ ] Создать `/core/data/hyperliquid_stream.py`
  
- [ ] **Order Execution**
  - [ ] Hyperliquid authentication (API keys)
  - [ ] Place market order
  - [ ] Place limit order
  - [ ] Cancel order
  - [ ] Query positions
  - [ ] Query account balance
  - [ ] Создать `/core/exchanges/hyperliquid_executor.py`
  
- [ ] **Testing Environment**
  - [ ] Testnet support (если есть у Hyperliquid)
  - [ ] Paper trading mode (виртуальное исполнение)
  - [ ] Order simulation

**Зависимости**: Требуется для автоматической торговли

#### 5.2 Trade Journal & History
**Статус**: ❌ Не начато  
**Важность**: 🟠 ВЫСОКАЯ

**Задачи**:
- [ ] **Backend: Trade Logger**
  - [ ] Создать `/core/data/trade_journal.py`
  - [ ] Database schema для сделок
  - [ ] Запись каждого трейда (entry, exit, P&L, setup type)
  - [ ] Запись условий входа (state, indicators)
  - [ ] Screenshot/chart snapshot хранение
  - [ ] API: `/api/trades` (CRUD)
  
- [ ] **Frontend: Trade Journal**
  - [ ] Компонент `TradeJournal.tsx`
  - [ ] Таблица всех сделок
  - [ ] Фильтры (по дате, setup, результат)
  - [ ] Просмотр деталей сделки
  - [ ] Chart replay для сделки

---

### **PHASE 6: Analytics & Optimization** 🟢 LOWER PRIORITY

#### 6.1 Performance Analytics
**Статус**: ❌ Не начато  
**Важность**: 🟢 СРЕДНЯЯ

**Задачи**:
- [ ] **Backend: Stats Calculator**
  - [ ] Win rate по setups
  - [ ] Average R:R
  - [ ] Profit factor
  - [ ] Max drawdown
  - [ ] Streak анализ
  - [ ] Hourly/Session performance
  - [ ] API: `/api/analytics`
  
- [ ] **Frontend: Analytics Dashboard**
  - [ ] Компонент `AnalyticsPanel.tsx`
  - [ ] Графики performance
  - [ ] Equity curve
  - [ ] Setup comparison
  - [ ] Time-of-day heatmap
  - [ ] Weekly/Monthly reports

#### 6.2 Strategy Optimization
**Статус**: ❌ Не начато  
**Важность**: 🟢 СРЕДНЯЯ

**Задачи**:
- [ ] Parameter optimization tools
- [ ] Backtesting framework
- [ ] Walk-forward analysis
- [ ] Monte Carlo simulation

---

## 🎯 Приоритизация работ

### **Неделя 1-2: Foundation (Volume Profile + Market State)**
```
GOAL: Визуализировать ключевые уровни (POC, LVN, VAH/VAL) и определять состояние рынка

✅ Критично:
1. Volume Profile backend calculator
2. Volume Profile frontend display
3. Market State detector
4. Enhanced CVD analysis

📊 Результат: Видим, где рынок в балансе/дисбалансе и ключевые уровни
```

### **Неделя 3-4: Setups (Entry Logic)**
```
GOAL: Реализовать два основных сетапа стратегии

✅ Критично:
1. Trend Continuation setup logic
2. Failed Breakout setup logic
3. Entry/Stop/Target calculation
4. Setup visualization на графике

📊 Результат: Система показывает потенциальные входы в реальном времени
```

### **Неделя 5-6: Execution (Hyperliquid Integration)**
```
GOAL: Подключить реальную биржу и автоматизировать исполнение

✅ Критично:
1. Hyperliquid WebSocket stream
2. Order execution (market/limit)
3. Position tracking
4. Risk management implementation

📊 Результат: Можно запустить в paper trading mode
```

### **Неделя 7-8: Analytics & Refinement**
```
GOAL: Добавить журнал сделок и аналитику для оптимизации

✅ Критично:
1. Trade journal
2. Performance analytics
3. Strategy parameter tuning
4. Testing & bug fixes

📊 Результат: Полноценная система с feedback loop
```

---

## 🛠️ Технический стек

### **Frontend (Existing)**
- ✅ Next.js 15 + React 18
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Zustand (state management)
- ✅ Lightweight Charts 4.2.3
- ✅ Audio feedback system

### **Backend (Existing)**
- ✅ Python 3.13
- ✅ FastAPI
- ✅ Polars (data processing)
- ✅ NumPy + Pandas
- ✅ Parquet storage

### **Нужно добавить**
- [ ] DuckDB (для сложных queries на историю)
- [ ] Redis (для real-time data cache)
- [ ] PostgreSQL (для trade journal)
- [ ] WebSocket server (для live updates фронтенда)
- [ ] Hyperliquid SDK / CCXT
- [ ] TA-Lib или pandas-ta (для расширенных индикаторов)

---

## 📋 Чеклист для запуска Live Trading

Перед запуском в production необходимо:

- [ ] ✅ Volume Profile работает корректно
- [ ] ✅ Market State определяется точно
- [ ] ✅ Оба сетапа генерируют валидные сигналы
- [ ] ✅ Risk management проверен (не превышает 0.5% риск)
- [ ] ✅ Hyperliquid API протестирован на testnet/paper
- [ ] ✅ Stop-loss logic работает (автоматическое закрытие)
- [ ] ✅ Reconnection logic для WebSocket
- [ ] ✅ Error handling и logging
- [ ] ✅ Manual override controls (пауза, закрытие позиции)
- [ ] ✅ Backtesting показывает положительный expectancy
- [ ] ✅ Trade journal записывает все корректно
- [ ] ✅ Alerts и notifications настроены
- [ ] ✅ Security (API keys защищены)

---

## 📞 Контрольные точки (Milestones)

### ✅ Milestone 1: UI Foundation (COMPLETED)
- ✅ График работает
- ✅ CVD отображается
- ✅ Индикаторы работают
- ✅ Live telemetry
- ✅ Theme system

### 🚧 Milestone 2: Strategy Foundation (IN PROGRESS)
- ⏳ Volume Profile
- ⏳ Market State detection
- ⏳ Enhanced order flow analysis

### ⏳ Milestone 3: Trading Logic (PLANNED)
- ⏳ Setup 1: Trend Continuation
- ⏳ Setup 2: Failed Breakout
- ⏳ Entry/Exit logic

### ⏳ Milestone 4: Live Trading (PLANNED)
- ⏳ Hyperliquid integration
- ⏳ Order execution
- ⏳ Position management
- ⏳ Risk controls

### ⏳ Milestone 5: Analytics & Optimization (PLANNED)
- ⏳ Trade journal
- ⏳ Performance analytics
- ⏳ Parameter optimization

---

## 🔄 Следующие шаги (Immediate Actions)

### **Прямо сейчас нужно:**

1. **Volume Profile Implementation** 🔴
   - Это foundation для всей стратегии
   - Без него не можем определять LVN, POC, Value Area
   - Начать с backend calculator
   
2. **Market State Detector** 🔴
   - Определяет, когда торговать каждый сетап
   - Balance vs Out-of-balance detection
   - Range breakout detection

3. **VWAP Indicator** 🟠
   - Дополнительный фильтр для входов
   - Определение перекупленности/перепроданности

---

## 📝 Notes & Considerations

### Важные замечания:
- **Paper trading первый**: Тестируем все на виртуальных деньгах минимум месяц
- **Малый риск**: Всегда 0.25-0.5% максимум на трейд
- **No overfitting**: Не оптимизировать слишком сильно под историю
- **Manual override**: Всегда возможность вмешаться вручную
- **Logging everything**: Каждое решение робота записывать для анализа

### Риски:
- ⚠️ Hyperliquid API limits (rate limiting)
- ⚠️ WebSocket disconnects (need robust reconnection)
- ⚠️ Latency (исполнение может опаздывать)
- ⚠️ Slippage (на малой ликвидности)
- ⚠️ False signals (в низковолатильные периоды)

### Opportunities:
- ✨ 24/7 рынок крипты = больше возможностей
- ✨ High volatility BTC = хорошие R:R setups
- ✨ Hyperliquid низкие комиссии
- ✨ Полная автоматизация освобождает время

---

**Last Updated**: November 1, 2025  
**Next Review**: При завершении каждого milestone

---

> 💡 **Философия разработки**: Iterative progress, test everything, trade small, scale gradually.


