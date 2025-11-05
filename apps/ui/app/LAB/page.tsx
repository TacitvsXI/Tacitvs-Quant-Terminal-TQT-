/**
 * 🔷 TEZERAKT - Quant Terminal - LAB Module
 * Research, Backtests, Monte Carlo, Walk-Forward
 */

'use client';

import React from 'react';
import { Navigation } from '@/components/Navigation';
import { TelemetryStrip } from '@/components/TelemetryStrip';
import { CommandPalette } from '@/components/CommandPalette';
import { DataPanel, GridMetrics } from '@/components/DataPanel';
import { ChartPanel } from '@/components/ChartPanel';
import { useAppStore } from '@/lib/store';
import { playBeep, playDoubleBeep } from '@/lib/audio';

export default function LAB() {
  const { audioEnabled, isSimulating, setSimulating } = useAppStore();
  
  const handleRunBacktest = () => {
    playBeep('sim_start', audioEnabled);
    setSimulating(true);
    
    // Simulate backtest
    setTimeout(() => {
      playDoubleBeep(audioEnabled);
      setSimulating(false);
    }, 3000);
  };
  
  return (
    <>
      <CommandPalette />
      <Navigation />
      
      <main className="min-h-screen pb-20 p-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-mono font-bold text-[var(--accent)] glow-strong mb-2">
            LAB — RESEARCH
          </h1>
          <p className="text-sm font-mono text-[var(--fg)] opacity-60">
            Backtests • Walk-Forward • Monte Carlo • Queue Simulation
          </p>
        </div>
        
        {/* Backtest Controls */}
        <DataPanel title="Backtest Engine" className="mb-6" glow>
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-mono text-[var(--fg)] opacity-60 mb-1 block">
                  STRATEGY
                </label>
                <select className="w-full bg-[var(--grid)] text-[var(--fg)] font-mono text-sm p-2 border border-[var(--border)]">
                  <option>Tortoise (Donchian)</option>
                  <option>Mean Reversion</option>
                  <option>Momentum</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-mono text-[var(--fg)] opacity-60 mb-1 block">
                  MARKET
                </label>
                <select className="w-full bg-[var(--grid)] text-[var(--fg)] font-mono text-sm p-2 border border-[var(--border)]">
                  <option>BTC-PERP</option>
                  <option>ETH-PERP</option>
                  <option>ALL MARKETS</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-mono text-[var(--fg)] opacity-60 mb-1 block">
                  TIMEFRAME
                </label>
                <select className="w-full bg-[var(--grid)] text-[var(--fg)] font-mono text-sm p-2 border border-[var(--border)]">
                  <option>1H</option>
                  <option>4H</option>
                  <option>1D</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleRunBacktest}
                disabled={isSimulating}
                className={`
                  px-6 py-3 font-mono text-sm uppercase tracking-wider
                  transition-all duration-200
                  ${isSimulating 
                    ? 'bg-[var(--grid)] text-[var(--fg)] opacity-50 cursor-not-allowed' 
                    : 'bg-[var(--accent)] text-black hover:border-glow font-bold'
                  }
                `}
              >
                {isSimulating ? 'RUNNING...' : 'RUN BACKTEST'}
              </button>
              
              {isSimulating && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] pulse-slow" />
                  <span className="text-xs font-mono text-[var(--accent)]">
                    Simulating...
                  </span>
                </div>
              )}
            </div>
          </div>
        </DataPanel>
        
        {/* Results */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <DataPanel title="Performance Metrics">
            <GridMetrics
              columns={2}
              metrics={[
                { label: 'TOTAL RETURN', value: '+34.2', status: 'ok', unit: '%' },
                { label: 'SHARPE RATIO', value: '1.85', status: 'ok', unit: '' },
                { label: 'MAX DRAWDOWN', value: '-12.3', status: 'warning', unit: '%' },
                { label: 'WIN RATE', value: '47', status: 'neutral', unit: '%' },
                { label: 'TOTAL TRADES', value: '248', status: 'neutral', unit: '' },
                { label: 'AVG EV', value: '+0.42', status: 'ok', unit: 'R' },
              ]}
            />
          </DataPanel>
          
          <DataPanel title="Monte Carlo Analysis">
            <GridMetrics
              columns={2}
              metrics={[
                { label: 'PATHS', value: '10,000', status: 'neutral', unit: '' },
                { label: 'MEDIAN RETURN', value: '+28.5', status: 'ok', unit: '%' },
                { label: 'P(RUIN)', value: '2.4', status: 'ok', unit: '%' },
                { label: '95% VaR', value: '-$450', status: 'warning', unit: '' },
                { label: 'BEST CASE', value: '+142', status: 'ok', unit: '%' },
                { label: 'WORST CASE', value: '-38', status: 'error', unit: '%' },
              ]}
            />
          </DataPanel>
        </div>
        
        {/* Live Chart */}
        <DataPanel title="Market Chart — Real-Time Visualization" className="mb-6" glow>
          <ChartPanel />
        </DataPanel>
        
        {/* Trade List */}
        <DataPanel title="Trade History">
          <div className="font-mono text-xs space-y-2 text-[var(--fg)]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 hover:bg-[var(--grid)] p-2 -mx-2 transition-all">
                <span className="text-[var(--accent2)]">2024-10-{20 + i} 14:30Z</span>
                <span>|</span>
                <span className="text-[var(--accent)]">BTC-PERP</span>
                <span>|</span>
                <span>LONG</span>
                <span>|</span>
                <span className={i % 3 === 0 ? 'status-error' : 'status-ok'}>
                  {i % 3 === 0 ? '-$45 (-1.0R)' : `+$${120 + i * 10} (+2.${i}R)`}
                </span>
              </div>
            ))}
          </div>
        </DataPanel>
      </main>
      
      <TelemetryStrip />
    </>
  );
}

