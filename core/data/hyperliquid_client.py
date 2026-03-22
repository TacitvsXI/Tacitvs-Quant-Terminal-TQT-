"""
Hyperliquid REST client.

All public data goes through POST https://api.hyperliquid.xyz/info
with different `type` values in the request body.
"""

import time
import logging
from typing import Optional
from dataclasses import dataclass

import requests
import polars as pl

logger = logging.getLogger(__name__)

MAINNET_URL = "https://api.hyperliquid.xyz"
TESTNET_URL = "https://api.hyperliquid-testnet.xyz"

VALID_INTERVALS = [
    "1m", "3m", "5m", "15m", "30m",
    "1h", "2h", "4h", "8h", "12h",
    "1d", "3d", "1w", "1M",
]

CANDLE_LIMIT = 5000  # Hyperliquid max per request


@dataclass
class HyperliquidConfig:
    base_url: str = MAINNET_URL
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0


class HyperliquidClient:
    """
    REST client for Hyperliquid info endpoint.

    Covers: candles, meta, asset contexts, funding, recent trades, L2 book.
    No API key required for public data.
    """

    def __init__(self, config: Optional[HyperliquidConfig] = None):
        self.config = config or HyperliquidConfig()
        self._session = requests.Session()
        self._session.headers.update({"Content-Type": "application/json"})

    def _post(self, payload: dict) -> dict | list:
        url = f"{self.config.base_url}/info"
        for attempt in range(self.config.max_retries):
            try:
                resp = self._session.post(url, json=payload, timeout=self.config.timeout)
                resp.raise_for_status()
                return resp.json()
            except requests.exceptions.RequestException as e:
                if attempt == self.config.max_retries - 1:
                    raise
                logger.warning("Request failed (attempt %d/%d): %s", attempt + 1, self.config.max_retries, e)
                time.sleep(self.config.retry_delay * (attempt + 1))

    # ── Meta ──────────────────────────────────────────────────────────

    def get_meta(self) -> dict:
        """Perpetuals universe: coin names, szDecimals, maxLeverage."""
        return self._post({"type": "meta"})

    def get_meta_and_asset_ctxs(self) -> list:
        """Meta + live context: mark price, funding, OI, mid price, dayNtlVlm."""
        return self._post({"type": "metaAndAssetCtxs"})

    def get_all_mids(self) -> dict:
        """Current mid prices for all coins. Returns {"BTC": "87234.5", ...}."""
        return self._post({"type": "allMids"})

    # ── Candles ───────────────────────────────────────────────────────

    def get_candles(
        self,
        coin: str,
        interval: str,
        start_time: int,
        end_time: Optional[int] = None,
    ) -> list[dict]:
        """
        Fetch candle snapshot. Returns up to 5000 candles.

        Args:
            coin: e.g. "BTC", "ETH" (not "BTC-PERP")
            interval: one of VALID_INTERVALS
            start_time: start timestamp in milliseconds
            end_time: end timestamp in milliseconds (default: now)
        """
        if interval not in VALID_INTERVALS:
            raise ValueError(f"Invalid interval {interval!r}. Valid: {VALID_INTERVALS}")

        req = {"coin": coin, "interval": interval, "startTime": start_time}
        if end_time is not None:
            req["endTime"] = end_time

        return self._post({"type": "candleSnapshot", "req": req})

    def get_all_candles(
        self,
        coin: str,
        interval: str,
        start_time: int,
        end_time: Optional[int] = None,
    ) -> pl.DataFrame:
        """
        Fetch all available candles with automatic pagination.

        Hyperliquid returns max 5000 per request.
        We paginate using the last candle's close time as next startTime.

        Returns a Polars DataFrame with columns:
            timestamp (ms), open, high, low, close, volume, n_trades
        """
        if end_time is None:
            end_time = int(time.time() * 1000)

        all_candles = []
        cursor = start_time

        while cursor < end_time:
            batch = self.get_candles(coin, interval, cursor, end_time)
            if not batch:
                break

            all_candles.extend(batch)

            last_close_time = batch[-1]["T"]
            next_start = last_close_time + 1
            if next_start <= cursor:
                break
            cursor = next_start

            if len(batch) < CANDLE_LIMIT:
                break

            time.sleep(0.2)

        if not all_candles:
            return pl.DataFrame()

        return self._candles_to_dataframe(all_candles)

    @staticmethod
    def _candles_to_dataframe(candles: list[dict]) -> pl.DataFrame:
        """
        Convert raw Hyperliquid candle dicts to Polars DataFrame.

        Raw format: {"t": open_ms, "T": close_ms, "s": "BTC", "i": "1h",
                     "o": "87000.0", "h": "87500.0", "l": "86900.0",
                     "c": "87200.0", "v": "123.456", "n": 500}
        """
        rows = []
        seen = set()
        for c in candles:
            t = c["t"]
            if t in seen:
                continue
            seen.add(t)
            rows.append({
                "timestamp": t,
                "open": float(c["o"]),
                "high": float(c["h"]),
                "low": float(c["l"]),
                "close": float(c["c"]),
                "volume": float(c["v"]),
                "n_trades": c.get("n", 0),
            })

        df = pl.DataFrame(rows)
        if len(df) > 0:
            df = df.sort("timestamp")
        return df

    # ── Order Book ────────────────────────────────────────────────────

    def get_l2_book(self, coin: str, n_sig_figs: Optional[int] = None) -> dict:
        """
        L2 order book snapshot. Up to 20 levels per side.

        Returns: {"coin": "BTC", "time": ..., "levels": [[bids], [asks]]}
        """
        payload: dict = {"type": "l2Book", "coin": coin}
        if n_sig_figs is not None:
            payload["nSigFigs"] = n_sig_figs
        return self._post(payload)

    # ── Recent Trades ─────────────────────────────────────────────────

    def get_recent_trades(self, coin: str) -> list[dict]:
        """Recent trades via REST. For live tape, use WebSocket instead."""
        return self._post({"type": "recentTrades", "coin": coin})

    # ── Funding ───────────────────────────────────────────────────────

    def get_funding_history(
        self,
        coin: str,
        start_time: int,
        end_time: Optional[int] = None,
    ) -> list[dict]:
        """Historical funding rates."""
        payload: dict = {"type": "fundingHistory", "coin": coin, "startTime": start_time}
        if end_time is not None:
            payload["endTime"] = end_time
        return self._post(payload)

    # ── User data (requires address, no signing) ──────────────────────

    def get_clearinghouse_state(self, user: str) -> dict:
        """User positions, margin, equity. Needs 0x address."""
        return self._post({"type": "clearinghouseState", "user": user})

    def get_user_fills(self, user: str) -> list[dict]:
        """User's recent fills (up to 2000)."""
        return self._post({"type": "userFills", "user": user})

    def get_open_orders(self, user: str) -> list[dict]:
        """User's currently open orders."""
        return self._post({"type": "openOrders", "user": user})

    def get_user_fees(self, user: str) -> dict:
        """User's fee schedule and rates."""
        return self._post({"type": "userFees", "user": user})
