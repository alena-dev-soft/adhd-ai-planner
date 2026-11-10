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
