'use client';

import { useState, useRef, useEffect } from 'react';
import { useTape, useTapeStats } from '@/lib/useOrderFlow';

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtPx(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export default function Tape({ coin = 'BTC' }: { coin?: string }) {
  const [minSize, setMinSize] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: tape } = useTape(300);
  const { data: stats } = useTapeStats();

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [tape, autoScroll]);

  const filtered = tape?.filter(t => t.sz >= minSize) ?? [];

  const buyPct = stats?.buy_pct ?? 50;
  const sellPct = 100 - buyPct;

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50">
            TAPE
          </span>
          {stats && (
            <span className="text-[10px] font-mono text-[var(--fg)] opacity-40">
              {stats.count} trades
            </span>
          )}
        </div>

        {/* Buy/Sell flow bar */}
        {stats && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tabular-nums" style={{ color: '#00FF84' }}>
              {buyPct.toFixed(0)}%
            </span>
            <div className="flex-1 h-1.5 bg-[var(--border)] rounded overflow-hidden flex">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${buyPct}%`, background: '#00FF84' }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${sellPct}%`, background: '#fe0174' }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums" style={{ color: '#fe0174' }}>
              {sellPct.toFixed(0)}%
            </span>
          </div>
        )}

        {/* VWAP + 1m vol */}
        {stats && stats.count > 0 && (
          <div className="flex items-center justify-between text-[10px] font-mono mb-2">
            <span className="text-[var(--fg)] opacity-50">
              VWAP: <span className="text-[var(--accent)] tabular-nums">${fmtPx(stats.vwap)}</span>
            </span>
            <span className="text-[var(--fg)] opacity-50">
              1m: <span style={{ color: '#00FF84' }} className="tabular-nums">{stats['1m_buy_vol'].toFixed(3)}</span>
              {' / '}
              <span style={{ color: '#fe0174' }} className="tabular-nums">{stats['1m_sell_vol'].toFixed(3)}</span>
            </span>
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[var(--fg)] opacity-40">MIN SIZE</span>
          <div className="flex gap-1">
            {[0, 0.1, 0.5, 1.0].map(v => (
              <button
                key={v}
                onClick={() => setMinSize(v)}
                className={`px-1.5 py-0.5 text-[9px] font-mono rounded transition-all ${
                  minSize === v
                    ? 'bg-[var(--accent)] text-black font-bold'
                    : 'text-[var(--fg)] opacity-40 hover:opacity-80'
                }`}
              >
                {v === 0 ? 'ALL' : `${v}`}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
              autoScroll ? 'text-[var(--accent)]' : 'text-[var(--fg)] opacity-40'
            }`}
          >
            {autoScroll ? 'LIVE' : 'PAUSED'}
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="px-3 py-1 flex items-center text-[9px] font-mono text-[var(--fg)] opacity-30 border-b border-[var(--border)]">
        <span className="w-16">TIME</span>
        <span className="w-10 text-center">SIDE</span>
        <span className="flex-1 text-right">PRICE</span>
        <span className="w-20 text-right">SIZE</span>
        <span className="w-20 text-right">NOTIONAL</span>
      </div>

      {/* Trade rows */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onWheel={() => setAutoScroll(false)}
      >
        {filtered.map((t, i) => {
          const isBuy = t.side === 'B';
          const sideColor = isBuy ? '#00FF84' : '#fe0174';
          const bgAlpha = t.large ? '0.12' : '0';
          const textWeight = t.large ? 'font-bold' : '';

          return (
            <div
              key={`${t.ts}-${i}`}
              className={`px-3 py-[3px] flex items-center text-[11px] font-mono tabular-nums border-b border-[var(--border)] border-opacity-30 hover:bg-[var(--grid)] transition-colors ${textWeight}`}
              style={{
                background: t.large ? `rgba(${isBuy ? '0,255,132' : '254,1,116'}, ${bgAlpha})` : undefined,
              }}
            >
              <span className="w-16 text-[var(--fg)] opacity-50 text-[10px]">
                {fmtTime(t.ts)}
              </span>
              <span className="w-10 text-center text-[10px]" style={{ color: sideColor }}>
                {isBuy ? 'BUY' : 'SELL'}
              </span>
              <span className="flex-1 text-right" style={{ color: sideColor }}>
                {fmtPx(t.px)}
              </span>
              <span className="w-20 text-right text-[var(--fg)]">
                {t.sz.toFixed(5)}
              </span>
              <span className="w-20 text-right text-[var(--fg)] opacity-60">
                ${t.notional >= 1000 ? `${(t.notional / 1000).toFixed(1)}K` : t.notional.toFixed(0)}
              </span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-4 text-center text-[10px] font-mono text-[var(--fg)] opacity-30 pulse-slow">
            Waiting for trades...
          </div>
        )}
      </div>

      {/* Large trades summary */}
      {stats && stats.large_trades > 0 && (
        <div className="px-3 py-1.5 border-t border-[var(--border)] flex items-center justify-between text-[9px] font-mono">
          <span className="text-[var(--fg)] opacity-40">LARGE ({'>'}0.5 BTC)</span>
          <span>
            <span style={{ color: '#00FF84' }}>{stats.large_buy} buy</span>
            {' / '}
            <span style={{ color: '#fe0174' }}>{stats.large_sell} sell</span>
          </span>
        </div>
      )}
    </div>
  );
}
