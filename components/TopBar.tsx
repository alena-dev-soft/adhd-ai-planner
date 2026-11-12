"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { signOut } from "@/app/login/actions";
import { plannerHref } from "@/lib/domain/selection";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTheme } from "./ThemeProvider";

/**
 * Header (DESIGN §3): "Planner" + "{done} / {target} {unit} gathered today" on the left;
 * theme switcher, Review link and sign out on the right (Q6). The subline counts the
 * selected day; it says "today" only when that day is today (Q3).
 */
export function Header({
  weekStart,
  selectedDate,
  today,
  done,
  target,
  status,
}: {
  weekStart: string;
  selectedDate: string;
  today: string;
  done: number;
  target: number;
  status?: ReactNode;
}) {
  const { theme } = useTheme();
  const when = selectedDate === today ? "today" : `on ${format(parseISO(selectedDate), "EEE d")}`;
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="font-head text-[26px] leading-tight font-medium tracking-[3px]">Planner</h1>
        <p className="flex flex-wrap items-baseline gap-x-3 text-muted">
          <span>
            {done} / {target} {theme.pomodoroUnit} gathered {when}
          </span>
          {status}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <ThemeSwitcher />
        <Link href={`/review?week=${weekStart}`} className="btn ghost inline-flex items-center px-3!">
          Review
        </Link>
        <form action={signOut}>
          <button type="submit" className="btn ghost px-3!">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}

/**
 * Nav row: ‹ · "Week of 9 November" · › and the Mon–Sun pills. Pills are links
 * (URL state), so the selected one uses aria-current="date" (Q2); globals.css gives
 * it the same look as .pill[aria-pressed="true"].
 */
export function WeekNav({
  weekStart,
  dates,
  selectedDate,
  today,
  prevWeekHref,
  nextWeekHref,
}: {
  weekStart: string;
  dates: string[];
  selectedDate: string;
  today: string;
  prevWeekHref: string;
  nextWeekHref: string;
}) {
  const arrow = "pill inline-flex items-center justify-center text-lg!";
  return (
    <nav aria-label="Week" className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-2">
        <Link href={prevWeekHref} aria-label="Previous week" className={arrow}>
          ‹
        </Link>
        <span className="head min-w-44 text-center text-[15px]">
          Week of {format(parseISO(weekStart), "d MMMM")}
        </span>
        <Link href={nextWeekHref} aria-label="Next week" className={arrow}>
          ›
        </Link>
      </div>

      <ul className="grid w-full grid-cols-7 gap-1 min-[600px]:flex min-[600px]:w-auto min-[600px]:gap-1.5">
        {dates.map((date) => {
          const d = parseISO(date);
          const selected = date === selectedDate;
          const isToday = date === today;
          return (
            <li key={date}>
              <Link
                href={plannerHref(date)}
                aria-current={selected ? "date" : undefined}
                aria-label={`${format(d, "EEEE d MMMM")}${isToday ? " (today)" : ""}`}
                className="pill flex w-full flex-col items-center justify-center px-0! text-[13px]! leading-none min-[600px]:inline-flex min-[600px]:w-auto min-[600px]:flex-row min-[600px]:gap-1 min-[600px]:px-3! min-[600px]:text-sm!"
                data-today={isToday || undefined}
              >
                <span>{format(d, "EEE")}</span>
                <span className="tabular-nums">{format(d, "d")}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
