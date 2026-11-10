# ADH Planner

A calm, paper-like digital Productivity Planner: a weekly page and a daily page with pomodoro bubbles,
built for night shifts (a day belongs to the date it started; with the default rollover hour 7,
Tuesday 02:00 still counts as Monday).
See `CLAUDE.md` for the brief and `docs/PROGRESS.md` for status.

## Setup (local Supabase, needs Docker + Node ≥ 20)

```bash
git clone <repo-url> adh-planner && cd adh-planner
npm install
npx supabase start                 # local Postgres/Auth/Mailpit in Docker
cp .env.example .env.local         # then fill in the values printed by `npx supabase status`
npx supabase db reset              # migrations + seed (quotes)
npm run dev                        # http://localhost:3000 → /login
npm test                           # unit tests (Vitest)
```

In `.env.local` set `NEXT_PUBLIC_SUPABASE_URL` to the API URL (`http://127.0.0.1:54321`) and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` to the anon / publishable key from `npx supabase status`.
The magic-link email arrives in the local Mailpit inbox (the Mailpit/Inbucket URL from `supabase status`, usually http://127.0.0.1:54324).

**AI is optional.** Without `OPENAI_API_KEY` (or when OpenAI fails or takes longer than 5s), tasks still save,
the target box stays empty for you to fill in, and the overload warning works from your own targets.

### Hosted Supabase instead of Docker

This project is developed against a hosted Supabase project (see `docs/SETUP.md`):

```bash
cp .env.example .env.local                                # project URL + publishable key (+ service key for tests)
npx supabase db push --db-url "$SUPABASE_DB_URL" --yes    # migrations
psql "$SUPABASE_DB_URL" -f supabase/seed.sql              # quotes (idempotent)
```

In the dashboard, Auth → URL Configuration must allow `http://localhost:3000/**`.
To sign in without an email (needs `SUPABASE_SERVICE_ROLE_KEY`):
`node --env-file=.env.local scripts/dev-login-link.mjs you@example.com` and open the printed URL.

## Keyboard

- In a task title: **Enter** saves and moves to the next slot, **Escape** steps out to the row.
- With the row focused (after Escape, or clicking the row's empty space or a bubble): **Space** toggles done,
  **1–5** works like clicking that bubble (day tasks), **Enter** goes back to the title.

## Checks

```bash
npm run lint && npm test
npx playwright install chromium    # once
npm run test:e2e                   # smoke test: login → add task → fill bubble → reload
```

The smoke test starts `npm run dev` itself (or reuses a running one). It logs in via
the local Mailpit when `MAILPIT_URL` is set (e.g. `MAILPIT_URL=http://127.0.0.1:54324`).
Otherwise it uses the admin API, which needs `SUPABASE_SERVICE_ROLE_KEY`. The throwaway user is deleted afterwards.
