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
 * Get chart colors based on current theme
 */
export function getChartThemeColors(theme: ThemeName) {
  const baseColors = {
    background: '#0B0F16',
    text: '#7FB7FF',
    grid: '#1B2230',
    crosshair: '#7FB7FF',
  };

  const themeColors = {
    matrix: {
      upColor: '#00FF84',      // Matrix green
      downColor: '#00CC66',    // Darker green
      borderColor: '#00FF84',
      wickUpColor: '#00FF84',
      wickDownColor: '#00CC66',
    },
    blackops: {
      upColor: '#fe0174',      // Hot pink
      downColor: '#f82909',    // Orange-red
      borderColor: '#fe0174',
      wickUpColor: '#fe0174',
      wickDownColor: '#f82909',
    },
    neon: {
      upColor: '#319ff8',      // Bright blue
      downColor: '#422d94',    // Deep purple
      borderColor: '#319ff8',
      wickUpColor: '#319ff8',
      wickDownColor: '#422d94',
    },
  };

  return {
    ...baseColors,
    ...themeColors[theme],
  };
}

