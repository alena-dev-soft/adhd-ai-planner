import clsx from "clsx";
import { BUBBLE_COUNT, bubbleDisplay } from "@/lib/domain/bubbles";

/** Five pomodoro bubbles; completed > 5 shows "+N" after the last bubble. */
export function Bubbles({
  completed,
  onClick,
}: {
  completed: number;
  onClick?: (n: number) => void;
}) {
  const { filled, overflow } = bubbleDisplay(completed);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: BUBBLE_COUNT }, (_, i) => {
        const n = i + 1;
        return (
          <button
            key={n}
            type="button"
            tabIndex={-1}
            aria-label={`Pomodoro ${n}`}
            aria-pressed={n <= filled}
            onClick={() => onClick?.(n)}
            className={clsx(
              "size-4 rounded-full border transition-colors",
              n <= filled ? "border-accent bg-accent" : "border-line hover:bg-line",
            )}
          />
        );
      })}
      <span className="w-5 text-[0.7rem] text-muted">{overflow}</span>
    </div>
  );
}
