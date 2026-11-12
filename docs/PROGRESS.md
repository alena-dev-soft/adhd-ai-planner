# Progress

Each phase appends a section below: what was done, how it was verified, and what was skipped.

## Step 0 — Development environment & keys

What was done:
- `.gitignore`: the repo came with a Visual Studio template that didn't ignore `.env.local`, `node_modules/` or `.next/`. Added entries for Node, Next, Supabase and Playwright, plus `.env` / `.env*.local` (with `!.env.example`). Checked: `git check-ignore -v .env.local` → ignored.
- **Decision (user):** we use a hosted Supabase project, not the local Docker stack. No Docker. All checks run in the agent container. `docs/SETUP.md` was rewritten for this (tools, env vars, migration commands).
- Secrets requested and present as env vars and in `.env.local` (gitignored, not committed): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `OPENAI_API_KEY`.
- Added `.env.example` (placeholders only) and `docs/OPEN_QUESTIONS.md`.

Checked in the container:
- Node v22.23, npm 10.9, git 2.39, `npx supabase@latest --version` → 3.1.0, psql 15.19 installed via apt.
- `psql "$SUPABASE_DB_URL"` → connects as `postgres`, server Postgres 17.11. The `auth` schema exists and `public` has no tables yet.
- Auth API at `<origin>/auth/v1/health` and `/settings` → 200 (email provider enabled). Admin users endpoint with the service key → 200.
- OpenAI `GET /v1/models/gpt-4o-mini` → 200 (key is valid and has access to the model).

Open points (see OPEN_QUESTIONS.md):
- The `SUPABASE_URL` secret is the REST endpoint (`…/rest/v1/`), not the origin. Fix the secret, or use `new URL(...).origin` in code.
- Keys use the new format (`sb_publishable_…` / `sb_secret_…`). Use a current `@supabase/supabase-js`.
- The redirect URL `http://localhost:3000/**` must be allowed in Supabase Auth settings. The user needs to confirm this.
- Phases 1–2 need to change: `supabase start` / `db reset` / Inbucket → `db push --db-url`, admin `generateLink` for test logins.

## Step 0b — Bootstrap: brief, prototype, docs

What was done:
- Added `CLAUDE.md` (the build brief) to the repo root, unchanged.
- Added `docs/prototype.html`, an unchanged copy of `ADHD_PLANNER_NEW.html` (the approved static mockup).
- Added the prototype-vs-brief gaps to `docs/OPEN_QUESTIONS.md`, each with the resolution the brief dictates.

How it was verified: files committed; `git show --stat` lists them.

Skipped: nothing. No app code yet (phase 1 is next).

## Phase 1 — Skeleton

What was done:
- Next.js **16.4** app (App Router, TypeScript strict, ESLint, Tailwind v4 via `@tailwindcss/turbopack`), scaffolded with `create-next-app` into the repo root.
  - Next 16 renamed `middleware.ts` to **`proxy.ts`** (root). It calls `lib/supabase/middleware.ts#updateSession`, which refreshes the session (`getClaims()`) and redirects to `/login` when there is no user. Public paths: `/login`, `/auth/*`.
  - **Decision:** removed `cacheComponents` / `partialPrefetching` from the template's `next.config.ts`. The app is fully per-user and dynamic. With Cache Components on, every cookie read needs its own Suspense boundary. Without it, the pages stay plain dynamic server components.
  - `AGENTS.md` (written by `next dev`) is committed so the tree stays clean. It says to read `node_modules/next/dist/docs/` before using Next APIs.
- Design tokens are in `app/globals.css` `@theme` (Tailwind v4 has no `tailwind.config`): `cream paper ink sage skyblue warm muted`, plus `line` (#e8e3dd, the hairline colour from the prototype) and `font-serif` (Georgia).
- Supabase: `@supabase/ssr` + `@supabase/supabase-js`. Clients are in `lib/supabase/{client,server,middleware}.ts`, and public env is in `lib/supabase/env.ts`.
  - `next.config.ts` `env` sets `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` and falls back to the `SUPABASE_URL` / `SUPABASE_ANON_KEY` secrets. **It uses only the URL origin**, so the `/rest/v1/` suffix on the secret doesn't matter. Values are inlined at build/dev start.
- `/login`: email field → Server Action `sendMagicLink` (zod email check, `signInWithOtp` with `emailRedirectTo=<origin>/auth/callback`). The style is paper-like. On success the page shows "Check your email…".
- `/auth/callback`: handles both `?code=` (PKCE, default email template) and `?token_hash=&type=` (`verifyOtp`). `next` is sanitised by `lib/safe-next.ts`. On failure it redirects to `/login`.
- `/`: empty two-page planner shell behind auth (side by side at ≥900px, stacked below). The real layout comes in phase 3.
- `supabase init` → `supabase/config.toml` (local stack config only). Set `site_url = http://localhost:3000` and the redirect allow-list to `http://localhost:3000/**` and `http://127.0.0.1:3000/**`. The local mail catcher (`[local_smtp]`, port 54324) is enabled by default. **We don't use it**, because the project runs on hosted Supabase (step 0 decision).
- Vitest: `npm test` (= `vitest run`), config `vitest.config.mts`, tests `lib/**/*.test.ts`. First test: `lib/safe-next.test.ts`.
- `scripts/dev-login-link.mjs`: uses the admin API (`generateLink`) to print a one-time `/auth/callback?token_hash=…` sign-in URL. No email is sent. Use it for dev and later for the Playwright smoke test.
- Deps added: `@supabase/ssr`, `@supabase/supabase-js`, `zod`, dev `vitest`. Bumped `@types/node` to ^22 because vitest 5 has a peer requirement on it.
- `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, plus the optional script/test vars. `.env.local` is gitignored (`.env*.local`).

How it was verified (agent container, hosted Supabase):
- `npm run lint` clean, `npm test` 2/2 green, `npm run build` ok (routes `/`, `/login`, `/auth/callback`, Proxy).
- `npm run dev`: `GET /` without a session → 307 to `/login`. `/login` → 200.
- The magic-link flow ran against the hosted project. `generateLink` (admin API) → `GET /auth/callback?token_hash=…&type=…` → sets the `sb-…-auth-token` cookie → 307 to `/`. `GET /` with that cookie → 200 with the planner shell. A bad token → `/login`. `next=//evil.com` → not followed. The test users were deleted afterwards.

Skipped / not verified:
- Supabase `start` / Mailpit: not used (hosted project, no Docker).
- **The real email (PKCE `?code=`) path was not tested end-to-end.** It would send a real email, and the hosted SMTP is rate-limited. The user should check it once: open `/login`, enter your own email, and click the link. If the link lands on the Supabase Site URL instead of `localhost:3000/auth/callback`, add `http://localhost:3000/**` under Auth → URL Configuration.
- No sign-out button (not in the brief). See OPEN_QUESTIONS.

## Phase 2a — Migrations: tables, constraints, RLS, sign-up trigger

What was done:
- `supabase/migrations/20261110060647_init_schema.sql` (made with `supabase migration new`) creates `profiles`, `quotes`, `weeks`, `week_tasks`, `days` and `day_tasks`. Columns, defaults, checks and unique constraints match CLAUDE.md §5.
  - uuid PKs use `default gen_random_uuid()`. `profiles.id` is a FK to `auth.users`. `weeks.user_id` and `days.user_id` are FKs to `auth.users`. All of these are `on delete cascade`. `week_tasks.week_id` → `weeks` and `day_tasks.day_id` → `days` also cascade.
  - **Additions within the brief's shape (no new columns):** keys/FKs/`slot`/`date`/`week_start` are `not null`. Columns that have a default are also `not null` (`time_zone`, `rollover_hour`, `is_done`, `completed_pomodoros`). `quotes.text` is `not null`. `days.quote_id` → `quotes` is `on delete set null`. `day_tasks.week_task_id` → `week_tasks` is `on delete set null`. There are indexes on those two FKs. `title` stays nullable.
- RLS is enabled on all six tables. Policies apply to the `authenticated` role and use `(select auth.uid())`:
  - `profiles`: `id = auth.uid()` for select/insert/update/delete.
  - `weeks` and `days`: `user_id = auth.uid()` for select/insert/update/delete.
  - `week_tasks` and `day_tasks`: checked with `exists` on the parent row. **Extra check:** on insert/update, a non-null `day_tasks.week_task_id` must point to a week task the user owns. Without it, the FK check (which bypasses RLS) would let a user link to another user's row.
  - `quotes`: select only, `using (true)`. Nobody can write quotes through the API; the seed adds them.
  - `anon` has its default privileges revoked on all of these tables and on `quotes_id_seq`.
- The trigger `on_auth_user_created` (after insert on `auth.users`) runs `public.handle_new_user()`. The function is `security definer` with `search_path = ''`, inserts `profiles(id)` (`on conflict do nothing`), and nobody else can execute it.
- `lib/db-types.ts` is generated with `supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public`. The CLI prints it unformatted; leave it that way and don't hand-edit it.
- `scripts/rls-check.mjs` (`npm run check:rls`) creates two throwaway users (admin API + password sign-in) and checks: the trigger and its defaults, the constraints (slot, rating, feasibility, unique week), that B can't read/update/delete/insert-into A's rows in any table, that B can't link A's week task, quote read vs write, that anon gets nothing, and that deleting a user cascades. Afterwards it deletes both users.

How to apply (hosted project, no Docker, so no `db reset`):
```
npx supabase db push --db-url "$SUPABASE_DB_URL" --dry-run   # preview
npx supabase db push --db-url "$SUPABASE_DB_URL" --yes
npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > lib/db-types.ts
npm run check:rls
```
(The CLI warns that `--db-url` is deprecated in favour of `--remote=<db-url>`. It still works in 3.1.)

How it was verified: the migration was pushed to the hosted DB, and `npm run check:rls` passed all 27 checks. `npm run lint` is clean and `npm test` is green.

Skipped / open:
- No quotes seed yet (`supabase/seed.sql` belongs to the next step). `lib/domain` + tests also come later.
- `npx tsc --noEmit` reports `LayoutProps` missing in `app/layout.tsx`. That type comes from Next's build-time typegen; `npm run build` is fine. This isn't from this step.

## Phase 2b — Quotes seed + generated types

What was done:
- `supabase/seed.sql`: **40** short productivity/focus quotes (`text`, `author`). It is wired in through `config.toml` `[db.seed] sql_paths = ["./seed.sql"]`, so a local `supabase db reset` picks it up.
  - **Idempotent:** `insert … select … where not exists (same text)`. You can re-run it against the hosted DB without getting duplicates, and existing `days.quote_id` links are never touched. That's why there's no truncate.
  - **Attribution decision:** I kept only quotes with a solid source. From the prototype's 8, I kept Jobs, Collier, Levenson and Carnegie. I **dropped** the 4 common misattributions: "secret of getting ahead" (Twain), "whole staircase" (MLK), "future depends on what you do today" (Gandhi) and "believe you can" (Roosevelt). The rest are well-sourced: Drucker, Covey, David Allen, James Clear, Knuth, Torvalds, Kent Beck, Carmack, Annie Dillard, Stephen King and others. The Aristotle–Durant "We are what we repeatedly do" line is credited to Will Durant, its actual author.
- Applied to the hosted DB with `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`. **I didn't use `supabase db reset`:** this container has no Docker, and running it against the hosted DB would wipe all data.
- `lib/db-types.ts` was regenerated (`npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public`). The output was byte-identical, which is expected because the seed doesn't change the schema.

How it was verified: first run `INSERT 0 40`, second run `INSERT 0 0`. `select count(*), count(distinct text) from quotes` → `40|40`. `npm run lint` is clean and `npm test` is green.

Open: the quote picking (random on day creation) comes with the day-row logic in phase 3.

## Phase 2c — Pure domain functions (`lib/domain`) + Vitest

What was done (plain functions, one file per rule, no barrel file; tests next to each file):
- **Dependencies:** added `date-fns` and `date-fns-tz`. Both are on the brief's allowed list.
- `category.ts`: `weekCategory(slot)` maps 1–5 → important, 6–10 → secondary, 11–12 → additional. `dayCategory(slot)` maps 1 → important, 2–3 → secondary, 4–5 → additional. Out-of-range slots throw `RangeError`.
- `rollover.ts`:
  - `plannerDate(instant, timeZone = 'Asia/Ho_Chi_Minh', rolloverHour = 7)` returns `YYYY-MM-DD`. It reads the local wall-clock date and hour in the user's zone (`formatInTimeZone`). If the hour is before `rolloverHour`, it returns the previous date.
  - `rolloverHour` must be an integer from 0 to 23, otherwise it throws.
  - `weekStart(date)` returns the Monday. `addDaysToDate(date, n)` and `weekDates(monday)` (Mon–Sun) are also here.
  - Date strings are worked on at local noon, so the result doesn't depend on the server's TZ or on DST. Tests pass with `TZ=America/Los_Angeles` and `TZ=Pacific/Kiritimati`.
  - Usage on the server: `plannerDate(new Date(), profile.time_zone, profile.rollover_hour)`.
- `bubbles.ts`:
  - `clickBubble(completed, n)`: clicking bubble n sets completed to n. Clicking the last filled bubble sets completed − 1.
  - **Decision:** when completed > 5, bubble 5 counts as the last filled one, so clicking it gives completed − 1 (7 → 6).
  - `bubbleDisplay(completed)` returns `{ filled: 0–5, overflow: '+N' | null }`.
- `overload.ts`: `overload(targets)` returns `'yes'` up to 12, `'warning'` above 12, and `'no'` above 15. Null and undefined targets are ignored. `totalTarget(targets)` is also exported.
- `review.ts`: `reviewWeek({ weekStart, days, dayTasks, weekTasks? })`.
  - The inputs are structural subsets of the DB rows. The function always returns 7 days (Mon–Sun).
  - Each day has `done`/`notDone` (with slot, title and category), `highlight`, `rating`, `closed`, `pomodorosDone` and `pomodorosTarget` (null targets count as 0), plus `hasData`. `hasData` is true if the day has a titled task, a highlight, a rating or a `closed_at`.
  - The week also gets `weekTasksDone`/`weekTasksNotDone` for the review header, and `totals` (done, notDone, pomodoros done and target, daysRated, averageRating or null).
  - Tasks with an empty or whitespace-only title are ignored, and days outside the week are ignored.

How it was verified: `npm test` passes 39 tests: rollover across midnight, exactly at the hour, the HCM default, month/year boundaries and New York DST. `npm run lint` is clean. `tsc` shows no new errors (only the known `LayoutProps` one remains).

Open: none for this step. The UI wires these in phases 3 and 5.

## Phase 2d — RLS isolation verified with two users

What was done:
- `scripts/rls-check.mjs` (`npm run check:rls`) was made stricter. It's a plain Node ESM script that only uses `@supabase/supabase-js`, so no new dependencies.
- **Setup:**
  - It creates two throwaway users A and B with the auth admin API (service role) and signs both in with a password. That gives two real `authenticated` JWT clients.
  - A inserts a week, a week_task, a day (with notes) and a day_task linked to its own week_task.
- **What it checks (56 checks):**
  - Trigger defaults and constraints: slot range, week slot 13, rating, feasibility, and the duplicate week.
  - **Reads:** B's `select *` returns **0 rows** from weeks, week_tasks, days and day_tasks. On profiles it returns only B's own row. Selecting each of A's rows by id also returns 0 rows.
  - **Updates and deletes:** on every table, B's update and delete of A's rows affect 0 rows.
  - **Inserts into A's data are rejected:** a week or day with `user_id = A`, a week_task in A's week, a day_task in A's day.
  - **Moving or linking rows into A's data is rejected:** B can't reassign its own week or day to A, move its own week_task or day_task under A's parent, link A's week_task (by insert or update), or upsert onto A's primary keys.
  - **Error code:** each rejection must fail with Postgres code **42501** (RLS / insufficient privilege). A failure for any other reason doesn't count as a pass.
  - **A's data unchanged:** an admin (service-role) snapshot of all of A's rows taken before B's attempts is **byte-identical** afterwards.
  - **Quotes and anon:** authenticated users can read quotes but not insert them. `anon` can read none of the 6 tables and can't insert.
  - **Cleanup:** deleting both users cascades to their weeks and days.
- Exit code 1 if any check fails, 2 if env vars are missing. It prints `N passed, M failed`.

How to run:
```
npm ci
npm run check:rls        # reads SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY from .env.local or env
```
It works against local (`supabase start`, with keys from `supabase status`) and against the hosted project. It only creates and deletes its own `rls-*@example.com` users.

How it was verified: I ran it against the hosted Supabase project (this container has no Docker, so no local stack). Result: 56 passed, 0 failed. `npm run lint` is clean and `npm test` is green (39).

Open: none. Re-run `npm run check:rls` after any future migration that touches tables or policies.

## Phase 3a — Static planner layout (prototype match)

What was done:
- **Dependency:** added `clsx` (on the brief's allowed list).
- `components/Page.tsx`: `Page` (one sheet, `@container`, px-5 mobile / px-10 desktop, min-h 900px at ≥900px), `PageTitle`, `Section` (uppercase light 1px-tracked title + italic quoted subtitle).
- `components/TaskRow.tsx`:
  - `WeekTaskRow` = number · underline input · checkbox.
  - `DayTaskRow` = number · underline input · target box · 5 bubbles · actual box · checkbox · feasibility mark slot (✓ sage / ⚠ warm / ✕ warm, note in `title`).
  - The controls wrap below the title when the page is narrow (flex-wrap, title min 10rem). This happens at 390px and at 900px; at 1440 they are inline.
  - A done task gets muted + line-through but stays editable (brief wins over the prototype's `disabled`).
- `components/Bubbles.tsx`: 5 bubbles via `bubbleDisplay`, "+N" overflow, `aria-pressed`. `tabIndex=-1` so keyboard focus stays on rows (keys come in phase 6).
- `components/Quote.tsx` (Georgia italic, centered, author `font-variant: small-caps`), `components/Notes.tsx`, `components/TopBar.tsx` (‹ Week of DD MMM ›, Mon–Sun buttons with date, selected = skyblue, `Review` link to `/review?week=YYYY-MM-DD`).
- `components/Planner.tsx` (client): composes the two pages from section configs that use the prototype's titles and subtitles.
  - **State is local only.** Typing, checkboxes, bubbles (via `clickBubble`), notes, the week arrows and day selection all work but nothing is saved.
  - Below 900px the weekly page has a "Show ▾ / Hide ▴" toggle (`aria-expanded`), collapsed by default so the day page is close to the top. At ≥900px it's always open and the toggle is hidden.
- `lib/sample-planner.ts`: static sample data (prototype titles) plus the `WeekTaskView` / `DayTaskView` view types. These view types are meant to be reused when wiring.
- `app/page.tsx`: auth guard as before. Today = `plannerDate(new Date())` (default HCM/7h; the profile values come with wiring). Renders `Planner` with the sample data.

How it was verified:
- `npm run lint` is clean and `npm test` is green (39).
- I ran headless Chromium (Playwright installed in /tmp, **not** a project dependency) against `npm run dev`, logged in via `scripts/dev-login-link.mjs`. Screenshots are in `docs/screenshots/` (planner 1440, 390, 390 with the week open, and the prototype at 1440 for comparison).
- I also measured the DOM:
  - 1440: two 680px pages side by side, day row inline.
  - 900: two 430px pages side by side, row controls wrapped.
  - 390: pages stacked, week collapsed, no horizontal scroll (scrollWidth = viewport at all three widths).
  - Quote computed as Georgia/italic/center with small-caps author. Headings are uppercase, 1px, weight 300. The selected day is rgb(184,197,214).
  - Clicking bubble 4 → actual 4, clicking it again → 3.
  - No console or hydration errors.
- Note: the agent can't view images, so the screenshots were checked by DOM measurement only. **A human should eyeball `docs/screenshots/` against the prototype.**

Decisions / deviations:
- Page surface is `paper` on a `cream` background (brief tokens), where the prototype has cream pages on a white container.
- The prototype's sage nav buttons were replaced by the brief's top bar. On <600px the day selector wraps to its own full-width row.
- Target box is read-only display for now. Override-by-click comes in phase 4.

Next step: wire to Supabase with Server Actions (load/create week + day rows, random quote on day creation, autosave with a "saved" indicator), then replace `lib/sample-planner.ts`.

## Phase 3b — Load data: planner day, week, quote

What was done:
- **URL state** (`lib/domain/selection.ts`, pure + tests):
  - `/?date=YYYY-MM-DD` selects that day; the week shown is its Monday-based week.
  - `/?week=YYYY-MM-DD` (any date in the week, normalised to Monday) selects today if today is in that week, else Monday.
  - No params or invalid values (e.g. `2025-02-30`) → today. `date` wins over `week`.
  - ‹ › link to `/?date=<Monday of prev/next week>` (or today when returning to the current week) via `shiftWeek`. The Mon–Sun selector links to `/?date=…`. Both are now `<Link>`s in `TopBar` (no client state for week/day). The selected day has `aria-current="date"`; today (when not selected) gets a skyblue underline + title "Today".
- **Today** (`lib/planner.ts#userToday`): reads `profiles.time_zone` / `rollover_hour` for the user and calls `plannerDate`. A missing profile or bad time zone falls back to the defaults (HCM / 7) instead of crashing.
- **Load or create** (`lib/planner.ts#loadPlanner`, runs in the server component with the user's RLS client):
  - weeks row for `week_start` and days row for the selected date: select → if missing, `upsert(..., { ignoreDuplicates: true })` → select again. Concurrent first loads can't create duplicates or fail.
  - **Quote:** only when the days row is created, a random `quotes.id` (`pickRandom`) is set as `quote_id`. On conflict nothing is written, and nothing else ever updates `quote_id`, so it stays fixed. The day is read with `quote:quotes(text, author)`.
  - week_tasks and day_tasks are read and mapped to all 12 / 5 slots (`lib/domain/views.ts`, pure + tests; missing slots are empty rows). Day fields (notes, highlight, what worked/didn't, rating, closed_at) come in `DayView`.
- `lib/supabase/server.ts` client is now typed with `Database` (join types are inferred).
- `Planner` gets `weekStart`, `selectedDate`, `today`, prev/next hrefs, tasks and `day`. It's keyed by date in `app/page.tsx`, so local state resets when the day changes. Edits are still local only (Server Actions = next step). The quote is hidden if a day has no quote (empty quotes table).
- `lib/sample-planner.ts` removed. The view types moved to `lib/domain/views.ts`, and `Feasibility` now comes from `lib/domain/overload.ts`.

How it was verified:
- `npm run lint` is clean, `npm test` is green (54), and `tsc` only shows the known `LayoutProps` error.
- Against the hosted project with `npm run dev` + curl, signed in via `dev-login-link.mjs` as a throwaway user (deleted afterwards):
  - `/` → today's week (Mon 09 Nov for Tue 2026-11-10) with today selected. `?date=2025-12-17` and `?week=2025-12-01` (→ Monday 12-01) both work, and `?date=bogus` → today. Prev/next hrefs are `/?date=2025-12-08` / `2025-12-22`.
  - Weeks and days rows are created once each. The quote_id stayed the same across 3 reloads (same quote text rendered). 5 parallel first requests for a new date → 200 ×5 and one row.
  - Rows inserted with the service role (week slot 7 done, day slot 2 with 6 pomodoros, notes) rendered correctly (value, checked, "+1", notes).

Decisions:
- Visiting any date creates its weeks/days rows (as the step asked). Empty days don't show in the review because `hasData` ignores them.
- No `server-only` package (not on the allowed list); `lib/planner.ts` is only imported by server components.

Next: Server Actions for autosave (week task title/done, day task title/bubbles/done, notes debounce 800ms) + the "saved" indicator.

## Phase 3c — Server Actions and autosave

What was done:
- `lib/domain/inputs.ts` (pure, with tests): zod schemas for `weekTaskPatch` (weekId uuid, slot 1–12, title?, isDone?), `dayTaskPatch` (dayId uuid, slot 1–5, title?, targetPomodoros 1–99 | null?, completedPomodoros 0–99?, isDone?) and `dayNotes` (≤20000 chars).
  - Titles are trimmed, max 500 characters; an empty title is stored as `null`. A patch with no fields is rejected.
  - `weekTaskRow` / `dayTaskRow` map only the fields that are present to columns, so a partial upsert never overwrites the other columns.
- `app/actions.ts` (Server Actions):
  - `saveWeekTask` and `saveDayTask` upsert by `(week_id, slot)` / `(day_id, slot)`. `saveNotes` updates `days.notes` by id.
  - They use the RLS cookie client, so a foreign weekId/dayId just fails. `saveNotes` treats 0 updated rows as a failure.
  - They return `{ ok }` and never throw, so the page can't crash on a failed save.
- `lib/use-saver.ts` (client hook):
  - Runs saves one after another, so rapid bubble clicks arrive in order.
  - Exposes one status: `saving…` / `saved` / `not saved` (warm). It is shown as small text in the top bar next to Review. This is the only feedback.
- `Planner` gets `weekId` / `dayId` from `loadPlanner`.
  - **Titles** save on blur, only if the trimmed value changed. **Enter** moves focus to the next slot's input (`#week-task-N`, `#day-task-N`), and that blur saves. On the last slot, Enter blurs. IME composition is ignored.
  - **Checkboxes** save immediately. **Bubbles** use `clickBubble` and save `completed_pomodoros` immediately.
  - **Notes** save after an 800ms debounce. They also flush on blur and on unmount, i.e. when switching day or week before the timer fires.
- `TaskRow` gets `inputId` / `nextInputId` / `onTitleCommit`, `Notes` gets `onBlur`, and `TopBar` gets a `status` slot.
- Target pomodoros: the action accepts it already. The UI box stays read-only until phase 4 (override + AI). No AI call is wired yet; the AI estimate hook goes in `commitDayTitle` later.

How it was verified:
- `eslint` is clean and `vitest` is green (61).
- I ran a headless Playwright script (in /tmp, not a project dependency) against `npm run dev` with the hosted Supabase project, as a throwaway user (deleted afterwards):
  - Enter moves focus week-task-1→2 and day-task-1→2; Enter on the last slot blurs.
  - Typed week tasks 1–2 (2 done) and day tasks 1, 2, 5 on 2025-12-16. Clicked bubbles 1–5, then 5 again → actual 4. Checked day task 1 and wrote notes. The status went `saving…` → `saved`.
  - Reload → all values persisted.
  - Switched to Wed 12-17 via the selector: week tasks were shared, and day tasks and notes were empty. Typed Wed data and clicked back to Tue **before** the 800ms debounce fired → Wed notes were still saved (flush on unmount). Tue data was intact.
  - Next week (12-22) was empty. A week task written there didn't show in the 12-15 week and vice versa, and both survived reloads.
  - No console errors.

Decisions:
- Titles save on blur/Enter, not on every keystroke. Notes are debounced instead.
- Failed saves show "not saved" in the warm color. The brief only names "saved", but silently losing data seemed worse. → listed in OPEN_QUESTIONS.

Next: phase 4 (AI estimate route, inline feasibility, target override, overload warning).

## Phase 3d — Layout review against the prototype (approved)

Screenshots (all in `docs/screenshots/`, regenerated from the Supabase-wired app on 2025-12-16 with prototype-like data):
- `compare-1440.png`: prototype (left) and app (right) side by side at 1440px.
- `compare-390.png`: the same at 390px.
- Single shots: `planner-1440.png`, `planner-390.png`, `planner-390-week-open.png`, `prototype-1440.png` and `prototype-390.png`.

How they were made:
- A throwaway user (deleted afterwards) opened `/?date=2025-12-16`.
- Week and day tasks were filled in with the service role (same titles as the prototype, plus targets, feasibility marks and one "+1" overflow), then the page was reloaded and captured with headless Chromium.
- No console errors. At 390px `scrollWidth` is 390, so there's no horizontal scroll.

Deliberate differences from the prototype (required by the brief):
1. **Top bar** replaces the prototype's sage "Daily Planner / Weekly Review" buttons and its full-name day buttons. It holds ‹ Week of DD MMM ›, a Mon–Sun selector (selected day in skyblue, today underlined), a Review link and the "saved" text indicator (§7).
2. **Day task row:** number · underline input · **target box** · **5 bubbles** (the prototype has 3) · **actual box** · checkbox · feasibility mark (§4). Over 5, the actual box shows "+N".
3. **Week tasks have a checkbox** (§1). The prototype's week rows have none.
3a. A done task stays editable: its title is muted with a line-through. The prototype disables the input instead, but the brief says everything stays editable.
4. **Real dates** are shown ("Week of dd / MM / yyyy", "Date dd / MM / yyyy"), not the blank `___/___/20__`.
5. **Colours:** pages use the `paper` (#FBFAF7) surface on a `cream` background (§4 tokens). The prototype has cream pages on a white card.
6. **Breakpoint:** the pages sit side by side at ≥900px and stack below that (§4). The prototype stacks below 1024px. On mobile the weekly page is collapsible ("Show ▾ / Hide ▴") and collapsed by default.
7. **Weekly Review** will be its own route `/review` (phase 5), not a toggle on the same page. **Close the day** (rating circles etc.) also comes in phase 5, so it isn't on the screenshots yet.

Result: **the human approved the layout with no changes.** Next: phase 4 (AI).

## Phase 4 — AI estimate, inline feasibility, target override, overload

What was done:
- **`lib/ai/estimator.ts`** is the one swappable function, `estimate({ title, category, otherTasks })`:
  - It calls OpenAI `gpt-4o-mini` with plain `fetch` (no SDK), using `response_format: json_object` and temperature 0.2. It reads `OPENAI_API_KEY` server-side only. With no key it returns `{ targetPomodoros: null }` without making a call.
  - The system prompt (`SYSTEM_PROMPT`) is ADHD-aware and conservative ("round up"). It counts task-switching cost, assumes a shift holds 15 pomodoros, asks for JSON only and keeps the note to one short neutral sentence.
  - `parseEstimate` is pure: strip ``` fences → `JSON.parse` → zod. `targetPomodoros` is coerced, rounded and clamped to 1–8. `feasibility` is trimmed and lowercased, and must be yes|warning|no (anything else counts as a failure). The note is whitespace-collapsed and capped at 200 chars.
  - A 5s `AbortController` timeout races the call, so a fetch that ignores the signal still times out. Non-OK status, network error, bad body or timeout all return `{ targetPomodoros: null }`. It never throws.
- **`app/api/estimate/route.ts`** takes `POST { title, category, otherTasks[] }`. The body is validated by `estimateRequest` in `lib/domain/inputs.ts` (title 1–500 chars, category enum, ≤10 other tasks). A signed-in user is required (`getClaims`), otherwise it returns 401. AI failures are answered with 200 `{ targetPomodoros: null }`.
  - `lib/supabase/middleware.ts` no longer redirects `/api/*` to /login, so the route can answer 401 itself.
- **`dayTaskPatch`** also accepts `feasibility` (yes|warning|no|null) and `feasibilityNote` (trimmed, empty → null).
- **UI** (`components/Planner.tsx`, `components/TaskRow.tsx`, `lib/ai/fetch-estimate.ts`):
  - The estimate is requested only when a day task title is created or changed (the commit on blur/Enter). The title save is queued first, and the AI request runs alongside it without blocking anything.
  - `otherTasks` holds the other non-empty day titles, with " (N pomodoros)" added when they have a target.
  - On success, target, feasibility and note are saved through `saveDayTask`. The mark shows inline (✓ sage, ⚠ warm, ✕ warm for "no"), and the note appears as small muted italic text under the row.
  - On failure (null, 401, timeout after 8s client-side, garbage) nothing changes and nothing is shown.
  - A per-slot sequence counter drops stale answers: a newer title edit or a manual target override during a pending request wins.
  - Clearing a title also clears that slot's target, feasibility and note, so an empty slot doesn't count towards overload.
  - Week tasks get no estimate. The brief only describes targets for day tasks.
- **Target override:** clicking the target box turns it into a small numeric input. Enter or blur saves, Escape cancels, an empty value clears the target (null), and invalid input (0, letters) is ignored. Allowed values are 1–99, the same as the action schema.
- **Overload:** a line under the day tasks, in warm italic, uses `overload()` / `totalTarget()` from `lib/domain/overload.ts`.
  - It shows "N pomodoros planned — the shift is getting tight." when the total is above 12, and "… more than one shift holds (15)." above 15.
  - Nothing renders when the total is ≤ 12. It works without AI, from manual targets.

How it was verified:
- `npm run lint` is clean and `npm test` is green (80).
  - New tests in `lib/ai/estimator.test.ts` (mocked fetch) cover: valid JSON, fenced JSON, garbage, non-OK status, malformed body, a fetch that throws, the 5s timeout with fake timers (aborted exactly at 5000ms, even when the fetch ignores the signal), out-of-range clamping (40→8, 0/-4→1, 2.6→3, "4"→4), feasibility normalisation, and the case where no key means no fetch.
  - Further tests for the new `inputs` schemas.
  - `tsc` shows only the known `LayoutProps` error.
- Against `npm run dev` + the hosted Supabase project, with a throwaway user (deleted afterwards) and headless Playwright from /tmp:
  - Unauthenticated `POST /api/estimate` → 401.
  - **Real OpenAI:** the project's key currently answers **429 "no credits remaining"**, so the route returned `{targetPomodoros:null}`. The task saved, the target stayed empty, there was no mark, and the status said "saved". This is the live failure path. The live success path could **not** be verified.
  - **Success path with `/api/estimate` mocked in the browser:** the target (4), ⚠ and the note appeared. The request body had the right category and otherTasks (including the "(7 pomodoros)" suffix).
  - Override 7 → overload (with 7+4+5=16) showed the "no" text, and overriding to 2 (13) showed the warning text. Escape and the invalid value "0" were ignored.
  - Blurring an unchanged title sent no request. A slow (1.5s) AI answer arriving after a manual override did not overwrite it.
  - After a reload, targets, marks, notes and the overload line persisted. Clearing a title cleared its estimate after the reload too.
  - At 390px, `scrollWidth` is 390. There were no console errors.
- **With `OPENAI_API_KEY` unset** (`env -u OPENAI_API_KEY npm run dev`): the route returned `{targetPomodoros:null}` in about 270ms. Tasks saved, manual targets 9+7 showed the "no" overload line, and everything persisted after the reload.

Decisions / open points (also in OPEN_QUESTIONS):
- A new AI estimate on a changed title overwrites an earlier manual target. A manual override keeps the AI mark and note from the last estimate.
- An unknown `feasibility` value from the model counts as a failure. It is not guessed.

Next: phase 5 (Close the day + Review).

## Phase 5 — Close the day + Weekly Review

What was done:
- **`components/CloseDay.tsx`**: a "Close the day" button sits at the bottom of the day page, under Notes. Clicking it opens an inline panel (not a modal) and focuses the first field.
  - The panel has Highlight, What worked and What didn't (textareas), plus Rating as ten tappable numbered circles (prototype `.rating-circle`; selected = sage with ink text for contrast). Tapping the selected number again clears the rating.
  - Opening the panel marks the day closed: `closed_at = now()`, set **once** (conditional update `closed_at is null`), so reopening or editing never moves it. A closed day loads with the panel already open and a small muted "closed" label.
  - Text fields autosave after an 800ms pause and flush on blur and on leaving the day, like Notes. The rating saves immediately. Everything goes through the shared `useSaver` and its "saved" indicator.
  - The day stays fully editable after closing (tasks, bubbles, notes and the panel).
- **Server Action `saveCloseDay`** (`app/actions.ts`) uses the zod schema `dayClosePatch` and `dayCloseRow` in `lib/domain/inputs.ts`. Text is trimmed, and empty text becomes null. The rating is an int 1–10 or null. `close: true` sets closed_at. RLS ensures ownership: if 0 rows are updated, it returns not saved.
- **`/review?week=YYYY-MM-DD`** (`app/review/page.tsx`, `lib/review.ts`, `components/ReviewCard.tsx`):
  - The week is normalised to Monday through `resolveSelection`. Without the param, it uses the current week from the user's rollover date.
  - It is read-only, so it never creates `weeks`/`days` rows. It loads the week's days, day tasks and week tasks, then aggregates them with `reviewWeek` from `lib/domain/review.ts`.
  - **Header:** ‹ Week of DD MMM › (prev/next week) and a "Planner" link back to `/?week=…`. Then the totals: day tasks done X of Y, pomodoros done (plus "of N planned" when targets exist), weekly tasks done X of Y. Below that, the weekly tasks are split into done and not done.
  - **One ReviewCard per day, Mon–Sun:** the date (links to that day in the planner) and the rating "N / 10" when set. A stats line shows "N done · M not done · P (of T) pomodoros", plus "· not closed" if the day was never closed. Then What got done (sage ✓), What didn't get done (muted ✗) and the Highlight in italics.
  - Days without data show a quiet "Nothing written down."
  - There are no percentages and no stars (see OPEN_QUESTIONS, "Weekly review content").
- **Fix in `lib/planner.ts`:** `ensureWeek`/`ensureDay` now take the id/row from the insert itself (`upsert … .select()`). Before, they re-read it with a separate select, and on the hosted project that read sometimes didn't see the just-inserted row yet. This made a brand-new user's very first page load fail with "week … could not be created" (reproduced 2 of 2 times, fixed afterwards). The re-read stays as a fallback for the concurrent-insert case.

How it was verified:
- `npm run lint` is clean and `npm test` is green (83, including new `dayClosePatch` tests).
- Against `npm run dev` with the hosted Supabase and AI disabled (`env -u OPENAI_API_KEY`), using a throwaway user (deleted afterwards) and headless Playwright:
  - Week 2025-12-15: two week tasks were added, one of them done.
  - Mon 12-15: 3 day tasks, 1 done, bubbles 3+1. The day was closed with highlight, worked, didn't and rating 8. Tue 12-16: 2 tasks, none done, 2 bubbles, closed with rating 5. No dialog element was present, and focus moved to the highlight field.
  - After reloading Monday, the panel was open with every value intact. Editing the highlight and adding a 4th task after closing both saved. `closed_at` in the DB was unchanged.
  - The Review link opened `/review?week=2025-12-15` showing Mon "8 / 10, 1 done · 3 not done · 4 pomodoros" with the 3 not-done tasks listed (including the one added after closing), and Tue "5 / 10, 0 done · 2 not done" with both tasks listed under not done. Both highlights appeared. Wed–Sun showed "Nothing written down." The weekly tasks were split 1 done / 1 not done.
  - After setting a target of 4 in the DB, the card showed "4 of 4 pomodoros" and the header showed "6 of 4 planned".
  - `/review` with no param went to the current week. `?week=2025-12-17` was normalised to Week of 15 Dec. "Planner" went to `/?week=2025-12-15`.
  - At 390px, `scrollWidth` was 390 on both pages. There were no console errors.
- Screenshots: `docs/screenshots/review-1440.png`, `review-390.png`, `close-day-1440.png` and `close-day-390.png`.

Decisions / open points (also in OPEN_QUESTIONS):
- "Closed" means the button was pressed. There is no "reopen". It doesn't need one, because everything stays editable.
- The review shows "not closed" for days with data that were never closed, and it shows no average rating (not in the brief).

Next: phase 6 (polish: keyboard, empty states, focus rings, AA contrast, README, Playwright smoke test).

## Phase 6 — Polish: keyboard, a11y, README, Playwright smoke

What was done:
- **Keyboard** (`components/TaskRow.tsx`):
  - In a title, Enter saves and moves to the next slot, as before. **Escape** now steps out to the row. Each row is a focusable `role="group"` (`tabIndex=-1`, `data-row`, `aria-keyshortcuts`).
  - A row-level `onKeyDown` acts only when focus isn't in a text field. Space toggles done; 1–5 = `clickBubble(n)` (day rows); Enter returns to the title. The checkbox and target box keep their native Space/Enter (`data-native-keys`).
  - Choice documented in OPEN_QUESTIONS.
- **Contrast** (user chose option A, see OPEN_QUESTIONS):
  - New text-only tokens `muted-text` #6B6B6B, `sage-text` #567540 and `warm-text` #8A6030 in `app/globals.css`. Every `text-muted/sage/warm` use was switched to them. Fills, bubbles and borders are unchanged.
  - Placeholders use `muted-text`. Text-field focus underlines use `sage-text`. The selected day number is full ink.
- **Focus rings:** a global `:focus-visible` 2px `sage-text` outline (offset 2px) on links, buttons, checkboxes and `[tabindex]`. Rows show the same outline on `:focus`.
- **Empty states:**
  - The review page shows one calm line instead of seven empty cards when the week has no data: "These pages are still blank. Plan a day and close it, and it will show up here."
  - Existing hints stay: "Nothing written down.", "No weekly tasks planned.", "Task" / "Notes…" placeholders.
- **README:** local setup in 7 commands (clone, install, `supabase start`, copy env, `db reset`, dev, test), the hosted alternative, the keyboard list, checks and e2e. It notes that the app works without `OPENAI_API_KEY`. `.env.example` gained `MAILPIT_URL` and `E2E_BASE_URL`.
- **Playwright:**
  - Added `@playwright/test` 1.65 (dev), `playwright.config.ts` (loads `.env.local`, starts or reuses `npm run dev`, chromium) and `npm run test:e2e`.
  - Exactly one test, `e2e/smoke.spec.ts`: magic-link login → type a day task + Enter → click bubble 1 → reload → title and bubble still there. It waits for the Server Action responses.
  - Login reads the email from Mailpit when `MAILPIT_URL` is set. Otherwise it uses the admin `generateLink` (hosted). The throwaway user is deleted.

How it was verified:
- `npm run lint` clean, `npm test` 83/83 green (`tsc` shows only the known `LayoutProps` typegen error).
- `npm run test:e2e` passes both with AI disabled (`env -u OPENAI_API_KEY`) and with the current key (OpenAI 429 → estimate null → task saved anyway).
  - The dev server logs a harmless `Error: aborted` when the reload cuts off an in-flight request.
- Temporary Playwright scripts (not committed, users deleted) against hosted Supabase:
  - **Keyboard:** typing "Write 1 2 3 tests " in a title changes no bubbles. Enter → slot 2 focused. Escape → row focused, with a computed outline of solid 2px rgb(86,117,64). "3" → 3 bubbles. Space twice → done/undone. Space on the checkbox toggles it once. "5" → 5 bubbles. Enter on the row → title focused. On a week row, Escape + Space → done, and "2" is a no-op. All of it persisted after reload. Tab focus on a link shows the ring.
  - **Definition of Done walkthrough, AI disabled**, day 2026-01-05:
    - Planned week task 1. Added day tasks 1 and 2 and set the targets manually (9 + 7), which showed the "16 … more than one shift holds (15)" line.
    - Filled 3 bubbles, checked task 1, wrote notes, closed the day with a highlight and rating 8. Everything was still there after reload.
    - `/review?week=2026-01-05` showed: 1 of 2 day tasks done, "3 of 16 planned" pomodoros, weekly 0 of 1 ("Ship release" not done). Monday showed 8/10, Fix migration done, Review PR not done, and the highlight. The other days showed "Nothing written down."
  - **Night-shift boundary:** covered by `lib/domain/rollover.test.ts` ("Tue 2025-12-16 02:00 local → 2025-12-15", plus 00:00/06:59/07:00 and DST cases). The server computes "today" with `plannerDate` in the profile time zone.

Skipped / open:
- The local-stack paths (README `supabase start`/`db reset`, smoke test via Mailpit) weren't run because there is no Docker in the container.
- Hairlines and empty-bubble outlines stay below 3:1 (decorative).

Next: phase 7 (deploy) — only when asked.

## MVP acceptance check

- **Result: the user accepted the MVP**, with every recommended answer to the open questions (see OPEN_QUESTIONS → "Answers").
- Checklist for the manual walkthrough: `docs/ACCEPTANCE.md`.
- Verified by the agent:
  - The OpenAI key works now. Live estimates came back in 1–2.5 s.
  - The redirect allow-list sends magic links to localhost (admin `generateLink` → verify 303 → `localhost:3000/auth/callback`).
- Changes made from the answers:
  - **Sticky manual target.** New migration `20261110225842_day_task_target_is_manual.sql` (adds `day_tasks.target_is_manual bool not null default false`), applied to the hosted DB with `db push`. `lib/db-types.ts` was regenerated.
    - Pure helpers `estimatePatch` / `manualTargetPatch` in `lib/domain/target.ts`, with tests. Also wired through `dayTaskPatch` and `toDayTaskViews`, and the planner query selects the column.
  - **Sign out:** a "sign out" link in the top bar (`signOut` server action in `app/login/actions.ts`).
  - **Review header:** shows "Average rating" (from `reviewWeek().totals.averageRating`).
- How it was verified:
  - `npm run lint` clean, `npm test` 91/91, `npm run test:e2e` passes.
  - A temporary Playwright run with real AI (spec deleted afterwards, user deleted):
    - AI target 3 ✓ → manual 7 → rename → still 7, and still 7 after reload.
    - Clear the box → rename → the AI fills in 3.
    - Close the day with rating 8 → the review header shows "Average rating 8 / 10".
    - Sign out → `/login`, and `/` then redirects to `/login`.
- Open:
  - A real inbox magic-link email wasn't tested by the agent (the user's choice).
  - Phase 7 (deploy) only when asked. Remember to `db push` the new migration to the cloud project too. It's already applied on the current hosted project.

## UI redesign step 1 — Design files + UI audit and mapping (fantasy themes)

What was done:
- Added `docs/ui/DESIGN.md` (exact copy of the attached design), `docs/ui/themes.css` (exact CSS from the project instruction) and `docs/ui/UI_AGENT_PROMPT.md` (the task prompt for the following steps).
- Read CLAUDE.md and the UI files only: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `app/review/page.tsx`, `app/login/page.tsx` (classes only), `components/*`. No code changed in this step.

### Facts that shape the work
- **Tailwind v4, there is no `tailwind.config.*`.** Tokens live in `app/globals.css` `@theme`. The prompt's `tailwind.config` mapping will therefore be done in `@theme` instead (e.g. `--color-page: var(--page)`, `--color-accent: var(--accent)`, `--font-head: …`, `--radius-page: var(--radius)`), giving the same utilities (`bg-page`, `text-accent`, `font-head`, `rounded-page`).
  - Name clashes to watch: `@theme` already defines `--color-ink`, `--color-muted`, `--color-line`, which become `var(--ink)` etc. `--font-head`/`--font-body` are set by themes.css per theme, so the Tailwind font tokens must be named differently in `@theme` or reference them without redefining them (decide in step 2; no self-reference loops).
- **Bubble click logic:** `components/Planner.tsx` → `onBubbleClick` on `DayTaskRow` calls `clickBubble()` (`lib/domain/bubbles.ts`) then `saveDayTask`. The same handler is reached from the row keys 1–5 (`rowKeys` in `components/TaskRow.tsx`). `components/Bubbles.tsx` only renders and calls `onClick(n)`.
- **Task-done logic:** `components/Planner.tsx` `onToggleDone` for week rows (`saveWeekTask`) and day rows (`saveDayTask`). Reached from the native checkbox `onChange` and from Space on a focused row (`rowKeys`).
- **Close-day logic:** `components/CloseDay.tsx`. Clicking "Close the day" opens the inline panel **and** sets `closed_at` right away (`saveCloseDay({ close: true })`, set once). Text fields debounce 800ms, rating saves immediately, tapping the selected rating clears it. There is no "unclose".
- **Animation hooks (step 4 of the prompt)** fit in `Planner.tsx`: `lastPop` set inside `onBubbleClick` when the new count > old count; `lastSpark` set inside `onToggleDone` when `isDone` becomes true. Both handlers are user-triggered only (initial state comes from props), so sparks never fire on load.

### Old colour classes (all to be replaced)
`dark` is not used anywhere. Also replaced: the text-only AA tokens `muted-text`, `sage-text`, `warm-text` (phase 6) and `paper`.
- `app/globals.css`: `@theme` tokens cream/paper/sage/skyblue/warm/muted(-text)/sage-text/warm-text/line, `body` cream background + Georgia + line-height 1.8, `::placeholder` muted-text, `:focus-visible` sage-text outline.
- `app/layout.tsx:12` `bg-cream font-serif text-ink`.
- `app/login/page.tsx:13` `bg-paper` + shadow, `:33` `focus:border-sage-text`, `:39` `decoration-sage`, `:44` `text-warm-text`.
- `app/review/page.tsx:49` `decoration-skyblue`, `:55` `bg-paper` + shadow; many `text-muted-text`.
- `components/Bubbles.tsx:27` `border-sage bg-sage`, `hover:bg-[#f0ede8]`.
- `components/CloseDay.tsx:107` `border-sage hover:bg-sage/10`, `:136` `focus:border-sage-text`, `:156` `border-sage bg-sage hover:border-sage`.
- `components/Notes.tsx:23` `focus:border-sage-text`.
- `components/Planner.tsx:175` `text-warm-text` (save error), `:182` `bg-paper` + shadow, `:268` `text-warm-text` (overload line).
- `components/ReviewCard.tsx:17` `text-sage-text`, `:33` `bg-paper`, `:36` `decoration-skyblue`.
- `components/TaskRow.tsx:9–11` feasibility marks `text-sage-text` / `text-warm-text`, `:15` `focus:border-sage-text`, `:16` `accent-sage` (checkbox), `:60` `focus:outline-sage-text` (row focus), `:167` `hover:border-sage`, `:199` `focus:border-sage-text`.
- `components/TopBar.tsx:53` `border-skyblue bg-skyblue hover:border-skyblue`, `:54` + `:68` `decoration-skyblue`.

### Mapping: existing component → what changes
| Area | Today | Change |
|---|---|---|
| **Header** | None. `TopBar` is a single nav row (week arrows, day selector, saved status, Review link, sign out). | New header row in `Planner`: "Planner" (`.head`, 26px, 3px tracking) + subline `{done} / {target} {unit} gathered today` (sum of `completedPomodoros` / `totalTarget()` of the day tasks) + `ThemeSwitcher` (3 `.pill`). |
| **Week nav + day pills** (`TopBar.tsx`) | `<Link>`s, "Week of dd MMM", day = weekday + date number, selected = skyblue + `aria-current="date"`, today underlined. | "Week of 9 November" (`d MMMM`), arrows and days as `.pill`. Days stay `<Link>` (URL state) — see Q2 for the selected style. |
| **Pages** (`Planner.tsx`, `Page.tsx`) | One paper sheet, CSS grid 2 cols ≥900px, `Page` sections separated by a border; max-width 1400. | Two separate `.page` cards in a flex-wrap row, gap 24px, week `flex: 1 1 460px`, day `flex: 1 1 560px`, padding 32px, inner gap 22px; max-width 1280, page padding 32px 24px. They stack below ~1000px by flex-basis. |
| **Week page** | "Weekly Planning" + "Week of dd / MM / yyyy"; section titles from the prototype; collapsible below 900px (Show/Hide). | Themed page title ("Quests of the Week" …) and themed section names + DESIGN subtitles from `lib/theme.ts`. Collapse toggle: see Q5. |
| **Day page** | "Daily" left, date + weekday right; prototype section titles. | Date (left) + weekday uppercase (right); themed section names + DESIGN subtitles. |
| **TaskRow (day)** | `div[data-row]` flex-wrap: num · underline `<input>` (line-through when done) · TargetBox (button→input) · Bubbles · CountBox · native checkbox · feasibility mark · note line. | `.row[data-done]`, `.num`, `.title` **wrapper span around the input** (the `::after` strike can't live on an `<input>`), target as `.box` (still click-to-edit), `Bubble`×5, `.box.actual`, `.chk` button (`aria-pressed`, label "Day task N done"), `data-spark`. Keyboard shortcuts, Enter/Escape, ids unchanged. Feasibility: see Q4. |
| **TaskRow (week)** | num · input · native checkbox. | Same `.row` with `.num`, `.title`, `.chk`. |
| **Bubbles** (`Bubbles.tsx`) | 5 round buttons, sage fill, `aria-label "Pomodoro N"`, `tabIndex=-1`, "+N" overflow. | New `components/Bubble.tsx` (`.bub[data-shape]`, SVG per theme: orb/star/fly, `aria-pressed`, `data-pop`, key `${index}-${n}`), label "Pomodoro N for {title}". `Bubbles` keeps the loop and "+N". Keep `tabIndex=-1` (focus stays on rows, keys 1–5) — phase 6 decision. |
| **Check** | native `<input type=checkbox accent-sage>`. | `.chk` `<button aria-pressed>` with the SVG + `.burst`. Space/Enter native on button (keep `data-native-keys`). |
| **Quote** (`Quote.tsx`) | Georgia italic 0.95rem, small-caps author, top/bottom hairline. | Italic 22px centered (body font), author uppercase 12px muted. |
| **Notes** (`Notes.tsx`) | "Notes" + subtitle, bordered textarea. | Themed title ("Scroll of notes" …), `.field` textarea; subtitle kept; autosave unchanged. |
| **Close-the-day** (`CloseDay.tsx`) | Outlined "Close the day" button → panel (always open once closed), "closed" label. | Themed button (`.btn`), panel `.unfold`, textareas `.field`, sealed stamp `.seal` with themed text + rating, "Reopen the day" `.btn.ghost`. Flow: see Q1. |
| **Rating** | 28px round buttons, sage when selected. | `.rate` (44px), `aria-pressed` kept; deselect-on-retap kept. |
| **Sealed state** | small italic "closed". | `.seal` stamp (see Q1). |
| **Weekly Review** (`app/review/page.tsx`, `ReviewCard.tsx`) | paper sheet, sage ✓, skyblue underlines. | `.page` surfaces, `.head` headings, done ✓ in `--accent`, not-done in `--muted`, links underline in accent, `.pill`/arrows for week nav. No animations. |
| **Login** (`app/login/page.tsx`) | paper card, sage/warm. | Not in DESIGN; restyle with the same tokens (`.page`, `.field`, `.btn`, title "Planner") so it isn't left in the old palette. |
| **Status / warnings** | "saving… / saved / not saved" (warm on error), overload line in warm, feasibility ⚠/✕ in warm. | No warning colour exists in themes.css — see Q4. |
| **Global** | Georgia, line-height 1.8, sage focus ring for `[tabindex]` rows and checkboxes. | Fonts via `next/font` + themes.css; themes.css focus ring covers button/a/input/textarea; add the same `--glow` ring for `[data-row]:focus` (rows are `tabIndex=-1` groups). |

### Differences from DESIGN.md §3–4 and proposed approach (needs user confirmation)
The structure matches well (separate week/day halves, rows num·title·target·bubbles·actual·check, inline close-day). No big restructuring is needed. Points that need a decision:
1. **Q1 Close-the-day flow.** Today one click opens the panel *and* sets `closed_at`. DESIGN has a button → unfolding panel → sealed stamp + "Reopen the day". `closed_at` can't be cleared without changing the Server Action. **Proposal (no logic change):** the themed button ("Seal the day") opens the panel with `.unfold` and sets `closed_at` as today. While the day is closed, the `.seal` stamp (themed text + rating or "—") drops in above the fields. On a closed day loaded later, the stamp shows with the panel folded and a "Reopen the day" ghost button that unfolds the fields again for editing (UI state only; `closed_at` stays).
2. **Q2 Day pills are links, not toggle buttons.** `aria-pressed` on a link is invalid. **Proposal:** keep `<Link aria-current="date">`, and add one rule in globals.css: `.pill[aria-current="date"]` = same look as `.pill[aria-pressed="true"]`. Pill text: weekday + date number ("Mon 9"), today keeps a subtle underline.
3. **Q3 Header subline "today".** The page loads only the *selected* day. **Proposal:** count the selected day's tasks; text says "gathered today" when the selected day is today, otherwise "gathered on Mon 9".
4. **Q4 Warning colour.** themes.css has no warning token, but feasibility ⚠/✕, the overload line and "not saved" use `warm`. **Proposal:** no new colour: ✓ in `--accent`, ⚠/✕ and the overload line in `--ink` italic (symbol carries the meaning), "not saved" in `--ink`. Alternative: add a `--warn` token per theme (design change).
5. **Q5 Week collapse on mobile.** DESIGN only says "stack, week first". **Proposal:** keep the existing Show/Hide toggle below ~1000px (it keeps the day page near the top on phones), styled as `.btn.ghost`.
6. **Q6 Header right side.** DESIGN puts only the theme switcher there; the app also has Review, sign out and the saved status. **Proposal:** header right = theme switcher + Review link + sign out (small `.btn.ghost`); saved status as small muted text under/next to the subline.
7. Tailwind v4: mapping goes into `@theme` in globals.css (no config file) — informational.
8. Breakpoint changes from 900px (CLAUDE.md) to ~1000px via flex-basis (DESIGN wins for visuals) — informational.

Next step (after confirmation): fonts + tokens (`app/layout.tsx`, `app/globals.css`).
