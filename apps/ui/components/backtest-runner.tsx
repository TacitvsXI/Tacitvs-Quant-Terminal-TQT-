"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRunBacktest } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface BacktestFormData {
  strategy: string;
  market: string;
  interval: string;
  daysBack: number;
  initialCapital: number;
  riskPct: number;
}

export function BacktestRunner() {
  const [formData, setFormData] = useState<BacktestFormData>({
    strategy: "tortoise",
    market: "BTC-PERP",
    interval: "1d",
    daysBack: 365,
    initialCapital: 10000,
    riskPct: 1.0,
  });

  const queryClient = useQueryClient();
  const { mutate: runBacktest, isPending, data, error } = useRunBacktest();

  const handleRunBacktest = () => {
    runBacktest({
      strategy: formData.strategy,
      market: formData.market,
      timeframe: formData.interval,
    });
  };

  // Get cached results for immediate display
  const cachedResults = queryClient.getQueryData(["backtest-results"]) as any;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Setup Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Backtest Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Strategy
              </label>
              <select 
                className="w-full p-2 bg-[#0e1117] border border-[#1a1f2e] rounded-lg text-neutral-200"
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
              >
                <option value="tortoise">Tortoise</option>
                <option value="mean-reversion">Mean Reversion</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Market
              </label>
              <select 
                className="w-full p-2 bg-[#0e1117] border border-[#1a1f2e] rounded-lg text-neutral-200"
                value={formData.market}
                onChange={(e) => setFormData({ ...formData, market: e.target.value })}
              >
                <option value="BTC-PERP">BTC-PERP</option>
                <option value="ETH-PERP">ETH-PERP</option>
                <option value="SOL-PERP">SOL-PERP</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Interval
              </label>
              <select 
                className="w-full p-2 bg-[#0e1117] border border-[#1a1f2e] rounded-lg text-neutral-200"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
              >
                <option value="1d">1d</option>
                <option value="4h">4h</option>
                <option value="1h">1h</option>
                <option value="15m">15m</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Days Back
              </label>
              <input
                type="number"
                value={formData.daysBack}
                onChange={(e) => setFormData({ ...formData, daysBack: Number(e.target.value) })}
                className="w-full p-2 bg-[#0e1117] border border-[#1a1f2e] rounded-lg text-neutral-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Capital ($)
              </label>
              <input
                type="number"
                value={formData.initialCapital}
                onChange={(e) => setFormData({ ...formData, initialCapital: Number(e.target.value) })}
                className="w-full p-2 bg-[#0e1117] border border-[#1a1f2e] rounded-lg text-neutral-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Risk %
              </label>
              <input
                type="number"
                value={formData.riskPct}
                step={0.1}
                onChange={(e) => setFormData({ ...formData, riskPct: Number(e.target.value) })}
                className="w-full p-2 bg-[#0e1117] border border-[#1a1f2e] rounded-lg text-neutral-200"
              />
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg"
            onClick={handleRunBacktest}
            disabled={isPending}
          >
            {isPending ? "🔄 Running..." : "▶ Run Backtest"}
          </Button>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm">
              Error: {error.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-neutral-700 rounded w-3/4" />
                <div className="h-4 bg-neutral-700 rounded w-1/2" />
                <div className="h-4 bg-neutral-700 rounded w-2/3" />
                <div className="h-4 bg-neutral-700 rounded w-1/3" />
              </div>
            </div>
          ) : (cachedResults || data) ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-neutral-500">Return</div>
                  <div className={`font-mono ${
                    (cachedResults || data)?.results?.metrics?.return_pct > 0 ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {formatPercentage(((cachedResults || data)?.results?.metrics?.return_pct || 0) / 100)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Sharpe</div>
                  <div className="text-neutral-200 font-mono">
                    {((cachedResults || data)?.results?.metrics?.sharpe || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Max DD</div>
                  <div className="text-rose-400 font-mono">
                    {formatPercentage(((cachedResults || data)?.results?.metrics?.max_dd_pct || 0) / 100)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Win Rate</div>
                  <div className="text-neutral-200 font-mono">
                    {formatPercentage((cachedResults || data)?.results?.metrics?.win_rate || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Total Trades</div>
                  <div className="text-neutral-200 font-mono">
                    {(cachedResults || data)?.results?.metrics?.total_trades || 0}
                  </div>
                </div>
                <div>
                  <div className="text-neutral-500">Avg R</div>
                  <div className="text-neutral-200 font-mono">
                    {((cachedResults || data)?.results?.metrics?.avg_r || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full">
                  📄 View Full Report
                </Button>
                <Button variant="ghost" size="sm" className="w-full">
                  📊 Export CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-neutral-500">
              <div className="text-2xl mb-2">📊</div>
              <div>No results yet</div>
              <div className="text-sm mt-1">Run a backtest to see results</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
