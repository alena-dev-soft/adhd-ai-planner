import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("keeps relative paths", () => {
    expect(safeNext("/review?week=2025-12-15")).toBe("/review?week=2025-12-15");
  });

  it("falls back to / for missing or external targets", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
  });
});
