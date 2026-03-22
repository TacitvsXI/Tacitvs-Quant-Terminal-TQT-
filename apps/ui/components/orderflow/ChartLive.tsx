'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import { useAppStore } from '@/lib/store';
import { getChartThemeColors } from '@/lib/theme';
import { orderflowApi, type LiveCandle } from '@/lib/orderflow';
import { useAssetContext } from '@/lib/useOrderFlow';

interface Props {
  symbol: string;
  timeframe: string;
  height?: number;
  initialData?: LiveCandle[];
  onReady?: () => void;
}

const TF_INTERVAL_SEC: Record<string, number> = {
  '1m': 60, '3m': 180, '5m': 300, '15m': 900, '30m': 1800,
  '1h': 3600, '2h': 7200, '4h': 14400, '8h': 28800, '12h': 43200,
  '1d': 86400,
};

export default function ChartLive({ symbol, timeframe, height = 360, initialData, onReady }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const candlesRef = useRef<LiveCandle[]>([]);
  const lastBarRef = useRef<CandlestickData | null>(null);
  const tfRef = useRef(timeframe);

  const [barCount, setBarCount] = useState(0);
  const [lastCandle, setLastCandle] = useState<LiveCandle | null>(null);

  const { theme } = useAppStore();
  const { data: ctx } = useAssetContext('BTC');

  // Create chart once — only on mount or height change
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getChartThemeColors(theme);

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid, style: 1 },
        horzLines: { color: colors.grid, style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: colors.crosshair, width: 1, style: 3, labelBackgroundColor: colors.upColor },
        horzLine: { color: colors.crosshair, width: 1, style: 3, labelBackgroundColor: colors.upColor },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.05, bottom: 0.15 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderVisible: false,
      wickUpColor: colors.wickUpColor,
      wickDownColor: colors.wickDownColor,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    lastBarRef.current = null;

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Update theme colors in-place — no chart recreation, no data loss
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    const colors = getChartThemeColors(theme);

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        vertLine: { color: colors.crosshair, labelBackgroundColor: colors.upColor },
        horzLine: { color: colors.crosshair, labelBackgroundColor: colors.upColor },
      },
    });

    seriesRef.current.applyOptions({
      upColor: colors.upColor,
      downColor: colors.downColor,
      wickUpColor: colors.wickUpColor,
      wickDownColor: colors.wickDownColor,
    });
  }, [theme]);

  const initialUsedRef = useRef(false);

  const applyCandles = useCallback((data: LiveCandle[]) => {
    if (!seriesRef.current) return;
    candlesRef.current = data;
    tfRef.current = timeframe;

    const formatted: CandlestickData[] = data.map(c => ({
      time: c.time as CandlestickData['time'],
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    seriesRef.current.setData(formatted);
    lastBarRef.current = formatted.length > 0 ? { ...formatted[formatted.length - 1] } : null;
    setBarCount(data.length);
    setLastCandle(data.length > 0 ? data[data.length - 1] : null);
    chartRef.current?.timeScale().scrollToRealTime();
    onReady?.();
  }, [timeframe, onReady]);

  const loadCandles = useCallback(async () => {
    if (!seriesRef.current) return;
    try {
      const coin = symbol.replace('-PERP', '');
      const data = await orderflowApi.liveCandles(coin, timeframe, 500);
      applyCandles(data);
    } catch (e) {
      console.error('Failed to load candles:', e);
    }
  }, [symbol, timeframe, applyCandles]);

  // On mount: use initialData immediately if available, otherwise fetch
  useEffect(() => {
    if (!seriesRef.current) return;
    if (initialData?.length && !initialUsedRef.current) {
      initialUsedRef.current = true;
      applyCandles(initialData);
    } else {
      loadCandles();
    }
  }, [loadCandles, initialData, applyCandles]);

  // Periodic full refresh to pick up closed candles
  useEffect(() => {
    const intervalSec = TF_INTERVAL_SEC[timeframe] ?? 300;
    // Refresh at candle close cadence, but at least every 60s for 1m, max every 5min
    const refreshMs = Math.min(Math.max(intervalSec * 1000, 10_000), 300_000);
    const interval = setInterval(loadCandles, refreshMs);
    return () => clearInterval(interval);
  }, [loadCandles, timeframe]);

  // Live update: modify last candle with live mid price every ~2s
  useEffect(() => {
    if (!ctx || !seriesRef.current || !lastBarRef.current) return;

    const livePx = ctx.midPx;
    if (!livePx || livePx <= 0) return;

    const bar = lastBarRef.current;
    const intervalSec = TF_INTERVAL_SEC[tfRef.current] ?? 300;
    const nowSec = Math.floor(Date.now() / 1000);
    const currentBucketStart = Math.floor(nowSec / intervalSec) * intervalSec;
    const barTime = bar.time as number;

    if (currentBucketStart > barTime) {
      // New candle period started — create a new bar
      const newBar: CandlestickData = {
        time: currentBucketStart as CandlestickData['time'],
        open: livePx,
        high: livePx,
        low: livePx,
        close: livePx,
      };
      seriesRef.current.update(newBar);
      lastBarRef.current = { ...newBar };
      setLastCandle({ time: currentBucketStart, open: livePx, high: livePx, low: livePx, close: livePx, volume: 0 });
    } else {
      // Update existing last bar
      const updated: CandlestickData = {
        time: bar.time,
        open: bar.open,
        high: Math.max(bar.high, livePx),
        low: Math.min(bar.low, livePx),
        close: livePx,
      };
      seriesRef.current.update(updated);
      lastBarRef.current = { ...updated };
      setLastCandle({
        time: barTime,
        open: updated.open,
        high: updated.high,
        low: updated.low,
        close: updated.close,
        volume: 0,
      });
    }
  }, [ctx]);

  const priceColor = lastCandle
    ? lastCandle.close >= lastCandle.open ? 'var(--bull)' : 'var(--bear)'
    : 'var(--accent)';

  return (
    <div className="relative w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] font-bold text-sm glow-strong">{symbol}</span>
          <span className="text-[var(--fg)] opacity-60">|</span>
          <span className="text-[var(--fg)] opacity-80">{timeframe}</span>
          <span className="text-[var(--fg)] opacity-60">|</span>
          <span className="text-[var(--fg)] opacity-40">{barCount} bars</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] pulse-slow" title="Live" />
        </div>

        {lastCandle && (
          <div className="flex items-center gap-3 text-[10px] tabular-nums">
            <span className="text-[var(--fg)] opacity-50">
              O <span className="text-[var(--fg)] opacity-80">{lastCandle.open.toFixed(1)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-50">
              H <span style={{ color: 'var(--bull)' }}>{lastCandle.high.toFixed(1)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-50">
              L <span style={{ color: 'var(--bear)' }}>{lastCandle.low.toFixed(1)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-50">
              C <span style={{ color: priceColor }} className="font-bold">{lastCandle.close.toFixed(1)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div
        ref={chartContainerRef}
        className="border border-[var(--border)] rounded-lg overflow-hidden"
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}
