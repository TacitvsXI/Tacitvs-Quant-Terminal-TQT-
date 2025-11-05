/**
 * 📊 TACITVS QUANT TERMINAL - CVD Chart Component
 * Cumulative Volume Delta visualization
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import { useAppStore } from '@/lib/store';
import { getChartThemeColors } from '@/lib/theme';

interface CVDData {
  time: number;
  value: number;
  delta: number;
}

interface Props {
  symbol: string;
  timeframe: string;
  data: CVDData[];
  height?: number;
}

export default function CVDChart({ 
  symbol, 
  timeframe, 
  data,
  height = 200 
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get current theme
  const { theme } = useAppStore();
  const themeColors = getChartThemeColors(theme);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart with theme colors
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: themeColors.background },
        textColor: themeColors.text,
      },
      grid: {
        vertLines: { 
          color: themeColors.grid,
          style: 1,
          visible: true,
        },
        horzLines: { 
          color: themeColors.grid,
          style: 1,
          visible: true,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: themeColors.crosshair,
          width: 1,
          style: 3,
          labelBackgroundColor: themeColors.upColor,
        },
        horzLine: {
          color: themeColors.crosshair,
          width: 1,
          style: 3,
          labelBackgroundColor: themeColors.upColor,
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add CVD line series
    const cvdSeries = chart.addLineSeries({
      color: themeColors.upColor,
      lineWidth: 2,
      title: 'CVD',
      priceLineVisible: true,
      lastValueVisible: true,
    });

    // Add zero line (baseline)
    const zeroLineSeries = chart.addLineSeries({
      color: '#666666',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Format and set CVD data
    if (data && data.length > 0) {
      const formattedData: LineData[] = data.map(d => ({
        time: d.time as LineData['time'],
        value: d.value,
      }));
      
      cvdSeries.setData(formattedData);
      
      // Add zero line if CVD goes negative
      const minValue = Math.min(...data.map(d => d.value));
      const maxValue = Math.max(...data.map(d => d.value));
      
      if (minValue < 0 || maxValue > 0) {
        // Add zero reference line
        const zeroLineData: LineData[] = [
          { time: data[0].time as LineData['time'], value: 0 },
          { time: data[data.length - 1].time as LineData['time'], value: 0 },
        ];
        zeroLineSeries.setData(zeroLineData);
      }
      
      setIsLoading(false);
    }

    // Auto-fit content
    chart.timeScale().fitContent();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [data, height, theme, themeColors]);

  return (
    <div className="relative w-full">
      {/* Chart Info Header */}
      <div className="flex items-center justify-between mb-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] font-bold text-sm">
            CVD (Cumulative Volume Delta)
          </span>
          <span className="text-[var(--fg)] opacity-60">|</span>
          <span className="text-[var(--fg)] opacity-80">{symbol} · {timeframe}</span>
          {data.length > 0 && (
            <>
              <span className="text-[var(--fg)] opacity-60">|</span>
              <span className="text-[var(--fg)] opacity-60">
                {data.length} bars
              </span>
            </>
          )}
        </div>
        
        {/* Current CVD Value */}
        {data.length > 0 && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-[var(--fg)] opacity-60">
              CVD: <span className={
                data[data.length - 1].value >= 0 
                  ? 'text-[var(--accent)]' 
                  : 'text-red-500'
              }>
                {data[data.length - 1].value.toFixed(0)}
              </span>
            </span>
            <span className="text-[var(--fg)] opacity-60">
              Δ: <span className={
                data[data.length - 1].delta >= 0 
                  ? 'text-[var(--accent)]' 
                  : 'text-red-500'
              }>
                {data[data.length - 1].delta >= 0 ? '+' : ''}
                {data[data.length - 1].delta.toFixed(0)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-[var(--bg)] bg-opacity-90 z-10"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <div className="w-3 h-3 rounded-full bg-[var(--accent)] pulse-slow mx-auto mb-2" />
            <p className="text-xs font-mono text-[var(--fg)] opacity-60">
              Loading CVD data...
            </p>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        className="relative border border-[var(--border)] rounded-lg overflow-hidden"
        style={{
          width: '100%',
          height: `${height}px`,
        }}
      />
    </div>
  );
}


