# Open questions

- **Hosted Supabase instead of local stack (step 0).** CLAUDE.md phases 1–2 assume `supabase start`, Inbucket/Mailpit and `supabase db reset`. The user chose a hosted project, so:
  - Magic-link emails go to real inboxes, and Supabase's built-in SMTP has a low hourly rate limit. For automated checks we can create users and generate links with the admin API (`auth.admin.generateLink`) using the service key.
  - We can't run `db reset`. Migrations are applied with `db push --db-url`; seed with `--include-seed` or psql.
  - Auth → URL Configuration in the dashboard must allow `http://localhost:3000/**` (and later the Vercel URL) as a redirect URL. We couldn't check this with the keys we have; the user needs to confirm it.
- **`SUPABASE_URL` secret has `/rest/v1/` on the end.** Either the user fixes the secret, or the code uses `new URL(...).origin`.
- **Env var names.** Client-side Supabase needs `NEXT_PUBLIC_*` vars. Phase 1 should map `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from these values (e.g. in `next.config`) or add them to `.env.local`.

## Prototype vs. brief (resolved by the brief)

Rule from CLAUDE.md: layout/styling → the prototype wins; behavior/data → the brief wins.

- **Task row controls.** The prototype shows 3 bubbles and no target/actual boxes. → **Brief:** row = number · underline input · target box · 5 bubbles · actual box · checkbox (plus AI feasibility mark). Over 5 completed → "+N".
- **Checking a task disables its input.** The prototype sets `disabled` (greyed and struck through) on check. → **Brief:** the day stays editable. Checking marks the task done visually, but the title stays editable.
- **Navigation.** The prototype has "Daily Planner / Weekly Review" toggle buttons and a full-name day button row. → **Brief:** top bar with `‹ Week of DD MMM ›`, a Mon–Sun selector and a link to `/review` (a separate route).
- **Weekly review content.** The prototype shows a completion % and star ratings. → **Brief:** per day show done / not done / highlight / rating / pomodoros (done vs target). No % badge, no stars; rating is shown as a number.

## Phase 1

- **Sign out.** The brief doesn't list a sign-out control, so none was added. Sessions last until the cookie expires or is cleared. Should a small "sign out" link go in the top bar?
- **Real magic-link email not verified by the agent** (hosted SMTP, rate limit). Only the admin `generateLink` → `token_hash` path was tested. The user needs to test the email path once and confirm that the dashboard redirect allow-list contains `http://localhost:3000/**`.

## Phase 3c

- **Failed save feedback.** The brief allows only a small "saved" indicator. When a save fails (network/RLS), the indicator says "not saved" in warm instead of staying silent. There is no retry: the next edit saves the full field again. Is that OK?
