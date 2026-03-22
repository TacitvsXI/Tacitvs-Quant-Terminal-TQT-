"""
Order Flow API routes.

Live and REST endpoints for order flow data from Hyperliquid:
- L2 order book snapshot
- Recent trades (tape)
- Funding rates and OI
- Asset context (mark price, mid, 24h volume)
- CVD, footprint, tape stats (from aggregator)
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Any
from pathlib import Path
import sys
import logging

ROOT_DIR = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from core.data.hyperliquid_client import HyperliquidClient
from core.data.orderflow import OrderFlowAggregator
from core.data.hyperliquid_ws import HyperliquidWS
from core.data.orderflow_recorder import OrderFlowRecorder

logger = logging.getLogger(__name__)

router = APIRouter()

_client = HyperliquidClient()
_aggregator = OrderFlowAggregator(footprint_tick_size=10.0, footprint_period_ms=300_000)
_recorder = OrderFlowRecorder(flush_interval=30)
_ws: HyperliquidWS | None = None
_ws_started = False


def _ensure_ws():
    """Start WebSocket feed if not already running."""
    global _ws, _ws_started
    if _ws_started:
        return
    _ws_started = True

    _ws = HyperliquidWS()
    _ws.subscribe_trades("BTC")

    def _on_trade(trade):
        _aggregator.on_trade(
            ts=trade.time, px=trade.px, sz=trade.sz,
            side=trade.side, tid=trade.tid,
        )
        _recorder.on_trade(
            ts=trade.time, px=trade.px, sz=trade.sz,
            side=trade.side, tid=trade.tid,
        )

    _ws.on_trade = _on_trade
    _ws.start()
    _recorder.start()

    def _snapshot_loop():
        """Periodically save CVD and footprint snapshots to recorder."""
        import time as _t
        while True:
            _t.sleep(5)
            try:
                cvd_state = _aggregator.get_cvd()
                if cvd_state.get("cvd") is not None:
                    _recorder.snapshot_cvd(cvd_state["cvd"])
            except Exception:
                pass

    import threading
    threading.Thread(target=_snapshot_loop, daemon=True).start()
    logger.info("Order flow WebSocket + Recorder started for BTC")


@router.get("/candles")
async def get_live_candles(
    coin: str = Query("BTC", description="Coin name"),
    interval: str = Query("5m", description="Candle interval"),
    limit: int = Query(500, ge=1, le=5000, description="Number of candles"),
) -> list[dict[str, Any]]:
    """
    Live candles directly from Hyperliquid API (not from Parquet).
    Always returns the most recent data including the current forming candle.
    """
    try:
        import time as _time
        now_ms = int(_time.time() * 1000)

        interval_ms_map = {
            "1m": 60_000, "3m": 180_000, "5m": 300_000, "15m": 900_000,
            "30m": 1_800_000, "1h": 3_600_000, "2h": 7_200_000,
            "4h": 14_400_000, "1d": 86_400_000,
        }
        interval_ms = interval_ms_map.get(interval, 300_000)
        start_ms = now_ms - (limit * interval_ms)

        raw = _client.get_all_candles(coin, interval, start_ms, now_ms)
        if raw.is_empty():
            return []

        candles = []
        for row in raw.iter_rows(named=True):
            candles.append({
                "time": row["timestamp"] // 1000,
                "open": row["open"],
                "high": row["high"],
                "low": row["low"],
                "close": row["close"],
                "volume": row["volume"],
            })
        return candles
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live candles: {e}")


@router.get("/orderbook")
async def get_orderbook(
    coin: str = Query("BTC", description="Coin name (BTC, ETH, SOL)"),
) -> dict[str, Any]:
    """
    L2 order book snapshot from Hyperliquid.
    Up to 20 levels per side (exchange limit).
    """
    try:
        raw = _client.get_l2_book(coin)
        levels = raw.get("levels", [[], []])
        bids = [{"px": float(l["px"]), "sz": float(l["sz"]), "n": l.get("n", 0)} for l in levels[0]]
        asks = [{"px": float(l["px"]), "sz": float(l["sz"]), "n": l.get("n", 0)} for l in levels[1]]
        return {
            "coin": coin,
            "time": raw.get("time", 0),
            "bids": bids,
            "asks": asks,
            "spread": asks[0]["px"] - bids[0]["px"] if bids and asks else 0,
            "mid": (asks[0]["px"] + bids[0]["px"]) / 2 if bids and asks else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orderbook: {e}")


@router.get("/trades/recent")
async def get_recent_trades(
    coin: str = Query("BTC", description="Coin name"),
) -> list[dict[str, Any]]:
    """
    Recent trades from Hyperliquid REST endpoint.
    For live tape, connect to WebSocket instead.
    """
    try:
        raw = _client.get_recent_trades(coin)
        trades = []
        for t in raw:
            trades.append({
                "coin": t.get("coin", coin),
                "side": t.get("side", ""),
                "px": float(t.get("px", 0)),
                "sz": float(t.get("sz", 0)),
                "time": t.get("time", 0),
                "tid": t.get("tid", 0),
            })
        return trades
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trades: {e}")


@router.get("/context")
async def get_asset_context(
    coin: str = Query("BTC", description="Coin name"),
) -> dict[str, Any]:
    """
    Asset context from Hyperliquid: mark price, funding, OI, 24h volume, mid price.
    Uses metaAndAssetCtxs endpoint.
    """
    try:
        raw = _client.get_meta_and_asset_ctxs()
        universe = raw[0]["universe"]
        ctxs = raw[1]

        for meta, ctx in zip(universe, ctxs):
            if meta["name"] == coin:
                return {
                    "coin": coin,
                    "markPx": float(ctx.get("markPx", 0)),
                    "midPx": float(ctx.get("midPx", 0)),
                    "oraclePx": float(ctx.get("oraclePx", 0)),
                    "funding": float(ctx.get("funding", 0)),
                    "openInterest": float(ctx.get("openInterest", 0)),
                    "dayNtlVlm": float(ctx.get("dayNtlVlm", 0)),
                    "prevDayPx": float(ctx.get("prevDayPx", 0)),
                    "premium": float(ctx.get("premium", 0)),
                    "maxLeverage": meta.get("maxLeverage", 0),
                    "szDecimals": meta.get("szDecimals", 0),
                }

        raise HTTPException(status_code=404, detail=f"Coin {coin} not found in Hyperliquid universe")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch context: {e}")


@router.get("/funding")
async def get_funding_history(
    coin: str = Query("BTC", description="Coin name"),
    hours: int = Query(168, ge=1, le=8760, description="Hours of history"),
) -> list[dict[str, Any]]:
    """
    Historical funding rates from Hyperliquid.
    Default: last 7 days (168 hours).
    """
    try:
        import time
        end_ms = int(time.time() * 1000)
        start_ms = end_ms - (hours * 3_600_000)
        raw = _client.get_funding_history(coin, start_ms, end_ms)
        return [
            {
                "coin": f.get("coin", coin),
                "fundingRate": float(f.get("fundingRate", 0)),
                "premium": float(f.get("premium", 0)),
                "time": f.get("time", 0),
            }
            for f in raw
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch funding: {e}")


@router.get("/mids")
async def get_all_mids() -> dict[str, float]:
    """All current mid prices from Hyperliquid."""
    try:
        raw = _client.get_all_mids()
        return {k: float(v) for k, v in raw.items()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch mids: {e}")


# ── Order Flow Aggregator Endpoints ──────────────────────────────

@router.get("/cvd")
async def get_cvd() -> dict[str, Any]:
    """Current CVD value and metadata. Starts WebSocket feed on first call."""
    _ensure_ws()
    return _aggregator.get_cvd()


@router.get("/cvd/history")
async def get_cvd_history(
    limit: int = Query(500, ge=1, le=5000),
) -> list[dict[str, Any]]:
    """CVD time series for charting."""
    _ensure_ws()
    return _aggregator.get_cvd_history(limit)


@router.get("/footprint")
async def get_footprint() -> dict[str, Any]:
    """Latest footprint candle with price-level detail."""
    _ensure_ws()
    return _aggregator.get_footprint()


@router.get("/footprint/candles")
async def get_footprint_candles(
    n: int = Query(20, ge=1, le=100),
) -> list[dict[str, Any]]:
    """Last N footprint time buckets with aggregated delta/volume."""
    _ensure_ws()
    return _aggregator.get_footprint_candles(n)


@router.get("/tape")
async def get_tape(
    limit: int = Query(100, ge=1, le=5000),
) -> list[dict[str, Any]]:
    """Recent tape (trades) with notional and large-trade flag."""
    _ensure_ws()
    return _aggregator.get_tape(limit)


@router.get("/tape/stats")
async def get_tape_stats() -> dict[str, Any]:
    """
    Tape summary: buy/sell count, volume, VWAP, large trades, 1m flow.
    """
    _ensure_ws()
    return _aggregator.get_tape_stats()


@router.get("/imbalance")
async def get_book_imbalance(
    coin: str = Query("BTC"),
    levels: int = Query(5, ge=1, le=20),
) -> dict[str, Any]:
    """
    Order book imbalance from L2 snapshot.
    Ratio > 1 = more bids (buying pressure), < 1 = more asks (selling pressure).
    """
    try:
        raw = _client.get_l2_book(coin)
        raw_levels = raw.get("levels", [[], []])
        bids = [{"px": float(l["px"]), "sz": float(l["sz"])} for l in raw_levels[0]]
        asks = [{"px": float(l["px"]), "sz": float(l["sz"])} for l in raw_levels[1]]
        result = _aggregator.get_book_imbalance(bids, asks, levels)
        result["coin"] = coin
        result["mid"] = (bids[0]["px"] + asks[0]["px"]) / 2 if bids and asks else 0
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute imbalance: {e}")


# ── Recorder / History Endpoints ─────────────────────────────────

@router.get("/recorder/stats")
async def get_recorder_stats() -> dict[str, Any]:
    """Recording buffer sizes and files on disk."""
    return _recorder.stats()


@router.get("/history/tape")
async def get_tape_history(
    date: str = Query(None, description="Date YYYY-MM-DD (default: today)"),
    limit: int = Query(1000, ge=1, le=100000),
) -> dict[str, Any]:
    """Raw trade stream from Parquet. For replay and analysis."""
    df = _recorder.read_tape(date)
    if df.is_empty():
        return {"count": 0, "trades": []}
    df = df.tail(limit)
    return {
        "count": len(df),
        "date": date or "today",
        "trades": df.to_dicts(),
    }


@router.get("/history/cvd")
async def get_cvd_snapshot_history(
    date: str = Query(None, description="Date YYYY-MM-DD (default: today)"),
) -> dict[str, Any]:
    """Sampled CVD snapshots from Parquet."""
    df = _recorder.read_cvd(date)
    if df.is_empty():
        return {"count": 0, "snapshots": []}
    return {
        "count": len(df),
        "date": date or "today",
        "snapshots": df.to_dicts(),
    }


@router.get("/history/footprint")
async def get_footprint_history(
    date: str = Query(None, description="Date YYYY-MM-DD (default: today)"),
) -> dict[str, Any]:
    """Derived footprint buckets from Parquet."""
    df = _recorder.read_footprint(date)
    if df.is_empty():
        return {"count": 0, "levels": []}
    return {
        "count": len(df),
        "date": date or "today",
        "levels": df.to_dicts(),
    }


@router.get("/history/signals")
async def get_signals_history(
    date: str = Query(None, description="Date YYYY-MM-DD (default: today)"),
) -> dict[str, Any]:
    """Detected signals from Parquet. For validation and expectancy analysis."""
    df = _recorder.read_signals(date)
    if df.is_empty():
        return {"count": 0, "signals": []}
    return {
        "count": len(df),
        "date": date or "today",
        "signals": df.to_dicts(),
    }


@router.get("/history/signals/range")
async def get_signals_range(
    start: str = Query(..., description="Start date YYYY-MM-DD"),
    end: str = Query(..., description="End date YYYY-MM-DD"),
) -> dict[str, Any]:
    """Signals across a date range. For expectancy/winrate calculation."""
    df = _recorder.read_signals_range(start, end)
    if df.is_empty():
        return {"count": 0, "signals": []}

    stats: dict[str, Any] = {"count": len(df), "start": start, "end": end}

    if "outcome" in df.columns:
        outcomes = df.group_by("outcome").len()
        stats["outcomes"] = {
            row["outcome"]: row["len"]
            for row in outcomes.iter_rows(named=True)
        }

    if "signal_type" in df.columns:
        by_type = df.group_by("signal_type").len()
        stats["by_type"] = {
            row["signal_type"]: row["len"]
            for row in by_type.iter_rows(named=True)
        }

    stats["signals"] = df.to_dicts()
    return stats
