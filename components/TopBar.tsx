import clsx from "clsx";
import Link from "next/link";
import { format, parseISO } from "date-fns";

/** ‹ Week of DD MMM › · Mon–Sun selector · link to Review. */
export function TopBar({
  weekStart,
  dates,
  selectedDate,
  onPrevWeek,
  onNextWeek,
  onSelectDate,
}: {
  weekStart: string;
  dates: string[];
  selectedDate: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onSelectDate?: (date: string) => void;
}) {
  const arrow = "px-2 text-lg leading-none text-muted hover:text-ink";
  return (
    <nav className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm">
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous week" onClick={onPrevWeek} className={arrow}>
          ‹
        </button>
        <span className="text-xs font-light uppercase tracking-[1px]">
          Week of {format(parseISO(weekStart), "dd MMM")}
        </span>
        <button type="button" aria-label="Next week" onClick={onNextWeek} className={arrow}>
          ›
        </button>
      </div>

      <div className="order-last flex w-full justify-between gap-1 min-[600px]:order-none min-[600px]:w-auto">
        {dates.map((date) => {
          const d = parseISO(date);
          const selected = date === selectedDate;
          return (
            <button
              key={date}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectDate?.(date)}
              className={clsx(
                "flex min-w-10 flex-col items-center rounded-[3px] border px-2 py-0.5 text-xs leading-tight",
                selected ? "border-skyblue bg-skyblue text-ink" : "border-line hover:border-skyblue",
              )}
            >
              <span>{format(d, "EEE")}</span>
              <span className="tabular-nums text-[0.7rem] text-ink/70">{format(d, "d")}</span>
            </button>
          );
        })}
      </div>

      <Link
        href={`/review?week=${weekStart}`}
        className="text-xs uppercase tracking-[1px] underline decoration-skyblue underline-offset-4"
      >
        Review
      </Link>
    </nav>
  );
}
