import { describe, expect, it } from "vitest";
import { estimatePatch, manualTargetPatch } from "./target";

const r = { targetPomodoros: 3, feasibility: "warning" as const, note: "Tight." };

describe("estimatePatch", () => {
  it("takes the AI target when there is none", () => {
    expect(estimatePatch({ targetPomodoros: null, targetIsManual: false }, r)).toEqual({
      targetPomodoros: 3, targetIsManual: false, feasibility: "warning", feasibilityNote: "Tight.",
    });
  });
  it("replaces an earlier AI target", () => {
    expect(estimatePatch({ targetPomodoros: 6, targetIsManual: false }, r)).toMatchObject({ targetPomodoros: 3 });
  });
  it("keeps a manual target but updates the mark", () => {
    expect(estimatePatch({ targetPomodoros: 6, targetIsManual: true }, r)).toEqual({
      feasibility: "warning", feasibilityNote: "Tight.",
    });
  });
  it("fills a cleared target even if the flag is stale", () => {
    expect(estimatePatch({ targetPomodoros: null, targetIsManual: true }, r)).toMatchObject({ targetPomodoros: 3 });
  });
  it("stores an empty note as null", () => {
    expect(estimatePatch({ targetPomodoros: null, targetIsManual: false }, { ...r, note: "" }).feasibilityNote).toBeNull();
  });
});

describe("manualTargetPatch", () => {
  it("marks a typed target as manual", () => {
    expect(manualTargetPatch(4)).toEqual({ targetPomodoros: 4, targetIsManual: true });
  });
  it("clearing the box un-marks it", () => {
    expect(manualTargetPatch(null)).toEqual({ targetPomodoros: null, targetIsManual: false });
  });
});
