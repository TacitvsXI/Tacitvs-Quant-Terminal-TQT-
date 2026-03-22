/**
 * 🔷 TEZERAKT - Quant Terminal - Theme Manager
 * Dynamic theme switching with logo and favicon updates
 */

import type { ThemeName } from './store';

export const THEMES = {
  matrix: {
    name: 'Matrix',
    primary: '#00FF84',
    secondary: '#00CC66',
    description: 'Research / Simulation',
  },
  blackops: {
    name: 'BlackOps',
    primary: '#fe0174',
    secondary: '#f82909',
    description: 'Execution / Risk Mode',
  },
  neon: {
    name: 'Neon',
    primary: '#319ff8',
    secondary: '#422d94',
    description: 'Post-Analysis / Reporting',
  },
} as const;

/**
 * Update HTML data-theme attribute
 */
export function setTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return;
  
  document.documentElement.setAttribute('data-theme', theme);
  updateFavicon();
}

/**
 * Get current theme colors from CSS variables
 */
export function getThemeColors(): { accent: string; accent2: string } {
  if (typeof window === 'undefined') {
    return { accent: '#00FF84', accent2: '#00CC66' };
  }
  
  const styles = getComputedStyle(document.documentElement);
  return {
    accent: styles.getPropertyValue('--accent').trim(),
    accent2: styles.getPropertyValue('--accent2').trim(),
  };
}

// Маппинг тем на SVG фавиконы
const FAVICON_MAP = {
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
} as const;

/**
 * Update dynamic favicon based on current theme
 * Использует те же самые SVG файлы что и основной логотип
 */
export function updateFavicon(): void {
  if (typeof window === 'undefined') return;
  
  const theme = (document.documentElement.getAttribute('data-theme') || 'matrix') as ThemeName;
  const faviconSrc = FAVICON_MAP[theme];
  
  console.log(`🔷 Updating favicon to theme: ${theme} → ${faviconSrc}`);
  
  // Удаляем все существующие favicon links
  const existingLinks = document.querySelectorAll<HTMLLinkElement>('link[rel*="icon"]');
  existingLinks.forEach(link => link.remove());
  
  // Создаем новый favicon link с cache busting
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  link.href = `${faviconSrc}?v=${Date.now()}`; // Cache busting
  
  document.head.appendChild(link);
  
  // Также обновляем shortcut icon для некоторых браузеров
  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.type = 'image/svg+xml';
  shortcutLink.href = `${faviconSrc}?v=${Date.now()}`;
  
  document.head.appendChild(shortcutLink);
  
  console.log(`✅ Favicon updated successfully`);
}

/**
 * Initialize theme on mount
 */
export function initializeTheme(theme: ThemeName): void {
  setTheme(theme);
}

/**
 * Directional (bull/bear) palette per theme — hex values for JS contexts
 * (lightweight-charts, canvas, etc. that can't read CSS vars).
 * Mirrors the --bull/--bear CSS custom properties in globals.css.
 */
const BULL_BEAR = {
  matrix:  { bull: '#00FF84', bear: '#FFAA00', bullRgb: '0,255,132',  bearRgb: '255,170,0'  },
  blackops:{ bull: '#00E5FF', bear: '#FF0055', bullRgb: '0,229,255',  bearRgb: '255,0,85'   },
  neon:    { bull: '#00FFCC', bear: '#FF00AA', bullRgb: '0,255,204',  bearRgb: '255,0,170'  },
} as const;

export function getBullBearColors(theme: ThemeName) {
  return BULL_BEAR[theme];
}

/**
 * Get chart colors based on current theme.
 * Candlestick up/down now uses the directional bull/bear palette.
 */
export function getChartThemeColors(theme: ThemeName) {
  const bb = BULL_BEAR[theme];

  const baseColors = {
    background: '#0B0F16',
    text: '#7FB7FF',
    grid: '#1B2230',
    crosshair: '#7FB7FF',
  };

  return {
    ...baseColors,
    upColor: bb.bull,
    downColor: bb.bear,
    borderColor: bb.bull,
    wickUpColor: bb.bull,
    wickDownColor: bb.bear,
  };
}

