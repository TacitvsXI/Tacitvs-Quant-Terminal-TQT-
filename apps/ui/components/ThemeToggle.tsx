/**
 * 🔷 TEZERAKT - Quant Terminal - Theme Toggle
 * System-style theme switcher with audio feedback
 */

'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { setTheme, THEMES } from '@/lib/theme';
import { playBeep } from '@/lib/audio';
import type { ThemeName } from '@/lib/store';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme: updateTheme, audioEnabled } = useAppStore();
  
  const handleThemeChange = (newTheme: ThemeName) => {
    updateTheme(newTheme);
    setTheme(newTheme);
    playBeep('theme_switch', audioEnabled);
  };
  
  const themes: ThemeName[] = ['matrix', 'blackops', 'neon'];
  
  return (
    <div className="flex items-center gap-2 panel p-2">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => handleThemeChange(t)}
          className={`
            px-3 py-1.5 text-xs font-mono uppercase tracking-wider
            transition-all duration-200
            ${theme === t 
              ? 'bg-[var(--accent)] text-black font-bold border-glow' 
              : 'bg-[var(--panel)] text-[var(--fg)] hover:bg-[var(--grid)] hover-glow'
            }
          `}
          title={THEMES[t].description}
        >
          {THEMES[t].name}
        </button>
      ))}
    </div>
  );
};

export const ThemeIndicator: React.FC = () => {
  const { theme } = useAppStore();
  const themeInfo = THEMES[theme];
  
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <div 
        className="w-2 h-2 rounded-full pulse-slow"
        style={{ backgroundColor: 'var(--accent)' }}
      />
      <span className="text-[var(--fg)]">{themeInfo.name}</span>
      <span className="text-[var(--accent2)]">{themeInfo.description}</span>
    </div>
  );
};

