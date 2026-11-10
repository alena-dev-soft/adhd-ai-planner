import { describe, expect, it } from "vitest";
import { dayCategory, weekCategory } from "./category";

describe("weekCategory", () => {
  it("maps slots 1–5 / 6–10 / 11–12", () => {
    expect([1, 5].map(weekCategory)).toEqual(["important", "important"]);
    expect([6, 10].map(weekCategory)).toEqual(["secondary", "secondary"]);
    expect([11, 12].map(weekCategory)).toEqual(["additional", "additional"]);
  });

  it("rejects slots outside 1–12", () => {
    for (const s of [0, 13, 1.5]) expect(() => weekCategory(s)).toThrow(RangeError);
  });
});

describe("dayCategory", () => {
  it("maps slots 1 / 2–3 / 4–5", () => {
    expect([1, 2, 3, 4, 5].map(dayCategory)).toEqual([
      "important",
      "secondary",
      "secondary",
      "additional",
      "additional",
    ]);
  });

  it("rejects slots outside 1–5", () => {
    for (const s of [0, 6, -1]) expect(() => dayCategory(s)).toThrow(RangeError);
  });
});
