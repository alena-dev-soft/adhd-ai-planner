"use client";

import { useTheme } from "./ThemeProvider";

/** Free notes at the bottom of the day page; title from the theme registry. */
export function Notes({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <div>
      <h3 className="head text-base leading-snug">
        <label htmlFor="day-notes">{theme.notesTitle}</label>
      </h3>
      <p className="sub mb-2">&ldquo;Extra space for ideas, future tasks, inspiration, etc.&rdquo;</p>
      <textarea
        id="day-notes"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={() => onBlur?.()}
        rows={3}
        className="field min-h-20"
      />
    </div>
  );
}
