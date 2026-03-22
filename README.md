# Tacitus Quant Terminal (TQT)

Professional quant trading terminal for perpetual DEX with EV-first approach and venue-agnostic architecture.

**Stack:** Python 3.13 (FastAPI) + Next.js 16 (React 19, Tailwind, Lightweight Charts)  
**Venue:** Hyperliquid (BTC-PERP, ETH-PERP, SOL-PERP)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/you/Tacitvs-Quant-Terminal-TQT.git
cd Tacitvs-Quant-Terminal-TQT

# 2. Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt

# 3. Frontend
cd apps/ui && npm install && cd ../..

# 4. Run (two terminals)
./start-api.sh    # API  → http://localhost:8080
./start-ui.sh     # UI   → http://localhost:3000
```

Or use the full bootstrap script: `./bootstrap_tqt_v2.sh`

---

## Architecture

```
tqt/
├── apps/
│   ├── api/              # FastAPI backend (Python)
│   │   ├── main.py       # App entry, CORS, routers
│   │   ├── routes/       # candles, indicators, volume, volume_profile
│   │   ├── core/         # analysis (volume profile), types
│   │   └── data/         # historical parquet files
│   └── ui/               # Next.js 16 frontend (TypeScript)
│       ├── app/          # App Router pages
│       ├── components/   # ChartPanel, VolumeProfile, MarketState, etc.
│       └── lib/          # API client, store, utils
├── core/                 # Shared Python modules
│   ├── strategy/         # IStrategy, Tortoise (Donchian breakout)
│   ├── ev/               # EV calculator (fees, funding, slippage in R)
│   ├── risk/             # Risk manager (1% R sizing, kill-switch)
│   ├── data/             # Data pipeline
│   └── exchanges/        # Venue adapters
├── data/historical/      # Parquet storage (BTC, ETH, SOL)
├── docs/                 # Documentation hub
└── tests/                # Integration & unit tests
```

---

## Key Concepts

**R-units (Risk Units):**  
1R = distance from entry to stop in $. Universal metric. Sizing: `size = (1% x equity) / stop_distance`

**EV-first Discipline:**  
Trade only when EV_net > 0 after all costs. Formula: `EV_net = p*b - (1-p) - Costs_in_R`

**Maker-first Execution:**  
Limit orders for rebates (-1.5 bps on Hyperliquid). Saves ~6 bps vs taker = $600 per $1M notional.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/candles` | OHLCV data (up to 50K bars) |
| GET | `/api/indicators` | RSI, EMA, SMA, Bollinger |
| GET | `/api/cvd` | Cumulative Volume Delta |
| GET | `/api/volume_profile` | POC, Value Area, LVN/HVN |
| POST | `/api/ev/calculate` | EV calculation with full costs |
| POST | `/api/risk/position-size` | Position sizing (1% R) |
| POST | `/api/strategy/signal` | Strategy signals |

Swagger docs: http://localhost:8080/docs

---

## Frontend Features

- Candlestick charts (Lightweight Charts v4) with multi-timeframe support
- Volume Profile visualization (POC, VAH/VAL, LVN/HVN)
- CVD (Cumulative Volume Delta) histogram
- Technical indicators (RSI, EMA, SMA, Bollinger Bands)
- Market State detection panel (Balance / Trending)
- Live telemetry strip (API status, latency, feed status)
- Three themes: Neon, Matrix, BlackOps
- Command palette (Ctrl+K)

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Detailed setup guide |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Frontend architecture & design system |
| [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) | Code structure reference |
| [docs/api/API_REFERENCE.md](docs/api/API_REFERENCE.md) | REST API reference |
| [docs/strategies/TORTOISE.md](docs/strategies/TORTOISE.md) | Tortoise strategy guide |
| [docs/strategies/STRATEGY_FRAMEWORK.md](docs/strategies/STRATEGY_FRAMEWORK.md) | How to create strategies |
| [ROADMAP.md](ROADMAP.md) | Full implementation roadmap |
| [strategy.md](strategy.md) | Trading strategy (AMT + Order Flow) |
| [implementation.md](implementation.md) | System architecture & data flow |
| [TESTING_PLAN.md](TESTING_PLAN.md) | Testing strategy (TDD, >90% coverage) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13, FastAPI, Uvicorn |
| Data | Pandas, NumPy, Polars, Parquet |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, CSS variables themes |
| Charts | Lightweight Charts v4.2.3, Recharts |
| State | Zustand, React Query |
| Venue | Hyperliquid (REST + planned WebSocket) |

---

## License

MIT

**Disclaimer:** Not financial advice. Derivatives trading carries substantial risk.
