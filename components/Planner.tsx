"use client";

import clsx from "clsx";
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { clickBubble } from "@/lib/domain/bubbles";
import { addDaysToDate, weekDates } from "@/lib/domain/rollover";
import type { DayTaskView, WeekTaskView } from "@/lib/sample-planner";
import { Notes } from "./Notes";
import { Page, PageTitle, Section } from "./Page";
import { Quote } from "./Quote";
import { DayTaskRow, WeekTaskRow } from "./TaskRow";
import { TopBar } from "./TopBar";

const WEEK_SECTIONS = [
  { title: "Five Most Important Tasks of the Week", subtitle: "If these are the only tasks you completed during the week, you'd be satisfied", slots: [1, 2, 3, 4, 5] },
  { title: "Tasks of Secondary Importance", subtitle: "Do these only after you have completed the above tasks", slots: [6, 7, 8, 9, 10] },
  { title: "Additional Tasks", subtitle: "Do these only after you have completed the above tasks", slots: [11, 12] },
];

const DAY_SECTIONS = [
  { title: "Most Important Task of the Day", subtitle: "If this was the only thing you did today you'd be satisfied", slots: [1] },
  { title: "Secondary Tasks of Importance", subtitle: "Completion of these tasks will make the day even better", slots: [2, 3] },
  { title: "Additional Tasks", subtitle: "Do these only after you have completed the tasks above", slots: [4, 5] },
];

/** Two facing pages. Static phase: state is local only, nothing is saved yet. */
export function Planner({
  initialWeekStart,
  initialDate,
  weekTasks: initialWeekTasks,
  dayTasks: initialDayTasks,
  quote,
}: {
  initialWeekStart: string;
  initialDate: string;
  weekTasks: WeekTaskView[];
  dayTasks: DayTaskView[];
  quote: { text: string; author: string | null };
}) {
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [weekTasks, setWeekTasks] = useState(initialWeekTasks);
  const [dayTasks, setDayTasks] = useState(initialDayTasks);
  const [notes, setNotes] = useState("");
  const [weekOpen, setWeekOpen] = useState(false);

  const dates = weekDates(weekStart);
  const day = parseISO(selectedDate);

  function moveWeek(days: number) {
    const next = addDaysToDate(weekStart, days);
    setWeekStart(next);
    setSelectedDate(next);
  }
  const updateWeek = (slot: number, patch: Partial<WeekTaskView>) =>
    setWeekTasks((ts) => ts.map((t) => (t.slot === slot ? { ...t, ...patch } : t)));
  const updateDay = (slot: number, patch: (t: DayTaskView) => Partial<DayTaskView>) =>
    setDayTasks((ts) => ts.map((t) => (t.slot === slot ? { ...t, ...patch(t) } : t)));

  return (
    <main className="mx-auto max-w-[1400px] p-3 min-[900px]:p-5">
      <TopBar
        weekStart={weekStart}
        dates={dates}
        selectedDate={selectedDate}
        onPrevWeek={() => moveWeek(-7)}
        onNextWeek={() => moveWeek(7)}
        onSelectDate={setSelectedDate}
      />

      <div className="grid grid-cols-1 overflow-hidden bg-paper shadow-[0_4px_20px_rgba(0,0,0,0.06)] min-[900px]:grid-cols-2">
        <Page className="border-b-2 border-line min-[900px]:border-r-2 min-[900px]:border-b-0">
          <div className="flex items-center justify-between">
            <PageTitle>Weekly Planning</PageTitle>
            <button
              type="button"
              aria-expanded={weekOpen}
              aria-controls="week-tasks"
              onClick={() => setWeekOpen((o) => !o)}
              className="text-xs uppercase tracking-[1px] text-muted hover:text-ink min-[900px]:hidden"
            >
              {weekOpen ? "Hide ▴" : "Show ▾"}
            </button>
          </div>
          <p className="mb-8 text-[0.85rem] text-muted">
            Week of {format(parseISO(weekStart), "dd / MM / yyyy")}
          </p>

          <div id="week-tasks" className={clsx(!weekOpen && "hidden", "min-[900px]:block")}>
            {WEEK_SECTIONS.map((s) => (
              <Section key={s.title} title={s.title} subtitle={s.subtitle}>
                {s.slots.map((slot) => {
                  const t = weekTasks.find((w) => w.slot === slot)!;
                  return (
                    <WeekTaskRow
                      key={slot}
                      slot={slot}
                      title={t.title}
                      isDone={t.isDone}
                      onTitleChange={(title) => updateWeek(slot, { title })}
                      onToggleDone={() => updateWeek(slot, { isDone: !t.isDone })}
                    />
                  );
                })}
              </Section>
            ))}
          </div>
        </Page>

        <Page>
          <div className="flex items-start justify-between">
            <PageTitle>Daily</PageTitle>
            <div className="text-right text-[0.85rem] text-muted">
              <p>Date {format(day, "dd / MM / yyyy")}</p>
              <p className="text-xs uppercase tracking-[1px]">{format(day, "EEEE")}</p>
            </div>
          </div>

          <Quote text={quote.text} author={quote.author} />

          {DAY_SECTIONS.map((s) => (
            <Section key={s.title} title={s.title} subtitle={s.subtitle}>
              {s.slots.map((slot) => {
                const t = dayTasks.find((d) => d.slot === slot)!;
                return (
                  <DayTaskRow
                    key={slot}
                    {...t}
                    onTitleChange={(title) => updateDay(slot, () => ({ title }))}
                    onBubbleClick={(n) =>
                      updateDay(slot, (x) => ({ completedPomodoros: clickBubble(x.completedPomodoros, n) }))
                    }
                    onToggleDone={() => updateDay(slot, (x) => ({ isDone: !x.isDone }))}
                  />
                );
              })}
            </Section>
          ))}

          <Notes value={notes} onChange={setNotes} />
        </Page>
      </div>
    </main>
  );
}
