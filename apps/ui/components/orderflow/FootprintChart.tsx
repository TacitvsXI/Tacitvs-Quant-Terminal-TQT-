'use client';

import { useFootprint } from '@/lib/useOrderFlow';
import type { FootprintLevel } from '@/lib/orderflow';

function intensityColor(val: number, max: number, positive: boolean): string {
  if (max === 0) return 'transparent';
  const ratio = Math.min(Math.abs(val) / max, 1);
  const alpha = 0.15 + ratio * 0.7;
  return positive
    ? `rgba(var(--bull-rgb), ${alpha})`
    : `rgba(var(--bear-rgb), ${alpha})`;
}

export default function FootprintChart() {
  const { data: footprint, isLoading } = useFootprint();

  if (isLoading || !footprint) {
    return (
      <div className="panel p-3 h-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50 mb-2">
          FOOTPRINT
        </div>
        <div className="text-xs font-mono text-[var(--fg)] opacity-30 pulse-slow">
          Waiting for data...
        </div>
      </div>
    );
  }

  const levels = Object.entries(footprint)
    .map(([px, data]) => ({ px: parseFloat(px), ...data }))
    .sort((a, b) => b.px - a.px);

  if (levels.length === 0) {
    return (
      <div className="panel p-3 h-full">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50 mb-2">
          FOOTPRINT
        </div>
        <div className="text-xs font-mono text-[var(--fg)] opacity-30 pulse-slow">
          Accumulating trades...
        </div>
      </div>
    );
  }

  const maxVol = Math.max(...levels.map(l => Math.max(l.buy_vol, l.sell_vol)), 0.001);
  const maxDelta = Math.max(...levels.map(l => Math.abs(l.delta)), 0.001);
  const totalDelta = levels.reduce((s, l) => s + l.delta, 0);
  const totalVol = levels.reduce((s, l) => s + l.buy_vol + l.sell_vol, 0);
  const poc = levels.reduce((best, l) =>
    (l.buy_vol + l.sell_vol) > (best.buy_vol + best.sell_vol) ? l : best
  , levels[0]);

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50">
            FOOTPRINT (5min)
          </span>
          <span className="text-[10px] font-mono tabular-nums" style={{ color: totalDelta >= 0 ? 'var(--bull)' : 'var(--bear)' }}>
            Delta: {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(4)}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono text-[var(--fg)] opacity-40">
          <span>Vol: {totalVol.toFixed(4)}</span>
          <span>POC: ${poc.px.toFixed(0)}</span>
          <span>Levels: {levels.length}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="px-3 py-1 grid grid-cols-[60px_1fr_40px_1fr_60px] gap-1 text-[9px] font-mono text-[var(--fg)] opacity-30 border-b border-[var(--border)]">
        <span className="text-right">SELL</span>
        <span />
        <span className="text-center">PRICE</span>
        <span />
        <span className="text-left">BUY</span>
      </div>

      {/* Price levels */}
      <div className="flex-1 overflow-y-auto">
        {levels.map(level => {
          const isPoc = level.px === poc.px;
          const buyWidth = maxVol > 0 ? (level.buy_vol / maxVol) * 100 : 0;
          const sellWidth = maxVol > 0 ? (level.sell_vol / maxVol) * 100 : 0;
          const deltaColor = level.delta >= 0 ? 'var(--bull)' : 'var(--bear)';

          return (
            <div
              key={level.px}
              className={`px-3 py-[2px] grid grid-cols-[60px_1fr_40px_1fr_60px] gap-1 items-center text-[10px] font-mono tabular-nums border-b border-[var(--border)] border-opacity-20 ${isPoc ? 'border-opacity-60' : ''}`}
              style={isPoc ? { background: 'rgba(var(--accent-rgb), 0.08)' } : undefined}
            >
              {/* Sell volume + bar */}
              <span className="text-right text-[10px]" style={{ color: 'var(--bear)' }}>
                {level.sell_vol > 0 ? level.sell_vol.toFixed(4) : ''}
              </span>
              <div className="flex justify-end h-3">
                <div
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${sellWidth}%`,
                    background: intensityColor(level.sell_vol, maxVol, false),
                  }}
                />
              </div>

              {/* Price */}
              <span
                className="text-center text-[10px]"
                style={{
                  color: isPoc ? 'var(--accent)' : 'var(--fg)',
                  fontWeight: isPoc ? 'bold' : 'normal',
                  opacity: isPoc ? 1 : 0.6,
                }}
              >
                {level.px.toFixed(0)}
              </span>

              {/* Buy bar */}
              <div className="flex h-3">
                <div
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${buyWidth}%`,
                    background: intensityColor(level.buy_vol, maxVol, true),
                  }}
                />
              </div>

              {/* Buy volume */}
              <span className="text-left text-[10px]" style={{ color: 'var(--bull)' }}>
                {level.buy_vol > 0 ? level.buy_vol.toFixed(4) : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Delta summary bar */}
      <div className="px-3 py-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[var(--fg)] opacity-40">DELTA</span>
          <div className="flex-1 h-2 bg-[var(--border)] rounded overflow-hidden relative">
            {/* Center marker */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--fg)] opacity-20" />
            <div
              className="absolute top-0 h-full transition-all duration-300 rounded-sm"
              style={totalDelta >= 0 ? {
                left: '50%',
                width: `${Math.min(Math.abs(totalDelta) / maxDelta * 50, 50)}%`,
                background: 'var(--bull)',
              } : {
                right: '50%',
                width: `${Math.min(Math.abs(totalDelta) / maxDelta * 50, 50)}%`,
                background: 'var(--bear)',
              }}
            />
          </div>
          <span
            className="text-[9px] font-mono tabular-nums"
            style={{ color: totalDelta >= 0 ? 'var(--bull)' : 'var(--bear)' }}
          >
            {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
