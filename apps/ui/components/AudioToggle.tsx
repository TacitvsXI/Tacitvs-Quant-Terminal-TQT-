/**
 * 🔷 TEZERAKT QUANT TERMINAL - Audio Toggle
 * Enable/disable system sounds
 */

'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { playBeep } from '@/lib/audio';

export const AudioToggle: React.FC = () => {
  const { audioEnabled, toggleAudio } = useAppStore();
  
  const handleToggle = () => {
    const newState = !audioEnabled;
    toggleAudio();
    if (newState) {
      playBeep('command', true);
    }
  };
  
  return (
    <button
      onClick={handleToggle}
      className="panel px-3 py-1.5 text-xs font-mono hover-glow transition-all"
      title={audioEnabled ? 'Disable audio' : 'Enable audio'}
    >
      <span className={audioEnabled ? 'text-[var(--accent)]' : 'text-[var(--fg)]'}>
        {audioEnabled ? '🔊 AUDIO ON' : '🔇 AUDIO OFF'}
      </span>
    </button>
  );
};

