'use client';

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { TelemetryStrip } from '@/components/TelemetryStrip';
import ChartLive from '@/components/orderflow/ChartLive';
import ContextPanel from '@/components/orderflow/ContextPanel';
import Tape from '@/components/orderflow/Tape';
import FootprintChart from '@/components/orderflow/FootprintChart';
import CVDLive from '@/components/orderflow/CVDLive';
import { useOrderBook } from '@/lib/useOrderFlow';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

export default function FlowPage() {
  const [tf, setTf] = useState<string>('5m');

  const { data: book } = useOrderBook('BTC');

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />

      <main className="max-w-[1920px] mx-auto px-3 py-3">
        {/* Top bar: symbol + controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-[var(--accent)] glow-strong tracking-wider">
              BTC-PERP
            </span>
            <span className="text-[10px] font-mono text-[var(--fg)] opacity-40">
              Hyperliquid
            </span>
            {book && (
              <span className="text-[10px] font-mono text-[var(--fg)] opacity-40">
                Spread: ${book.spread.toFixed(1)} | Mid: ${book.mid.toLocaleString('en-US', { minimumFractionDigits: 1 })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {TIMEFRAMES.map(t => (
              <button
                key={t}
                onClick={() => setTf(t)}
                className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-all ${
                  tf === t
                    ? 'bg-[var(--accent)] text-black font-bold'
                    : 'text-[var(--fg)] opacity-40 hover:opacity-80 hover:text-[var(--accent)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Main grid: chart area (left) + sidebar (right) */}
        <div className="grid grid-cols-[1fr_340px] gap-3" style={{ height: 'calc(100vh - 120px)' }}>
          {/* Left column: chart + CVD + footprint */}
          <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* Live candlestick chart */}
            <div className="min-h-0">
              <ChartLive
                symbol="BTC-PERP"
                timeframe={tf}
                height={360}
              />
            </div>

            {/* CVD chart */}
            <div className="min-h-0">
              <CVDLive height={130} />
            </div>

            {/* Footprint */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <FootprintChart />
            </div>
          </div>

          {/* Right column: context + tape */}
          <div className="flex flex-col gap-3 min-h-0">
            <ContextPanel coin="BTC" />
            <div className="flex-1 min-h-0 overflow-hidden">
              <Tape coin="BTC" />
            </div>
          </div>
        </div>
      </main>

      <TelemetryStrip />
    </div>
  );
}
