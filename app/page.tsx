import { redirect } from "next/navigation";
import { Planner } from "@/components/Planner";
import { plannerDate, weekStart } from "@/lib/domain/rollover";
import { sampleDayTasks, sampleQuote, sampleWeekTasks } from "@/lib/sample-planner";
import { createClient } from "@/lib/supabase/server";

// Phase 3a: static layout with sample data. Supabase wiring comes next.
export default async function PlannerPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const today = plannerDate(new Date());
  return (
    <Planner
      initialWeekStart={weekStart(today)}
      initialDate={today}
      weekTasks={sampleWeekTasks}
      dayTasks={sampleDayTasks}
      quote={sampleQuote}
    />
  );
}
