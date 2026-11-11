import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import type { Feasibility } from "@/lib/domain/overload";
import { Bubbles } from "./Bubbles";

export type { Feasibility };

const FEASIBILITY_MARK: Record<Feasibility, { mark: string; className: string; label: string }> = {
  yes: { mark: "✓", className: "text-sage-text", label: "Feasible" },
  warning: { mark: "⚠", className: "text-warm-text", label: "Tight" },
  no: { mark: "✕", className: "text-warm-text", label: "Too much" },
};

const titleInput =
  "min-w-0 flex-1 border-0 border-b border-line bg-transparent py-1 text-[0.95rem] outline-none focus:border-sage-text";
const checkbox = "size-[18px] shrink-0 cursor-pointer accent-sage";

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

const rowFocus = "rounded-sm outline-offset-4 focus:outline-2 focus:outline-sage-text";

function SlotNumber({ slot }: { slot: number }) {
  return <span className="min-w-6 text-[0.9rem] tabular-nums text-muted-text">{slot}.</span>;
}

/** Week page row: number · underline input · checkbox. */
export function WeekTaskRow({
  slot,
  title,
  isDone,
  inputId,
  nextInputId,
  onTitleChange,
  onTitleCommit,
  onToggleDone,
}: {
  slot: number;
  title: string;
  isDone: boolean;
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
      className={clsx("mb-3 flex items-center gap-3", rowFocus)}
    >
      <SlotNumber slot={slot} />
      <input
        type="text"
        id={inputId}
        aria-label={`Week task ${slot}`}
        placeholder="Task"
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
        onKeyDown={(e) => titleKeys(e, nextInputId)}
        onBlur={() => onTitleCommit?.()}
        className={clsx(titleInput, isDone && "text-muted-text line-through")}
      />
      <input
        type="checkbox"
        aria-label={`Week task ${slot} done`}
        checked={isDone}
        onChange={() => onToggleDone?.()}
        data-native-keys
        className={checkbox}
      />
    </div>
  );
}

/** A small square box holding a pomodoro count (target or actual). */
function CountBox({ value, label }: { value: number | null; label: string }) {
  return (
    <span
      aria-label={label}
      title={label}
      className="flex size-7 shrink-0 items-center justify-center border border-line text-[0.8rem] tabular-nums"
    >
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
  const box = "flex size-7 shrink-0 items-center justify-center border border-line text-[0.8rem] tabular-nums";
  const label = `Day task ${slot} target pomodoros`;

  if (draft === null) {
    return (
      <button
        type="button"
        aria-label={value ? `${label}: ${value}, click to change` : `${label}, click to set`}
        title="Target pomodoros"
        data-native-keys
        onClick={() => setDraft(value?.toString() ?? "")}
        className={clsx(box, "cursor-text hover:border-sage")}
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
      className={clsx(box, "bg-transparent text-center outline-none focus:border-sage-text")}
    />
  );
}

/**
 * Day page row: number · underline input · target box · 5 bubbles · actual box ·
 * checkbox · feasibility mark. On narrow pages the controls wrap below the title.
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
}: {
  slot: number;
  title: string;
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
      className={clsx("mb-3 flex flex-wrap items-center gap-x-3 gap-y-1", rowFocus)}
    >
      <div className="flex min-w-40 flex-1 items-center gap-3">
        <SlotNumber slot={slot} />
        <input
          type="text"
          id={inputId}
          aria-label={`Day task ${slot}`}
          placeholder="Task"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          onKeyDown={(e) => titleKeys(e, nextInputId)}
          onBlur={() => onTitleCommit?.()}
          className={clsx(titleInput, isDone && "text-muted-text line-through")}
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <TargetBox slot={slot} value={targetPomodoros} onCommit={onTargetCommit} />
        <Bubbles completed={completedPomodoros} onClick={onBubbleClick} />
        <CountBox value={completedPomodoros} label="Actual pomodoros" />
        <input
          type="checkbox"
          aria-label={`Day task ${slot} done`}
          checked={isDone}
          onChange={() => onToggleDone?.()}
          data-native-keys
          className={checkbox}
        />
        <span
          className={clsx("w-3 text-center text-xs", mark?.className)}
          title={feasibilityNote ?? mark?.label}
          aria-label={mark ? `${mark.label}${feasibilityNote ? `: ${feasibilityNote}` : ""}` : undefined}
        >
          {mark?.mark}
        </span>
      </div>
      {feasibilityNote && title.trim() && (
        <p className="w-full pl-9 text-xs italic leading-snug text-muted-text">{feasibilityNote}</p>
      )}
    </div>
  );
}
