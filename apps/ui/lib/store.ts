/**
 * 🔷 TEZERAKT - Quant Terminal - Global Store
 * Zustand store for theme, audio, and app state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 'matrix' | 'blackops' | 'neon';

export interface AppState {
  // Theme
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  
  // Audio
  audioEnabled: boolean;
  toggleAudio: () => void;
  
  // Radio
  radioEnabled: boolean;
  radioVolume: number;
  radioStationIndex: number;
  toggleRadio: () => void;
  setRadioVolume: (volume: number) => void;
  setRadioStationIndex: (index: number) => void;
  nextRadioStation: () => void;
  
  // Simulation state
  isSimulating: boolean;
  setSimulating: (value: boolean) => void;
  
  // Connection status
  apiConnected: boolean;
  setApiConnected: (value: boolean) => void;
  apiLatency: number | null;
  setApiLatency: (value: number | null) => void;
  
  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'matrix',
      setTheme: (theme) => {
        set({ theme });
        // Update DOM attribute for CSS
        if (typeof window !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },
      
      // Audio
      audioEnabled: true,
      toggleAudio: () => set((state) => ({ audioEnabled: !state.audioEnabled })),
      
      // Radio
      radioEnabled: false,
      radioVolume: 0.5,
      radioStationIndex: 0,
      toggleRadio: () => set((state) => ({ radioEnabled: !state.radioEnabled })),
      setRadioVolume: (volume) => set({ radioVolume: Math.max(0, Math.min(1, volume)) }),
      setRadioStationIndex: (index) => set({ radioStationIndex: index }),
      nextRadioStation: () => set((state) => ({ 
        radioStationIndex: state.radioStationIndex + 1 
      })),
      
      // Simulation
      isSimulating: false,
      setSimulating: (value) => set({ isSimulating: value }),
      
      // API Connection
      apiConnected: false,
      setApiConnected: (value) => set({ apiConnected: value }),
      apiLatency: null,
      setApiLatency: (value) => set({ apiLatency: value }),
      
      // Command Palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (value) => set({ commandPaletteOpen: value }),
    }),
    {
      name: 'tqt-storage',
      partialize: (state) => ({
        theme: state.theme,
        audioEnabled: state.audioEnabled,
        radioEnabled: state.radioEnabled,
        radioVolume: state.radioVolume,
        radioStationIndex: state.radioStationIndex,
      }),
    }
  )
);

