/**
 * 🔷 TEZERAKT - Quant Terminal - Dashboard
 * Main terminal overview with system metrics
 */

'use client';

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { TelemetryStrip } from '@/components/TelemetryStrip';
import { CommandPalette } from '@/components/CommandPalette';
import { DataPanel, MetricCell, GridMetrics } from '@/components/DataPanel';
import { TacitvsLogo } from '@/components/TacitvsLogo';

export default function Dashboard() {
  return (
    <>
      <CommandPalette />
      <Navigation />
      
      <main className="min-h-screen pb-20 p-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mono font-bold text-[var(--accent)] glow-strong mb-2">
              DASHBOARD
            </h1>
            <p className="text-sm font-mono text-[var(--fg)] opacity-60">
              System Overview • Live Telemetry • EV Metrics
            </p>
          </div>
          
          <TacitvsLogo size={80} className="opacity-20" />
        </div>
        
        {/* System Status */}
        <DataPanel title="System Status" className="mb-6">
          <GridMetrics
            columns={4}
            metrics={[
              { label: 'EQUITY', value: '$10,000', status: 'ok', unit: '' },
              { label: 'DAILY P&L', value: '+$247', status: 'ok', unit: '' },
              { label: 'POSITIONS', value: '2', status: 'neutral', unit: '' },
              { label: 'UTILIZATION', value: '18.5', status: 'ok', unit: '%' },
            ]}
          />
        </DataPanel>
        
        {/* Risk Metrics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <DataPanel title="Risk Management" glow>
            <GridMetrics
              columns={2}
              metrics={[
                { label: 'DAILY LIMIT', value: '3', status: 'ok', unit: 'trades' },
                { label: 'STOP LOSS', value: '2.5', status: 'ok', unit: '%' },
                { label: 'MAX DRAWDOWN', value: '-$100', status: 'ok', unit: '' },
                { label: 'RISK PER TRADE', value: '1.0', status: 'neutral', unit: '%' },
              ]}
            />
          </DataPanel>
          
          <DataPanel title="Expected Value">
            <GridMetrics
              columns={2}
              metrics={[
                { label: 'AVG EV', value: '+0.57', status: 'ok', unit: 'R' },
                { label: 'WIN RATE', value: '45', status: 'neutral', unit: '%' },
                { label: 'AVG WIN', value: '+2.5', status: 'ok', unit: 'R' },
                { label: 'AVG LOSS', value: '-1.0', status: 'neutral', unit: 'R' },
              ]}
            />
          </DataPanel>
        </div>
        
        {/* Active Markets */}
        <DataPanel title="Active Markets" className="mb-6">
          <div className="space-y-3">
            {[
              { market: 'BTC-PERP', price: '$45,230', change: '+2.4%', ev: '+0.16R', status: 'ok' as const },
              { market: 'ETH-PERP', price: '$2,845', change: '+1.8%', ev: '+0.08R', status: 'warning' as const },
              { market: 'SOL-PERP', price: '$98.50', change: '-0.5%', ev: '-0.02R', status: 'error' as const },
            ].map((market) => (
              <div 
                key={market.market}
                className="flex items-center justify-between p-3 bg-[var(--grid)] hover-glow transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-[var(--accent)]">
                    {market.market}
                  </span>
                  <span className="font-mono text-[var(--fg)]">
                    {market.price}
                  </span>
                  <span className={`font-mono text-sm status-${market.status}`}>
                    {market.change}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-sm status-${market.status}`}>
                    EV: {market.ev}
                  </span>
                  <div className={`w-2 h-2 rounded-full status-${market.status}`} />
                </div>
              </div>
            ))}
          </div>
        </DataPanel>
        
        {/* Recent Activity */}
        <DataPanel title="Recent Activity">
          <div className="font-mono text-xs space-y-2 text-[var(--fg)]">
            <div className="flex items-center gap-3">
              <span className="text-[var(--accent2)]">14:31:22Z</span>
              <span>|</span>
              <span className="text-[var(--accent)]">BTC-PERP</span>
              <span>|</span>
              <span>TORTOISE</span>
              <span>|</span>
              <span className="status-ok">ENTRY LONG</span>
              <span>|</span>
              <span>R=$120 EV=+0.16 maker</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[var(--accent2)]">14:28:15Z</span>
              <span>|</span>
              <span className="text-[var(--accent)]">ETH-PERP</span>
              <span>|</span>
              <span>TORTOISE</span>
              <span>|</span>
              <span className="status-ok">EXIT PROFIT</span>
              <span>|</span>
              <span>PnL=+$89 (+2.2R)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[var(--accent2)]">14:15:08Z</span>
              <span>|</span>
              <span className="text-[var(--accent)]">SOL-PERP</span>
              <span>|</span>
              <span>TORTOISE</span>
              <span>|</span>
              <span className="status-error">STOP LOSS</span>
              <span>|</span>
              <span>PnL=-$40 (-1.0R)</span>
            </div>
          </div>
        </DataPanel>
        
        {/* Shortcut Hint */}
        <div className="mt-8 text-center">
          <p className="text-xs font-mono text-[var(--fg)] opacity-40">
            Press <span className="text-[var(--accent)]">⌘K</span> to open command palette
          </p>
        </div>
      </main>
      
      <TelemetryStrip />
    </>
  );
}

