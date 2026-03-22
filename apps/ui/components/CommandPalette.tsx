/**
 * TEZERAKT - Command Palette
 * Ctrl+K / ⌘K system command interface
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { setTheme } from '@/lib/theme';
import { playBeep, playDoubleBeep } from '@/lib/audio';
import { useRouter } from 'next/navigation';

interface Command {
  id: string;
  label: string;
  action: () => void;
  category: 'nav' | 'theme' | 'system';
}

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setTheme: updateTheme,
    audioEnabled,
    toggleAudio,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    { id: 'nav-dash', label: 'Go to Dashboard', action: () => router.push('/'), category: 'nav' },
    { id: 'nav-flow', label: 'Go to Flow', action: () => router.push('/FLOW'), category: 'nav' },
    { id: 'nav-lab', label: 'Go to LAB', action: () => router.push('/LAB'), category: 'nav' },
    { id: 'nav-ops', label: 'Go to OPS', action: () => router.push('/OPS'), category: 'nav' },

    { id: 'theme-matrix', label: 'Theme: Matrix', action: () => { updateTheme('matrix'); setTheme('matrix'); }, category: 'theme' },
    { id: 'theme-blackops', label: 'Theme: BlackOps', action: () => { updateTheme('blackops'); setTheme('blackops'); }, category: 'theme' },
    { id: 'theme-neon', label: 'Theme: Neon', action: () => { updateTheme('neon'); setTheme('neon'); }, category: 'theme' },

    { id: 'sys-audio', label: audioEnabled ? 'Disable Audio' : 'Enable Audio', action: toggleAudio, category: 'system' },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        playBeep('command', audioEnabled);
        return;
      }

      if (!commandPaletteOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredCommands.length);
        playBeep('focus', audioEnabled);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
        playBeep('focus', audioEnabled);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          cmd.action();
          playDoubleBeep(audioEnabled);
          setCommandPaletteOpen(false);
          setSearch('');
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setCommandPaletteOpen(false);
        setSearch('');
        playBeep('focus', audioEnabled);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, audioEnabled, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/80 backdrop-blur-sm"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl panel border-glow"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type a command..."
            autoFocus
            className="w-full bg-transparent text-[var(--fg)] font-mono text-sm outline-none placeholder:text-[var(--fg)] placeholder:opacity-40"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-[var(--fg)] opacity-40 text-sm font-mono">
              No commands found
            </div>
          ) : (
            filteredCommands.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  playDoubleBeep(audioEnabled);
                  setCommandPaletteOpen(false);
                  setSearch('');
                }}
                className={`
                  w-full p-3 text-left font-mono text-sm transition-all
                  flex items-center justify-between
                  ${i === selectedIndex
                    ? 'bg-[var(--accent)] text-black'
                    : 'text-[var(--fg)] hover:bg-[var(--grid)]'
                  }
                `}
              >
                <span>{cmd.label}</span>
                <span className="text-xs opacity-60 uppercase">{cmd.category}</span>
              </button>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--fg)] opacity-40">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Execute</span>
            <span>ESC Close</span>
          </div>
          <span>⌘K</span>
        </div>
      </div>
    </div>
  );
};
