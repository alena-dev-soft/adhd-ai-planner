import { describe, expect, it } from "vitest";
import { addDaysToDate, plannerDate, weekDates, weekStart } from "./rollover";

// Asia/Ho_Chi_Minh is UTC+7 with no DST: local = UTC + 7h.
const HCM = "Asia/Ho_Chi_Minh";

describe("plannerDate", () => {
  it("defaults to Asia/Ho_Chi_Minh and rollover hour 7", () => {
    // Tue 2025-12-16 02:00 local = Mon 2025-12-15 19:00Z → still Monday
    expect(plannerDate(new Date("2025-12-15T19:00:00Z"))).toBe("2025-12-15");
  });

  it("keeps the previous date after local midnight until the rollover hour", () => {
    // Tue 00:00 local and Tue 06:59 local are still Monday
    expect(plannerDate(new Date("2025-12-15T17:00:00Z"), HCM, 7)).toBe("2025-12-15");
    expect(plannerDate(new Date("2025-12-15T23:59:59Z"), HCM, 7)).toBe("2025-12-15");
  });

  it("switches exactly at the rollover hour", () => {
    // Tue 07:00:00 local = Tue 00:00Z
    expect(plannerDate(new Date("2025-12-16T00:00:00Z"), HCM, 7)).toBe("2025-12-16");
    // one second earlier is still Monday
    expect(plannerDate(new Date("2025-12-15T23:59:59Z"), HCM, 7)).toBe("2025-12-15");
  });

  it("evening before midnight belongs to the same date", () => {
    // Mon 23:30 local
    expect(plannerDate(new Date("2025-12-15T16:30:00Z"), HCM, 7)).toBe("2025-12-15");
  });

  it("uses the local date, not the UTC date", () => {
    // Tue 2025-12-16 10:00 local = Tue 03:00Z; and Tue 08:00 local = Tue 01:00Z
    expect(plannerDate(new Date("2025-12-16T03:00:00Z"), HCM, 7)).toBe("2025-12-16");
    // UTC date is still Monday (Mon 20:00Z) but local is Tue 03:00 → Monday by rollover
    expect(plannerDate(new Date("2025-12-15T20:00:00Z"), HCM, 7)).toBe("2025-12-15");
  });

  it("rollover hour 0 means plain local midnight", () => {
    expect(plannerDate(new Date("2025-12-15T17:00:00Z"), HCM, 0)).toBe("2025-12-16");
    expect(plannerDate(new Date("2025-12-15T16:59:59Z"), HCM, 0)).toBe("2025-12-15");
  });

  it("crosses month and year boundaries", () => {
    // Thu 2026-01-01 03:00 local → Wed 2025-12-31
    expect(plannerDate(new Date("2025-12-31T20:00:00Z"), HCM, 7)).toBe("2025-12-31");
    // Sun 2026-03-01 05:00 local → Sat 2026-02-28
    expect(plannerDate(new Date("2026-02-28T22:00:00Z"), HCM, 7)).toBe("2026-02-28");
  });

  it("works in other time zones, including DST", () => {
    // New York, Sun 2026-03-08 (spring forward at 02:00). 06:30 EDT = 10:30Z → still Saturday
    expect(plannerDate(new Date("2026-03-08T10:30:00Z"), "America/New_York", 7)).toBe("2026-03-07");
    // 07:00 EDT = 11:00Z → Sunday
    expect(plannerDate(new Date("2026-03-08T11:00:00Z"), "America/New_York", 7)).toBe("2026-03-08");
    // UTC itself
    expect(plannerDate(new Date("2025-12-16T06:59:00Z"), "UTC", 7)).toBe("2025-12-15");
  });

  it("rejects an invalid rollover hour", () => {
    for (const h of [-1, 24, 6.5]) {
      expect(() => plannerDate(new Date(), HCM, h)).toThrow(RangeError);
    }
  });
});

describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2025-12-15")).toBe("2025-12-15"); // Monday
    expect(weekStart("2025-12-17")).toBe("2025-12-15"); // Wednesday
    expect(weekStart("2025-12-21")).toBe("2025-12-15"); // Sunday
    expect(weekStart("2025-12-22")).toBe("2025-12-22"); // next Monday
  });

  it("crosses month and year boundaries", () => {
    expect(weekStart("2026-01-01")).toBe("2025-12-29");
    expect(weekStart("2026-03-01")).toBe("2026-02-23");
  });

  it("combines with plannerDate across the night shift", () => {
    // Mon 2025-12-22 03:00 local is still Sunday → previous week
    expect(weekStart(plannerDate(new Date("2025-12-21T20:00:00Z")))).toBe("2025-12-15");
  });

  it("rejects malformed dates", () => {
    for (const d of ["2025-13-01", "2025-02-30", "15/12/2025", ""]) {
      expect(() => weekStart(d)).toThrow(RangeError);
    }
  });
});

describe("addDaysToDate / weekDates", () => {
  it("does calendar arithmetic on date strings", () => {
    expect(addDaysToDate("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDaysToDate("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("lists Monday–Sunday", () => {
    expect(weekDates("2025-12-29")).toEqual([
      "2025-12-29",
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });
});
