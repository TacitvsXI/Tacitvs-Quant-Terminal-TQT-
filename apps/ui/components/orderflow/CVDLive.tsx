'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CrosshairMode,
  type LineData,
} from 'lightweight-charts';
import { useAppStore } from '@/lib/store';
import { getChartThemeColors } from '@/lib/theme';
import { useCVDEstimated, useCVD } from '@/lib/useOrderFlow';

interface CVDLiveProps {
  height?: number;
  interval?: string;
  limit?: number;
}

export default function CVDLive({ height = 160, interval = '5m', limit = 500 }: CVDLiveProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const zeroRef = useRef<ISeriesApi<'Line'> | null>(null);
  const dataLenRef = useRef(0);
  const initializedRef = useRef(false);

  const { theme } = useAppStore();

  const { data: history } = useCVDEstimated('BTC', interval, limit);
  const { data: cvdState } = useCVD();

  const chartData = useMemo((): LineData[] => {
    if (!history || history.length === 0) return [];
    const deduped: LineData[] = [];
    let lastTime = 0;
    for (const p of history) {
      const t = Math.floor(p.ts / 1000);
      if (t <= lastTime) continue;
      lastTime = t;
      deduped.push({ time: t as LineData['time'], value: p.cvd });
    }
    return deduped;
  }, [history]);

  // Create chart once — only on mount, height change, or theme change
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
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: true,
      },
    });

    const series = chart.addLineSeries({
      color: colors.upColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      title: 'CVD',
    });

    const zero = chart.addLineSeries({
      color: '#333',
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    zeroRef.current = zero;
    dataLenRef.current = 0;
    initializedRef.current = false;

    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      zeroRef.current = null;
    };
  }, [height, theme]);

  // Update data — initial setData, then incremental update()
  useEffect(() => {
    if (!seriesRef.current || !zeroRef.current || chartData.length === 0) return;

    const prevLen = dataLenRef.current;
    const newLen = chartData.length;

    if (!initializedRef.current || newLen < prevLen) {
      // First load or data reset: full setData
      seriesRef.current.setData(chartData);
      initializedRef.current = true;

      const first = chartData[0];
      const last = chartData[newLen - 1];
      zeroRef.current.setData([
        { time: first.time, value: 0 },
        { time: last.time, value: 0 },
      ]);

      chartRef.current?.timeScale().scrollToRealTime();
    } else if (newLen > prevLen) {
      // Incremental: only update new points
      for (let i = prevLen; i < newLen; i++) {
        seriesRef.current.update(chartData[i]);
      }
      // Extend zero line
      const last = chartData[newLen - 1];
      zeroRef.current.update({ time: last.time, value: 0 });
    } else if (newLen === prevLen && newLen > 0) {
      // Same count but last value might have changed (same-second update)
      seriesRef.current.update(chartData[newLen - 1]);
    }

    dataLenRef.current = newLen;
  }, [chartData]);

  const cvdVal = cvdState?.cvd ?? 0;
  const cvdColor = cvdVal >= 0 ? '#00FF84' : '#fe0174';

  return (
    <div className="relative w-full">
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50">
            CVD (Live)
          </span>
          <span className="text-xs font-mono tabular-nums" style={{ color: cvdColor }}>
            {cvdVal >= 0 ? '+' : ''}{cvdVal.toFixed(4)} BTC
          </span>
        </div>
        {history && (
          <span className="text-[10px] font-mono text-[var(--fg)] opacity-30">
            {history.length} points
          </span>
        )}
      </div>
      <div
        ref={chartContainerRef}
        className="border border-[var(--border)] rounded-lg overflow-hidden"
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
}
