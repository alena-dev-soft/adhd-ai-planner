import { format, parseISO } from "date-fns";
import Link from "next/link";
import type { DayReview } from "@/lib/domain/review";
import { plannerHref } from "@/lib/domain/selection";
import { TaskList } from "./ReviewTaskList";

export { TaskList };

/** One day of the weekly review: done / not done / highlight / rating / pomodoros. */
export function ReviewCard({ day }: { day: DayReview }) {
  const date = parseISO(day.date);
  return (
    <article className="rounded-[calc(var(--radius)/2)] border border-line p-5">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="head text-base">
          <Link href={plannerHref(day.date)} className="decoration-accent underline-offset-4 hover:underline">
            {format(date, "EEEE, MMM d")}
          </Link>
        </h2>
        {day.rating !== null && (
          <span className="font-head text-base tabular-nums text-accent">
            {day.rating}
            <span className="text-muted"> / 10</span>
          </span>
        )}
      </header>

      {!day.hasData ? (
        <p className="sub mt-2">Nothing written down.</p>
      ) : (
        <>
          <p className="mt-1 text-[15px] text-muted">
            {day.done.length} done · {day.notDone.length} not done · {day.pomodorosDone}
            {day.pomodorosTarget > 0 && ` of ${day.pomodorosTarget}`} pomodoros
            {!day.closed && " · not closed"}
          </p>
          <TaskList title="What got done" tasks={day.done} done kind="day" />
          <TaskList title="What didn't get done" tasks={day.notDone} done={false} kind="day" />
          {day.highlight && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className="head mb-2 text-sm">Highlight</h3>
              <p className="text-[17px] whitespace-pre-line italic leading-relaxed">{day.highlight}</p>
            </div>
          )}
        </>
      )}
    </article>
  );
}
