/**
 * 🔷 TEZERAKT - Quant Terminal - API Client
 * FastAPI backend integration
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ===== EXISTING TYPES =====

export interface Signal {
  market: string;
  side: 'LONG' | 'SHORT';
  entry: number;
  stop: number;
  target: number;
  r_usd: number;
  r_ratio: number;
  confidence: number;
}

export interface EVResult {
  ev_gross: number;
  ev_net: number;
  win_rate: number;
  avg_win_r: number;
  avg_loss_r: number;
  fees_r: number;
  funding_r: number;
  slippage_r: number;
  profitable: boolean;
}

export interface RiskCheck {
  can_open: boolean;
  reason?: string;
  daily_trades: number;
  daily_pnl: number;
  max_positions: number;
}

export interface BacktestParams {
  strategy: string;
  market: string;
  timeframe: string;
  start_date?: string;
  end_date?: string;
}

export interface BacktestResult {
  total_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  avg_ev: number;
  trades: Array<{
    timestamp: string;
    market: string;
    side: string;
    pnl: number;
    pnl_r: number;
  }>;
}

// ===== NEW CHART TYPES =====

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorData {
  time: number;
  value: number;
}

export interface BBandsData {
  time: number;
  upper: number;
  middle: number;
  lower: number;
}

// ===== API CLIENT OBJECT =====

/**
 * API Client
 */
export const api = {
  // Health check
  async health(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('API health check failed');
    return res.json();
  },

  // Get signal
  async getSignal(market: string): Promise<Signal> {
    const res = await fetch(`${API_BASE_URL}/signal/${market}`);
    if (!res.ok) throw new Error('Failed to fetch signal');
    return res.json();
  },

  // Calculate EV
  async calculateEV(params: {
    win_rate: number;
    avg_win_r: number;
    avg_loss_r?: number;
    notional: number;
    r_usd: number;
  }): Promise<EVResult> {
    const res = await fetch(`${API_BASE_URL}/ev/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to calculate EV');
    return res.json();
  },

  // Risk check
  async checkRisk(params: {
    market: string;
    size: number;
    side: string;
  }): Promise<RiskCheck> {
    const res = await fetch(`${API_BASE_URL}/risk/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to check risk');
    return res.json();
  },

  // Run backtest
  async runBacktest(params: BacktestParams): Promise<BacktestResult> {
    const res = await fetch(`${API_BASE_URL}/backtest/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to run backtest');
    return res.json();
  },

  // Get markets
  async getMarkets(): Promise<Array<{ symbol: string; price: number; volume_24h: number }>> {
    const res = await fetch(`${API_BASE_URL}/markets`);
    if (!res.ok) throw new Error('Failed to fetch markets');
    return res.json();
  },
};

/**
 * Query keys for TanStack Query
 */
export const queryKeys = {
  health: ['health'],
  signal: (market: string) => ['signal', market],
  markets: ['markets'],
  backtest: (params: BacktestParams) => ['backtest', params],
} as const;

// ===== NEW CHART API FUNCTIONS =====

/**
 * Fetch candlestick data
 */
export async function fetchCandles(
  symbol: string,
  timeframe: string,
  limit: number = 1000
): Promise<Candle[]> {
  const url = `${API_BASE_URL}/api/candles?symbol=${symbol}&tf=${timeframe}&limit=${limit}`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch candles: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching candles:', error);
    throw error;
  }
}

/**
 * Fetch indicator data
 */
export async function fetchIndicator(
  symbol: string,
  timeframe: string,
  indicator: string,
  length: number = 14,
  limit: number = 1000
): Promise<IndicatorData[] | BBandsData[]> {
  const url = `${API_BASE_URL}/api/indicators?symbol=${symbol}&tf=${timeframe}&indicator=${indicator}&length=${length}&limit=${limit}`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch indicator: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching indicator:', error);
    throw error;
  }
}

/**
 * Fetch available symbols and timeframes
 */
export async function fetchAvailableData(): Promise<{
  symbols: string[];
  timeframes: string[];
}> {
  const url = `${API_BASE_URL}/api/candles/available`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch available data: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching available data:', error);
    return {
      symbols: ['BTC-PERP', 'ETH-PERP', 'SOL-PERP'],
      timeframes: ['1m', '5m', '15m', '1h', '4h', '1d']
    };
  }
}

/**
 * Fetch available indicators
 */
export async function fetchAvailableIndicators(): Promise<{
  indicators: Array<{
    id: string;
    name: string;
    description: string;
    default_period: number;
    min_period: number;
    max_period: number;
  }>;
}> {
  const url = `${API_BASE_URL}/api/indicators/available`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch available indicators: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching available indicators:', error);
    return { indicators: [] };
  }
}

/**
 * Fetch CVD (Cumulative Volume Delta) data
 */
export async function fetchCVD(
  symbol: string,
  timeframe: string,
  limit: number = 15000
): Promise<Array<{ time: number; value: number; delta: number }>> {
  const url = `${API_BASE_URL}/api/cvd?symbol=${symbol}&tf=${timeframe}&limit=${limit}`;
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CVD: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching CVD:', error);
    throw error;
  }
}

/**
 * Calculate EV (extended version with all params)
 */
export async function calculateEV(params: {
  win_rate: number;
  avg_win_r: number;
  avg_loss_r: number;
  notional_in?: number;
  notional_out?: number;
  fee_in_bps?: number;
  fee_out_bps?: number;
  funding_rate?: number;
  hold_time_hours?: number;
  slippage_bps?: number;
  gas_usd?: number;
  r_usd?: number;
}): Promise<{
  ev_result: Record<string, number>;
  is_tradeable: boolean;
  message: string;
}> {
  const url = `${API_BASE_URL}/api/ev/calculate`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to calculate EV: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calculating EV:', error);
    throw error;
  }
}
