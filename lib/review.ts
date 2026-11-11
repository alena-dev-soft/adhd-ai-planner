import { addDaysToDate } from "@/lib/domain/rollover";
import { reviewWeek, type WeekReview } from "@/lib/domain/review";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Read one week (Mon–Sun from `weekStart`) and aggregate it with the domain
 * review. Read-only: missing weeks/days rows are not created.
 */
export async function loadReview(supabase: Supabase, userId: string, weekStart: string): Promise<WeekReview> {
  const weekEnd = addDaysToDate(weekStart, 6);

  const [week, days] = await Promise.all([
    supabase.from("weeks").select("id").eq("user_id", userId).eq("week_start", weekStart).maybeSingle(),
    supabase
      .from("days")
      .select("id, date, highlight, rating, closed_at")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd),
  ]);
  if (week.error) throw week.error;
  if (days.error) throw days.error;

  const dayIds = days.data.map((d) => d.id);
  const [weekTasks, dayTasks] = await Promise.all([
    week.data
      ? supabase.from("week_tasks").select("slot, title, is_done").eq("week_id", week.data.id)
      : Promise.resolve({ data: [], error: null }),
    dayIds.length
      ? supabase
          .from("day_tasks")
          .select("day_id, slot, title, is_done, target_pomodoros, completed_pomodoros")
          .in("day_id", dayIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (weekTasks.error) throw weekTasks.error;
  if (dayTasks.error) throw dayTasks.error;

  return reviewWeek({
    weekStart,
    days: days.data,
    dayTasks: dayTasks.data ?? [],
    weekTasks: weekTasks.data ?? [],
  });
}
