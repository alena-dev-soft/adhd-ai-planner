"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES, isThemeKey, type Theme, type ThemeKey } from "@/lib/theme";

type ThemeContextValue = { theme: Theme; setTheme: (key: ThemeKey) => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);

// The source of truth is <html data-theme>, which the inline head script sets
// before paint. React reads it as an external store, so the server render and
// hydration use the default and the client switches right after (no mismatch).
const listeners = new Set<() => void>();

function readDomTheme(): ThemeKey {
  const value = document.documentElement.dataset.theme;
  return isThemeKey(value) ? value : DEFAULT_THEME;
}

function applyTheme(key: ThemeKey) {
  document.documentElement.dataset.theme = key;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep other tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY && isThemeKey(e.newValue)) applyTheme(e.newValue);
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerTheme = (): ThemeKey => DEFAULT_THEME;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const key = useSyncExternalStore(subscribe, readDomTheme, getServerTheme);

  const setTheme = useCallback((next: ThemeKey) => {
    applyTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode, blocked): theme still applies for this page.
    }
  }, []);

  const value = useMemo(() => ({ theme: THEMES[key], setTheme }), [key, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Current theme (labels, bubble shape, unit) and a setter. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
