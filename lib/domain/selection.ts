import { addDaysToDate, weekDates, weekStart } from "./rollover";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type Selection = { weekStart: string; date: string };

function validDate(value: string | undefined): string | null {
  if (!value || !DATE_RE.test(value)) return null;
  try {
    weekStart(value); // throws on impossible dates like 2025-02-30
    return value;
  } catch {
    return null;
  }
}

/**
 * Selected week and day from URL search params.
 * - `date` wins: its week is shown with that day selected.
 * - `week` alone: that week (normalised to Monday); today if it falls in it, else Monday.
 * - Nothing or invalid: today's planner date.
 */
export function resolveSelection(
  params: { date?: string; week?: string },
  today: string,
): Selection {
  const date = validDate(params.date);
  if (date) return { weekStart: weekStart(date), date };

  const week = validDate(params.week);
  if (week) {
    const monday = weekStart(week);
    return { weekStart: monday, date: weekDates(monday).includes(today) ? today : monday };
  }
  return { weekStart: weekStart(today), date: today };
}

/** Week shifted by `weeks`; same rule as `?week=` (today if inside, else Monday). */
export function shiftWeek(monday: string, weeks: number, today: string): Selection {
  return resolveSelection({ week: addDaysToDate(monday, weeks * 7) }, today);
}

/** Href of the planner for a selected date. */
export function plannerHref(date: string): string {
  return `/?date=${date}`;
}

/** Random element (used for the quote of a new day). Null for an empty list. */
export function pickRandom<T>(items: readonly T[], random: () => number = Math.random): T | null {
  if (items.length === 0) return null;
  const i = Math.min(items.length - 1, Math.floor(random() * items.length));
  return items[i];
}
