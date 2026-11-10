import { DEFAULT_ROLLOVER_HOUR, DEFAULT_TIME_ZONE, plannerDate } from "@/lib/domain/rollover";
import { pickRandom } from "@/lib/domain/selection";
import {
  toDayTaskViews,
  toWeekTaskViews,
  type DayTaskView,
  type DayView,
  type WeekTaskView,
} from "@/lib/domain/views";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type PlannerData = {
  weekId: string;
  dayId: string;
  weekTasks: WeekTaskView[];
  day: DayView;
  dayTasks: DayTaskView[];
};

/** Today's planner date for the user, from profiles.time_zone / rollover_hour. */
export async function userToday(supabase: Supabase, userId: string, now = new Date()): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("time_zone, rollover_hour")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  try {
    return plannerDate(now, data?.time_zone ?? DEFAULT_TIME_ZONE, data?.rollover_hour ?? DEFAULT_ROLLOVER_HOUR);
  } catch {
    // Bad time zone / hour in the profile: fall back instead of breaking the page.
    return plannerDate(now);
  }
}

/** Load (creating if missing) the weeks row, the days row and their tasks. */
export async function loadPlanner(
  supabase: Supabase,
  userId: string,
  weekStart: string,
  date: string,
): Promise<PlannerData> {
  const [weekId, day] = await Promise.all([
    ensureWeek(supabase, userId, weekStart),
    ensureDay(supabase, userId, date),
  ]);

  const [weekTasks, dayTasks] = await Promise.all([
    supabase.from("week_tasks").select("slot, title, is_done").eq("week_id", weekId),
    supabase
      .from("day_tasks")
      .select("slot, title, target_pomodoros, completed_pomodoros, is_done, feasibility, feasibility_note")
      .eq("day_id", day.id),
  ]);
  if (weekTasks.error) throw weekTasks.error;
  if (dayTasks.error) throw dayTasks.error;

  return {
    weekId,
    dayId: day.id,
    weekTasks: toWeekTaskViews(weekTasks.data),
    day: day.view,
    dayTasks: toDayTaskViews(dayTasks.data),
  };
}

async function ensureWeek(supabase: Supabase, userId: string, weekStart: string): Promise<string> {
  const find = () =>
    supabase.from("weeks").select("id").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();

  const found = await find();
  if (found.error) throw found.error;
  if (found.data) return found.data.id;

  // ignoreDuplicates: a concurrent request may have created it in between.
  // Use the inserted row directly: a read right after the write may not see it yet.
  const ins = await supabase
    .from("weeks")
    .upsert({ user_id: userId, week_start: weekStart }, { onConflict: "user_id,week_start", ignoreDuplicates: true })
    .select("id");
  if (ins.error) throw ins.error;
  if (ins.data[0]) return ins.data[0].id;

  const again = await find();
  if (again.error) throw again.error;
  if (!again.data) throw new Error(`week ${weekStart} could not be created`);
  return again.data.id;
}

const DAY_COLUMNS =
  "id, date, notes, highlight, what_worked, what_didnt, rating, closed_at, quote:quotes(text, author)";

async function ensureDay(
  supabase: Supabase,
  userId: string,
  date: string,
): Promise<{ id: string; view: DayView }> {
  const find = () =>
    supabase.from("days").select(DAY_COLUMNS).eq("user_id", userId).eq("date", date).maybeSingle();

  const found = await find();
  if (found.error) throw found.error;
  let d = found.data;

  if (!d) {
    // The quote is picked once, when the row is created. On conflict (another
    // request created the row first) nothing is written, so it never changes.
    const quotes = await supabase.from("quotes").select("id");
    if (quotes.error) throw quotes.error;
    const quoteId = pickRandom(quotes.data.map((q) => q.id));

    const ins = await supabase
      .from("days")
      .upsert({ user_id: userId, date, quote_id: quoteId }, { onConflict: "user_id,date", ignoreDuplicates: true })
      .select(DAY_COLUMNS)
      .maybeSingle();
    if (ins.error) throw ins.error;

    // Use the inserted row directly: a read right after the write may not see it yet.
    d = ins.data;
    if (!d) {
      const again = await find();
      if (again.error) throw again.error;
      if (!again.data) throw new Error(`day ${date} could not be created`);
      d = again.data;
    }
  }

  return {
    id: d.id,
    view: {
      date: d.date,
      quote: d.quote ? { text: d.quote.text, author: d.quote.author } : null,
      notes: d.notes ?? "",
      highlight: d.highlight ?? "",
      whatWorked: d.what_worked ?? "",
      whatDidnt: d.what_didnt ?? "",
      rating: d.rating,
      closedAt: d.closed_at,
    },
  };
}
