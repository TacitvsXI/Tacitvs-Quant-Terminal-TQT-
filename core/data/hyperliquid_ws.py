"""
Hyperliquid WebSocket client for live data.

Subscriptions: trades, l2Book, candle.
This is the primary feed for order flow (tape, CVD, book imbalance).
"""

import json
import time
import logging
import threading
from typing import Callable, Optional
from dataclasses import dataclass, field

import websocket

logger = logging.getLogger(__name__)

WS_MAINNET = "wss://api.hyperliquid.xyz/ws"
WS_TESTNET = "wss://api.hyperliquid-testnet.xyz/ws"


@dataclass
class WsTrade:
    coin: str
    side: str       # "B" (buy) or "A" (sell/ask)
    px: float
    sz: float
    time: int       # ms timestamp
    tid: int


@dataclass
class WsBookLevel:
    px: float
    sz: float
    n: int


@dataclass
class WsBook:
    coin: str
    time: int
    bids: list[WsBookLevel]
    asks: list[WsBookLevel]


class HyperliquidWS:
    """
    WebSocket client for Hyperliquid live data.

    Usage:
        ws = HyperliquidWS()
        ws.on_trade = my_trade_handler
        ws.on_book = my_book_handler
        ws.subscribe_trades("BTC")
        ws.subscribe_l2_book("BTC")
        ws.connect()  # blocking, runs in current thread
        # or
        ws.start()    # non-blocking, runs in background thread
    """

    def __init__(self, url: str = WS_MAINNET):
        self.url = url
        self._ws: Optional[websocket.WebSocketApp] = None
        self._thread: Optional[threading.Thread] = None
        self._subscriptions: list[dict] = []
        self._connected = threading.Event()
        self._running = False

        self.on_trade: Optional[Callable[[WsTrade], None]] = None
        self.on_book: Optional[Callable[[WsBook], None]] = None
        self.on_candle: Optional[Callable[[dict], None]] = None
        self.on_raw: Optional[Callable[[dict], None]] = None

    def subscribe_trades(self, coin: str):
        self._subscriptions.append({
            "method": "subscribe",
            "subscription": {"type": "trades", "coin": coin}
        })

    def subscribe_l2_book(self, coin: str):
        self._subscriptions.append({
            "method": "subscribe",
            "subscription": {"type": "l2Book", "coin": coin}
        })

    def subscribe_candle(self, coin: str, interval: str = "1m"):
        self._subscriptions.append({
            "method": "subscribe",
            "subscription": {"type": "candle", "coin": coin, "interval": interval}
        })

    def connect(self):
        """Blocking connect. Runs event loop in current thread."""
        self._running = True
        self._ws = websocket.WebSocketApp(
            self.url,
            on_open=self._on_open,
            on_message=self._on_message,
            on_error=self._on_error,
            on_close=self._on_close,
        )
        self._ws.run_forever(ping_interval=20, ping_timeout=10)

    def start(self):
        """Non-blocking connect. Runs event loop in a daemon thread."""
        self._thread = threading.Thread(target=self.connect, daemon=True)
        self._thread.start()
        self._connected.wait(timeout=10)

    def stop(self):
        self._running = False
        if self._ws:
            self._ws.close()

    def wait_connected(self, timeout: float = 10) -> bool:
        return self._connected.wait(timeout=timeout)

    def _on_open(self, ws):
        logger.info("WebSocket connected to %s", self.url)
        self._connected.set()
        for sub in self._subscriptions:
            ws.send(json.dumps(sub))
            logger.info("Subscribed: %s", sub["subscription"])

    def _on_message(self, ws, message):
        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            return

        if self.on_raw:
            self.on_raw(data)

        channel = data.get("channel")

        if channel == "trades":
            self._handle_trades(data.get("data", []))
        elif channel == "l2Book":
            self._handle_book(data.get("data", {}))
        elif channel == "candle":
            if self.on_candle:
                self.on_candle(data.get("data", {}))

    def _on_error(self, ws, error):
        logger.error("WebSocket error: %s", error)

    def _on_close(self, ws, close_status_code, close_msg):
        logger.info("WebSocket closed: %s %s", close_status_code, close_msg)
        self._connected.clear()
        if self._running:
            logger.info("Reconnecting in 3s...")
            time.sleep(3)
            self.connect()

    def _handle_trades(self, trades: list[dict]):
        if not self.on_trade:
            return
        for t in trades:
            trade = WsTrade(
                coin=t.get("coin", ""),
                side=t.get("side", ""),
                px=float(t.get("px", 0)),
                sz=float(t.get("sz", 0)),
                time=t.get("time", 0),
                tid=t.get("tid", 0),
            )
            self.on_trade(trade)

    def _handle_book(self, data: dict):
        if not self.on_book:
            return
        levels = data.get("levels", [[], []])
        bids = [WsBookLevel(float(l["px"]), float(l["sz"]), l.get("n", 0)) for l in levels[0]]
        asks = [WsBookLevel(float(l["px"]), float(l["sz"]), l.get("n", 0)) for l in levels[1]]
        book = WsBook(
            coin=data.get("coin", ""),
            time=data.get("time", 0),
            bids=bids,
            asks=asks,
        )
        self.on_book(book)
