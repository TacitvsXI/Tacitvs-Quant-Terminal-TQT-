'use client';

import { Navigation } from '@/components/Navigation';

export default function ConsolePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-mono text-[var(--accent)] glow mb-4">CONSOLE</h1>
        <p className="text-sm font-mono text-[var(--fg)] opacity-50">
          Terminal interface — coming soon.
        </p>
      </main>
    </div>
  );
}
