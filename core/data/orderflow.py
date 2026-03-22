"""
Order flow aggregator.

Builds real-time order flow metrics from Hyperliquid trade stream:
- CVD (Cumulative Volume Delta)
- Footprint chart buckets (price × time grid with buy/sell volume)
- Tape statistics (large trades, speed, aggression)
- Book imbalance from L2 snapshots
"""

import time
import threading
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class TapeEntry:
    """Single trade from the tape."""
    ts: int          # ms
    px: float
    sz: float
    side: str        # "B" (buy/aggressor) or "A" (sell/aggressor)
    tid: int = 0

    @property
    def is_buy(self) -> bool:
        return self.side == "B"

    @property
    def notional(self) -> float:
        return self.px * self.sz


@dataclass
class FootprintBucket:
    """Single price level in a footprint candle."""
    buy_vol: float = 0.0
    sell_vol: float = 0.0
    buy_count: int = 0
    sell_count: int = 0

    @property
    def delta(self) -> float:
        return self.buy_vol - self.sell_vol

    @property
    def total_vol(self) -> float:
        return self.buy_vol + self.sell_vol

    @property
    def imbalance(self) -> float:
        total = self.total_vol
        if total == 0:
            return 0.0
        return self.delta / total


@dataclass
class CVDState:
    """Running CVD (Cumulative Volume Delta) state."""
    cumulative: float = 0.0
    session_start: int = 0
    last_update: int = 0
    history: list = field(default_factory=list)  # [(ts, cvd_value)]
    max_history: int = 10000

    def update(self, trade: TapeEntry):
        delta = trade.sz if trade.is_buy else -trade.sz
        self.cumulative += delta
        self.last_update = trade.ts
        self.history.append((trade.ts, self.cumulative))
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]

    def reset(self):
        self.cumulative = 0.0
        self.session_start = int(time.time() * 1000)
        self.history.clear()


class OrderFlowAggregator:
    """
    Aggregates trade stream into order flow metrics.

    Feed it trades (from WebSocket or REST) and query metrics.
    Thread-safe for concurrent WebSocket feed + API reads.
    """

    def __init__(self, footprint_tick_size: float = 10.0, footprint_period_ms: int = 300_000):
        """
        Args:
            footprint_tick_size: price bucket size for footprint (e.g. 10 = $10 levels for BTC)
            footprint_period_ms: time bucket for footprint candles (default 5min)
        """
        self._lock = threading.Lock()

        self.tick_size = footprint_tick_size
        self.period_ms = footprint_period_ms

        self.cvd = CVDState(session_start=int(time.time() * 1000))

        # Footprint: {time_bucket: {price_bucket: FootprintBucket}}
        self._footprint: dict[int, dict[float, FootprintBucket]] = defaultdict(
            lambda: defaultdict(FootprintBucket)
        )

        # Recent tape (ring buffer)
        self._tape: list[TapeEntry] = []
        self._tape_max = 5000

        # Large trade threshold (in BTC for BTC; adjust per asset)
        self.large_trade_threshold = 0.5

        # Running stats
        self._buy_vol_1m = 0.0
        self._sell_vol_1m = 0.0
        self._last_1m_reset = int(time.time() * 1000)

    def on_trade(self, ts: int, px: float, sz: float, side: str, tid: int = 0):
        """
        Process a single trade. Call from WebSocket handler or REST poller.

        Args:
            ts: timestamp in ms
            px: price
            sz: size (in coin units)
            side: "B" for buy aggressor, "A" for sell aggressor
            tid: trade ID (optional)
        """
        entry = TapeEntry(ts=ts, px=px, sz=sz, side=side, tid=tid)

        with self._lock:
            # CVD
            self.cvd.update(entry)

            # Tape
            self._tape.append(entry)
            if len(self._tape) > self._tape_max:
                self._tape = self._tape[-self._tape_max:]

            # Footprint
            time_bucket = (ts // self.period_ms) * self.period_ms
            price_bucket = self._price_to_bucket(px)
            fp = self._footprint[time_bucket][price_bucket]
            if entry.is_buy:
                fp.buy_vol += sz
                fp.buy_count += 1
            else:
                fp.sell_vol += sz
                fp.sell_count += 1

            # 1-minute running volume
            now = ts
            if now - self._last_1m_reset > 60_000:
                self._buy_vol_1m = 0.0
                self._sell_vol_1m = 0.0
                self._last_1m_reset = now
            if entry.is_buy:
                self._buy_vol_1m += sz
            else:
                self._sell_vol_1m += sz

    def _price_to_bucket(self, px: float) -> float:
        return round(px / self.tick_size) * self.tick_size

    # ── Query methods ─────────────────────────────────────────────────

    def get_cvd(self) -> dict:
        """Current CVD state."""
        with self._lock:
            return {
                "cvd": self.cvd.cumulative,
                "session_start": self.cvd.session_start,
                "last_update": self.cvd.last_update,
            }

    def get_cvd_history(self, limit: int = 500) -> list[dict]:
        """CVD time series for charting."""
        with self._lock:
            points = self.cvd.history[-limit:]
            return [{"ts": ts, "cvd": val} for ts, val in points]

    def get_footprint(self, time_bucket: Optional[int] = None) -> dict:
        """
        Footprint data for a given time bucket (or latest).

        Returns: {price_level: {buy_vol, sell_vol, delta, imbalance}, ...}
        """
        with self._lock:
            if time_bucket is None:
                if not self._footprint:
                    return {}
                time_bucket = max(self._footprint.keys())

            bucket_data = self._footprint.get(time_bucket, {})
            result = {}
            for px, fp in sorted(bucket_data.items()):
                result[str(px)] = {
                    "buy_vol": round(fp.buy_vol, 6),
                    "sell_vol": round(fp.sell_vol, 6),
                    "delta": round(fp.delta, 6),
                    "imbalance": round(fp.imbalance, 4),
                    "buy_count": fp.buy_count,
                    "sell_count": fp.sell_count,
                }
            return result

    def get_footprint_candles(self, n: int = 20) -> list[dict]:
        """Last N footprint time buckets with aggregated stats."""
        with self._lock:
            buckets = sorted(self._footprint.keys())[-n:]
            result = []
            for tb in buckets:
                levels = self._footprint[tb]
                total_buy = sum(fp.buy_vol for fp in levels.values())
                total_sell = sum(fp.sell_vol for fp in levels.values())
                delta = total_buy - total_sell
                poc_px = max(levels.keys(), key=lambda p: levels[p].total_vol) if levels else 0
                result.append({
                    "time": tb,
                    "buy_vol": round(total_buy, 6),
                    "sell_vol": round(total_sell, 6),
                    "delta": round(delta, 6),
                    "poc": poc_px,
                    "levels": len(levels),
                })
            return result

    def get_tape(self, limit: int = 100) -> list[dict]:
        """Recent trades (tape)."""
        with self._lock:
            entries = self._tape[-limit:]
            return [
                {
                    "ts": e.ts,
                    "px": e.px,
                    "sz": e.sz,
                    "side": e.side,
                    "notional": round(e.notional, 2),
                    "large": e.sz >= self.large_trade_threshold,
                }
                for e in entries
            ]

    def get_tape_stats(self) -> dict:
        """Tape summary stats."""
        with self._lock:
            if not self._tape:
                return {"count": 0}

            buys = [t for t in self._tape if t.is_buy]
            sells = [t for t in self._tape if not t.is_buy]
            large = [t for t in self._tape if t.sz >= self.large_trade_threshold]
            total_vol = sum(t.sz for t in self._tape)
            buy_vol = sum(t.sz for t in buys)

            return {
                "count": len(self._tape),
                "buy_count": len(buys),
                "sell_count": len(sells),
                "total_vol": round(total_vol, 6),
                "buy_vol": round(buy_vol, 6),
                "sell_vol": round(total_vol - buy_vol, 6),
                "buy_pct": round(buy_vol / total_vol * 100, 1) if total_vol else 0,
                "large_trades": len(large),
                "large_buy": len([t for t in large if t.is_buy]),
                "large_sell": len([t for t in large if not t.is_buy]),
                "last_px": self._tape[-1].px,
                "vwap": round(
                    sum(t.px * t.sz for t in self._tape) / total_vol, 2
                ) if total_vol else 0,
                "1m_buy_vol": round(self._buy_vol_1m, 6),
                "1m_sell_vol": round(self._sell_vol_1m, 6),
            }

    def get_book_imbalance(self, bids: list, asks: list, levels: int = 5) -> dict:
        """
        Calculate book imbalance from L2 snapshot.

        Args:
            bids: list of {"px": float, "sz": float}
            asks: list of {"px": float, "sz": float}
            levels: how many levels to consider
        """
        bid_vol = sum(b["sz"] for b in bids[:levels])
        ask_vol = sum(a["sz"] for a in asks[:levels])
        total = bid_vol + ask_vol

        return {
            "bid_vol": round(bid_vol, 6),
            "ask_vol": round(ask_vol, 6),
            "imbalance": round((bid_vol - ask_vol) / total, 4) if total else 0,
            "ratio": round(bid_vol / ask_vol, 4) if ask_vol else float("inf"),
            "levels": levels,
        }
