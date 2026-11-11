import { dayCategory, weekCategory, type Category } from "./category";
import { weekDates } from "./rollover";

export type ReviewDayInput = {
  id: string;
  date: string;
  highlight: string | null;
  rating: number | null;
  closed_at: string | null;
};

export type ReviewDayTaskInput = {
  day_id: string;
  slot: number;
  title: string | null;
  is_done: boolean;
  target_pomodoros: number | null;
  completed_pomodoros: number;
};

export type ReviewWeekTaskInput = {
  slot: number;
  title: string | null;
  is_done: boolean;
};

export type ReviewTask = { slot: number; title: string; category: Category };

export type DayReview = {
  date: string;
  hasData: boolean;
  closed: boolean;
  done: ReviewTask[];
  notDone: ReviewTask[];
  highlight: string | null;
  rating: number | null;
  pomodorosDone: number;
  pomodorosTarget: number;
};

export type WeekReview = {
  weekStart: string;
  days: DayReview[];
  weekTasksDone: ReviewTask[];
  weekTasksNotDone: ReviewTask[];
  totals: {
    done: number;
    notDone: number;
    pomodorosDone: number;
    pomodorosTarget: number;
    daysRated: number;
    averageRating: number | null;
  };
};

/**
 * Aggregate one week (Mon–Sun starting at `weekStart`) into per-day cards and
 * week totals. Always returns 7 days; days without a row have hasData = false.
 * Tasks with an empty title are ignored; tasks are ordered by slot.
 */
export function reviewWeek(input: {
  weekStart: string;
  days: ReadonlyArray<ReviewDayInput>;
  dayTasks: ReadonlyArray<ReviewDayTaskInput>;
  weekTasks?: ReadonlyArray<ReviewWeekTaskInput>;
}): WeekReview {
  const dayByDate = new Map(input.days.map((d) => [d.date, d]));

  const days = weekDates(input.weekStart).map((date): DayReview => {
    const day = dayByDate.get(date);
    const tasks = day
      ? input.dayTasks
          .filter((t) => t.day_id === day.id && hasTitle(t.title))
          .sort((a, b) => a.slot - b.slot)
      : [];
    const toItem = (t: ReviewDayTaskInput): ReviewTask => ({
      slot: t.slot,
      title: t.title!.trim(),
      category: dayCategory(t.slot),
    });
    const highlight = hasTitle(day?.highlight) ? day!.highlight!.trim() : null;
    const rating = day?.rating ?? null;
    const closed = day?.closed_at != null;

    return {
      date,
      hasData: tasks.length > 0 || highlight !== null || rating !== null || closed,
      closed,
      done: tasks.filter((t) => t.is_done).map(toItem),
      notDone: tasks.filter((t) => !t.is_done).map(toItem),
      highlight,
      rating,
      pomodorosDone: tasks.reduce((s, t) => s + t.completed_pomodoros, 0),
      pomodorosTarget: tasks.reduce((s, t) => s + (t.target_pomodoros ?? 0), 0),
    };
  });

  const weekTasks = (input.weekTasks ?? [])
    .filter((t) => hasTitle(t.title))
    .sort((a, b) => a.slot - b.slot);
  const toWeekItem = (t: ReviewWeekTaskInput): ReviewTask => ({
    slot: t.slot,
    title: t.title!.trim(),
    category: weekCategory(t.slot),
  });

  const ratings = days.flatMap((d) => (d.rating === null ? [] : [d.rating]));

  return {
    weekStart: input.weekStart,
    days,
    weekTasksDone: weekTasks.filter((t) => t.is_done).map(toWeekItem),
    weekTasksNotDone: weekTasks.filter((t) => !t.is_done).map(toWeekItem),
    totals: {
      done: sum(days.map((d) => d.done.length)),
      notDone: sum(days.map((d) => d.notDone.length)),
      pomodorosDone: sum(days.map((d) => d.pomodorosDone)),
      pomodorosTarget: sum(days.map((d) => d.pomodorosTarget)),
      daysRated: ratings.length,
      averageRating: ratings.length ? sum(ratings) / ratings.length : null,
    },
  };
}

function hasTitle(s: string | null | undefined): s is string {
  return typeof s === "string" && s.trim() !== "";
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
