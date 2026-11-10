import { format, parseISO } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReviewCard, TaskList } from "@/components/ReviewCard";
import { addDaysToDate } from "@/lib/domain/rollover";
import { resolveSelection } from "@/lib/domain/selection";
import { userToday } from "@/lib/planner";
import { loadReview } from "@/lib/review";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const reviewHref = (monday: string) => `/review?week=${monday}`;

/** Weekly review. `?week=YYYY-MM-DD` (any day, normalised to Monday); default: the current week. */
export default async function ReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect("/login");

  const params = await searchParams;
  const today = await userToday(supabase, userId);
  const { weekStart } = resolveSelection({ week: first(params.week) }, today);
  const review = await loadReview(supabase, userId, weekStart);
  const { totals } = review;
  const weekTaskCount = review.weekTasksDone.length + review.weekTasksNotDone.length;

  const arrow = "px-2 text-lg leading-none text-muted-text hover:text-ink";
  const stat = "flex flex-col";

  return (
    <main className="mx-auto max-w-[900px] p-3 min-[900px]:p-5">
      <nav className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-1">
          <Link href={reviewHref(addDaysToDate(weekStart, -7))} aria-label="Previous week" className={arrow}>
            ‹
          </Link>
          <span className="text-xs font-light uppercase tracking-[1px]">
            Week of {format(parseISO(weekStart), "dd MMM")}
          </span>
          <Link href={reviewHref(addDaysToDate(weekStart, 7))} aria-label="Next week" className={arrow}>
            ›
          </Link>
        </div>
        <Link
          href={`/?week=${weekStart}`}
          className="text-xs uppercase tracking-[1px] underline decoration-skyblue underline-offset-4"
        >
          Planner
        </Link>
      </nav>

      <div className="bg-paper p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] min-[900px]:p-10">
        <h1 className="text-2xl font-light uppercase tracking-[1px]">Weekly Review</h1>
        <p className="mt-1 text-[0.85rem] text-muted-text">
          {format(parseISO(weekStart), "dd MMM")} – {format(parseISO(addDaysToDate(weekStart, 6)), "dd MMM yyyy")}
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-[0.9rem]">
          <div className={stat}>
            <dt className="text-xs uppercase tracking-[1px] text-muted-text">Day tasks done</dt>
            <dd className="tabular-nums">
              {totals.done} of {totals.done + totals.notDone}
            </dd>
          </div>
          <div className={stat}>
            <dt className="text-xs uppercase tracking-[1px] text-muted-text">Pomodoros</dt>
            <dd className="tabular-nums">
              {totals.pomodorosDone}
              {totals.pomodorosTarget > 0 && ` of ${totals.pomodorosTarget} planned`}
            </dd>
          </div>
          <div className={stat}>
            <dt className="text-xs uppercase tracking-[1px] text-muted-text">Weekly tasks done</dt>
            <dd className="tabular-nums">
              {review.weekTasksDone.length} of {weekTaskCount}
            </dd>
          </div>
        </dl>

        {weekTaskCount === 0 ? (
          <p className="mt-6 text-xs italic text-muted-text">No weekly tasks planned.</p>
        ) : (
          <div className="mt-2 grid gap-x-10 min-[600px]:grid-cols-2">
            <TaskList title="Weekly tasks done" tasks={review.weekTasksDone} done />
            <TaskList title="Weekly tasks not done" tasks={review.weekTasksNotDone} done={false} />
          </div>
        )}

        {review.days.some((d) => d.hasData) ? (
          <div className="mt-8 grid gap-5">
            {review.days.map((day) => (
              <ReviewCard key={day.date} day={day} />
            ))}
          </div>
        ) : (
          <p className="mt-8 border-t border-line pt-6 text-sm italic text-muted-text">
            These pages are still blank. Plan a day and close it, and it will show up here.
          </p>
        )}
      </div>
    </main>
  );
}
