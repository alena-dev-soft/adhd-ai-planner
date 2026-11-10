# ADH Planner — Agent Build Brief

Build **ADH Planner**: a digital version of the paper "Productivity Planner" (weekly plan page + daily page with pomodoro bubbles) for an ADHD developer who works night shifts.

Visual reference: `docs/prototype.html` (approved static mockup). Layout/styling: the prototype wins. Behavior/data: this brief wins.

---

## 1. Product

Two facing "pages":
- **Left — Week:** 5 most important tasks of the week, 5 secondary, 2 additional. Checkbox each.
- **Right — Day:** random quote on top, 1 most important task, 2 secondary, 2 additional, notes at the bottom. Each task: target pomodoros, 5 bubbles, actual count, checkbox, AI feasibility mark.
- **Close the day:** highlight, what worked, what didn't, rating 1–10.
- **Weekly Review:** per day — done, not done, highlight, rating, pomodoros.

## 2. Principles

- Calm, minimal, paper-like. No dashboards, charts, streaks, notifications, toasts, modals.
- Adding a task = type + Enter. AI feedback inline, never blocks saving.
- AI fails or takes >5s → save the task anyway, target stays empty, no error shown.
- Do not add features not listed here. Missing something → write to `docs/OPEN_QUESTIONS.md` and continue.

## 3. Stack

- **Next.js (App Router, latest stable) + TypeScript (strict)**
- **Tailwind CSS**
- **Supabase**: Postgres + Auth (email magic link) + Row Level Security. Local development via Supabase CLI (`supabase start`, runs in Docker); Supabase cloud only for deploy.
- `@supabase/ssr` + `@supabase/supabase-js` — no ORM
- Mutations via **Server Actions**; AI call via one **Route Handler** (`app/api/estimate/route.ts`)
- AI: OpenAI `gpt-4o-mini` behind `lib/ai/estimator.ts` (one function, swappable). Key in `OPENAI_API_KEY`, server-only.
- Tests: **Vitest** for pure logic only. One **Playwright** smoke test at the end.
- Deploy: Vercel + Supabase cloud.

Allowed dependencies: the above + `zod`, `date-fns`, `date-fns-tz`, `clsx`. Anything else — ask first.

Layout:
```
app/                 routes (planner, review, login)
components/          UI (Page, TaskRow, Bubbles, Quote, Notes, CloseDay, ReviewCard)
lib/                 supabase clients, domain logic, ai
lib/domain/          pure functions (rollover, bubbles, review, overload) + tests
supabase/migrations/ SQL migrations (created with `supabase migration new`)
supabase/seed.sql    quotes
lib/db-types.ts      generated with `supabase gen types typescript --local`
docs/                prototype.html, PROGRESS.md, OPEN_QUESTIONS.md
```

## 4. Design tokens

| Token | Value | Use |
|---|---|---|
| cream | #F5F3EF | background |
| paper | #FBFAF7 | page surface |
| ink | #2C2C2C | text |
| sage | #A8C48F | done, filled bubble |
| skyblue | #B8C5D6 | selected day, accents |
| warm | #D4A574 | warning |
| muted | #9A9A9A | hints |

- Headings: uppercase, letter-spacing 1px, light weight.
- Quote: Georgia italic, centered, author in small caps.
- Subtitles in paper-planner tone: "If this was the only thing you did today you'd be satisfied."
- Task row: number · underline input · target box · 5 bubbles · actual box · checkbox.
- ≥900px: pages side by side. <900px: stacked, weekly page collapsible.

## 5. Database (Supabase SQL)

```sql
profiles   (id uuid pk references auth.users, display_name text,
            time_zone text default 'Asia/Ho_Chi_Minh', rollover_hour int default 7)
quotes     (id serial pk, text text, author text)
weeks      (id uuid pk, user_id uuid, week_start date, unique(user_id, week_start))
week_tasks (id uuid pk, week_id uuid, slot int check (slot between 1 and 12),
            title text, is_done bool default false, unique(week_id, slot))
days       (id uuid pk, user_id uuid, date date, quote_id int, notes text,
            highlight text, what_worked text, what_didnt text,
            rating int check (rating between 1 and 10), closed_at timestamptz,
            unique(user_id, date))
day_tasks  (id uuid pk, day_id uuid, slot int check (slot between 1 and 5),
            title text, target_pomodoros int, completed_pomodoros int default 0,
            is_done bool default false, feasibility text check (feasibility in ('yes','warning','no')),
            feasibility_note text, week_task_id uuid null, unique(day_id, slot))
```

- RLS on every user table: a row is visible/editable only by its owner (`user_id = auth.uid()`, child tables via parent).
- Trigger: create `profiles` row on sign-up.
- Seed ~40 quotes.

Rules (implement as pure functions in `lib/domain`, with tests):
- Category from slot. Week: 1–5 important, 6–10 secondary, 11–12 additional. Day: 1 important, 2–3 secondary, 4–5 additional.
- **Rollover:** a day belongs to the date it started. With `rollover_hour = 7`, Tuesday 02:00 is still Monday. Computed on the server with the user's time zone.
- **Bubbles:** click bubble N → completed = N; click the last filled bubble → completed − 1. Over 5 → show "+N".
- **Quote:** picked randomly when the day row is created, fixed afterwards.
- **Overload:** sum of targets > 12 → warning, > 15 → "no". Works without AI.
- **Review:** aggregate a week into per-day done / not done / highlight / rating / pomodoros done vs target.

## 6. AI estimate

`POST /api/estimate { title, category, otherTasks[] }` → `{ targetPomodoros: 1–8, feasibility, note }`

System prompt rules: ADHD-aware, conservative, account for task switching, shift capacity 15 pomodoros, JSON only, note = one short neutral sentence.

Implementation: strip code fences → zod parse → clamp. Any failure → `{ targetPomodoros: null }`. Call only when a task title is created or changed. The user can override the target by clicking the target box.

## 7. Screens

1. `/login` — email magic link.
2. `/` — planner. Top bar: ‹ Week of DD MMM ›, Mon–Sun selector, link to Review. Left/right pages as in section 1. Notes autosave (debounce 800ms). "Close the day" opens an inline panel at the bottom of the day page (not a modal); rating = ten tappable numbers. The day stays editable after closing.
3. `/review?week=YYYY-MM-DD` — week header with totals and weekly tasks done/not done, then one card per day with data.

Everything autosaves. A small "saved" text indicator is the only feedback.

Keyboard: Enter → next slot; on a focused row, Space toggles done and keys 1–5 set pomodoros.

## 8. Phases

Finish and verify each phase before starting the next one. After each phase, append to `docs/PROGRESS.md`: what was done, how it was verified, what was skipped.

1. **Skeleton** — Next app, Tailwind tokens, Supabase clients, login works, empty planner page behind auth.
   Done: `supabase start` + `npm run dev`, magic link arrives in local Inbucket/Mailpit (URL from `supabase status`) → see the page.
2. **Database** — migrations, RLS, trigger, seed, generated `lib/db-types.ts`, `lib/domain` + Vitest tests. Apply with `supabase db reset` (re-runs migrations + seed).
   Done: `npm test` is green; with two test users, user B cannot read user A's rows.
3. **Planner UI** — static layout matching the prototype, then wired to Supabase with Server Actions.
   Done: data survives reload; layout matches the prototype at 1440px and 390px.
4. **AI** — estimate route, inline feasibility, target override, overload warning.
   Done: tests for valid JSON, fenced JSON, garbage, timeout (mock fetch).
5. **Close day + Review**.
   Done: close 2 days → review shows both correctly, including tasks not done.
6. **Polish** — keyboard, empty states, focus rings, AA contrast, README, one Playwright smoke test (login → add task → fill bubble → reload → still there).
7. **Deploy (only when asked)** — Vercel + Supabase cloud (`supabase link` + `supabase db push`), env vars documented.

## 9. Agent rules (token economy)

- Database changes only through new migration files; never edit an applied migration, never change the schema from Studio.

- Read only the files you need. Never read `node_modules`, `.next`, lockfiles, or generated types.
- Edit with small targeted diffs; do not rewrite whole files to change a few lines.
- Do not echo file contents back after writing them. Do not paste long logs — show only the relevant error lines.
- No speculative abstractions, no extra layers, no barrel files. Plain functions over classes.
- Regenerate `lib/db-types.ts` after every migration change (`supabase gen types typescript --local > lib/db-types.ts`); never hand-edit it.
- Run `npm run lint && npm test` before marking a phase done; fix only what fails.
- Small commits with conventional messages (`feat:`, `fix:`, `test:`).
- Ask before: new dependencies, changes to the DB schema shape, visual design changes, starting phase 7.
- Never commit secrets. `.env.local` is gitignored; provide `.env.example`.

## 10. Definition of done (MVP)

- Plan a week, plan a day, track pomodoros, write notes, close the day, read the weekly review — all from the UI.
- Correct across the night-shift date boundary.
- Fully usable with AI disabled.
- Tests green; README setup fits in under 10 commands.
