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

