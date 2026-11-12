"use client";

import { THEME_LIST } from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

/** Three pills in the header; the active theme is aria-pressed. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="group" aria-label="Theme" className="flex flex-wrap gap-2">
      {THEME_LIST.map((t) => (
        <button
          key={t.key}
          type="button"
          className="pill"
          aria-pressed={t.key === theme.key}
          onClick={() => setTheme(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
