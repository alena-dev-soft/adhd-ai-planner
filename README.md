# ADH Planner

A calm, paper-like digital Productivity Planner (weekly page + daily page with pomodoro bubbles).
See `CLAUDE.md` for the brief and `docs/PROGRESS.md` for status.

## Setup

```bash
npm install
cp .env.example .env.local      # fill in NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY (hosted Supabase project)
npx supabase db push --db-url "$SUPABASE_DB_URL" --yes   # apply migrations
psql "$SUPABASE_DB_URL" -f supabase/seed.sql              # quotes (idempotent)
npm run dev                     # http://localhost:3000 → redirects to /login
```

In the Supabase dashboard, Auth → URL Configuration must allow `http://localhost:3000/**`.

Sign in without waiting for an email (needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`):

```bash
node --env-file=.env.local scripts/dev-login-link.mjs you@example.com   # open the printed URL
```

## Checks

```bash
npm run lint && npm test
```
