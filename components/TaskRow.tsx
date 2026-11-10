import clsx from "clsx";
import { Bubbles } from "./Bubbles";

export type Feasibility = "yes" | "warning" | "no";

const FEASIBILITY_MARK: Record<Feasibility, { mark: string; className: string; label: string }> = {
  yes: { mark: "✓", className: "text-sage", label: "Feasible" },
  warning: { mark: "⚠", className: "text-warm", label: "Tight" },
  no: { mark: "✕", className: "text-warm", label: "Too much" },
};

const titleInput =
  "min-w-0 flex-1 border-0 border-b border-line bg-transparent py-1 text-[0.95rem] outline-none focus:border-sage";
const checkbox = "size-[18px] shrink-0 cursor-pointer accent-sage";

function SlotNumber({ slot }: { slot: number }) {
  return <span className="min-w-6 text-[0.9rem] tabular-nums text-muted">{slot}.</span>;
}

/** Week page row: number · underline input · checkbox. */
export function WeekTaskRow({
  slot,
  title,
  isDone,
  onTitleChange,
  onToggleDone,
}: {
  slot: number;
  title: string;
  isDone: boolean;
  onTitleChange?: (title: string) => void;
  onToggleDone?: () => void;
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <SlotNumber slot={slot} />
      <input
        type="text"
        aria-label={`Week task ${slot}`}
        placeholder="Task"
        value={title}
        onChange={(e) => onTitleChange?.(e.target.value)}
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
  onTitleChange,
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
  onTitleChange?: (title: string) => void;
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
          aria-label={`Day task ${slot}`}
          placeholder="Task"
          value={title}
          onChange={(e) => onTitleChange?.(e.target.value)}
          className={clsx(titleInput, isDone && "text-muted line-through")}
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <CountBox value={targetPomodoros} label="Target pomodoros" />
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
    </div>
  );
}
