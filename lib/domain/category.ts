export type Category = "important" | "secondary" | "additional";

/** Week page: slots 1–5 important, 6–10 secondary, 11–12 additional. */
export function weekCategory(slot: number): Category {
  if (!Number.isInteger(slot) || slot < 1 || slot > 12) {
    throw new RangeError(`week slot out of range: ${slot}`);
  }
  if (slot <= 5) return "important";
  if (slot <= 10) return "secondary";
  return "additional";
}

/** Day page: slot 1 important, 2–3 secondary, 4–5 additional. */
export function dayCategory(slot: number): Category {
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) {
    throw new RangeError(`day slot out of range: ${slot}`);
  }
  if (slot === 1) return "important";
  if (slot <= 3) return "secondary";
  return "additional";
}
