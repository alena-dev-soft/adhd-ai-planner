import { redirect } from "next/navigation";
import { Planner } from "@/components/Planner";
import { plannerHref, resolveSelection, shiftWeek } from "@/lib/domain/selection";
import { loadPlanner, userToday } from "@/lib/planner";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Planner. URL state: `?date=YYYY-MM-DD` (selected day; its week is shown) or `?week=YYYY-MM-DD`. */
export default async function PlannerPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const params = await searchParams;
  const today = await userToday(supabase, userId);
  const { weekStart, date } = resolveSelection(
    { date: first(params.date), week: first(params.week) },
    today,
  );
  const data = await loadPlanner(supabase, userId, weekStart, date);

  return (
    <Planner
      key={date}
      weekStart={weekStart}
      selectedDate={date}
      today={today}
      prevWeekHref={plannerHref(shiftWeek(weekStart, -1, today).date)}
      nextWeekHref={plannerHref(shiftWeek(weekStart, 1, today).date)}
      weekId={data.weekId}
      dayId={data.dayId}
      weekTasks={data.weekTasks}
      dayTasks={data.dayTasks}
      day={data.day}
    />
  );
}
