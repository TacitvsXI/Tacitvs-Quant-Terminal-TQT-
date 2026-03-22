/**
 * 🔷 TEZERAKT - Quant Terminal - Custom React Hooks
 * Useful hooks for API and state management
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { api, queryKeys } from './api';
import type { BacktestParams } from './api';

/**
 * Hook to check API health
 */
export function useAPIHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.health,
    refetchInterval: 30000, // Check every 30 seconds
  });
}

/**
 * Hook to get signal for a market
 */
export function useSignal(market: string) {
  return useQuery({
    queryKey: queryKeys.signal(market),
    queryFn: () => api.getSignal(market),
    enabled: !!market,
  });
}

/**
 * Hook to get all markets
 */
export function useMarkets() {
  return useQuery({
    queryKey: queryKeys.markets,
    queryFn: api.getMarkets,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

/**
 * Hook to calculate EV (mutation)
 */
export function useCalculateEV() {
  return useMutation({
    mutationFn: api.calculateEV,
  });
}

/**
 * Hook to check risk (mutation)
 */
export function useCheckRisk() {
  return useMutation({
    mutationFn: api.checkRisk,
  });
}

/**
 * Hook to run backtest (mutation)
 */
export function useRunBacktest() {
  return useMutation({
    mutationFn: api.runBacktest,
  });
}

/**
 * Hook to get candle data for charts
 * Smart caching: IndexedDB → Backend Cache → Hyperliquid API → Mock Data
 */
export function useCandles(market: string, interval: string, daysBack: number) {
  return useQuery({
    queryKey: ['candles', market, interval, daysBack],
    queryFn: async () => {
      const now = Date.now();
      const desiredStart = now - (daysBack * 24 * 60 * 60 * 1000);
      const desiredEnd = now;

      // Step 1: Check IndexedDB cache (frontend)
      if (typeof window !== 'undefined') {
        try {
          const { getCandleCache } = await import('./candle-cache');
          const cache = getCandleCache();
          const cached = await cache.get(market, interval);

          if (cached && cached.candles.length > 0) {
            // Check if we have enough data
            if (cached.firstTimestamp <= desiredStart && cached.lastTimestamp >= desiredEnd - 3600000) {
              // We have all the data we need
              console.log(`[useCandles] IndexedDB hit: ${cached.candles.length} candles for ${market}`);
              return {
                candles: cached.candles.filter(c => c.timestamp >= desiredStart),
                market,
                interval,
                from_cache: true,
              };
            } else {
              // Partial cache hit - we'll merge with API data
              console.log(`[useCandles] Partial IndexedDB hit for ${market}, fetching missing data...`);
            }
          }
        } catch (error) {
          console.warn('[useCandles] IndexedDB error:', error);
        }
      }

      // Step 2: Fetch from backend (which checks its own cache + Hyperliquid)
      try {
        const response = await fetch(
          `http://localhost:8080/api/candles/${market}/${interval}?days_back=${daysBack}`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[useCandles] Backend: ${data.count} candles for ${market} (from_cache: ${data.from_cache})`);
          
          // Store in IndexedDB for next time
          if (typeof window !== 'undefined' && data.candles.length > 0) {
            try {
              const { getCandleCache } = await import('./candle-cache');
              const cache = getCandleCache();
              await cache.set(market, interval, data.candles);
            } catch (error) {
              console.warn('[useCandles] Failed to cache in IndexedDB:', error);
            }
          }

          return {
            candles: data.candles,
            market,
            interval,
            from_cache: data.from_cache,
          };
        }
      } catch (error) {
        console.warn('[useCandles] API error, falling back to mock data:', error);
      }

      // Step 3: Fallback to mock data if everything fails
      console.log(`[useCandles] Using mock data for ${market}`);
      return {
        candles: generateMockCandles(market, daysBack),
        market,
        interval,
        from_cache: false,
      };
    },
    enabled: !!market,
    staleTime: 60000, // Cache for 1 minute
    retry: 1, // Only retry once
  });
}

/**
 * Generate mock candle data with realistic price movement
 */
function generateMockCandles(market: string, count: number) {
  const basePrice = market.includes('BTC') ? 50000 : market.includes('ETH') ? 3000 : 100;
  const candles = [];
  const now = Date.now();
  const interval = 3600000; // 1 hour
  
  let currentPrice = basePrice;
  const trend = Math.random() > 0.5 ? 1 : -1; // Random uptrend or downtrend
  
  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now - (i * interval);
    
    // Add some trend and randomness
    const trendStrength = 0.0005; // 0.05% per candle
    const volatility = 0.015; // 1.5% volatility
    
    currentPrice = currentPrice * (1 + trend * trendStrength + (Math.random() - 0.5) * volatility * 0.5);
    
    // Generate OHLC based on current price
    const open = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.3);
    const close = currentPrice * (1 + (Math.random() - 0.5) * volatility * 0.3);
    
    // High and low with wicks
    const wickSize = volatility * 0.4;
    const high = Math.max(open, close) * (1 + Math.random() * wickSize);
    const low = Math.min(open, close) * (1 - Math.random() * wickSize);
    
    // Volume with some variation
    const baseVolume = market.includes('BTC') ? 1000000 : market.includes('ETH') ? 50000 : 10000;
    const volume = baseVolume * (0.5 + Math.random() * 1.5);
    
    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });
    
    // Update current price for next candle
    currentPrice = close;
  }
  
  return candles;
}

