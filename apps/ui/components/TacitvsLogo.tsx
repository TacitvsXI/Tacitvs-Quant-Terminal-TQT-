/**
 * 🔷 TEZERAKT - Dynamic Logo
 * Three SVG versions that switch based on theme
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';

interface TacitvsLogoProps {
  size?: number;
  className?: string;
}

// Маппинг тем на SVG файлы
const LOGO_MAP = {
  matrix: '/tezerakt-logo-green.svg',
  blackops: '/tezerakt-logo-red.svg',
  neon: '/tezerakt-logo-blue.svg',
} as const;

/**
 * TEZERAKT Logo - Geometric tesseract-inspired design
 * Динамически переключается между тремя SVG файлами
 */
export const TacitvsLogo: React.FC<TacitvsLogoProps> = ({
  size = 100,
  className = ''
}) => {
  const { theme } = useAppStore();
  const logoSrc = LOGO_MAP[theme];
  
  return (
    <Image
      src={logoSrc}
      alt="TEZERAKT Logo"
      width={size}
      height={size}
      className={className}
      priority
      unoptimized // SVG не требует оптимизации
    />
  );
};

