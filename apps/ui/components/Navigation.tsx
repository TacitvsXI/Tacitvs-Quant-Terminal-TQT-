/**
 * 🔷 TEZERAKT - Quant Terminal - Navigation
 * Terminal-style navigation bar with API status
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TacitvsLogo } from './TacitvsLogo';
import { ThemeToggle } from './ThemeToggle';
import { AudioToggle } from './AudioToggle';
import { useAppStore } from '@/lib/store';
import { playBeep } from '@/lib/audio';
import { useAPIHealth } from '@/lib/hooks';

const NAV_ITEMS = [
  { href: '/', label: 'DASHBOARD', shortcut: '⌘1' },
  { href: '/LAB', label: 'LAB', shortcut: '⌘2' },
  { href: '/OPS', label: 'OPS', shortcut: '⌘3' },
] as const;

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { audioEnabled, setApiConnected } = useAppStore();
  const { data: health, isError } = useAPIHealth();
  
  React.useEffect(() => {
    setApiConnected(!isError && !!health);
  }, [health, isError, setApiConnected]);
  
  const handleNavClick = () => {
    playBeep('focus', audioEnabled);
  };
  
  const apiStatus = isError ? 'OFFLINE' : health ? 'ONLINE' : 'CONNECTING';
  const apiColor = isError ? 'var(--accent2)' : 'var(--accent)';
  
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-4 hover-glow transition-all group">
            <div className="transition-transform group-hover:scale-110 duration-200">
              <TacitvsLogo size={42} />
            </div>
            <div>
              <h1 className="text-lg font-mono font-bold text-[var(--accent)] glow-strong tracking-wider">
                TEZERAKT
              </h1>
              <p className="text-[10px] font-mono text-[var(--fg)] -mt-1 tracking-wide opacity-70">
                Quant Terminal
              </p>
            </div>
          </Link>
        </div>
        
        {/* Main Navigation */}
        <div className="flex items-center gap-2">
          {NAV_ITEMS.map(({ href, label, shortcut }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={handleNavClick}
                className={`
                  px-4 py-1.5 text-xs font-mono uppercase tracking-wider
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-[var(--accent)] text-black font-bold border-glow' 
                    : 'text-[var(--fg)] hover:text-[var(--accent)] hover-glow'
                  }
                `}
                title={shortcut}
              >
                {label}
              </Link>
            );
          })}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          <AudioToggle />
          <ThemeToggle />
          
          {/* API Status */}
          <div className="panel px-3 py-1.5 flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full pulse-slow" 
              style={{ backgroundColor: apiColor }}
            />
            <span className="text-xs font-mono text-[var(--fg)]">
              API: {apiStatus}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

