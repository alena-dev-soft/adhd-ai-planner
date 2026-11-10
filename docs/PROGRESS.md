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
