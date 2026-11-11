"use server";

import {
  dayClosePatch,
  dayCloseRow,
  dayNotes,
  dayTaskPatch,
  dayTaskRow,
  weekTaskPatch,
  weekTaskRow,
  type DayClosePatch,
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

export type CloseDayResult = SaveResult & { closedAt?: string | null };

/**
 * Close-the-day panel: highlight, what worked / didn't, rating. With
 * `close: true`, closed_at is set to now — only if the day isn't closed yet.
 * Returns the day's closed_at so the client shows the stored value.
 */
export async function saveCloseDay(input: DayClosePatch): Promise<CloseDayResult> {
  const p = dayClosePatch.safeParse(input);
  if (!p.success) return { ok: false };
  const supabase = await createClient();
  const row = dayCloseRow(p.data);

  if (Object.keys(row).length > 0) {
    const { data, error } = await supabase.from("days").update(row).eq("id", p.data.dayId).select("id");
    if (error || data.length !== 1) return { ok: false };
  }
  if (p.data.close) {
    const { error } = await supabase
      .from("days")
      .update({ closed_at: new Date().toISOString() })
      .eq("id", p.data.dayId)
      .is("closed_at", null);
    if (error) return { ok: false };
  }
  const { data, error } = await supabase.from("days").select("closed_at").eq("id", p.data.dayId).maybeSingle();
  if (error || !data) return { ok: false };
  return { ok: true, closedAt: data.closed_at };
}
