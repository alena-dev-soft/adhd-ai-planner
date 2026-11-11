export const BUBBLE_COUNT = 5;

/**
 * New completed count after clicking bubble `n` (1–5).
 * Clicking the last filled bubble removes one pomodoro; any other bubble sets
 * completed = n. When completed is over 5, bubble 5 is the last filled one.
 */
export function clickBubble(completed: number, n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > BUBBLE_COUNT) {
    throw new RangeError(`bubble out of range: ${n}`);
  }
  const current = Math.max(0, Math.floor(completed));
  const lastFilled = Math.min(current, BUBBLE_COUNT);
  return n === lastFilled ? current - 1 : n;
}

/** How to draw a completed count: filled bubbles (0–5) and "+N" past 5. */
export function bubbleDisplay(completed: number): { filled: number; overflow: string | null } {
  const current = Math.max(0, Math.floor(completed));
  const extra = current - BUBBLE_COUNT;
  return {
    filled: Math.min(current, BUBBLE_COUNT),
    overflow: extra > 0 ? `+${extra}` : null,
  };
}
