"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveCloseDay, type CloseDayResult } from "@/app/actions";
import type { DayClosePatch } from "@/lib/domain/inputs";

const DEBOUNCE_MS = 800;
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type TextField = "highlight" | "whatWorked" | "whatDidnt";

const FIELDS: { field: TextField; title: string; subtitle: string }[] = [
  { field: "highlight", title: "Highlight", subtitle: "The one moment you want to remember from today" },
  { field: "whatWorked", title: "What worked", subtitle: "Keep doing this" },
  { field: "whatDidnt", title: "What didn't", subtitle: "No judgement, just notes for tomorrow" },
];

const heading = "mb-1 text-[0.8rem] font-light uppercase tracking-[1px]";
const subtitle = "mb-3 text-xs italic text-muted";

/**
 * "Close the day": an inline panel at the bottom of the day page (never a
 * modal). Opening it marks the day closed (closed_at, set once). Text fields
 * autosave after an 800ms pause, the rating right away. Everything stays
 * editable after closing.
 */
export function CloseDay({
  dayId,
  highlight,
  whatWorked,
  whatDidnt,
  rating: initialRating,
  closedAt: initialClosedAt,
  save,
}: {
  dayId: string;
  highlight: string;
  whatWorked: string;
  whatDidnt: string;
  rating: number | null;
  closedAt: string | null;
  save: (run: () => Promise<{ ok: boolean }>) => Promise<void>;
}) {
  const [closedAt, setClosedAt] = useState(initialClosedAt);
  const [open, setOpen] = useState(initialClosedAt !== null);
  const [text, setText] = useState<Record<TextField, string>>({ highlight, whatWorked, whatDidnt });
  const [rating, setRating] = useState(initialRating);

  const send = useCallback(
    (patch: Omit<DayClosePatch, "dayId">) =>
      save(async () => {
        const r: CloseDayResult = await saveCloseDay({ dayId, ...patch });
        if (r.ok && r.closedAt !== undefined) setClosedAt(r.closedAt);
        return r;
      }),
    [dayId, save],
  );

  // Pending text per field, flushed after a pause, on blur and on unmount.
  const pending = useRef<Partial<Record<TextField, string>>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length > 0) void send(patch);
  }, [send]);
  useEffect(() => flush, [flush]);

  const changeText = (field: TextField, value: string) => {
    setText((t) => ({ ...t, [field]: value }));
    pending.current[field] = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, DEBOUNCE_MS);
  };

  // Focus the first field right after the button opens the panel.
  const focusOnOpen = useRef(false);
  useEffect(() => {
    if (open && focusOnOpen.current) {
      focusOnOpen.current = false;
      document.getElementById("close-highlight")?.focus();
    }
  }, [open]);

  const closeDay = () => {
    setOpen(true);
    focusOnOpen.current = true;
    if (closedAt === null) void send({ close: true });
  };

  const pickRating = (n: number) => {
    // Tapping the selected number again clears the rating.
    const next = rating === n ? null : n;
    setRating(next);
    void send({ rating: next });
  };

  if (!open) {
    return (
      <div className="mt-8 border-t border-line pt-5">
        <button
          type="button"
          onClick={closeDay}
          className="rounded-[3px] border border-accent px-3 py-1.5 text-xs uppercase tracking-[1px] text-ink hover:bg-accent/10"
        >
          Close the day
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="close-day-title" className="mt-8 border-t border-line pt-5">
      <div className="mb-5 flex items-baseline justify-between">
        <h3 id="close-day-title" className={heading}>
          Close the day
        </h3>
        {closedAt && <span className="text-xs italic text-muted">closed</span>}
      </div>

      {FIELDS.map(({ field, title, subtitle: sub }) => (
        <div key={field} className="mb-5">
          <label htmlFor={`close-${field}`} className={clsx(heading, "block")}>
            {title}
          </label>
          <p className={subtitle}>&ldquo;{sub}&rdquo;</p>
          <textarea
            id={`close-${field}`}
            value={text[field]}
            onChange={(e) => changeText(field, e.target.value)}
            onBlur={flush}
            rows={2}
            className="min-h-14 w-full resize-y border border-line bg-transparent p-2.5 text-[0.9rem] outline-none focus:border-accent"
          />
        </div>
      ))}

      <div>
        <p id="close-rating" className={heading}>
          Rating
        </p>
        <p className={subtitle}>&ldquo;How did today feel, 1 to 10?&rdquo;</p>
        <div role="group" aria-labelledby="close-rating" className="flex flex-wrap gap-2">
          {RATINGS.map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={rating === n}
              aria-label={`Rating ${n}`}
              onClick={() => pickRating(n)}
              className={clsx(
                "flex size-7 items-center justify-center rounded-full border text-[0.75rem] tabular-nums transition-colors",
                rating === n ? "border-accent bg-accent text-accent-ink" : "border-line hover:border-accent",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
