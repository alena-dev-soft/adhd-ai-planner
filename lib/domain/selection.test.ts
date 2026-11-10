import { describe, expect, it } from "vitest";
import { pickRandom, plannerHref, resolveSelection, shiftWeek } from "./selection";

const today = "2025-12-17"; // Wednesday, week of Mon 2025-12-15

describe("resolveSelection", () => {
  it("defaults to today and its week", () => {
    expect(resolveSelection({}, today)).toEqual({ weekStart: "2025-12-15", date: today });
  });

  it("uses ?date= with its own week", () => {
    expect(resolveSelection({ date: "2026-01-01" }, today)).toEqual({
      weekStart: "2025-12-29",
      date: "2026-01-01",
    });
  });

  it("?date= wins over ?week=", () => {
    expect(resolveSelection({ date: "2025-12-20", week: "2025-12-01" }, today)).toEqual({
      weekStart: "2025-12-15",
      date: "2025-12-20",
    });
  });

  it("?week= of another week selects its Monday", () => {
    expect(resolveSelection({ week: "2025-12-08" }, today)).toEqual({
      weekStart: "2025-12-08",
      date: "2025-12-08",
    });
  });

  it("?week= of the current week selects today", () => {
    expect(resolveSelection({ week: "2025-12-15" }, today)).toEqual({
      weekStart: "2025-12-15",
      date: today,
    });
  });

  it("normalises ?week= to Monday", () => {
    expect(resolveSelection({ week: "2025-12-11" }, today).weekStart).toBe("2025-12-08");
  });

  it("ignores invalid values", () => {
    for (const bad of ["", "2025-02-30", "17-12-2025", "x", "2025-12-17T00:00"]) {
      expect(resolveSelection({ date: bad, week: bad }, today)).toEqual({
        weekStart: "2025-12-15",
        date: today,
      });
    }
  });
});

describe("shiftWeek", () => {
  it("moves to the previous / next Monday", () => {
    expect(shiftWeek("2025-12-15", -1, today)).toEqual({ weekStart: "2025-12-08", date: "2025-12-08" });
    expect(shiftWeek("2025-12-29", 1, today)).toEqual({ weekStart: "2026-01-05", date: "2026-01-05" });
  });

  it("selects today when returning to the current week", () => {
    expect(shiftWeek("2025-12-08", 1, today)).toEqual({ weekStart: "2025-12-15", date: today });
  });
});

it("plannerHref", () => {
  expect(plannerHref("2025-12-17")).toBe("/?date=2025-12-17");
});

describe("pickRandom", () => {
  it("returns null for an empty list", () => {
    expect(pickRandom([])).toBeNull();
  });
  it("covers first and last element", () => {
    expect(pickRandom([1, 2, 3], () => 0)).toBe(1);
    expect(pickRandom([1, 2, 3], () => 0.9999)).toBe(3);
    expect(pickRandom([1, 2, 3], () => 1)).toBe(3);
  });
});
