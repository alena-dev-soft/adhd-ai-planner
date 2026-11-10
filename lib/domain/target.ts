import type { Feasibility } from "./overload";

type Estimate = { targetPomodoros: number; feasibility: Feasibility; note: string };
type Current = { targetPomodoros: number | null; targetIsManual: boolean };

/**
 * What an AI estimate changes on a day task. A target the user typed stays;
 * the mark and note are still updated. Otherwise the AI target is taken.
 */
export function estimatePatch(current: Current, r: Estimate) {
  const mark = { feasibility: r.feasibility, feasibilityNote: r.note || null };
  if (current.targetIsManual && current.targetPomodoros !== null) return mark;
  return { targetPomodoros: r.targetPomodoros, targetIsManual: false, ...mark };
}

/** Typing a target makes it manual; clearing the box hands it back to the AI. */
export function manualTargetPatch(targetPomodoros: number | null) {
  return { targetPomodoros, targetIsManual: targetPomodoros !== null };
}
