import { describe, expect, it } from "vitest";
import { dayNotes, dayTaskPatch, dayTaskRow, weekTaskPatch, weekTaskRow } from "./inputs";

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
