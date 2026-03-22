/**
 * Order Flow API client and types.
 * All data from Hyperliquid via /api/hl/* endpoints.
 */

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Types ────────────────────────────────────────────────────────

export interface AssetContext {
  coin: string;
  markPx: number;
  midPx: number;
  oraclePx: number;
  funding: number;
  openInterest: number;
  dayNtlVlm: number;
  prevDayPx: number;
  premium: number;
  maxLeverage: number;
  szDecimals: number;
}

export interface BookLevel {
  px: number;
  sz: number;
  n: number;
}

export interface OrderBook {
  coin: string;
  time: number;
  bids: BookLevel[];
  asks: BookLevel[];
  spread: number;
  mid: number;
}

export interface TapeEntry {
  ts: number;
  px: number;
  sz: number;
  side: 'B' | 'A';
  notional: number;
  large: boolean;
}

export interface TapeStats {
  count: number;
  buy_count: number;
  sell_count: number;
  total_vol: number;
  buy_vol: number;
  sell_vol: number;
  buy_pct: number;
  large_trades: number;
  large_buy: number;
  large_sell: number;
  last_px: number;
  vwap: number;
  '1m_buy_vol': number;
  '1m_sell_vol': number;
}

export interface CVDState {
  cvd: number;
  session_start: number;
  last_update: number;
}

export interface CVDPoint {
  ts: number;
  cvd: number;
}

export interface FootprintLevel {
  buy_vol: number;
  sell_vol: number;
  delta: number;
  imbalance: number;
  buy_count: number;
  sell_count: number;
}

export interface FootprintCandle {
  time: number;
  buy_vol: number;
  sell_vol: number;
  delta: number;
  poc: number;
  levels: number;
}

export interface BookImbalance {
  bid_vol: number;
  ask_vol: number;
  imbalance: number;
  ratio: number;
  levels: number;
  coin: string;
  mid: number;
}

export interface FundingEntry {
  coin: string;
  fundingRate: number;
  premium: number;
  time: number;
}

// ── Fetchers ─────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path}: ${res.statusText}`);
  return res.json();
}

export interface LiveCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const orderflowApi = {
  liveCandles: (coin = 'BTC', interval = '5m', limit = 500) =>
    get<LiveCandle[]>(`/api/hl/candles?coin=${coin}&interval=${interval}&limit=${limit}`),

  context: (coin = 'BTC') =>
    get<AssetContext>(`/api/hl/context?coin=${coin}`),

  orderbook: (coin = 'BTC') =>
    get<OrderBook>(`/api/hl/orderbook?coin=${coin}`),

  recentTrades: (coin = 'BTC') =>
    get<TapeEntry[]>(`/api/hl/trades/recent?coin=${coin}`),

  tape: (limit = 200) =>
    get<TapeEntry[]>(`/api/hl/tape?limit=${limit}`),

  tapeStats: () =>
    get<TapeStats>(`/api/hl/tape/stats`),

  cvd: () =>
    get<CVDState>(`/api/hl/cvd`),

  cvdHistory: (limit = 500) =>
    get<CVDPoint[]>(`/api/hl/cvd/history?limit=${limit}`),

  footprint: () =>
    get<Record<string, FootprintLevel>>(`/api/hl/footprint`),

  footprintCandles: (n = 20) =>
    get<FootprintCandle[]>(`/api/hl/footprint/candles?n=${n}`),

  imbalance: (coin = 'BTC', levels = 5) =>
    get<BookImbalance>(`/api/hl/imbalance?coin=${coin}&levels=${levels}`),

  funding: (coin = 'BTC', hours = 24) =>
    get<FundingEntry[]>(`/api/hl/funding?coin=${coin}&hours=${hours}`),

  mids: () =>
    get<Record<string, number>>(`/api/hl/mids`),
};
