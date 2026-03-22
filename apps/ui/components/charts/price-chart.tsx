"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartErrorBoundary } from "@/components/chart-error-boundary";
import { SkeletonChart } from "@/components/ui/skeleton";
import { useCandles } from "@/lib/hooks";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface PriceChartProps {
  market?: string;
  interval?: string;
  daysBack?: number;
  data?: Array<{
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  height?: number;
  className?: string;
  showRRuler?: boolean;
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
}

function PriceChartInner({ 
  market = "BTC-PERP",
  interval = "1d",
  daysBack = 30,
  data, 
  height = 400, 
  className, 
  showRRuler = false,
  entryPrice,
  stopPrice,
  targetPrice
}: PriceChartProps) {
  const { data: realData, isLoading, error } = useCandles(market, interval, daysBack);
  
  // Use real data if available, otherwise fall back to provided data or mock data
  const rawData = (realData?.candles || realData) || data;
  const chartData = Array.isArray(rawData) ? rawData : [
    { timestamp: 1640995200000, open: 47000, high: 48000, low: 46500, close: 47500, volume: 1000000 },
    { timestamp: 1641081600000, open: 47500, high: 48500, low: 47000, close: 48000, volume: 1200000 },
    { timestamp: 1641168000000, open: 48000, high: 49000, low: 47500, close: 48500, volume: 1100000 },
    { timestamp: 1641254400000, open: 48500, high: 49500, low: 48000, close: 49000, volume: 1300000 },
    { timestamp: 1641340800000, open: 49000, high: 50000, low: 48500, close: 49500, volume: 1400000 },
    { timestamp: 1641427200000, open: 49500, high: 50500, low: 49000, close: 50000, volume: 1500000 },
    { timestamp: 1641513600000, open: 50000, high: 51000, low: 49500, close: 50500, volume: 1600000 },
    { timestamp: 1641600000000, open: 50500, high: 51500, low: 50000, close: 51000, volume: 1700000 },
    { timestamp: 1641686400000, open: 51000, high: 52000, low: 50500, close: 51500, volume: 1800000 },
    { timestamp: 1641772800000, open: 51500, high: 52500, low: 51000, close: 52000, volume: 1900000 },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0 && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0e1117] border border-[#1a1f2e] rounded-lg p-3 shadow-lg">
          <p className="text-neutral-400 text-sm mb-2">
            {new Date(label).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <div className="space-y-1">
            <p className="text-neutral-200 font-mono text-sm">
              {`Close: $${data.close?.toLocaleString() || 'N/A'}`}
            </p>
            <p className="text-neutral-400 font-mono text-xs">
              {`H: $${data.high?.toLocaleString() || 'N/A'} L: $${data.low?.toLocaleString() || 'N/A'}`}
            </p>
            <p className="text-neutral-400 font-mono text-xs">
              {`Vol: ${data.volume ? (data.volume / 1000000).toFixed(1) : '0'}M`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const currentPrice = chartData[chartData.length - 1]?.close || 50000;
  const priceChange = currentPrice - (chartData[0]?.close || 48000);
  const priceChangePercent = (priceChange / (chartData[0]?.close || 48000)) * 100;

  // Loading state
  if (isLoading) {
    return <SkeletonChart className={className} height={400} />;
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-[var(--color-danger)]">Failed to Load Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-neutral-400 text-sm">
            Unable to fetch data for {market}. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            📈 {market} | {interval.toUpperCase()}
          </span>
          <div className="flex gap-1">
            {["5m", "15m", "1h", "4h", "1d", "1w"].map((tf) => (
              <Button
                key={tf}
                variant={tf === "1d" ? "primary" : "ghost"}
                size="sm"
                className="px-3 py-1 text-xs"
              >
                {tf}
              </Button>
            ))}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Price Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-neutral-100">
              ${currentPrice.toLocaleString()}
            </div>
            <div className={`text-sm font-mono ${
              priceChange >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}>
              {priceChange >= 0 ? "+" : ""}{priceChange.toLocaleString()} 
              ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500">24h Volume</div>
            <div className="text-neutral-200 font-mono text-sm">
              {((chartData[chartData.length - 1]?.volume || 0) / 1000000).toFixed(1)}M
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* R-Ruler Lines */}
              {showRRuler && entryPrice && stopPrice && targetPrice && (
                <>
                  <ReferenceLine 
                    y={entryPrice} 
                    stroke="var(--color-secondary)" 
                    strokeDasharray="5 5"
                    label={{ value: "Entry", position: "right" as const }}
                  />
                  <ReferenceLine 
                    y={stopPrice} 
                    stroke="var(--color-danger)" 
                    strokeDasharray="5 5"
                    label={{ value: "Stop", position: "right" as const }}
                  />
                  <ReferenceLine 
                    y={targetPrice} 
                    stroke="#16A34A" 
                    strokeDasharray="5 5"
                    label={{ value: "Target", position: "right" as const }}
                  />
                </>
              )}
              
              <Line
                type="monotone"
                dataKey="close"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, stroke: "#22d3ee", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* R-Ruler Info */}
        {showRRuler && entryPrice && stopPrice && targetPrice && (
          <div className="mt-4 pt-4 border-t border-[#1a1f2e]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-neutral-500">Entry</div>
                <div className="text-cyan-400 font-mono text-sm">
                  ${entryPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Stop</div>
                <div className="text-rose-400 font-mono text-sm">
                  ${stopPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Target</div>
                <div className="text-emerald-400 font-mono text-sm">
                  ${targetPrice.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs text-neutral-500">R-Ratio</div>
              <div className="text-neutral-200 font-mono text-sm">
                {((targetPrice - entryPrice) / (entryPrice - stopPrice)).toFixed(2)}:1
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export with error boundary
export function PriceChart(props: PriceChartProps) {
  return (
    <ChartErrorBoundary>
      <PriceChartInner {...props} />
    </ChartErrorBoundary>
  );
}
