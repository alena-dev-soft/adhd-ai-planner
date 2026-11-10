import { describe, expect, it } from "vitest";
import { toDayTaskViews, toWeekTaskViews } from "./views";

describe("toWeekTaskViews", () => {
  it("fills all 12 slots in order", () => {
    const v = toWeekTaskViews([
      { slot: 12, title: "last", is_done: false },
      { slot: 1, title: "first", is_done: true },
      { slot: 3, title: null, is_done: false },
    ]);
    expect(v).toHaveLength(12);
    expect(v.map((t) => t.slot)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(v[0]).toEqual({ slot: 1, title: "first", isDone: true });
    expect(v[1]).toEqual({ slot: 2, title: "", isDone: false });
    expect(v[2].title).toBe("");
    expect(v[11].title).toBe("last");
  });
});

describe("toDayTaskViews", () => {
  it("fills all 5 slots and maps fields", () => {
    const v = toDayTaskViews([
      {
        slot: 2,
        title: "Review",
        target_pomodoros: 3,
        target_is_manual: true,
        completed_pomodoros: 7,
        is_done: true,
        feasibility: "warning",
        feasibility_note: "Tight.",
      },
    ]);
    expect(v).toHaveLength(5);
    expect(v[0]).toEqual({
      slot: 1,
      title: "",
      targetPomodoros: null,
      targetIsManual: false,
      completedPomodoros: 0,
      isDone: false,
      feasibility: null,
      feasibilityNote: null,
    });
    expect(v[1]).toEqual({
      slot: 2,
      title: "Review",
      targetPomodoros: 3,
      targetIsManual: true,
      completedPomodoros: 7,
      isDone: true,
      feasibility: "warning",
      feasibilityNote: "Tight.",
    });
  });

  it("drops unknown feasibility values", () => {
    const v = toDayTaskViews([
      { slot: 1, title: "x", target_pomodoros: null, completed_pomodoros: 0, is_done: false, feasibility: "maybe", feasibility_note: null },
    ]);
    expect(v[0].feasibility).toBeNull();
  });
});
