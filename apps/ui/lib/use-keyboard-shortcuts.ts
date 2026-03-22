"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export const KEYBOARD_SHORTCUTS = {
  navigation: {
    ops: { key: "1", cmd: true, description: "Go to OPS" },
    lab: { key: "2", cmd: true, description: "Go to LAB" },
    metrics: { key: "3", cmd: true, description: "Go to METRICS" },
    console: { key: "4", cmd: true, description: "Go to CONSOLE" },
  },
  actions: {
    commandPalette: { key: "k", cmd: true, description: "Open Command Palette" },
    backtest: { key: "b", cmd: true, description: "Run Backtest (on LAB)" },
  },
  tools: {
    shortcuts: { key: "/", cmd: true, description: "Show Shortcuts" },
  },
};

export function useKeyboardShortcuts() {
  const router = useRouter();
  const { setCommandPaletteOpen } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Number keys for navigation (1-4)
      if (cmdKey && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const pages = ["OPS", "LAB", "METRICS", "CONSOLE"];
        const index = parseInt(e.key) - 1;
        router.push(`/${pages[index]}`);
        return;
      }

      // Cmd/Ctrl+K - Command Palette
      if (cmdKey && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Cmd/Ctrl+B - Run Backtest (on LAB page)
      if (cmdKey && e.key === "b") {
        e.preventDefault();
        if (window.location.pathname === "/LAB") {
          // Trigger backtest run
          const backtestButton = document.querySelector('[data-backtest-button]') as HTMLButtonElement;
          backtestButton?.click();
        }
        return;
      }

      // Escape - Close modals/command palette
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, setCommandPaletteOpen]);
}

