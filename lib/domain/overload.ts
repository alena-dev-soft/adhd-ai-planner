export type Feasibility = "yes" | "warning" | "no";

export const WARNING_ABOVE = 12;
export const NO_ABOVE = 15;

/** Sum of target pomodoros; null/undefined targets are ignored. */
export function totalTarget(targets: ReadonlyArray<number | null | undefined>): number {
  return targets.reduce<number>((sum, t) => sum + (t ?? 0), 0);
}

/** Day overload without AI: sum > 12 → "warning", > 15 → "no", else "yes". */
export function overload(targets: ReadonlyArray<number | null | undefined>): Feasibility {
  const sum = totalTarget(targets);
  if (sum > NO_ABOVE) return "no";
  if (sum > WARNING_ABOVE) return "warning";
  return "yes";
}
