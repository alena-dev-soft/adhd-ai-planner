"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveCloseDay, type CloseDayResult } from "@/app/actions";
import type { DayClosePatch } from "@/lib/domain/inputs";
import { REOPEN_DAY_LABEL } from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

const DEBOUNCE_MS = 800;
const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type TextField = "highlight" | "whatWorked" | "whatDidnt";

const FIELDS: { field: TextField; title: string; subtitle: string }[] = [
  { field: "highlight", title: "Highlight", subtitle: "The one moment you want to remember from today" },
  { field: "whatWorked", title: "What worked", subtitle: "Keep doing this" },
  { field: "whatDidnt", title: "What didn't", subtitle: "No judgement, just notes for tomorrow" },
];

const heading = "head block text-sm leading-snug";
const subtitle = "sub mb-2";

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
  const { theme } = useTheme();
  const [closedAt, setClosedAt] = useState(initialClosedAt);
  // A day that loads already sealed shows the stamp with the fields folded.
  const [open, setOpen] = useState(false);
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

  // Reopen only unfolds the fields again (UI state); closed_at stays set —
  // there is no server-side reopen (docs/OPEN_QUESTIONS.md).
  const reopen = () => {
    setOpen(true);
    focusOnOpen.current = true;
  };

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

  if (!open && closedAt === null) {
    return (
      <div>
        <button type="button" onClick={closeDay} className="btn solid">
          {theme.closeDayButton}
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="close-day-title" className="flex flex-col gap-5">
      <h3 id="close-day-title" className="head text-base leading-snug">
        {theme.closeDayButton}
      </h3>

      {closedAt && (
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-2">
          {/* Mounted once per closed day, so the stamp drops in only when the day gets sealed. */}
          <div role="status" className="seal text-center">
            <span className="head text-[12px] leading-tight">{theme.sealedStamp}</span>
            <span className="head text-[26px] leading-none">
              <span className="sr-only">, rating </span>
              {rating ?? "—"}
              {rating !== null && <span className="text-[13px]"> / 10</span>}
            </span>
          </div>
          {!open && (
            <button type="button" onClick={reopen} className="btn ghost">
              {REOPEN_DAY_LABEL}
            </button>
          )}
        </div>
      )}

      {open && (
        <div className="unfold flex flex-col gap-5">
          {FIELDS.map(({ field, title, subtitle: sub }) => (
            <div key={field}>
              <label htmlFor={`close-${field}`} className={heading}>
                {title}
              </label>
              <p className={subtitle}>&ldquo;{sub}&rdquo;</p>
              <textarea
                id={`close-${field}`}
                value={text[field]}
                onChange={(e) => changeText(field, e.target.value)}
                onBlur={flush}
                rows={2}
                className="field min-h-14"
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
                  className="rate tabular-nums"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
