import { BUBBLE_COUNT, bubbleDisplay } from "@/lib/domain/bubbles";
import type { BubbleShape } from "@/lib/theme";
import { Bubble } from "./Bubble";
import { useTheme } from "./ThemeProvider";

/**
 * The bubble that was just filled: index 1–5, `n` = click counter (remount key),
 * `shape` = theme shape at click time, so a theme switch doesn't replay the pop.
 */
export type BubblePop = { index: number; n: number; shape: BubbleShape };

/** Five pomodoro bubbles in the theme's shape; completed > 5 shows "+N" after the last bubble. */
export function Bubbles({
  completed,
  taskTitle,
  pop,
  onClick,
}: {
  completed: number;
  taskTitle: string;
  pop?: BubblePop | null;
  onClick?: (n: number) => void;
}) {
  const { theme } = useTheme();
  const { filled, overflow } = bubbleDisplay(completed);
  return (
    <div className="flex items-center">
      {Array.from({ length: BUBBLE_COUNT }, (_, i) => {
        const index = i + 1;
        const lit = index <= filled;
        const popping = lit && pop?.index === index && pop.shape === theme.bubbleShape;
        return (
          <Bubble
            key={popping ? `${index}-${pop.n}` : index}
            n={index}
            taskTitle={taskTitle}
            shape={theme.bubbleShape}
            lit={lit}
            pop={popping}
            onClick={() => onClick?.(index)}
          />
        );
      })}
      {overflow && <span className="pl-0.5 text-sm tabular-nums text-muted">{overflow}</span>}
    </div>
  );
}
