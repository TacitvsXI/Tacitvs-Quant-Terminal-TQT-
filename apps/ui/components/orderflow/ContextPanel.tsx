'use client';

import { useAssetContext, useBookImbalance, useOrderBook } from '@/lib/useOrderFlow';

function fmt(n: number, decimals = 2): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(decimals);
}

function fmtPx(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtFunding(rate: number): string {
  const pct = rate * 100;
  const annualized = rate * 3 * 365 * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(6)}% (${annualized >= 0 ? '+' : ''}${annualized.toFixed(1)}% ann)`;
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-[var(--border)]">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50">
        {label}
      </span>
      <span
        className="text-xs font-mono tabular-nums"
        style={{ color: color || 'var(--accent)' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function ContextPanel({ coin = 'BTC' }: { coin?: string }) {
  const { data: ctx, isLoading } = useAssetContext(coin);
  const { data: imb } = useBookImbalance(coin, 10);
  const { data: book } = useOrderBook(coin);

  if (isLoading || !ctx) {
    return (
      <div className="panel p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50 mb-2">
          CONTEXT
        </div>
        <div className="text-xs font-mono text-[var(--fg)] opacity-30 pulse-slow">
          Loading...
        </div>
      </div>
    );
  }

  const change = ctx.prevDayPx ? ((ctx.markPx - ctx.prevDayPx) / ctx.prevDayPx) * 100 : 0;
  const changeColor = change >= 0 ? 'var(--bull)' : 'var(--bear)';
  const fundingColor = ctx.funding >= 0 ? 'var(--bull)' : 'var(--bear)';
  const imbColor = imb ? (imb.imbalance > 0 ? 'var(--bull)' : 'var(--bear)') : 'var(--fg)';

  // Use orderbook for mid and spread (single source of truth)
  const mid = book?.mid ?? ctx.midPx;
  const spread = book?.spread ?? 0;

  return (
    <div className="panel p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50">
          {coin}-PERP
        </span>
        <span className="text-[10px] font-mono" style={{ color: changeColor }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </span>
      </div>

      <div className="text-lg font-mono font-bold text-[var(--accent)] glow mb-3 tabular-nums">
        ${fmtPx(ctx.markPx)}
      </div>

      <Row label="Mid" value={`$${fmtPx(mid)}`} />
      <Row label="Oracle" value={`$${fmtPx(ctx.oraclePx)}`} />
      <Row label="Spread" value={`$${spread.toFixed(1)}`} />
      <Row label="Funding" value={fmtFunding(ctx.funding)} color={fundingColor} />
      <Row label="Premium" value={`${(ctx.premium * 100).toFixed(4)}%`} />
      <Row label="OI" value={`${fmt(ctx.openInterest)} ${coin}`} />
      <Row label="OI $" value={`$${fmt(ctx.openInterest * ctx.markPx)}`} />
      <Row label="24h Vol" value={`$${fmt(ctx.dayNtlVlm)}`} />
      <Row label="Max Lev" value={`${ctx.maxLeverage}x`} />

      {imb && (
        <>
          <div className="mt-3 mb-1 text-[10px] font-mono uppercase tracking-wider text-[var(--fg)] opacity-50">
            Book Imbalance (10 lvl)
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-2 bg-[var(--border)] rounded overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${((imb.bid_vol / (imb.bid_vol + imb.ask_vol)) * 100).toFixed(0)}%`,
                  background: 'var(--bull)',
                }}
              />
            </div>
            <span className="text-[10px] font-mono tabular-nums" style={{ color: imbColor }}>
              {imb.ratio.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[10px] font-mono opacity-60">
            <span style={{ color: 'var(--bull)' }}>{imb.bid_vol.toFixed(3)} bid</span>
            <span style={{ color: 'var(--bear)' }}>{imb.ask_vol.toFixed(3)} ask</span>
          </div>
        </>
      )}
    </div>
  );
}
