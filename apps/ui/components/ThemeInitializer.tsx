/**
 * 🔷 TEZERAKT QUANT TERMINAL - Theme Initializer
 * Client component to initialize theme on mount
 */

'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { initializeTheme } from '@/lib/theme';

export const ThemeInitializer: React.FC = () => {
  const theme = useAppStore((state) => state.theme);
  
  useEffect(() => {
    initializeTheme(theme);
  }, [theme]);
  
  return null;
};

