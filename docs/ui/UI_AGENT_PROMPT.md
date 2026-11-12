# Task: apply the fantasy-theme UI to the existing ADH Planner

You are working in the existing ADH Planner repo (Next.js App Router + TypeScript + Tailwind + Supabase; see `CLAUDE.md`). Apply the new visual design described in `docs/ui/DESIGN.md`, using the ready-made styles in `docs/ui/themes.css`. **This is a UI-only change.** Do not change data flow, Server Actions, the database, or business logic, except where section 4 says so.

## 0. Before you start

1. Read `docs/ui/DESIGN.md` and `docs/ui/themes.css` fully.
2. Read only the UI files: `app/layout.tsx`, `app/globals.css`, `tailwind.config.*`, the planner page and `components/*`. Do not read `node_modules`, `.next`, lockfiles, migrations.
3. Write a short mapping in `docs/PROGRESS.md`: each existing component → what changes. If the existing structure differs a lot from DESIGN.md section 3–4, stop and ask before restructuring.

## 1. Fonts and tokens

- Load fonts with `next/font/google` in `app/layout.tsx`: Cinzel (500, 700), EB Garamond (400, 500, italic), Marcellus (400), Cormorant Garamond (500, 600, italic), Alegreya (400, 500, 700, italic), Alegreya SC (500, 700). Expose each as a CSS variable with exactly these names: `--font-cinzel`, `--font-eb-garamond`, `--font-marcellus`, `--font-cormorant`, `--font-alegreya`, `--font-alegreya-sc`, and add all variable classes to `<html>`.
- Append `themes.css` to `app/globals.css` (after the Tailwind directives). Remove the old cream/sage palette styles that it replaces.
- In `tailwind.config`, map colors to the variables so utilities still work: `bg: 'var(--bg)'`, `page: 'var(--page)'`, `line: 'var(--line)'`, `ink: 'var(--ink)'`, `muted: 'var(--muted)'`, `accent: 'var(--accent)'`, `glow: 'var(--glow)'`; `fontFamily.head: 'var(--font-head)'`, `fontFamily.body: 'var(--font-body)'`; `borderRadius.page: 'var(--radius)'`. Replace old color class usages (`cream`, `sage`, `skyblue`, `warm`, `dark`) with the new ones.

## 2. Theme switching

- Create `lib/theme.ts` with the theme registry: key, label, bubble shape, pomodoro unit, and all themed labels from DESIGN.md section 2. Components read labels from here; no theme strings hard-coded in components.
- Create `components/ThemeProvider.tsx` (client): holds the current theme, sets `document.documentElement.dataset.theme`, persists to `localStorage` (try/catch). Default: `grimoire`.
- Avoid a flash of the wrong theme: in `app/layout.tsx` add a tiny inline script in `<head>` that reads `localStorage` and sets `data-theme` before paint; set `suppressHydrationWarning` on `<html>`.
- Create `components/ThemeSwitcher.tsx`: three `.pill` buttons with `aria-pressed`, in the header.
- Do **not** store the theme in Supabase in this task. Add it to `docs/OPEN_QUESTIONS.md` as a later option.

## 3. Components

Restyle existing components to the markup and class names in DESIGN.md sections 4 and 6 (the classes are defined in `themes.css`; use Tailwind only for layout: flex, gap, padding, widths).

- **Header:** title "Planner", subline with today's total `{done} / {target} {unit} gathered today`, theme switcher.
- **Week nav + day pills:** `.pill`, selected via `aria-pressed="true"`.
- **Pages:** `.page` wrappers, layout per DESIGN.md section 3.
- **TaskRow (day):** `.row` with `data-done`, `.num`, `.title`, `.box` (target), bubbles, `.box.actual`, `.chk`.
- **TaskRow (week):** same row, no bubbles/boxes.
- **Bubbles:** new `components/Bubble.tsx` rendering the SVG for the current theme's shape (`data-shape`), `aria-pressed`, aria-label "Pomodoro N for {title}". Keep the existing bubble click logic.
- **Quote, Notes, Close-the-day panel (`.unfold`), rating (`.rate`), sealed stamp (`.seal` showing the themed sealed text + rating)**, plus a "Reopen the day" ghost button.
- **Weekly Review:** same tokens and fonts; done items use `--accent`, not-done items use `--muted`. No new animations there.

## 4. Animation triggers (the only logic you add)

- **Bubble pop:** keep a client-side `lastPop: { taskId, index, n } | null`. Set it only when a click increases the count. Render `data-pop="true"` on that bubble and give it `key={`${index}-${n}`}` so the animation replays on each click.
- **Spark:** keep `lastSpark: string | null` (`d{slot}` / `w{slot}`). Set it when the user ticks a row to done; render `data-spark="true"` only on that row. Never set it on initial load.
- These states are UI-only (component state), never saved.

## 5. Rules

- Small targeted edits; do not rewrite files to change a few lines. Do not echo files back.
- No new dependencies besides `next/font` (built in). Ask before adding anything else.
- Keep accessibility: real buttons, labels, `aria-pressed`, focus rings from `themes.css`, 44px targets.
- Do not touch Supabase schema, migrations, Server Actions, or `lib/domain`.

## 6. Done when

- All three themes switch instantly from the header, persist after reload, and show no flash of the wrong theme.
- Bubble shape and all themed labels change with the theme.
- Fill a bubble → ignite + ring; tick a task → checkmark draws, strike-through, sparks (only on click, not on load); close the day → panel unfolds → stamp drops in.
- With OS "reduce motion" on, nothing animates but everything works.
- Layout works at 1440px and 390px wide.
- `npm run lint && npm test` pass. Append a short entry to `docs/PROGRESS.md`.
