/**
 * 📊 TACITVS QUANT TERMINAL - Chart Component
 * Lightweight Charts integration for candlestick visualization
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import { useAppStore } from '@/lib/store';
import { getChartThemeColors } from '@/lib/theme';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface IndicatorData {
  time: number;
  value: number;
}

interface Props {
  symbol: string;
  timeframe: string;
  candles: Candle[];
  indicators?: {
    name: string;
    data: IndicatorData[];
    color: string;
  }[];
  height?: number;
}

export default function Chart({ 
  symbol, 
  timeframe, 
  candles, 
  indicators = [],
  height = 480 
}: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
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
          bottom: 0.2,
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series with theme colors
    const candleSeries = chart.addCandlestickSeries({
      upColor: themeColors.upColor,
      downColor: themeColors.downColor,
      borderVisible: false,
      wickUpColor: themeColors.wickUpColor,
      wickDownColor: themeColors.wickDownColor,
    });

    candleSeriesRef.current = candleSeries;

    // Format and set candlestick data
    if (candles && candles.length > 0) {
      const formattedCandles: CandlestickData[] = candles.map(c => ({
        time: c.time as CandlestickData['time'],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      
      candleSeries.setData(formattedCandles);
      setIsLoading(false);
    }

    // Add indicator overlays
    indicators.forEach(indicator => {
      const lineSeries = chart.addLineSeries({
        color: indicator.color,
        lineWidth: 2,
        title: indicator.name,
        priceLineVisible: false,
        lastValueVisible: true,
      });

      const formattedData: LineData[] = indicator.data.map(d => ({
        time: d.time as LineData['time'],
        value: d.value,
      }));

      lineSeries.setData(formattedData);
    });

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
  }, [candles, indicators, height, theme, themeColors]);

  return (
    <div className="relative w-full">
      {/* Chart Info Header */}
      <div className="flex items-center justify-between mb-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] font-bold text-sm glow-strong">
            {symbol}
          </span>
          <span className="text-[var(--fg)] opacity-60">|</span>
          <span className="text-[var(--fg)] opacity-80">{timeframe}</span>
          {candles.length > 0 && (
            <>
              <span className="text-[var(--fg)] opacity-60">|</span>
              <span className="text-[var(--fg)] opacity-60">
                {candles.length} bars
              </span>
            </>
          )}
        </div>
        
        {/* OHLCV Display */}
        {candles.length > 0 && (
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-[var(--fg)] opacity-60">
              O: <span className="text-[var(--accent2)]">{candles[candles.length - 1]?.open.toFixed(2)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-60">
              H: <span className="text-[var(--accent2)]">{candles[candles.length - 1]?.high.toFixed(2)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-60">
              L: <span className="text-[var(--accent2)]">{candles[candles.length - 1]?.low.toFixed(2)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-60">
              C: <span className="text-[var(--accent)]">{candles[candles.length - 1]?.close.toFixed(2)}</span>
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
              Loading chart data...
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

