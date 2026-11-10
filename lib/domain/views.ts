import type { Feasibility } from "./overload";

export type WeekTaskView = { slot: number; title: string; isDone: boolean };

export type DayTaskView = {
  slot: number;
  title: string;
  targetPomodoros: number | null;
  completedPomodoros: number;
  isDone: boolean;
  feasibility: Feasibility | null;
  feasibilityNote: string | null;
};

export type QuoteView = { text: string; author: string | null };

export type DayView = {
  date: string;
  quote: QuoteView | null;
  notes: string;
  highlight: string;
  whatWorked: string;
  whatDidnt: string;
  rating: number | null;
  closedAt: string | null;
};

type WeekTaskRow = { slot: number; title: string | null; is_done: boolean };
type DayTaskRow = {
  slot: number;
  title: string | null;
  target_pomodoros: number | null;
  completed_pomodoros: number;
  is_done: boolean;
  feasibility: string | null;
  feasibility_note: string | null;
};

const FEASIBILITY = new Set<string>(["yes", "warning", "no"]);

/** All 12 week slots; slots without a row are empty. */
export function toWeekTaskViews(rows: readonly WeekTaskRow[]): WeekTaskView[] {
  return Array.from({ length: 12 }, (_, i) => {
    const r = rows.find((x) => x.slot === i + 1);
    return { slot: i + 1, title: r?.title ?? "", isDone: r?.is_done ?? false };
  });
}

/** All 5 day slots; slots without a row are empty. */
export function toDayTaskViews(rows: readonly DayTaskRow[]): DayTaskView[] {
  return Array.from({ length: 5 }, (_, i) => {
    const r = rows.find((x) => x.slot === i + 1);
    return {
      slot: i + 1,
      title: r?.title ?? "",
      targetPomodoros: r?.target_pomodoros ?? null,
      completedPomodoros: r?.completed_pomodoros ?? 0,
      isDone: r?.is_done ?? false,
      feasibility:
        r?.feasibility && FEASIBILITY.has(r.feasibility) ? (r.feasibility as Feasibility) : null,
      feasibilityNote: r?.feasibility_note ?? null,
    };
  });
}
