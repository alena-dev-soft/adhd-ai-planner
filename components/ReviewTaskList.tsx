"use client";

import type { ReviewTask } from "@/lib/domain/review";
import { slotGroups, type PageKind } from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

/**
 * Done (accent ✓) or not done (muted ✗) task list for the weekly review,
 * split under the theme's group names (lib/theme.ts). Nothing when empty.
 */
export function TaskList({
  title,
  tasks,
  done,
  kind,
}: {
  title: string;
  tasks: ReviewTask[];
  done: boolean;
  kind: PageKind;
}) {
  const { theme } = useTheme();
  if (tasks.length === 0) return null;
  const groups = slotGroups(theme, kind)
    .map((g) => ({ label: g.label, tasks: tasks.filter((t) => g.slots.includes(t.slot)) }))
    .filter((g) => g.tasks.length > 0);

  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className="head mb-2 text-sm">{title}</h3>
      <div className="flex flex-col gap-2">
        {groups.map((g) => (
          <div key={g.label}>
            <h4 className="head text-[11px] text-muted">{g.label}</h4>
            <ul className="text-[17px] leading-relaxed">
              {g.tasks.map((t) => (
                <li key={t.slot} className={done ? "text-ink" : "text-muted"}>
                  <span aria-hidden className={done ? "text-accent" : "text-muted"}>
                    {done ? "✓" : "✗"}
                  </span>{" "}
                  <span className="sr-only">{done ? "Done: " : "Not done: "}</span>
                  {t.title}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
