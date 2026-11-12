import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import type { Feasibility } from "@/lib/domain/overload";
import { Bubbles, type BubblePop } from "./Bubbles";

export type { Feasibility };

const FEASIBILITY_MARK: Record<Feasibility, { mark: string; className: string; label: string }> = {
  yes: { mark: "✓", className: "text-accent", label: "Feasible" },
  warning: { mark: "⚠", className: "text-ink", label: "Tight" },
  no: { mark: "✕", className: "text-ink", label: "Too much" },
};

/** Borderless input inside `.title` (the strike-through ::after lives on the wrapper span). */
const titleInput = "w-full min-w-0 border-0 bg-transparent py-1 placeholder:italic";

/**
 * Title input keys: Enter moves focus to the next slot (or leaves the last one),
 * Escape steps out of the text to the row itself. Blur saves.
 */
function titleKeys(e: KeyboardEvent<HTMLInputElement>, nextId: string | undefined) {
  if (e.nativeEvent.isComposing) return;
  if (e.key === "Enter") {
    e.preventDefault();
    const next = nextId ? document.getElementById(nextId) : null;
    if (next) next.focus();
    else e.currentTarget.blur();
  } else if (e.key === "Escape") {
    e.preventDefault();
    e.currentTarget.closest<HTMLElement>("[data-row]")?.focus();
  }
}

/**
 * Row shortcuts. They only act when the row itself (or a bubble) has focus,
 * never while typing in a text field: Escape in the title → row focus, Enter on
 * the row → back to the title. Space toggles done, 1–5 click that bubble.
 * The checkbox and the target box keep their own native Space/Enter.
 */
function rowKeys(
  e: KeyboardEvent<HTMLDivElement>,
  { onToggleDone, onBubbleClick }: { onToggleDone?: () => void; onBubbleClick?: (n: number) => void },
) {
  const target = e.target as HTMLElement;
  if (e.altKey || e.ctrlKey || e.metaKey || target.matches("input:not([type=checkbox]), textarea")) return;
  if (target.matches("[data-native-keys]") && (e.key === " " || e.key === "Enter")) return;
  if (e.key === " ") {
    e.preventDefault();
    onToggleDone?.();
  } else if (e.key === "Enter") {
    e.preventDefault();
    e.currentTarget.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
  } else if (onBubbleClick && /^[1-5]$/.test(e.key)) {
    e.preventDefault();
    onBubbleClick(Number(e.key));
  }
}

const rowFocus = "outline-offset-4 focus:outline-2 focus:outline-glow";

function SlotNumber({ slot }: { slot: number }) {
  return <span className="num shrink-0 tabular-nums">{slot}</span>;
}

/**
 * `.chk` done button: circle + checkmark (drawn in by `.row[data-done]`) and the
 * 6-dot `.burst` (fired by `.row[data-spark]`, set only right after a click).
 */
function CheckButton({ label, isDone, onToggle }: { label: string; isDone: boolean; onToggle?: () => void }) {
  return (
    <button
      type="button"
      className="chk shrink-0"
      aria-label={label}
      aria-pressed={isDone}
      data-native-keys
      onClick={() => onToggle?.()}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle className="c" cx="12" cy="12" r="9" />
        <path className="m" d="M7.5 12.5l3 3 6-6.5" />
      </svg>
      <span className="burst" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </span>
    </button>
  );
}

function rowState(isDone: boolean, spark: boolean | undefined) {
  return {
    "data-done": isDone ? "true" : "false",
    "data-spark": spark ? "true" : undefined,
  } as const;
}

/** Week page row (`.row`): number · title · check. */
export function WeekTaskRow({
  slot,
  title,
  isDone,
  inputId,
  nextInputId,
  onTitleChange,
  onTitleCommit,
  onToggleDone,
  spark,
}: {
  slot: number;
  title: string;
  isDone: boolean;
  /** Fire the spark burst (only right after the user ticked this row). */
  spark?: boolean;
  inputId?: string;
  nextInputId?: string;
  onTitleChange?: (title: string) => void;
  onTitleCommit?: () => void;
  onToggleDone?: () => void;
}) {
  return (
    <div
      data-row
      tabIndex={-1}
      role="group"
      aria-label={`Week task ${slot}`}
      aria-keyshortcuts="Space Enter"
      onKeyDown={(e) => rowKeys(e, { onToggleDone })}
      {...rowState(isDone, spark)}
      className={clsx("row flex-nowrap!", rowFocus)}
    >
      <SlotNumber slot={slot} />
      <span className="title">
        <input
        type="text"
        id={inputId}
        aria-label={`Week task ${slot}`}
        placeholder="Task"
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
        onKeyDown={(e) => titleKeys(e, nextInputId)}
        onBlur={() => onTitleCommit?.()}
        className={titleInput}
      />
      </span>
      <CheckButton label={`Week task ${slot} done`} isDone={isDone} onToggle={onToggleDone} />
    </div>
  );
}

/** The `.box.actual` holding the completed pomodoro count. */
function CountBox({ value, label }: { value: number | null; label: string }) {
  return (
    <span aria-label={label} title={label} className="box actual shrink-0 tabular-nums">
      {value ?? ""}
    </span>
  );
}

/** Parse a typed target: empty → null (cleared), 1–99 → number, else undefined (invalid). */
function parseTarget(raw: string): number | null | undefined {
  const s = raw.trim();
  if (!s) return null;
  if (!/^\d{1,2}$/.test(s)) return undefined;
  const n = Number(s);
  return n >= 1 ? n : undefined;
}

/**
 * Target box. Click (or Enter/Space on focus) to type your own number; Enter or
 * blur saves, Escape cancels, an empty box clears the target.
 */
function TargetBox({
  slot,
  value,
  onCommit,
}: {
  slot: number;
  value: number | null;
  onCommit?: (n: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const box = "box shrink-0 tabular-nums";
  const label = `Day task ${slot} target pomodoros`;

  if (draft === null) {
    return (
      <button
        type="button"
        aria-label={value ? `${label}: ${value}, click to change` : `${label}, click to set`}
        title="Target pomodoros"
        data-native-keys
        onClick={() => setDraft(value?.toString() ?? "")}
        className={clsx(box, "box-hit cursor-text hover:border-accent")}
      >
        {value ?? ""}
      </button>
    );
  }

  const commit = () => {
    const n = parseTarget(draft);
    setDraft(null);
    if (n !== undefined && n !== value) onCommit?.(n);
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      aria-label={label}
      value={draft}
      maxLength={2}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          setDraft(null);
        }
      }}
      onBlur={commit}
      className={clsx(box, "bg-transparent text-center text-ink outline-none focus:border-accent")}
    />
  );
}

/**
 * Day page row (`.row`): number · title · feasibility mark · target box · 5 bubbles ·
 * actual box · check. On narrow pages the controls (bubbles…) wrap below the title.
 */
export function DayTaskRow({
  slot,
  title,
  targetPomodoros,
  completedPomodoros,
  isDone,
  feasibility,
  feasibilityNote,
  inputId,
  nextInputId,
  onTitleChange,
  onTitleCommit,
  onTargetCommit,
  onBubbleClick,
  onToggleDone,
  pop,
  spark,
}: {
  slot: number;
  title: string;
  /** The bubble just filled by a click (ignite + ring), if it belongs to this row. */
  pop?: BubblePop | null;
  /** Fire the spark burst (only right after the user ticked this row). */
  spark?: boolean;
  targetPomodoros: number | null;
  completedPomodoros: number;
  isDone: boolean;
  feasibility: Feasibility | null;
  feasibilityNote: string | null;
  inputId?: string;
  nextInputId?: string;
  onTitleChange?: (title: string) => void;
  onTitleCommit?: () => void;
  onTargetCommit?: (n: number | null) => void;
  onBubbleClick?: (n: number) => void;
  onToggleDone?: () => void;
}) {
  const mark = feasibility ? FEASIBILITY_MARK[feasibility] : null;
  return (
    <div
      data-row
      tabIndex={-1}
      role="group"
      aria-label={`Day task ${slot}`}
      aria-keyshortcuts="Space Enter 1 2 3 4 5"
      onKeyDown={(e) => rowKeys(e, { onToggleDone, onBubbleClick })}
      {...rowState(isDone, spark)}
      className={clsx("row", rowFocus)}
    >
      <div className="flex min-w-0 flex-[1_1_180px] items-center gap-2.5">
        <SlotNumber slot={slot} />
        <span className="title">
          <input
          type="text"
          id={inputId}
          aria-label={`Day task ${slot}`}
          placeholder="Task"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          onKeyDown={(e) => titleKeys(e, nextInputId)}
          onBlur={() => onTitleCommit?.()}
          className={titleInput}
        />
        </span>
        {mark && (
          <span
            className={clsx("w-3 shrink-0 text-center text-xs", mark.className)}
            title={feasibilityNote ?? mark.label}
            aria-label={`${mark.label}${feasibilityNote ? `: ${feasibilityNote}` : ""}`}
          >
            {mark.mark}
          </span>
        )}
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        <TargetBox slot={slot} value={targetPomodoros} onCommit={onTargetCommit} />
        <Bubbles
          completed={completedPomodoros}
          taskTitle={title.trim() || `day task ${slot}`}
          pop={pop}
          onClick={onBubbleClick}
        />
        <CountBox value={completedPomodoros} label="Actual pomodoros" />
        <CheckButton label={`Day task ${slot} done`} isDone={isDone} onToggle={onToggleDone} />
      </div>
      {feasibilityNote && title.trim() && (
        <p className="w-full pl-8 text-xs italic leading-snug text-muted">{feasibilityNote}</p>
      )}
    </div>
  );
}
