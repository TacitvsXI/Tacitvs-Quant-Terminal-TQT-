/**
 * 🔷 TEZERAKT - Quant Terminal - Root Layout
 * Retro Cyberpunk + Post-Military Industrial
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { QueryProvider } from "@/components/QueryProvider";
import { CommandPalette } from "@/components/CommandPalette";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TEZERAKT - Quant Terminal",
  description: "Professional quant trading terminal - EV-first, venue-agnostic",
  icons: {
    icon: [
      { url: '/tezerakt-logo-green.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  },
};

const THEME_RESTORE_SCRIPT = `
(function(){
  try {
    var raw = localStorage.getItem('tqt-storage');
    if (raw) {
      var t = JSON.parse(raw).state.theme;
      if (t === 'matrix' || t === 'blackops' || t === 'neon') {
        document.documentElement.setAttribute('data-theme', t);
      }
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="matrix" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_RESTORE_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ThemeInitializer />
          <CommandPalette />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
