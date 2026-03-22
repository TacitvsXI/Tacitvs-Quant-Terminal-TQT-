"""
Hyperliquid data fetcher.

Downloads historical candles from Hyperliquid and stores them as Parquet.
Replaces the old Binance-based fetcher.
"""

import time
import logging
from pathlib import Path
from datetime import datetime, timezone

import polars as pl

from core.data.hyperliquid_client import HyperliquidClient, HyperliquidConfig

logger = logging.getLogger(__name__)

DEFAULT_DATA_DIR = Path(__file__).parent.parent.parent / "data" / "historical"
API_DATA_DIR = Path(__file__).parent.parent.parent / "apps" / "api" / "data" / "historical"

INTERVAL_MS = {
    "1m": 60_000,
    "3m": 180_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "2h": 7_200_000,
    "4h": 14_400_000,
    "8h": 28_800_000,
    "12h": 43_200_000,
    "1d": 86_400_000,
}


def fetch_and_store(
    coin: str = "BTC",
    intervals: list[str] | None = None,
    days_back: int = 365,
    data_dir: Path | None = None,
    also_write_api_dir: bool = True,
) -> dict[str, int]:
    """
    Download candles from Hyperliquid and save as Parquet.

    Args:
        coin: Hyperliquid coin name (e.g. "BTC", "ETH")
        intervals: list of timeframes to fetch (default: all major)
        days_back: how far back to fetch
        data_dir: where to store parquet files
        also_write_api_dir: also write to apps/api/data/historical/

    Returns:
        dict mapping interval to number of candles fetched
    """
    if intervals is None:
        intervals = ["1m", "5m", "15m", "1h", "4h", "1d"]

    if data_dir is None:
        data_dir = DEFAULT_DATA_DIR

    symbol = f"{coin}-PERP"
    client = HyperliquidClient()

    now_ms = int(time.time() * 1000)
    start_ms = now_ms - (days_back * 86_400_000)

    results = {}

    for interval in intervals:
        logger.info("Fetching %s %s (last %d days)...", coin, interval, days_back)

        try:
            df = client.get_all_candles(coin, interval, start_ms, now_ms)
        except Exception as e:
            logger.error("Failed to fetch %s %s: %s", coin, interval, e)
            results[interval] = 0
            continue

        if df.is_empty():
            logger.warning("No data returned for %s %s", coin, interval)
            results[interval] = 0
            continue

        _save_parquet(df, symbol, interval, data_dir)
        if also_write_api_dir:
            _save_parquet(df, symbol, interval, API_DATA_DIR)

        results[interval] = len(df)

        ts_min = datetime.fromtimestamp(df["timestamp"].min() / 1000, tz=timezone.utc)
        ts_max = datetime.fromtimestamp(df["timestamp"].max() / 1000, tz=timezone.utc)
        logger.info(
            "  %s %s: %d candles | %s → %s | last close: $%s",
            coin, interval, len(df),
            ts_min.strftime("%Y-%m-%d"),
            ts_max.strftime("%Y-%m-%d %H:%M"),
            f"{df['close'][-1]:,.2f}",
        )

        time.sleep(0.3)

    return results


def _save_parquet(df: pl.DataFrame, symbol: str, interval: str, base_dir: Path):
    out_dir = base_dir / symbol
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{interval}.parquet"
    df.write_parquet(path)


def main():
    """CLI entry point. Downloads BTC data from Hyperliquid."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    print("=" * 60)
    print("  TQT Data Fetcher — Hyperliquid")
    print("=" * 60)
    print()

    results = fetch_and_store(
        coin="BTC",
        intervals=["1m", "5m", "15m", "1h", "4h", "1d"],
        days_back=365,
    )

    print()
    print("=" * 60)
    print("  Summary")
    print("=" * 60)
    total = 0
    for interval, count in results.items():
        status = f"{count:>6} candles" if count > 0 else "  FAILED"
        print(f"  {interval:>4}  {status}")
        total += count
    print(f"  {'':>4}  {'─' * 16}")
    print(f"  {'TOTAL':>4}  {total:>6} candles")
    print()


if __name__ == "__main__":
    main()
