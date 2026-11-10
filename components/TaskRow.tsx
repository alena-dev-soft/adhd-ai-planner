import clsx from "clsx";
import { useState, type KeyboardEvent } from "react";
import type { Feasibility } from "@/lib/domain/overload";
import { Bubbles } from "./Bubbles";

export type { Feasibility };

const FEASIBILITY_MARK: Record<Feasibility, { mark: string; className: string; label: string }> = {
  yes: { mark: "✓", className: "text-sage", label: "Feasible" },
  warning: { mark: "⚠", className: "text-warm", label: "Tight" },
  no: { mark: "✕", className: "text-warm", label: "Too much" },
};

const titleInput =
  "min-w-0 flex-1 border-0 border-b border-line bg-transparent py-1 text-[0.95rem] outline-none focus:border-sage";
const checkbox = "size-[18px] shrink-0 cursor-pointer accent-sage";

/** Enter moves focus to the next slot (or leaves the last one); blur saves. */
function enterToNext(e: KeyboardEvent<HTMLInputElement>, nextId: string | undefined) {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  e.preventDefault();
  const next = nextId ? document.getElementById(nextId) : null;
  if (next) next.focus();
  else e.currentTarget.blur();
}

function SlotNumber({ slot }: { slot: number }) {
  return <span className="min-w-6 text-[0.9rem] tabular-nums text-muted">{slot}.</span>;
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
    <div className="mb-3 flex items-center gap-3">
      <SlotNumber slot={slot} />
      <input
        type="text"
        id={inputId}
        aria-label={`Week task ${slot}`}
        placeholder="Task"
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
        onKeyDown={(e) => enterToNext(e, nextInputId)}
        onBlur={() => onTitleCommit?.()}
        className={clsx(titleInput, isDone && "text-muted line-through")}
      />
      <input
        type="checkbox"
        aria-label={`Week task ${slot} done`}
        checked={isDone}
        onChange={() => onToggleDone?.()}
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
      className={clsx(box, "bg-transparent text-center outline-none focus:border-sage")}
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
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <div className="flex min-w-40 flex-1 items-center gap-3">
        <SlotNumber slot={slot} />
        <input
          type="text"
          id={inputId}
          aria-label={`Day task ${slot}`}
          placeholder="Task"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          onKeyDown={(e) => enterToNext(e, nextInputId)}
          onBlur={() => onTitleCommit?.()}
          className={clsx(titleInput, isDone && "text-muted line-through")}
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
        <p className="w-full pl-9 text-xs italic leading-snug text-muted">{feasibilityNote}</p>
      )}
    </div>
  );
}
