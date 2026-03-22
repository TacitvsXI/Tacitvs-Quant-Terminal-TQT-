# TEZERAKT — Quant Terminal

Professional order flow trading terminal for Hyperliquid perpetuals.  
EV-first approach. Maker-first execution. Built for signal validation before capital deployment.

**Stack:** Python 3.13 (FastAPI) + Next.js 16 (React 19, Lightweight Charts)  
**Venue:** Hyperliquid (BTC-PERP primary)

---

## Architecture

```
                        ┌─────────────────────────────┐
                        │      Hyperliquid API         │
                        │  (Mainnet / Testnet)         │
                        └──────────┬──────────────────-┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
               WebSocket        REST          REST
            (live trades,    (candles,      (L2 book,
             l2Book)        meta, funding)  recentTrades)
                    │              │              │
                    ▼              ▼              ▼
         ┌──────────────────────────────────────────────┐
         │              FastAPI Backend                  │
         │              (localhost:8080)                 │
         │                                              │
         │  ┌────────────────┐  ┌────────────────────┐  │
         │  │ OrderFlow      │  │ Hyperliquid Client │  │
         │  │ Aggregator     │  │ (REST)             │  │
         │  │ (in-memory)    │  │                    │  │
         │  │                │  │ • get_candles      │  │
         │  │ • CVD          │  │ • get_l2_book      │  │
         │  │ • Footprint    │  │ • get_meta         │  │
         │  │ • Tape stats   │  │ • get_funding      │  │
         │  │ • Book imbal.  │  │ • get_recent_trades│  │
         │  └───────┬────────┘  └────────────────────┘  │
         │          │                                    │
         │  ┌───────▼────────┐                           │
         │  │ OrderFlow      │                           │
         │  │ Recorder       │                           │
         │  │ (persistence)  │                           │
         │  │                │                           │
         │  │ → tape.parquet │                           │
         │  │ → cvd.parquet  │                           │
         │  │ → footprint.pq │                           │
         │  │ → signals.pq   │                           │
         │  └────────────────┘                           │
         └──────────────────┬───────────────────────────-┘
                            │
                      REST API (JSON)
                   /api/hl/* endpoints
                            │
                            ▼
         ┌──────────────────────────────────────────────┐
         │              Next.js Frontend                 │
         │              (localhost:3000)                 │
         │                                              │
         │  React Query (polling 1s/3s/10s)             │
         │                                              │
         │  ┌──────────┐ ┌──────┐ ┌──────────────────┐  │
         │  │ChartLive │ │CVD   │ │ContextPanel      │  │
         │  │(candles) │ │Live  │ │(mark/mid/spread  │  │
         │  │          │ │      │ │ funding/OI/vol)  │  │
         │  └──────────┘ └──────┘ └──────────────────┘  │
         │  ┌──────────┐ ┌──────┐ ┌──────────────────┐  │
         │  │Footprint │ │Tape  │ │Book Imbalance    │  │
         │  │Heatmap   │ │(live │ │Gauge (10 lvl)    │  │
         │  │          │ │fills)│ │                   │  │
         │  └──────────┘ └──────┘ └──────────────────┘  │
         └──────────────────────────────────────────────┘
```

---

## Data Flow — Live vs Historical

```
┌─────────────────────────────────────────────────────────────────┐
│                     LIVE PATH (real-time)                        │
│                                                                 │
│  Hyperliquid WS ──→ on_trade() ──→ OrderFlowAggregator         │
│                                     │                           │
│                                     ├──→ CVD (cumulative delta) │
│                                     ├──→ Tape (recent fills)    │
│                                     ├──→ Footprint (px × time)  │
│                                     └──→ REST API → Dashboard   │
│                                                                 │
│  Also: on_trade() ──→ OrderFlowRecorder ──→ Parquet (persist)   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   HISTORICAL PATH (archive)                     │
│                                                                 │
│  Hyperliquid REST ──→ candleSnapshot ──→ Live candle chart      │
│                                                                 │
│  data/orderflow/*.parquet ──→ Replay, journal, backtesting      │
│                                                                 │
│  Parquet files (daily rotation):                                │
│    tape_YYYY-MM-DD.parquet      Raw trade stream                │
│    cvd_YYYY-MM-DD.parquet       Sampled CVD snapshots (5s)      │
│    footprint_YYYY-MM-DD.parquet Derived volume matrix           │
│    signals_YYYY-MM-DD.parquet   Detected setups + outcomes      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hyperliquid Integration — What's Implemented

### REST Client (`core/data/hyperliquid_client.py`)

| Method | Hyperliquid Endpoint | Status |
|--------|---------------------|--------|
| `get_candles()` | `candleSnapshot` | done |
| `get_all_candles()` | paginated candles (up to 5000/req) | done |
| `get_l2_book()` | `l2Book` (20 levels/side) | done |
| `get_recent_trades()` | `recentTrades` | done |
| `get_meta()` | `meta` (universe, decimals, leverage) | done |
| `get_meta_and_asset_ctxs()` | `metaAndAssetCtxs` (mark, funding, OI) | done |
| `get_all_mids()` | `allMids` | done |
| `get_funding_history()` | `fundingHistory` | done |
| `get_clearinghouse_state()` | `clearinghouseState` (positions) | done |
| `get_user_fills()` | `userFills` | done |
| `get_open_orders()` | `openOrders` | done |
| `get_user_fees()` | `userFees` | done |

### WebSocket Client (`core/data/hyperliquid_ws.py`)

| Subscription | Channel | Status |
|-------------|---------|--------|
| Live trades | `trades` | done |
| L2 order book | `l2Book` | done |
| Live candles | `candle` | done |
| Auto-reconnect | — | done |

### Order Flow Aggregator (`core/data/orderflow.py`)

| Metric | Description | Status |
|--------|-------------|--------|
| CVD | Cumulative buy − sell volume from tick stream | done |
| CVD Estimated | Historical CVD from candle direction × volume | done |
| Footprint | Price × time volume matrix with delta/imbalance | done |
| Tape | Ring buffer of recent fills with large-print detection | done |
| Tape Stats | Buy/sell %, VWAP, 1m flow, large trade counts | done |
| Book Imbalance | Bid/ask volume ratio from L2 snapshot (N levels) | done |

### Persistence (`core/data/orderflow_recorder.py`)

| Layer | File | What |
|-------|------|------|
| Raw | `tape_*.parquet` | Every fill from WebSocket |
| Sampled | `cvd_*.parquet` | CVD snapshots every 5 seconds |
| Derived | `footprint_*.parquet` | Aggregated price × time buckets |
| Signals | `signals_*.parquet` | Detected setups with entry/sl/tp/R:R/outcome |

---

## API Endpoints

### Order Flow (`/api/hl/*`)

| Method | Endpoint | Poll | Description |
|--------|----------|------|-------------|
| GET | `/api/hl/candles` | on TF change | Live candles from Hyperliquid API |
| GET | `/api/hl/orderbook` | 3s | L2 book snapshot (bid/ask/spread/mid) |
| GET | `/api/hl/context` | 3s | Mark, mid, oracle, funding, OI, 24h vol |
| GET | `/api/hl/trades/recent` | — | Recent trades (REST) |
| GET | `/api/hl/tape` | 1s | Live tape from WS with notional + large flag |
| GET | `/api/hl/tape/stats` | 1s | Buy/sell %, VWAP, 1m flow |
| GET | `/api/hl/cvd` | 1s | Current CVD value |
| GET | `/api/hl/cvd/history` | 1s | Live tick-level CVD series |
| GET | `/api/hl/cvd/estimated` | 30s | Historical CVD from candles + live tail |
| GET | `/api/hl/footprint` | 10s | Current footprint candle (price levels) |
| GET | `/api/hl/footprint/candles` | 10s | Last N footprint time buckets |
| GET | `/api/hl/imbalance` | 1s | Book imbalance ratio (configurable levels) |
| GET | `/api/hl/funding` | — | Historical funding rates |
| GET | `/api/hl/mids` | — | All mid prices |

### History / Replay (`/api/hl/history/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hl/history/tape` | Recorded trades for a date |
| GET | `/api/hl/history/cvd` | Sampled CVD snapshots for a date |
| GET | `/api/hl/history/footprint` | Footprint buckets for a date |
| GET | `/api/hl/history/signals` | Detected signals for a date |
| GET | `/api/hl/history/signals/range` | Signals across date range + stats |
| GET | `/api/hl/recorder/stats` | Buffer sizes, files on disk |

### Legacy (`/api/*`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/candles` | OHLCV from Parquet files |
| GET | `/api/indicators` | RSI, EMA, SMA, Bollinger |
| GET | `/api/volume_profile` | POC, Value Area, LVN/HVN |
| POST | `/api/ev/calculate` | EV calculation |

---

## Frontend — FLOW Dashboard

Live order flow observation screen at `/FLOW`:

```
┌────────────────────────────────────────────────────┬──────────────┐
│                                                    │              │
│             Candlestick Chart (live)               │   Context    │
│         BTC-PERP  5m  from Hyperliquid API         │   Panel      │
│         Last candle updates with mid price          │              │
│                                                    │  Mark price  │
│                                                    │  Mid price   │
├────────────────────────────────────────────────────┤  Oracle      │
│                                                    │  Funding     │
│             CVD Line Chart (synced)                │  OI          │
│         Estimated from candles + live ticks         │  24h Vol     │
│         Time axis aligned with BTC chart           │  Spread      │
│                                                    │              │
├────────────────────────────────────────────────────┤  Book Imbal. │
│                                                    │  Gauge       │
│             Footprint Heatmap                      │              │
│         Price × time volume matrix                 ├──────────────┤
│         Delta coloring per level                   │              │
│         Imbalance markers                          │   Tape       │
│                                                    │   (live)     │
│                                                    │              │
│                                                    │  Side color  │
│                                                    │  Large print │
│                                                    │  Min filter  │
│                                                    │  Buy/Sell %  │
│                                                    │  VWAP        │
│                                                    │  1m flow     │
└────────────────────────────────────────────────────┴──────────────┘
```

**Timeframes:** 1m, 5m, 15m, 1h, 4h, 1d (synced across chart + CVD)  
**Themes:** Matrix, BlackOps, Neon  
**Keyboard:** Ctrl+K (command palette), Ctrl+1-4 (page nav)

---

## Roadmap

```
Phase 1 — Data Layer                                        ✅ DONE
  Hyperliquid REST client (candles, meta, funding, book)
  Hyperliquid WebSocket client (trades, l2Book, candle)
  Order flow aggregator (CVD, footprint, tape, imbalance)

Phase 2A — Observation Dashboard                            ✅ DONE
  Live candlestick chart (real-time from Hyperliquid API)
  CVD line chart (estimated historical + live tick)
  Tape (color-coded fills, large prints, filters)
  Footprint heatmap (delta, imbalance per level)
  Book imbalance gauge + context panel
  Parquet recorder (tape, CVD, footprint, signals)

Phase 2B — Signal Overlays                                  ⬜ NEXT
  CVD divergence detector
  Absorption marker (imbalance + opposite tape)
  Aggression burst detector
  LVN rejection marker
  Failed breakout candidate
  Signal → signals_*.parquet with entry/sl/tp/R:R

Phase 2C — Replay / Journal Mode                            ⬜ PLANNED
  Browse historical tape/CVD/footprint by date
  "Capture setup" → snapshot to Parquet
  Replay past setups for pattern recognition

Phase 3 — Paper Trader                                      ⬜ PLANNED
  generate_signal() → simulate_entry() → log_result()
  Expectancy calculation from signals_*.parquet
  Forward-test without real orders

Phase 4 — Execution Layer                                   ⬜ PLANNED
  Hyperliquid SDK order placement
  Maker-first limit orders with rebates
  Position manager, partial fills, cancel/replace
  Kill switch, max daily loss, concurrent position limits
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/TacitvsXI/Tacitvs-Quant-Terminal-TQT-.git
cd Tacitvs-Quant-Terminal-TQT

# Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt

# Frontend
cd apps/ui && npm install && cd ../..

# Run (two terminals)
./start-api.sh    # API  → http://localhost:8080
./start-ui.sh     # UI   → http://localhost:3000
```

Swagger docs: http://localhost:8080/docs

---

## Project Structure

```
tqt/
├── apps/
│   ├── api/                    # FastAPI backend
│   │   ├── main.py             # Entry point, CORS, routers
│   │   └── routes/
│   │       ├── orderflow.py    # /api/hl/* (live order flow)
│   │       ├── candles.py      # /api/candles (historical)
│   │       ├── indicators.py   # /api/indicators
│   │       └── volume_profile.py
│   └── ui/                     # Next.js 16 frontend
│       ├── app/
│       │   ├── FLOW/page.tsx   # Order flow dashboard
│       │   ├── LAB/            # Backtesting
│       │   └── OPS/            # Operations
│       ├── components/
│       │   ├── orderflow/      # ChartLive, CVDLive, Tape,
│       │   │                   # FootprintChart, ContextPanel
│       │   ├── Navigation.tsx  # Nav bar + keyboard shortcuts
│       │   └── CommandPalette.tsx
│       └── lib/
│           ├── orderflow.ts    # API types + fetchers
│           └── useOrderFlow.ts # React Query hooks (polling)
├── core/                       # Shared Python modules
│   ├── data/
│   │   ├── hyperliquid_client.py  # REST client
│   │   ├── hyperliquid_ws.py      # WebSocket client
│   │   ├── orderflow.py           # Aggregator (CVD, footprint, tape)
│   │   └── orderflow_recorder.py  # Parquet persistence
│   ├── ev/                     # EV calculator
│   ├── risk/                   # Risk manager
│   └── strategy/               # Strategy framework
├── data/
│   ├── historical/             # Candle Parquet files
│   └── orderflow/              # Live recorded order flow
└── config.yaml                 # Venues, strategies, risk limits
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13, FastAPI, Uvicorn |
| Data | Polars, Parquet, NumPy |
| Frontend | Next.js 16, React 19, TypeScript |
| Charts | Lightweight Charts v4 |
| State | Zustand (local), React Query (server) |
| Styling | Tailwind CSS v4, CSS variable themes |
| Venue | Hyperliquid (REST + WebSocket) |

---

## Key Concepts

**R-units:** 1R = distance from entry to stop. Universal sizing metric.  
**EV-first:** Trade only when `EV_net = p×b − (1−p) − costs > 0`.  
**Maker-first:** Limit orders for rebates (−1.5 bps on Hyperliquid). Saves ~6 bps vs taker.  
**Signal validation before execution:** See 50+ setups visually before deploying capital.

---

MIT License. Not financial advice. Derivatives trading carries substantial risk.
