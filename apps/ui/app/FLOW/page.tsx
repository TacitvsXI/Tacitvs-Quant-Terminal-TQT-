'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { TelemetryStrip } from '@/components/TelemetryStrip';
import ChartLive from '@/components/orderflow/ChartLive';
import ContextPanel from '@/components/orderflow/ContextPanel';
import Tape from '@/components/orderflow/Tape';
import FootprintChart from '@/components/orderflow/FootprintChart';
import CVDLive from '@/components/orderflow/CVDLive';
import { useOrderBook, useAssetContext, useTape } from '@/lib/useOrderFlow';
import { useQuery } from '@tanstack/react-query';
import { orderflowApi } from '@/lib/orderflow';

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;

interface BootStep {
  label: string;
  done: boolean;
}

function BootOverlay({ steps, fading }: { steps: BootStep[]; fading: boolean }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const doneCount = steps.filter(s => s.done).length;
  const progress = (doneCount / steps.length) * 100;
  const currentStep = steps.find(s => !s.done);

  return (
    <div
      className={`fixed inset-0 z-50 bg-[var(--bg)] flex items-center justify-center transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-10">
          <div className="text-xs font-mono text-[var(--fg)] opacity-30 tracking-[0.3em] mb-2">
            TEZERAKT
          </div>
          <div className="text-lg font-mono font-bold text-[var(--accent)] glow-strong tracking-wider">
            FLOW TERMINAL
          </div>
        </div>

        <div className="font-mono text-[11px] mb-6 space-y-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[var(--accent)] opacity-70">{'>'}</span>
              <span className={s.done ? 'text-[var(--fg)] opacity-60' : 'text-[var(--fg)]'}>
                {s.label}
                {!s.done && s === currentStep ? dots : ''}
              </span>
              {s.done && (
                <span className="text-[var(--accent)] ml-auto">OK</span>
              )}
            </div>
          ))}
        </div>

        <div className="h-[2px] bg-[var(--border)] rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              boxShadow: '0 0 8px var(--accent)',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[var(--fg)] opacity-30">
          <span>BTC-PERP</span>
          <span>{doneCount === steps.length ? 'ONLINE' : `${Math.round(progress)}%`}</span>
          <span>Hyperliquid</span>
        </div>
      </div>
    </div>
  );
}

export default function FlowPage() {
  const [tf, setTf] = useState<string>('5m');
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  const { data: book } = useOrderBook('BTC');
  const { data: ctx } = useAssetContext('BTC');
  const { data: tape } = useTape(10);

  const { data: candles } = useQuery({
    queryKey: ['hl-prefetch-candles', tf],
    queryFn: () => orderflowApi.liveCandles('BTC', tf, 500),
    staleTime: 60_000,
  });
  const { data: cvd } = useQuery({
    queryKey: ['hl-cvd-estimated', 'BTC', tf, 500],
    queryFn: () => orderflowApi.cvdEstimated('BTC', tf, 500),
    staleTime: 30_000,
  });

  const onChartReady = useCallback(() => setChartReady(true), []);

  const bootSteps: BootStep[] = [
    { label: 'Connecting to Hyperliquid', done: !!(book || ctx) },
    { label: 'Loading L2 orderbook', done: !!book },
    { label: 'Subscribing to trade feed', done: !!tape },
    { label: 'Loading BTC candles', done: !!(candles?.length) },
    { label: 'Computing CVD history', done: !!(cvd?.length) },
    { label: 'Rendering charts', done: chartReady },
  ];

  const allReady = bootSteps.every(s => s.done);

  useEffect(() => {
    if (allReady && !fading && !hidden) {
      setFading(true);
      const t = setTimeout(() => setHidden(true), 500);
      return () => clearTimeout(t);
    }
  }, [allReady, fading, hidden]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />

      {!hidden && <BootOverlay steps={bootSteps} fading={fading} />}

      <main className="max-w-[1920px] mx-auto px-3 py-3">
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

        <div className="grid grid-cols-[1fr_340px] gap-3" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
            <div className="min-h-0">
              <ChartLive
                symbol="BTC-PERP"
                timeframe={tf}
                height={360}
                initialData={candles}
                onReady={onChartReady}
              />
            </div>

            <div className="min-h-0">
              <CVDLive height={130} interval={tf} limit={500} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <FootprintChart />
            </div>
          </div>

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
