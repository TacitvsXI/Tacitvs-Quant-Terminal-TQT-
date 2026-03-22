/**
 * 🔷 TEZERAKT - Quant Terminal - OPS Module
 * Live Execution • Risk Management • Order Flow
 */

'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { TelemetryStrip } from '@/components/TelemetryStrip';
import { CommandPalette } from '@/components/CommandPalette';
import { DataPanel, GridMetrics } from '@/components/DataPanel';
import { CandlestickChart } from '@/components/charts/candlestick-chart';
import { LivePriceTicker } from '@/components/live-price-ticker';
import { useAppStore } from '@/lib/store';
import { playBeep } from '@/lib/audio';

type SystemMode = 'SIM' | 'ARMED' | 'LIVE';

export default function OPS() {
  const { audioEnabled } = useAppStore();
  const [mode, setMode] = useState<SystemMode>('SIM');
  const [interval, setInterval] = useState<string>('1h');
  const [daysBack, setDaysBack] = useState<number>(30);
  
  const handleModeChange = (newMode: SystemMode) => {
    setMode(newMode);
    playBeep('command', audioEnabled);
  };
  
  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
    playBeep('command', audioEnabled);
    
    // МАКСИМУМ данных для каждого таймфрейма
    if (newInterval === '1m') setDaysBack(7);        // ~10K свечей (лимит API)
    else if (newInterval === '5m') setDaysBack(30);  // ~8K свечей
    else if (newInterval === '15m') setDaysBack(90); // ~8K свечей
    else if (newInterval === '1h') setDaysBack(365); // ~8K свечей
    else if (newInterval === '4h') setDaysBack(730); // ~4K свечей
    else if (newInterval === '1d') setDaysBack(730); // ~730 свечей (2 года!)
  };
  
  return (
    <>
      <CommandPalette />
      <Navigation />
      
      <main className="min-h-screen pb-20 p-6 max-w-[1800px] mx-auto">
        {/* Header with Mode Controls */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mono font-bold text-[var(--accent)] glow-strong mb-2">
              OPS — LIVE TERMINAL
            </h1>
            <p className="text-sm font-mono text-[var(--fg)] opacity-60">
              Live Execution • Order Management • Risk Controls
            </p>
          </div>
          
          {/* Mode Selector */}
          <div className="flex items-center gap-2 panel p-2">
            {(['SIM', 'ARMED', 'LIVE'] as SystemMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`
                  px-4 py-2 font-mono text-sm font-bold uppercase tracking-wider
                  transition-all duration-200
                  ${mode === m
                    ? m === 'LIVE' 
                      ? 'bg-[#fe0174] text-white border-glow'
                      : m === 'ARMED'
                      ? 'bg-[#FFB800] text-black border-glow'
                      : 'bg-[#00FF84] text-black border-glow'
                    : 'bg-[var(--grid)] text-[var(--fg)] hover:bg-[var(--border)]'
                  }
                `}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        
        {/* Warning Banner for LIVE mode */}
        {mode === 'LIVE' && (
          <div className="mb-6 p-4 border-2 border-[#fe0174] bg-[#fe0174]/10">
            <p className="font-mono text-sm text-[#fe0174] font-bold">
              ⚠️ LIVE MODE ACTIVE — Real capital at risk
            </p>
          </div>
        )}
        
        {/* Active Positions */}
        <DataPanel title="Active Positions" className="mb-6" glow>
          <div className="space-y-3">
            {[
              { 
                market: 'BTC-PERP', 
                side: 'LONG', 
                size: '0.15', 
                entry: '45,230',
                current: '45,890',
                pnl: '+$99',
                pnlR: '+1.8R',
                stop: '44,100',
                target: '47,500',
                status: 'ok' as const
              },
              { 
                market: 'ETH-PERP', 
                side: 'LONG', 
                size: '2.4', 
                entry: '2,845',
                current: '2,820',
                pnl: '-$60',
                pnlR: '-0.6R',
                stop: '2,720',
                target: '3,050',
                status: 'warning' as const
              },
            ].map((pos) => (
              <div 
                key={pos.market}
                className="p-4 bg-[var(--grid)] border border-[var(--border)] hover-glow transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-lg text-[var(--accent)]">
                      {pos.market}
                    </span>
                    <span className={`font-mono text-xs px-2 py-1 ${
                      pos.side === 'LONG' 
                        ? 'bg-[#00FF84] text-black' 
                        : 'bg-[#fe0174] text-white'
                    }`}>
                      {pos.side}
                    </span>
                    <span className="font-mono text-sm text-[var(--fg)]">
                      {pos.size} BTC
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold status-${pos.status}`}>
                      {pos.pnl} ({pos.pnlR})
                    </span>
                    <button className="px-3 py-1 bg-[#fe0174] text-white font-mono text-xs hover:border-glow transition-all">
                      CLOSE
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[var(--fg)] opacity-60">ENTRY:</span>
                    <span className="ml-2 text-[var(--accent)]">${pos.entry}</span>
                  </div>
                  <div>
                    <span className="text-[var(--fg)] opacity-60">CURRENT:</span>
                    <span className="ml-2 text-[var(--accent)]">${pos.current}</span>
                  </div>
                  <div>
                    <span className="text-[var(--fg)] opacity-60">STOP:</span>
                    <span className="ml-2 text-[#fe0174]">${pos.stop}</span>
                  </div>
                  <div>
                    <span className="text-[var(--fg)] opacity-60">TARGET:</span>
                    <span className="ml-2 text-[#00FF84]">${pos.target}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DataPanel>
        
        {/* Live Price Tickers */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {['BTC-PERP', 'ETH-PERP', 'SOL-PERP'].map((market) => (
            <DataPanel key={market} title={market} glow>
              <LivePriceTicker 
                market={market}
                size="md"
                showChange
                showVolume
              />
            </DataPanel>
          ))}
        </div>
        
        {/* Price Chart with R-Ruler */}
        <div className="mb-6">
          <DataPanel 
            title={`BTC-PERP • ${interval.toUpperCase()} • ${daysBack} days`}
            glow
          >
            {/* Timeframe Selector */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs text-[var(--fg)] opacity-60 mr-2">TIMEFRAME:</span>
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => handleIntervalChange(tf)}
                  className={`
                    px-3 py-1 font-mono text-xs font-bold uppercase
                    transition-all duration-200
                    ${interval === tf
                      ? 'bg-[var(--accent)] text-[var(--bg-primary)] border-glow'
                      : 'bg-[var(--grid)] text-[var(--fg)] hover:bg-[var(--border)] border border-[var(--border)]'
                    }
                  `}
                >
                  {tf}
                </button>
              ))}
              <div className="ml-auto font-mono text-xs text-[var(--accent2)]">
                📊 {daysBack === 365 ? '1 year' : `${daysBack} days`} of data
              </div>
            </div>
            
            <CandlestickChart 
              market="BTC-PERP"
              interval={interval}
              daysBack={daysBack}
              showVolume={true}
              showRRuler={true}
              entryPrice={45230}
              stopPrice={44100}
              targetPrice={47500}
              indicators={{
                sma20: true,
                ema12: true,
              }}
              height={500}
            />
          </DataPanel>
        </div>
        
        {/* Strategy Status */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <DataPanel title="Strategy Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-[var(--fg)]">BTC-PERP • TORTOISE</span>
                <span className="text-xs font-mono px-2 py-1 bg-[#00FF84] text-black">EV ON</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-[var(--fg)]">ETH-PERP • TORTOISE</span>
                <span className="text-xs font-mono px-2 py-1 bg-[#FFB800] text-black">EV ~0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-[var(--fg)]">SOL-PERP • TORTOISE</span>
                <span className="text-xs font-mono px-2 py-1 bg-[#fe0174] text-white">EV OFF</span>
              </div>
            </div>
          </DataPanel>
          
          <DataPanel title="Risk Limits">
            <GridMetrics
              columns={1}
              metrics={[
                { label: 'DAILY TRADES', value: '2/5', status: 'ok', unit: '' },
                { label: 'DAILY LOSS', value: '-$60/$500', status: 'ok', unit: '' },
                { label: 'KILL SWITCH', value: 'ARMED', status: 'ok', unit: '' },
              ]}
            />
          </DataPanel>
          
          <DataPanel title="Execution Stats">
            <GridMetrics
              columns={1}
              metrics={[
                { label: 'AVG LATENCY', value: '12', status: 'ok', unit: 'ms' },
                { label: 'MAKER RATIO', value: '87', status: 'ok', unit: '%' },
                { label: 'AVG SLIPPAGE', value: '0.8', status: 'ok', unit: 'bps' },
              ]}
            />
          </DataPanel>
        </div>
        
        {/* Operations Log */}
        <DataPanel title="Operations Log">
          <div className="font-mono text-xs space-y-2 text-[var(--fg)] max-h-96 overflow-y-auto">
            {[
              { time: '14:31:22Z', market: 'BTC-PERP', strategy: 'TORTOISE', action: 'ENTRY LONG', detail: 'R=$120 EV=+0.16 maker', status: 'ok' },
              { time: '14:28:15Z', market: 'ETH-PERP', strategy: 'TORTOISE', action: 'EXIT PROFIT', detail: 'PnL=+$89 (+2.2R)', status: 'ok' },
              { time: '14:15:08Z', market: 'SOL-PERP', strategy: 'TORTOISE', action: 'STOP LOSS', detail: 'PnL=-$40 (-1.0R)', status: 'error' },
              { time: '14:12:45Z', market: 'BTC-PERP', strategy: 'TORTOISE', action: 'SIGNAL', detail: 'Evaluating entry...', status: 'neutral' },
              { time: '14:10:33Z', market: 'ETH-PERP', strategy: 'TORTOISE', action: 'ENTRY LONG', detail: 'R=$95 EV=+0.08 maker', status: 'ok' },
              { time: '14:05:12Z', market: 'BTC-PERP', strategy: 'RISK', action: 'LIMIT CHECK', detail: 'Daily: 2/5 trades', status: 'ok' },
            ].map((log, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 hover:bg-[var(--grid)] p-2 -mx-2 transition-all"
              >
                <span className="text-[var(--accent2)]">{log.time}</span>
                <span>|</span>
                <span className="text-[var(--accent)]">{log.market}</span>
                <span>|</span>
                <span>{log.strategy}</span>
                <span>|</span>
                <span className={`status-${log.status}`}>{log.action}</span>
                <span>|</span>
                <span>{log.detail}</span>
              </div>
            ))}
          </div>
        </DataPanel>
      </main>
      
      <TelemetryStrip />
    </>
  );
}

