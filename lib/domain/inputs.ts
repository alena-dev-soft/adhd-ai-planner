import { z } from "zod";

/** Titles: trimmed, max 500 chars; an empty title is stored as null. */
const title = z
  .string()
  .max(500)
  .transform((s) => s.trim() || null);

/** Patch for one week task, addressed by (weekId, slot). At least one field. */
export const weekTaskPatch = z
  .object({
    weekId: z.uuid(),
    slot: z.number().int().min(1).max(12),
    title: title.optional(),
    isDone: z.boolean().optional(),
  })
  .refine((p) => p.title !== undefined || p.isDone !== undefined, "empty patch");

/** Patch for one day task, addressed by (dayId, slot). At least one field. */
export const dayTaskPatch = z
  .object({
    dayId: z.uuid(),
    slot: z.number().int().min(1).max(5),
    title: title.optional(),
    targetPomodoros: z.number().int().min(1).max(99).nullable().optional(),
    completedPomodoros: z.number().int().min(0).max(99).optional(),
    isDone: z.boolean().optional(),
    feasibility: z.enum(["yes", "warning", "no"]).nullable().optional(),
    feasibilityNote: z
      .string()
      .max(500)
      .transform((s) => s.trim() || null)
      .nullable()
      .optional(),
  })
  .refine(
    (p) =>
      p.title !== undefined ||
      p.targetPomodoros !== undefined ||
      p.completedPomodoros !== undefined ||
      p.isDone !== undefined ||
      p.feasibility !== undefined ||
      p.feasibilityNote !== undefined,
    "empty patch",
  );

export const dayNotes = z.object({
  dayId: z.uuid(),
  notes: z.string().max(20000),
});

export type WeekTaskPatch = z.input<typeof weekTaskPatch>;
export type DayTaskPatch = z.input<typeof dayTaskPatch>;
export type DayNotes = z.input<typeof dayNotes>;

/** Only the columns present in the patch, so an upsert never clobbers the others. */
export function weekTaskRow(p: z.output<typeof weekTaskPatch>) {
  return {
    week_id: p.weekId,
    slot: p.slot,
    ...(p.title !== undefined && { title: p.title }),
    ...(p.isDone !== undefined && { is_done: p.isDone }),
  };
}

export function dayTaskRow(p: z.output<typeof dayTaskPatch>) {
  return {
    day_id: p.dayId,
    slot: p.slot,
    ...(p.title !== undefined && { title: p.title }),
    ...(p.targetPomodoros !== undefined && { target_pomodoros: p.targetPomodoros }),
    ...(p.completedPomodoros !== undefined && { completed_pomodoros: p.completedPomodoros }),
    ...(p.isDone !== undefined && { is_done: p.isDone }),
    ...(p.feasibility !== undefined && { feasibility: p.feasibility }),
    ...(p.feasibilityNote !== undefined && { feasibility_note: p.feasibilityNote }),
  };
}

/** Body of POST /api/estimate. */
export const estimateRequest = z.object({
  title: z.string().trim().min(1).max(500),
  category: z.enum(["important", "secondary", "additional"]),
  otherTasks: z.array(z.string().trim().min(1).max(500)).max(10).default([]),
});

export type EstimateRequest = z.input<typeof estimateRequest>;
