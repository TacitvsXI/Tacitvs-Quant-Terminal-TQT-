# Tacitus Quant Terminal — Frontend README (Sci‑Fi Terminal)

> A cinematic, **sci‑fi trading terminal** for research & execution ops.  
> Stack: **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion + Recharts + Zustand + React Query**.  
> Design goal: *“personal command center”* — neon accents, glass/metal textures, dynamic grid, telemetry glow.

---

## Table of Contents
1. Vision & Design Philosophy  
2. Feature Map & Screens  
3. Information Architecture (IA)  
4. Tech Stack & Rationale  
5. Data Flow & State (Query + Store)  
6. API Contracts (with the Python FastAPI backend)  
7. UI System: Theme, Tokens, Motion, Components  
8. Pages & Components (by route)  
9. Charts & Visuals (Recharts)  
10. Accessibility & Keyboard Ops  
11. Performance Budget & Monitoring  
12. Project Structure  
13. Commands & Dev Workflow  
14. Testing (unit, visual, e2e)  
15. Roadmap (FX)  
16. Appendix: Code Snippets

---

## 1) Vision & Design Philosophy

- **Feel**: not “exchange-like,” but a **personal super‑terminal**. No stock tables. Panels breathe via **subtle motion**, **live glow**, and **contextual color** (EV → lamp color; funding/vol → gradient).
- **Hierarchy**: information density is high, but **layered**:
  - **OPS**: live status, actions, safety (arm/hold, EV lamps, kill‑switch).  
  - **LAB**: research playground (backtests, WF, MC, queue sim).  
  - **Console**: command palette & logs.  
  - **Metrics**: EV, Costs_in_R, MaxDD, risk exposure.
- **Palette**: deep black/charcoal base; cyan/azure for neutral; **emerald/teal for positive**; **amber for caution**; **red/pink for alerts**.  
- **Motion**: short, **purposeful** (≤200ms), easing out; micro-parallax on panels; pulse on EV changes.  
- **No skeuomorphism**; **thin neon outlines** + **soft blur** (glass) + **gridlines** for “bridge of a starship” vibe.

---

## 2) Feature Map & Screens

### OPS (Operations Terminal)
- **Table Matrix**: venue × market tiles → lamp by `EV_net` thresholds.
- **Controls**: ARM / HOLD / SIM / DRY‑RUN; Risk% slider; Router hint (maker/taker).
- **Ops Log**: chronologically sorted, fixed‑width, tail‑append.
- **R‑Ruler** overlay on the chart (1R/2R, stop, trail preview).
- **Safety**: kill‑switch status, daily‑loss‑R gauge.

### LAB (Research)
- **Backtest Runner**: strategy + params + data range → results (R timeline, stats).
- **Walk‑Forward Wizard**: train/test windows, parameters freeze, report.
- **Monte Carlo**: permutation, bootstrap, block bootstrap → p‑tiles, PoR, VaR/ES.
- **Queue Sim** (later): maker post‑only placement, FIFO fills, replace penalties.

### Console
- **Command Palette** (`Ctrl/Cmd+K`): `/status btc`, `/mc <strat> <N>`, `/backtest …`, `/arm`, `/route maker|taker`.
- **Notifications**: toasts for success/warn/error.

### Metrics
- **EV Board**: `p, b̄, Costs_in_R, EV_net` (rolling) per table.
- **Risk**: exposure by market, daily loss in R, position caps.

---

## 3) Information Architecture (IA)

- **Primary Nav** (left sidebar): OPS · LAB · Metrics · Console.  
- **Secondary** (within page): tabs/segmented control for sub‑panels (e.g., LAB: Backtest | WF | MC | Queue).  
- **Global**: command palette, notifications, settings (theme, units), connection status dot.

---

## 4) Tech Stack & Rationale

- **Next.js (App Router)**: file‑routed pages, SSR when needed, static where possible.  
- **Tailwind CSS**: design tokens & utility flow; fast theming, dark‑first.  
- **shadcn/ui**: solid primitives (Card, Tabs, Dialog, Sheet, Tooltip).  
- **Framer Motion**: layout transitions, presence animations, micro‑motion.  
- **Recharts**: performant charts; we add custom grid/gradients for the sci‑fi look.  
- **Zustand**: tiny global store for **ephemeral UI state** (palette open, panel layout, local toggles).  
- **React Query**: server state (polling EV, backtest jobs, logs).  
- **TypeScript**: safer UI contracts.

---

## 5) Data Flow & State

- **Server state** (React Query):  
  - `/health`, `/lab/tortoise`, `/ev/calc`, `/backtest/*`, `/mc/*`.  
  - Polling: `EV_net` every 2–5s (SIM); exponential backoff; stale‑time 5s.  
- **Client state** (Zustand):

```ts
// lib/store.ts
import { create } from 'zustand';

type UIState = {
  paletteOpen: boolean;
  opsMode: 'SIM'|'DRY'|'OFF';
  riskPct: number;
  setPalette: (v:boolean)=>void;
  setOpsMode: (m:UIState['opsMode'])=>void;
  setRiskPct: (x:number)=>void;
};

export const useUI = create<UIState>((set)=> ({
  paletteOpen:false, opsMode:'SIM', riskPct:1.0,
  setPalette:(v)=>set({paletteOpen:v}),
  setOpsMode:(m)=>set({opsMode:m}),
  setRiskPct:(x)=>set({riskPct:x})
}));
```

---

## 6) API Contracts (FastAPI)

- `GET /health` → `{ ok: true }`  
- `GET /lab/tortoise?n=20&bars=400` → `{ trades: number, ev_gross: number, outcomes_R: number[] }`  
- `POST /ev/calc` → `{ costs_in_R: number, ev_net: number }`  
  Body:
  ```json
  { "p":0.45, "b":2.0, "fees_eff":0.9, "funding":0.2, "slippage":0.6, "gas":0, "R_usd":120 }
  ```

We wrap these with a tiny fetch client in `lib/api.ts` and consume via React Query.

---

## 7) UI System: Theme, Tokens, Motion, Components

### Theme Tokens (Tailwind CSS)
- **Base**: `bg-[#0a0c12]`, `text-neutral-200`, `border-[#202633]`.  
- **Accents**: `emerald-400` (good), `amber-400` (warn), `rose-400` (alert), `sky-400` (info).  
- **Gradients**: cyan→blue for neutral telemetry; emerald→teal for positive; amber→orange for volatility.

### Motion
- Defaults: `duration-150`, `ease-out`.  
- Presence: `AnimatePresence` for panels/overlays; minimal parallax with `motion.div` and `whileHover` glow.

### Components (shadcn/ui + custom)
- **Card**, **Tabs**, **Dialog**, **Sheet**, **Tooltip**, **Slider**, **Toast**.  
- Custom: **Lamp**, **RulerOverlay**, **OpsTile**, **EVStat**, **OpsLog**.

---

## 8) Pages & Components

### `/OPS` (Operations)

**Layout**
- Grid 3×? responsive.  
- Col1: **Table Matrix** (venue×market tiles).  
- Col2: **Controls** (ARM/HOLD/SIM/DRY, Risk%, Router).  
- Col3: **Ops Log** + Connection status.

**Lamp logic**
```ts
// components/Lamp.tsx
export function lampClass(ev:number){
  if(ev > 0.05)   return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]';
  if(ev > -0.02)  return 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]';
  return 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]';
}
```

**Controls**
- **ARM** → enables entries (UI only for now).  
- **HOLD** → pause entries.  
- **SIM/DRY/OFF** → ops mode in store.  
- **Risk% slider** → updates `riskPct` in store; shows `R_$` preview (computed client‑side).

### `/LAB` (Research)

- **Run mini backtest** → fetch `/lab/tortoise` → show `ev_gross`, list of outcomes (R).  
- **EV net**: optional POST `/ev/calc` to subtract costs and show `EV_net`.  
- **Charts**: cumulative R line; histogram of outcomes; EV trend.

---

## 9) Charts & Visuals

- Recharts components: `LineChart`, `BarChart`, `AreaChart`.  
- Sci‑fi gloss: SVG defs for gradients; subtle glow via filters; gridlines with low alpha.

```tsx
// components/EVLine.tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function EVLine({data}:{data:{x:number,y:number}[]}){
  return (
    <div className="rounded-2xl bg-[#0b0f16] p-3 border border-[#1b2230]">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <XAxis dataKey="x" hide />
          <YAxis hide />
          <Tooltip contentStyle={{background:'#0b0f16', border:'1px solid #1b2230'}}/>
          <Line type="monotone" dataKey="y" stroke="currentColor" className="text-sky-400" dot={false} strokeWidth={2}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

---

## 10) Accessibility & Keyboard Ops

- **Command Palette** (`K`): open/close; arrow navigate; enter to execute.  
- **Focusable tiles**; **aria‑labels** on lamps/buttons; contrast ≥ 4.5 for text.  
- Reduce motion mode: respect `prefers-reduced-motion` and tone down animations.

---

## 11) Performance Budget & Monitoring

- **LCP ≤ 1.8s**, **CLS ≈ 0**, **Hydration ≤ 200ms** on standard laptop.  
- Images next‑gen, no third‑party fonts blocking first paint.  
- React Query cache to avoid redundant fetches; poll with backoff.  
- Optional: Web Vitals logging to console in dev, Sentry (later).

---

## 12) Project Structure

```
apps/ui/
  app/
    layout.tsx
    page.tsx            # redirect → /OPS
    OPS/page.tsx
    LAB/page.tsx
    Metrics/page.tsx
    Console/page.tsx
  components/
    Lamp.tsx
    EVLine.tsx
    OpsLog.tsx
    RulerOverlay.tsx
    Tiles/
      OpsTile.tsx
      EVStat.tsx
  lib/
    api.ts              # fetchers
    store.ts            # zustand
    utils.ts
```

---

## 13) Commands & Dev Workflow

```bash
# Dev UI (if running separately)
cd apps/ui
npm run dev

# Lint & format
npm run lint
npx prettier -w .

# Build & start
npm run build && npm run start
```

Git conventions: Conventional Commits (`feat(ui): lamp thresholds`), PRs with screenshots/gifs.

---

## 14) Testing

- **Unit**: component props, helper utils (Jest + React Testing Library).  
- **Visual**: Storybook (optional), Chromatic / Percy later.  
- **E2E**: Playwright (flows: run backtest → see EV chart; ops lamp switch on data).

---

## 15) Roadmap (FX / polish)

- **Grid shaders** (subtle moving grid in background).  
- **Audio ticks** (very light, optional, when EV flips state).  
- **Tauri desktop** build (local journaling, hotkeys).  
- **Theme presets**: “Glacier”, “Nebula”, “Forge”.  
- **Live heatmap**: venue×market tile heat by EV / liquidity / fees.

---

## 16) Appendix: Code Snippets

### lib/api.ts
```ts
export async function api<T>(path:string, init?:RequestInit): Promise<T> {
  const r = await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
    cache: 'no-store', ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) }
  });
  if(!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r.json();
}

export const getTortoise = (n=20, bars=400) =>
  api<{trades:number; ev_gross:number; outcomes_R:number[]; }>(`/lab/tortoise?n=${n}&bars=${bars}`);

export const postEV = (body:{p:number;b:number;fees_eff:number;funding:number;slippage:number;gas:number;R_usd:number}) =>
  api<{costs_in_R:number; ev_net:number}>('/ev/calc', { method:'POST', body: JSON.stringify(body) });
```

### app/LAB/page.tsx (wire-up)
```tsx
'use client';
import { useState } from 'react';
import { getTortoise, postEV } from '@/lib/api';

export default function LAB(){
  const [gross, setGross] = useState<number|null>(null);
  const [net, setNet] = useState<number|null>(null);

  async function run(){
    const r = await getTortoise(20, 400);
    setGross(r.ev_gross);
    const ev = await postEV({ p:0.45, b:2.0, fees_eff:0.9, funding:0.2, slippage:0.6, gas:0, R_usd:120 });
    setNet(ev.ev_net);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">LAB — Research</h1>
      <button onClick={run} className="px-3 py-2 rounded-xl bg-emerald-600">Run mini backtest</button>
      <div className="text-sm">
        {gross!=null && <div>EV (gross): <b>{gross.toFixed(3)}</b></div>}
        {net!=null && <div>EV (net): <b>{net.toFixed(3)}</b></div>}
      </div>
    </main>
  );
}
```

### components/OpsLog.tsx
```tsx
export default function OpsLog({lines}:{lines:string[]}){
  return (
    <pre className="rounded-2xl bg-[#0b0f16] border border-[#1b2230] p-3 text-xs text-neutral-300 overflow-auto h-64">
      {lines.join('\n')}
    </pre>
  );
}
```

---

## Environment

Set the API URL exposed by FastAPI:
```
# apps/ui/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

**Done.** This README is your blueprint for a **cinematic yet practical** frontend.  
It preserves your stack and shows exactly how to wire **LAB/OPS** with the Python backend, add the **sci‑fi visual language**, and keep it performant and testable.
