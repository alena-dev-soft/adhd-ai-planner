import { describe, expect, it } from "vitest";
import { reviewWeek, type ReviewDayTaskInput } from "./review";

const task = (
  day_id: string,
  slot: number,
  title: string | null,
  is_done: boolean,
  target_pomodoros: number | null,
  completed_pomodoros: number,
): ReviewDayTaskInput => ({ day_id, slot, title, is_done, target_pomodoros, completed_pomodoros });

describe("reviewWeek", () => {
  const result = reviewWeek({
    weekStart: "2025-12-15",
    days: [
      { id: "mon", date: "2025-12-15", highlight: " Shipped the migration ", rating: 8, closed_at: "2025-12-16T00:00:00Z" },
      { id: "tue", date: "2025-12-16", highlight: "", rating: 5, closed_at: "2025-12-17T00:00:00Z" },
      { id: "wed", date: "2025-12-17", highlight: null, rating: null, closed_at: null },
      // outside the week: ignored
      { id: "other", date: "2025-12-22", highlight: "nope", rating: 1, closed_at: null },
    ],
    dayTasks: [
      task("mon", 2, "Review CPC codes", true, 2, 2),
      task("mon", 1, "Fix ABC database", true, 3, 4),
      task("mon", 4, "Clean temp files", false, null, 0),
      task("mon", 5, "   ", false, 2, 1), // empty title: ignored
      task("tue", 1, "Deploy tariff", false, 4, 1),
      task("other", 1, "Next week", true, 1, 1),
    ],
    weekTasks: [
      { slot: 6, title: "Team sync", is_done: false },
      { slot: 1, title: "Fix ABC system", is_done: true },
      { slot: 2, title: null, is_done: false },
    ],
  });

  it("returns Monday–Sunday", () => {
    expect(result.days.map((d) => d.date)).toEqual([
      "2025-12-15",
      "2025-12-16",
      "2025-12-17",
      "2025-12-18",
      "2025-12-19",
      "2025-12-20",
      "2025-12-21",
    ]);
  });

  it("splits done / not done by slot order with categories", () => {
    const mon = result.days[0];
    expect(mon.done).toEqual([
      { slot: 1, title: "Fix ABC database", category: "important" },
      { slot: 2, title: "Review CPC codes", category: "secondary" },
    ]);
    expect(mon.notDone).toEqual([{ slot: 4, title: "Clean temp files", category: "additional" }]);
  });

  it("carries highlight, rating, closed and pomodoros", () => {
    const [mon, tue] = result.days;
    expect(mon).toMatchObject({
      highlight: "Shipped the migration",
      rating: 8,
      closed: true,
      hasData: true,
      pomodorosDone: 6,
      pomodorosTarget: 5,
    });
    expect(tue).toMatchObject({
      highlight: null,
      rating: 5,
      closed: true,
      pomodorosDone: 1,
      pomodorosTarget: 4,
    });
    expect(tue.notDone.map((t) => t.title)).toEqual(["Deploy tariff"]);
  });

  it("marks empty days as having no data", () => {
    const wed = result.days[2];
    expect(wed).toEqual({
      date: "2025-12-17",
      hasData: false,
      closed: false,
      done: [],
      notDone: [],
      highlight: null,
      rating: null,
      pomodorosDone: 0,
      pomodorosTarget: 0,
    });
    expect(result.days[6].hasData).toBe(false);
  });

  it("lists weekly tasks done / not done", () => {
    expect(result.weekTasksDone).toEqual([{ slot: 1, title: "Fix ABC system", category: "important" }]);
    expect(result.weekTasksNotDone).toEqual([{ slot: 6, title: "Team sync", category: "secondary" }]);
  });

  it("computes week totals", () => {
    expect(result.totals).toEqual({
      done: 2,
      notDone: 2,
      pomodorosDone: 7,
      pomodorosTarget: 9,
      daysRated: 2,
      averageRating: 6.5,
    });
  });

  it("handles an empty week", () => {
    const empty = reviewWeek({ weekStart: "2025-12-15", days: [], dayTasks: [] });
    expect(empty.days).toHaveLength(7);
    expect(empty.weekTasksDone).toEqual([]);
    expect(empty.totals.averageRating).toBeNull();
    expect(empty.totals.done).toBe(0);
  });
});
