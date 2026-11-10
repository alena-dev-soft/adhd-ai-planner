import { describe, expect, it } from "vitest";
import {
  dayClosePatch,
  dayCloseRow,
  dayNotes,
  dayTaskPatch,
  dayTaskRow,
  estimateRequest,
  weekTaskPatch,
  weekTaskRow,
} from "./inputs";

const id = "7f1c7a52-6a2b-4d8e-9c1a-2b3c4d5e6f70";

describe("weekTaskPatch", () => {
  it("trims titles and stores empty as null", () => {
    expect(weekTaskPatch.parse({ weekId: id, slot: 1, title: "  Ship it " }).title).toBe("Ship it");
    expect(weekTaskPatch.parse({ weekId: id, slot: 1, title: "   " }).title).toBeNull();
  });

  it("rejects bad slots, ids and empty patches", () => {
    expect(weekTaskPatch.safeParse({ weekId: id, slot: 13, isDone: true }).success).toBe(false);
    expect(weekTaskPatch.safeParse({ weekId: id, slot: 0, isDone: true }).success).toBe(false);
    expect(weekTaskPatch.safeParse({ weekId: "x", slot: 1, isDone: true }).success).toBe(false);
    expect(weekTaskPatch.safeParse({ weekId: id, slot: 1 }).success).toBe(false);
  });

  it("maps only present fields to columns", () => {
    expect(weekTaskRow(weekTaskPatch.parse({ weekId: id, slot: 3, isDone: true }))).toEqual({
      week_id: id,
      slot: 3,
      is_done: true,
    });
  });
});

describe("dayTaskPatch", () => {
  it("accepts each field alone", () => {
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 5, completedPomodoros: 7 }).success).toBe(true);
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 1, targetPomodoros: null }).success).toBe(true);
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 2, isDone: false }).success).toBe(true);
  });

  it("rejects out-of-range values", () => {
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 6, isDone: true }).success).toBe(false);
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 1, completedPomodoros: -1 }).success).toBe(false);
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 1, completedPomodoros: 1.5 }).success).toBe(false);
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 1, targetPomodoros: 0 }).success).toBe(false);
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 1 }).success).toBe(false);
  });

  it("maps only present fields to columns", () => {
    expect(dayTaskRow(dayTaskPatch.parse({ dayId: id, slot: 2, completedPomodoros: 3 }))).toEqual({
      day_id: id,
      slot: 2,
      completed_pomodoros: 3,
    });
  });
});

describe("dayNotes", () => {
  it("keeps notes as typed", () => {
    expect(dayNotes.parse({ dayId: id, notes: " a\n" }).notes).toBe(" a\n");
    expect(dayNotes.safeParse({ dayId: id, notes: "x".repeat(20001) }).success).toBe(false);
  });
});

describe("dayTaskPatch targetIsManual", () => {
  it("maps to target_is_manual and counts as a non-empty patch", () => {
    expect(dayTaskRow(dayTaskPatch.parse({ dayId: id, slot: 2, targetIsManual: true }))).toEqual({
      day_id: id,
      slot: 2,
      target_is_manual: true,
    });
  });
});

describe("dayTaskPatch feasibility", () => {
  it("maps the AI estimate fields and clears with null", () => {
    const p = dayTaskPatch.parse({ dayId: id, slot: 1, targetPomodoros: 3, feasibility: "warning", feasibilityNote: " Tight. " });
    expect(dayTaskRow(p)).toEqual({
      day_id: id,
      slot: 1,
      target_pomodoros: 3,
      feasibility: "warning",
      feasibility_note: "Tight.",
    });
    expect(dayTaskRow(dayTaskPatch.parse({ dayId: id, slot: 1, feasibility: null, feasibilityNote: null }))).toEqual({
      day_id: id,
      slot: 1,
      feasibility: null,
      feasibility_note: null,
    });
  });

  it("rejects unknown feasibility values", () => {
    expect(dayTaskPatch.safeParse({ dayId: id, slot: 1, feasibility: "maybe" }).success).toBe(false);
  });
});

describe("estimateRequest", () => {
  it("accepts a valid body and defaults otherTasks", () => {
    expect(estimateRequest.parse({ title: " Fix DB ", category: "important" })).toEqual({
      title: "Fix DB",
      category: "important",
      otherTasks: [],
    });
  });

  it("rejects empty titles, unknown categories and too many tasks", () => {
    expect(estimateRequest.safeParse({ title: "  ", category: "important" }).success).toBe(false);
    expect(estimateRequest.safeParse({ title: "a", category: "urgent" }).success).toBe(false);
    expect(estimateRequest.safeParse({ title: "a", category: "secondary", otherTasks: Array(11).fill("x") }).success).toBe(false);
  });
});

describe("dayClosePatch", () => {
  const dayId = "00000000-0000-4000-8000-000000000001";

  it("trims text, empty → null, and maps only present columns", () => {
    const p = dayClosePatch.parse({ dayId, highlight: "  shipped it ", whatDidnt: "   " });
    expect(dayCloseRow(p)).toEqual({ highlight: "shipped it", what_didnt: null });
  });

  it("accepts rating 1–10 and null, rejects others", () => {
    expect(dayCloseRow(dayClosePatch.parse({ dayId, rating: 10 }))).toEqual({ rating: 10 });
    expect(dayCloseRow(dayClosePatch.parse({ dayId, rating: null }))).toEqual({ rating: null });
    expect(dayClosePatch.safeParse({ dayId, rating: 0 }).success).toBe(false);
    expect(dayClosePatch.safeParse({ dayId, rating: 11 }).success).toBe(false);
    expect(dayClosePatch.safeParse({ dayId, rating: 2.5 }).success).toBe(false);
  });

  it("accepts close alone, rejects an empty patch or a bad id", () => {
    const p = dayClosePatch.parse({ dayId, close: true });
    expect(p.close).toBe(true);
    expect(dayCloseRow(p)).toEqual({});
    expect(dayClosePatch.safeParse({ dayId }).success).toBe(false);
    expect(dayClosePatch.safeParse({ dayId: "x", rating: 3 }).success).toBe(false);
  });
});
