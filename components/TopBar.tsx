import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { plannerHref } from "@/lib/domain/selection";

/** ‹ Week of DD MMM › · Mon–Sun selector · link to Review. */
export function TopBar({
  weekStart,
  dates,
  selectedDate,
  today,
  prevWeekHref,
  nextWeekHref,
  status,
}: {
  weekStart: string;
  dates: string[];
  selectedDate: string;
  today: string;
  prevWeekHref: string;
  nextWeekHref: string;
  status?: ReactNode;
}) {
  const arrow = "px-2 text-lg leading-none text-muted-text hover:text-ink";
  return (
    <nav className="mb-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm">
      <div className="flex items-center gap-1">
        <Link href={prevWeekHref} aria-label="Previous week" className={arrow}>
          ‹
        </Link>
        <span className="text-xs font-light uppercase tracking-[1px]">
          Week of {format(parseISO(weekStart), "dd MMM")}
        </span>
        <Link href={nextWeekHref} aria-label="Next week" className={arrow}>
          ›
        </Link>
      </div>

      <div className="order-last flex w-full justify-between gap-1 min-[600px]:order-none min-[600px]:w-auto">
        {dates.map((date) => {
          const d = parseISO(date);
          const selected = date === selectedDate;
          return (
            <Link
              key={date}
              href={plannerHref(date)}
              aria-current={selected ? "date" : undefined}
              title={date === today ? "Today" : undefined}
              className={clsx(
                "flex min-w-10 flex-col items-center rounded-[3px] border px-2 py-0.5 text-xs leading-tight",
                selected ? "border-skyblue bg-skyblue text-ink" : "border-line hover:border-skyblue",
                date === today && !selected && "underline decoration-skyblue underline-offset-2",
              )}
            >
              <span>{format(d, "EEE")}</span>
              <span className={clsx("tabular-nums text-[0.7rem]", !selected && "text-ink/70")}>{format(d, "d")}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-4">
        {status}
        <Link
          href={`/review?week=${weekStart}`}
          className="text-xs uppercase tracking-[1px] underline decoration-skyblue underline-offset-4"
        >
          Review
        </Link>
      </div>
    </nav>
  );
}
