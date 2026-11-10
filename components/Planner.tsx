"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveDayTask, saveNotes, saveWeekTask } from "@/app/actions";
import { format, parseISO } from "date-fns";
import { fetchEstimate } from "@/lib/ai/fetch-estimate";
import { clickBubble } from "@/lib/domain/bubbles";
import { dayCategory } from "@/lib/domain/category";
import { overload, totalTarget } from "@/lib/domain/overload";
import { estimatePatch, manualTargetPatch } from "@/lib/domain/target";
import { weekDates } from "@/lib/domain/rollover";
import type { DayTaskView, DayView, WeekTaskView } from "@/lib/domain/views";
import { CloseDay } from "./CloseDay";
import { Notes } from "./Notes";
import { Page, PageTitle, Section } from "./Page";
import { Quote } from "./Quote";
import { DayTaskRow, WeekTaskRow } from "./TaskRow";
import { TopBar } from "./TopBar";
import { useSaver, type SaveStatus } from "@/lib/use-saver";

const NOTES_DEBOUNCE_MS = 800;

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "",
  saving: "saving…",
  saved: "saved",
  error: "not saved",
};

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

/**
 * Two facing pages. Week and day come from the URL (server-loaded). Every edit
 * autosaves through Server Actions: titles on blur / Enter, checkboxes and
 * bubbles immediately, notes after an 800ms pause.
 */
export function Planner({
  weekStart,
  selectedDate,
  today,
  prevWeekHref,
  nextWeekHref,
  weekId,
  dayId,
  weekTasks: initialWeekTasks,
  dayTasks: initialDayTasks,
  day: dayData,
}: {
  weekStart: string;
  selectedDate: string;
  today: string;
  prevWeekHref: string;
  nextWeekHref: string;
  weekId: string;
  dayId: string;
  weekTasks: WeekTaskView[];
  dayTasks: DayTaskView[];
  day: DayView;
}) {
  const [weekTasks, setWeekTasks] = useState(initialWeekTasks);
  const [dayTasks, setDayTasks] = useState(initialDayTasks);
  const [notes, setNotes] = useState(dayData.notes);
  const [weekOpen, setWeekOpen] = useState(false);

  const dates = weekDates(weekStart);
  const day = parseISO(selectedDate);

  const updateWeek = (slot: number, patch: Partial<WeekTaskView>) =>
    setWeekTasks((ts) => ts.map((t) => (t.slot === slot ? { ...t, ...patch } : t)));
  const updateDay = (slot: number, patch: Partial<DayTaskView>) =>
    setDayTasks((ts) => ts.map((t) => (t.slot === slot ? { ...t, ...patch } : t)));

  const { status, save } = useSaver();

  // Last saved titles per slot, so blur only saves real changes.
  const savedWeekTitles = useRef(new Map(initialWeekTasks.map((t) => [t.slot, t.title.trim()])));
  const savedDayTitles = useRef(new Map(initialDayTasks.map((t) => [t.slot, t.title.trim()])));

  const commitWeekTitle = (slot: number, title: string) => {
    const trimmed = title.trim();
    if (savedWeekTitles.current.get(slot) === trimmed) return;
    savedWeekTitles.current.set(slot, trimmed);
    save(() => saveWeekTask({ weekId, slot, title }));
  };
  // Per-slot counter: a newer title or a manual target makes a pending AI answer stale.
  const estimateSeq = useRef(new Map<number, number>());
  const bumpEstimate = (slot: number) => {
    const seq = (estimateSeq.current.get(slot) ?? 0) + 1;
    estimateSeq.current.set(slot, seq);
    return seq;
  };

  /** Ask the AI for a target after the title is saved. Never blocks, never shows errors. */
  const requestEstimate = async (slot: number, title: string) => {
    const seq = bumpEstimate(slot);
    const current = dayTasks.find((t) => t.slot === slot)!;
    const otherTasks = dayTasks
      .filter((t) => t.slot !== slot && t.title.trim())
      .map((t) => `${t.title.trim()}${t.targetPomodoros ? ` (${t.targetPomodoros} pomodoros)` : ""}`);
    const r = await fetchEstimate({ title, category: dayCategory(slot), otherTasks });
    if (!r || estimateSeq.current.get(slot) !== seq) return;
    const patch = estimatePatch(current, r);
    updateDay(slot, patch);
    save(() => saveDayTask({ dayId, slot, ...patch }));
  };

  const commitDayTitle = (slot: number, title: string) => {
    const trimmed = title.trim();
    if (savedDayTitles.current.get(slot) === trimmed) return;
    savedDayTitles.current.set(slot, trimmed);
    if (!trimmed) {
      // Slot emptied: the old estimate no longer belongs to anything.
      bumpEstimate(slot);
      const cleared = { targetPomodoros: null, targetIsManual: false, feasibility: null, feasibilityNote: null };
      updateDay(slot, cleared);
      save(() => saveDayTask({ dayId, slot, title, ...cleared }));
      return;
    }
    save(() => saveDayTask({ dayId, slot, title }));
    void requestEstimate(slot, trimmed);
  };

  const commitTarget = (slot: number, targetPomodoros: number | null) => {
    bumpEstimate(slot);
    const patch = manualTargetPatch(targetPomodoros);
    updateDay(slot, patch);
    save(() => saveDayTask({ dayId, slot, ...patch }));
  };

  const plannedPomodoros = totalTarget(dayTasks.map((t) => t.targetPomodoros));
  const load = overload(dayTasks.map((t) => t.targetPomodoros));

  // Notes: debounce 800ms; flush on blur and when leaving the day.
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotes = useRef<string | null>(null);
  const flushNotes = useCallback(() => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = null;
    const value = pendingNotes.current;
    if (value === null) return;
    pendingNotes.current = null;
    save(() => saveNotes({ dayId, notes: value }));
  }, [dayId, save]);
  const changeNotes = (value: string) => {
    setNotes(value);
    pendingNotes.current = value;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(flushNotes, NOTES_DEBOUNCE_MS);
  };
  useEffect(() => flushNotes, [flushNotes]);

  return (
    <main className="mx-auto max-w-[1400px] p-3 min-[900px]:p-5">
      <TopBar
        weekStart={weekStart}
        dates={dates}
        selectedDate={selectedDate}
        today={today}
        prevWeekHref={prevWeekHref}
        nextWeekHref={nextWeekHref}
        status={
          <span
            role="status"
            className={clsx("min-w-16 text-right text-xs", status === "error" ? "text-warm-text" : "text-muted-text")}
          >
            {STATUS_TEXT[status]}
          </span>
        }
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
              className="text-xs uppercase tracking-[1px] text-muted-text hover:text-ink min-[900px]:hidden"
            >
              {weekOpen ? "Hide ▴" : "Show ▾"}
            </button>
          </div>
          <p className="mb-8 text-[0.85rem] text-muted-text">
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
                      inputId={`week-task-${slot}`}
                      nextInputId={slot < 12 ? `week-task-${slot + 1}` : undefined}
                      onTitleChange={(title) => updateWeek(slot, { title })}
                      onTitleCommit={() => commitWeekTitle(slot, t.title)}
                      onToggleDone={() => {
                        const isDone = !t.isDone;
                        updateWeek(slot, { isDone });
                        save(() => saveWeekTask({ weekId, slot, isDone }));
                      }}
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
            <div className="text-right text-[0.85rem] text-muted-text">
              <p>Date {format(day, "dd / MM / yyyy")}</p>
              <p className="text-xs uppercase tracking-[1px]">{format(day, "EEEE")}</p>
            </div>
          </div>

          {dayData.quote && <Quote text={dayData.quote.text} author={dayData.quote.author} />}

          {DAY_SECTIONS.map((s) => (
            <Section key={s.title} title={s.title} subtitle={s.subtitle}>
              {s.slots.map((slot) => {
                const t = dayTasks.find((d) => d.slot === slot)!;
                return (
                  <DayTaskRow
                    key={slot}
                    {...t}
                    inputId={`day-task-${slot}`}
                    nextInputId={slot < 5 ? `day-task-${slot + 1}` : undefined}
                    onTitleChange={(title) => updateDay(slot, { title })}
                    onTitleCommit={() => commitDayTitle(slot, t.title)}
                    onTargetCommit={(n) => commitTarget(slot, n)}
                    onBubbleClick={(n) => {
                      const completedPomodoros = clickBubble(t.completedPomodoros, n);
                      updateDay(slot, { completedPomodoros });
                      save(() => saveDayTask({ dayId, slot, completedPomodoros }));
                    }}
                    onToggleDone={() => {
                      const isDone = !t.isDone;
                      updateDay(slot, { isDone });
                      save(() => saveDayTask({ dayId, slot, isDone }));
                    }}
                  />
                );
              })}
            </Section>
          ))}

          <p aria-live="polite" className={clsx("text-xs italic text-warm-text", load !== "yes" && "-mt-6 mb-8")}>
            {load === "warning" && `${plannedPomodoros} pomodoros planned — the shift is getting tight.`}
            {load === "no" && `${plannedPomodoros} pomodoros planned — more than one shift holds (15).`}
          </p>

          <Notes value={notes} onChange={changeNotes} onBlur={flushNotes} />

          <CloseDay
            dayId={dayId}
            highlight={dayData.highlight}
            whatWorked={dayData.whatWorked}
            whatDidnt={dayData.whatDidnt}
            rating={dayData.rating}
            closedAt={dayData.closedAt}
            save={save}
          />
        </Page>
      </div>
    </main>
  );
}
