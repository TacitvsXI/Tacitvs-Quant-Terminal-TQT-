"use client";

import { Navigation } from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RollingMetrics } from "@/components/charts/rolling-metrics";

export default function METRICS() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold cyber-title">METRICS Dashboard</h1>
            <p className="text-[var(--color-secondary)] font-mono text-sm">Key performance indicators and risk monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[var(--color-success)] rounded-full cyber-lamp" />
            <span className="text-sm font-mono text-[var(--color-success)] uppercase tracking-wider">MONITORING ACTIVE</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card specular>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-[#16A34A] mb-2">+0.12R</div>
              <div className="text-sm text-neutral-500">EV Net</div>
              <div className="w-3 h-3 bg-[#16A34A] rounded-full cyber-lamp mx-auto mt-2" />
            </CardContent>
          </Card>
          
          <Card specular>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-[#FFB020] mb-2">-2.5R</div>
              <div className="text-sm text-neutral-500">Daily P&L</div>
              <div className="w-3 h-3 bg-[#FFB020] rounded-full cyber-lamp mx-auto mt-2" />
            </CardContent>
          </Card>
          
          <Card specular>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-[#16A34A] mb-2">45%</div>
              <div className="text-sm text-neutral-500">Win Rate</div>
              <div className="w-3 h-3 bg-[#16A34A] rounded-full cyber-lamp mx-auto mt-2" />
            </CardContent>
          </Card>
          
          <Card specular>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-[#16A34A] mb-2">1.23</div>
              <div className="text-sm text-neutral-500">Sharpe</div>
              <div className="w-3 h-3 bg-[#16A34A] rounded-full cyber-lamp mx-auto mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Rolling Metrics Chart */}
        <RollingMetrics />

        {/* Risk Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Risk Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>BTC: 40%</span>
                  <span className="text-[var(--color-success)]">+5.2R</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ETH: 30%</span>
                  <span className="text-[var(--color-danger)]">-1.3R</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>SOL: 20%</span>
                  <span className="text-[var(--color-success)]">+2.1R</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cash: 10%</span>
                  <span className="text-neutral-400">0R</span>
                </div>
              </div>
              
              <div className="h-32 bg-[#0a0e14] rounded-lg border border-[#1a1f2e] flex items-center justify-center">
                <div className="text-center text-neutral-500">
                  <div className="text-2xl mb-2">🥧</div>
                  <div>Pie Chart</div>
                  <div className="text-sm mt-1">Coming in next iteration</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
