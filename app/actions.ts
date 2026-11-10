"use server";

import {
  dayNotes,
  dayTaskPatch,
  dayTaskRow,
  weekTaskPatch,
  weekTaskRow,
  type DayNotes,
  type DayTaskPatch,
  type WeekTaskPatch,
} from "@/lib/domain/inputs";
import { createClient } from "@/lib/supabase/server";

/**
 * Autosave actions. Inputs are zod-validated; ownership is enforced by RLS
 * (week_tasks / day_tasks via their parent row, days via user_id), so a
 * foreign weekId / dayId simply fails. They return ok instead of throwing so
 * the client can show "not saved" without an error boundary.
 */
export type SaveResult = { ok: boolean };

export async function saveWeekTask(input: WeekTaskPatch): Promise<SaveResult> {
  const p = weekTaskPatch.safeParse(input);
  if (!p.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("week_tasks")
    .upsert(weekTaskRow(p.data), { onConflict: "week_id,slot" });
  return { ok: !error };
}

export async function saveDayTask(input: DayTaskPatch): Promise<SaveResult> {
  const p = dayTaskPatch.safeParse(input);
  if (!p.success) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase
    .from("day_tasks")
    .upsert(dayTaskRow(p.data), { onConflict: "day_id,slot" });
  return { ok: !error };
}

export async function saveNotes(input: DayNotes): Promise<SaveResult> {
  const p = dayNotes.safeParse(input);
  if (!p.success) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("days")
    .update({ notes: p.data.notes })
    .eq("id", p.data.dayId)
    .select("id");
  // RLS hides foreign rows: 0 rows updated means not saved.
  return { ok: !error && data.length === 1 };
}
