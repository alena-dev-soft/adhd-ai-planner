import { format, parseISO } from "date-fns";
import Link from "next/link";
import { ReviewCard, TaskList } from "@/components/ReviewCard";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import type { WeekReview } from "@/lib/domain/review";
import { addDaysToDate } from "@/lib/domain/rollover";

const reviewHref = (monday: string) => `/review?week=${monday}`;

/** Weekly review screen (themed: .page, .head, .sub; done = accent, not done = muted). */
export function ReviewView({ review, weekStart }: { review: WeekReview; weekStart: string }) {
  const { totals } = review;
  const weekTaskCount = review.weekTasksDone.length + review.weekTasksNotDone.length;

  const arrow = "pill inline-flex items-center justify-center text-lg!";
  const stat = "flex flex-col";
  const statLabel = "head text-xs text-muted";

  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-6 px-4 py-6 min-[600px]:px-6 min-[600px]:py-8">
      <nav aria-label="Review" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <Link href={reviewHref(addDaysToDate(weekStart, -7))} aria-label="Previous week" className={arrow}>
            ‹
          </Link>
          <span className="head min-w-44 text-center text-[15px]">
            Week of {format(parseISO(weekStart), "d MMMM")}
          </span>
          <Link href={reviewHref(addDaysToDate(weekStart, 7))} aria-label="Next week" className={arrow}>
            ›
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeSwitcher />
          <Link href={`/?week=${weekStart}`} className="btn ghost inline-flex items-center px-3!">
            Planner
          </Link>
        </div>
      </nav>

      <div className="page p-5 min-[600px]:p-8">
        <h1 className="head text-[26px] leading-tight tracking-[3px]!">Weekly Review</h1>
        <p className="sub mt-1">
          {format(parseISO(weekStart), "d MMM")} – {format(parseISO(addDaysToDate(weekStart, 6)), "d MMM yyyy")}
        </p>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 text-[18px]">
          <div className={stat}>
            <dt className={statLabel}>Day tasks done</dt>
            <dd className="tabular-nums">
              <span className="text-accent">{totals.done}</span> of {totals.done + totals.notDone}
            </dd>
          </div>
          <div className={stat}>
            <dt className={statLabel}>Pomodoros</dt>
            <dd className="tabular-nums">
              <span className="text-accent">{totals.pomodorosDone}</span>
              {totals.pomodorosTarget > 0 && ` of ${totals.pomodorosTarget} planned`}
            </dd>
          </div>
          <div className={stat}>
            <dt className={statLabel}>Average rating</dt>
            <dd className="tabular-nums">
              {totals.averageRating === null ? "—" : `${Math.round(totals.averageRating * 10) / 10} / 10`}
            </dd>
          </div>
          <div className={stat}>
            <dt className={statLabel}>Weekly tasks done</dt>
            <dd className="tabular-nums">
              <span className="text-accent">{review.weekTasksDone.length}</span> of {weekTaskCount}
            </dd>
          </div>
        </dl>

        {weekTaskCount === 0 ? (
          <p className="sub mt-6">No weekly tasks planned.</p>
        ) : (
          <div className="mt-2 grid gap-x-10 min-[600px]:grid-cols-2">
            <TaskList title="Weekly tasks done" tasks={review.weekTasksDone} done kind="week" />
            <TaskList title="Weekly tasks not done" tasks={review.weekTasksNotDone} done={false} kind="week" />
          </div>
        )}

        {review.days.some((d) => d.hasData) ? (
          <div className="mt-8 grid gap-5">
            {review.days.map((day) => (
              <ReviewCard key={day.date} day={day} />
            ))}
          </div>
        ) : (
          <p className="sub mt-8 border-t border-line pt-6">
            These pages are still blank. Plan a day and close it, and it will show up here.
          </p>
        )}
      </div>
    </main>
  );
}
