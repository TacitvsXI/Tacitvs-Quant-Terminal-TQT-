/**
 * React hooks for order flow data with auto-polling.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { orderflowApi } from './orderflow';

const FAST_POLL = 1000;   // 1s for tape, CVD, imbalance
const MED_POLL = 3000;    // 3s for context, orderbook
const SLOW_POLL = 10000;  // 10s for footprint, funding

export function useAssetContext(coin = 'BTC') {
  return useQuery({
    queryKey: ['hl-context', coin],
    queryFn: () => orderflowApi.context(coin),
    refetchInterval: MED_POLL,
    staleTime: MED_POLL,
  });
}

export function useOrderBook(coin = 'BTC') {
  return useQuery({
    queryKey: ['hl-orderbook', coin],
    queryFn: () => orderflowApi.orderbook(coin),
    refetchInterval: MED_POLL,
    staleTime: MED_POLL,
  });
}

export function useTape(limit = 200) {
  return useQuery({
    queryKey: ['hl-tape', limit],
    queryFn: () => orderflowApi.tape(limit),
    refetchInterval: FAST_POLL,
    staleTime: FAST_POLL,
  });
}

export function useTapeStats() {
  return useQuery({
    queryKey: ['hl-tape-stats'],
    queryFn: () => orderflowApi.tapeStats(),
    refetchInterval: FAST_POLL,
    staleTime: FAST_POLL,
  });
}

export function useCVD() {
  return useQuery({
    queryKey: ['hl-cvd'],
    queryFn: () => orderflowApi.cvd(),
    refetchInterval: FAST_POLL,
    staleTime: FAST_POLL,
  });
}

export function useCVDHistory(limit = 500) {
  return useQuery({
    queryKey: ['hl-cvd-history', limit],
    queryFn: () => orderflowApi.cvdHistory(limit),
    refetchInterval: FAST_POLL,
    staleTime: FAST_POLL,
  });
}

export function useCVDEstimated(coin = 'BTC', interval = '5m', limit = 500) {
  return useQuery({
    queryKey: ['hl-cvd-estimated', coin, interval, limit],
    queryFn: () => orderflowApi.cvdEstimated(coin, interval, limit),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

export function useFootprint() {
  return useQuery({
    queryKey: ['hl-footprint'],
    queryFn: () => orderflowApi.footprint(),
    refetchInterval: SLOW_POLL,
    staleTime: SLOW_POLL,
  });
}

export function useFootprintCandles(n = 20) {
  return useQuery({
    queryKey: ['hl-footprint-candles', n],
    queryFn: () => orderflowApi.footprintCandles(n),
    refetchInterval: SLOW_POLL,
    staleTime: SLOW_POLL,
  });
}

export function useBookImbalance(coin = 'BTC', levels = 5) {
  return useQuery({
    queryKey: ['hl-imbalance', coin, levels],
    queryFn: () => orderflowApi.imbalance(coin, levels),
    refetchInterval: FAST_POLL,
    staleTime: FAST_POLL,
  });
}
