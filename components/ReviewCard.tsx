import { format, parseISO } from "date-fns";
import Link from "next/link";
import type { DayReview, ReviewTask } from "@/lib/domain/review";
import { plannerHref } from "@/lib/domain/selection";

const sectionTitle = "mb-2 text-[0.75rem] font-light uppercase tracking-[1px]";

/** Done (sage ✓) or not done (muted ✗) task list; nothing when empty. */
export function TaskList({ title, tasks, done }: { title: string; tasks: ReviewTask[]; done: boolean }) {
  if (tasks.length === 0) return null;
  return (
    <div className="mt-4 border-t border-line pt-4">
      <h3 className={sectionTitle}>{title}</h3>
      <ul className="text-[0.9rem] leading-relaxed">
        {tasks.map((t) => (
          <li key={t.slot} className={done ? "text-ink" : "text-muted-text"}>
            <span aria-hidden className={done ? "text-sage-text" : undefined}>
              {done ? "✓" : "✗"}
            </span>{" "}
            <span className="sr-only">{done ? "Done: " : "Not done: "}</span>
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One day of the weekly review: done / not done / highlight / rating / pomodoros. */
export function ReviewCard({ day }: { day: DayReview }) {
  const date = parseISO(day.date);
  return (
    <article className="border border-line bg-paper p-5">
      <header className="flex items-baseline justify-between gap-4">
        <h2 className="text-[0.9rem]">
          <Link href={plannerHref(day.date)} className="hover:underline decoration-skyblue underline-offset-4">
            {format(date, "EEEE, MMM d")}
          </Link>
        </h2>
        {day.rating !== null && (
          <span className="text-[0.9rem] tabular-nums">
            {day.rating}
            <span className="text-muted-text"> / 10</span>
          </span>
        )}
      </header>

      {!day.hasData ? (
        <p className="mt-2 text-xs italic text-muted-text">Nothing written down.</p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-text">
            {day.done.length} done · {day.notDone.length} not done · {day.pomodorosDone}
            {day.pomodorosTarget > 0 && ` of ${day.pomodorosTarget}`} pomodoros
            {!day.closed && " · not closed"}
          </p>
          <TaskList title="What got done" tasks={day.done} done />
          <TaskList title="What didn't get done" tasks={day.notDone} done={false} />
          {day.highlight && (
            <div className="mt-4 border-t border-line pt-4">
              <h3 className={sectionTitle}>Highlight</h3>
              <p className="whitespace-pre-line text-[0.9rem] italic leading-relaxed">{day.highlight}</p>
            </div>
          )}
        </>
      )}
    </article>
  );
}
