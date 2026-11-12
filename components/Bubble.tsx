import type { BubbleShape } from "@/lib/theme";

const STAR = "M10 1.8l2.5 5.3 5.8.7-4.3 4 1.1 5.8L10 14.8l-5.1 2.8 1.1-5.8-4.3-4 5.8-.7z";

/** SVG glyph per theme shape (docs/ui/DESIGN.md §6). */
function Glyph({ shape }: { shape: BubbleShape }) {
  if (shape === "star") {
    return (
      <>
        <path className="empty" d={STAR} />
        <path className="fill" d={STAR} />
        <circle className="ring" cx="10" cy="10" r="8" />
      </>
    );
  }
  if (shape === "fly") {
    return (
      <>
        <circle className="empty" cx="10" cy="10" r="5" />
        <circle className="fill halo" cx="10" cy="10" r="9" />
        <circle className="fill" cx="10" cy="10" r="4.5" />
        <circle className="ring" cx="10" cy="10" r="8" />
      </>
    );
  }
  return (
    <>
      <circle className="empty" cx="10" cy="10" r="7.5" />
      <circle className="fill" cx="10" cy="10" r="7.5" />
      <circle className="fill shine" cx="7.6" cy="7.4" r="2" />
      <circle className="ring" cx="10" cy="10" r="8" />
    </>
  );
}

/**
 * One pomodoro bubble (`.bub` in themes.css): 38×44 hit area, 22px glyph.
 * `pop` = this bubble was just filled → ignite + ring (the parent remounts it via key to replay).
 * tabIndex −1: focus stays on the row, keys 1–5 click the bubbles (phase 6 decision).
 */
export function Bubble({
  n,
  taskTitle,
  shape,
  lit,
  pop,
  onClick,
}: {
  n: number;
  taskTitle: string;
  shape: BubbleShape;
  lit: boolean;
  pop: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="bub"
      data-shape={shape}
      data-pop={pop ? "true" : undefined}
      aria-pressed={lit}
      aria-label={`Pomodoro ${n} for ${taskTitle}`}
      onClick={onClick}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <Glyph shape={shape} />
      </svg>
    </button>
  );
}
