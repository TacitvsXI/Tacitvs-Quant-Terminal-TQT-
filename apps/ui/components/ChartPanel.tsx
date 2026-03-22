/**
 * 📊 TACITVS QUANT TERMINAL - Chart Panel
 * Complete chart panel with symbol/timeframe selector and indicators
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Chart from './Chart';
import CVDChart from './CVDChart';
import { fetchCandles, fetchIndicator, fetchCVD, Candle } from '@/lib/api';
import { playBeep } from '@/lib/audio';
import { useAppStore } from '@/lib/store';

const AVAILABLE_SYMBOLS = ['BTC-PERP', 'ETH-PERP', 'SOL-PERP'];
const AVAILABLE_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const AVAILABLE_INDICATORS = [
  { id: 'none', name: 'None', color: '#8AFF00' },
  { id: 'ema', name: 'EMA(20)', color: '#8AFF00', length: 20 },
  { id: 'ema', name: 'EMA(50)', color: '#FF6B35', length: 50 },
  { id: 'rsi', name: 'RSI(14)', color: '#7FB7FF', length: 14 },
  { id: 'sma', name: 'SMA(20)', color: '#FFA500', length: 20 },
];
const AVAILABLE_LIMITS = [
  { value: 500, label: '500 bars' },
  { value: 1000, label: '1K bars' },
  { value: 2000, label: '2K bars' },
  { value: 5000, label: '5K bars' },
];

interface IndicatorOverlay {
  name: string;
  data: Array<{ time: number; value: number }>;
  color: string;
}

export function ChartPanel() {
  const { audioEnabled } = useAppStore();
  
  const [symbol, setSymbol] = useState<string>('BTC-PERP');
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [selectedIndicator, setSelectedIndicator] = useState<string>('none');
  const [barsLimit, setBarsLimit] = useState<number>(1000);
  const [showCVD, setShowCVD] = useState<boolean>(false);
  
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<IndicatorOverlay[]>([]);
  const [cvdData, setCvdData] = useState<Array<{ time: number; value: number; delta: number }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadChartData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch candles
      const candleData = await fetchCandles(symbol, timeframe, barsLimit);
      setCandles(candleData);
      
      // Fetch indicator if selected
      if (selectedIndicator !== 'none') {
        const indicatorConfig = AVAILABLE_INDICATORS.find(
          ind => ind.name === selectedIndicator
        );
        
        if (indicatorConfig && indicatorConfig.id !== 'none') {
          const indicatorData = await fetchIndicator(
            symbol,
            timeframe,
            indicatorConfig.id,
            indicatorConfig.length || 14,
            barsLimit
          );
          
          // Handle both regular indicators and BBands
          if (Array.isArray(indicatorData) && indicatorData.length > 0) {
            if ('value' in indicatorData[0]) {
              // Regular indicator (RSI, EMA, SMA)
              setIndicators([{
                name: indicatorConfig.name,
                data: indicatorData as Array<{ time: number; value: number }>,
                color: indicatorConfig.color
              }]);
            } else {
              // BBands - use middle line for now
              setIndicators([{
                name: indicatorConfig.name,
                data: (indicatorData as any[]).map(d => ({ time: d.time, value: d.middle })),
                color: indicatorConfig.color
              }]);
            }
          }
        }
      } else {
        setIndicators([]);
      }
      
      // Fetch CVD if enabled
      if (showCVD) {
        const cvd = await fetchCVD(symbol, timeframe, barsLimit);
        setCvdData(cvd);
      } else {
        setCvdData([]);
      }
      
      playBeep('sim_done', audioEnabled);
    } catch (err) {
      console.error('Error loading chart data:', err);
      
      // Проверяем если это ошибка подключения к API
      const errorMessage = err instanceof Error ? err.message : 'Failed to load chart data';
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        console.warn('⚠️  Backend API is not running!');
        console.warn('📋 To fix: Open a new terminal and run: ./START_BACKEND_NOW.sh');
        console.warn('📍 Or manually: cd apps/api && python -m uvicorn main:app --port 8080 --reload');
        setError('Backend API not running. Charts will be unavailable. Check console for instructions.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, selectedIndicator, barsLimit, showCVD, audioEnabled]);

  // Load chart data
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    playBeep('focus', audioEnabled);
  };

  const handleTimeframeChange = (newTf: string) => {
    setTimeframe(newTf);
    playBeep('focus', audioEnabled);
  };

  const handleIndicatorChange = (newIndicator: string) => {
    setSelectedIndicator(newIndicator);
    playBeep('focus', audioEnabled);
  };

  const handleLimitChange = (newLimit: number) => {
    setBarsLimit(newLimit);
    playBeep('focus', audioEnabled);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Symbol Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--fg)] opacity-60">
            SYMBOL:
          </span>
          <div className="flex gap-1">
            {AVAILABLE_SYMBOLS.map(sym => (
              <button
                key={sym}
                onClick={() => handleSymbolChange(sym)}
                className={`
                  px-3 py-1.5 text-xs font-mono border transition-all
                  ${symbol === sym
                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                    : 'bg-[var(--grid)] text-[var(--fg)] border-[var(--border)] hover:border-[var(--accent)]'
                  }
                `}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--fg)] opacity-60">
            TIMEFRAME:
          </span>
          <div className="flex gap-1">
            {AVAILABLE_TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`
                  px-3 py-1.5 text-xs font-mono border transition-all
                  ${timeframe === tf
                    ? 'bg-[var(--accent)] text-black border-[var(--accent)] font-bold'
                    : 'bg-[var(--grid)] text-[var(--fg)] border-[var(--border)] hover:border-[var(--accent)]'
                  }
                `}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--fg)] opacity-60">
            INDICATOR:
          </span>
          <select
            value={selectedIndicator}
            onChange={(e) => handleIndicatorChange(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-[var(--grid)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
          >
            {AVAILABLE_INDICATORS.map(ind => (
              <option key={ind.name} value={ind.name}>
                {ind.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bars Limit Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[var(--fg)] opacity-60">
            BARS:
          </span>
          <select
            value={barsLimit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-mono bg-[var(--grid)] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
          >
            {AVAILABLE_LIMITS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* CVD Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="cvd-toggle"
            checked={showCVD}
            onChange={(e) => {
              setShowCVD(e.target.checked);
              playBeep('focus', audioEnabled);
            }}
            className="w-4 h-4 accent-[var(--accent)]"
          />
          <label 
            htmlFor="cvd-toggle" 
            className="text-xs font-mono text-[var(--fg)] cursor-pointer hover:text-[var(--accent)] transition-colors"
          >
            CVD
          </label>
        </div>

        {/* Refresh Button */}
        <button
          onClick={loadChartData}
          disabled={isLoading}
          className={`
            px-4 py-1.5 text-xs font-mono border transition-all
            ${isLoading
              ? 'bg-[var(--grid)] text-[var(--fg)] border-[var(--border)] opacity-50 cursor-not-allowed'
              : 'bg-[var(--grid)] text-[var(--accent)] border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black font-bold'
            }
          `}
        >
          {isLoading ? '⟳ LOADING...' : '↻ REFRESH'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded">
          <p className="text-sm font-mono text-red-400">
            ⚠️ {error}
          </p>
        </div>
      )}

      {/* Main Chart */}
      {!error && (
        <Chart
          symbol={symbol}
          timeframe={timeframe}
          candles={candles}
          indicators={indicators}
          height={showCVD ? 400 : 500}
        />
      )}

      {/* CVD Chart (if enabled) */}
      {!error && showCVD && cvdData.length > 0 && (
        <div className="mt-4">
          <CVDChart
            symbol={symbol}
            timeframe={timeframe}
            data={cvdData}
            height={200}
          />
        </div>
      )}
    </div>
  );
}

