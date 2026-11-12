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
import type { BubblePop } from "./Bubbles";
import { DayTaskRow, WeekTaskRow } from "./TaskRow";
import { Header, WeekNav } from "./TopBar";
import { useTheme } from "./ThemeProvider";
import { slotGroups } from "@/lib/theme";
import { useSaver, type SaveStatus } from "@/lib/use-saver";

const NOTES_DEBOUNCE_MS = 800;

const STATUS_TEXT: Record<SaveStatus, string> = {
  idle: "",
  saving: "saving…",
  saved: "saved",
  error: "not saved",
};

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
  const { theme } = useTheme();

  // Animation triggers: UI-only, never saved, never set on load.
  // lastPop = the bubble a click just filled (taskId `d{slot}`); n bumps on every pop so the key replays it.
  const [lastPop, setLastPop] = useState<(BubblePop & { taskId: string }) | null>(null);
  // lastSpark = the row (`d{slot}` / `w{slot}`) the user just ticked to done.
  const [lastSpark, setLastSpark] = useState<string | null>(null);
  const markSpark = (rowId: string, isDone: boolean) =>
    setLastSpark((cur) => (isDone ? rowId : cur === rowId ? null : cur));

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

  const donePomodoros = dayTasks.reduce((sum, t) => sum + t.completedPomodoros, 0);

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-8">
      <Header
        weekStart={weekStart}
        selectedDate={selectedDate}
        today={today}
        done={donePomodoros}
        target={plannedPomodoros}
        status={
          <span role="status" className={clsx("text-sm", status === "error" ? "text-ink" : "text-muted")}>
            {STATUS_TEXT[status]}
          </span>
        }
      />
      <WeekNav
        weekStart={weekStart}
        dates={dates}
        selectedDate={selectedDate}
        today={today}
        prevWeekHref={prevWeekHref}
        nextWeekHref={nextWeekHref}
      />

      {/* 460 + 560 + 24 gap: side by side from ~1092px viewport, stacked (week first) below. */}
      <div className="flex flex-wrap items-start gap-6">
        <Page label="Week" className="flex-[1_1_460px]">
          <div className="flex items-center justify-between gap-4">
            <PageTitle>{theme.weekPageTitle}</PageTitle>
            <button
              type="button"
              aria-expanded={weekOpen}
              aria-controls="week-tasks"
              onClick={() => setWeekOpen((o) => !o)}
              className="btn ghost shrink-0 whitespace-nowrap px-3! min-[1092px]:hidden"
            >
              {weekOpen ? "Hide ▴" : "Show ▾"}
            </button>
          </div>

          <div
            id="week-tasks"
            className={clsx(!weekOpen && "hidden", "flex-col gap-[22px] min-[1092px]:flex", weekOpen && "flex")}
          >
            {slotGroups(theme, "week").map((s) => (
              <Section key={s.slots[0]} title={s.label} subtitle={s.subtitle}>
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
                      spark={lastSpark === `w${slot}`}
                      onToggleDone={() => {
                        const isDone = !t.isDone;
                        markSpark(`w${slot}`, isDone);
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

        <Page label="Day" className="flex-[1_1_560px]">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="head text-xl leading-snug">{format(day, "d MMMM yyyy")}</h2>
            <p className="head text-sm text-muted">{format(day, "EEEE")}</p>
          </div>

          {dayData.quote && <Quote text={dayData.quote.text} author={dayData.quote.author} />}

          {slotGroups(theme, "day").map((s) => (
            <Section key={s.slots[0]} title={s.label} subtitle={s.subtitle}>
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
                    pop={lastPop?.taskId === `d${slot}` ? lastPop : null}
                    spark={lastSpark === `d${slot}`}
                    onBubbleClick={(n) => {
                      const completedPomodoros = clickBubble(t.completedPomodoros, n);
                      const taskId = `d${slot}`;
                      setLastPop((cur) =>
                        completedPomodoros > t.completedPomodoros
                          ? { taskId, index: n, n: (cur?.n ?? 0) + 1, shape: theme.bubbleShape }
                          : cur?.taskId === taskId
                            ? null
                            : cur,
                      );
                      updateDay(slot, { completedPomodoros });
                      save(() => saveDayTask({ dayId, slot, completedPomodoros }));
                    }}
                    onToggleDone={() => {
                      const isDone = !t.isDone;
                      markSpark(`d${slot}`, isDone);
                      updateDay(slot, { isDone });
                      save(() => saveDayTask({ dayId, slot, isDone }));
                    }}
                  />
                );
              })}
            </Section>
          ))}

          <p aria-live="polite" className="-mt-2 text-sm italic text-ink empty:-mt-[22px]">
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
