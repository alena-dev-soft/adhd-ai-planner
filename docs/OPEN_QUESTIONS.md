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

## Phase 4

- **OpenAI key has no credits.** `OPENAI_API_KEY` currently gets 429 `insufficient_quota`, so the app runs as "AI disabled". The live success path is untested (only with a mocked route). Add credits, then type a day task once to confirm.
- **Override vs. AI mark.** A manual target keeps the ✓/⚠/✕ mark and the note from the last AI estimate, even though the mark was judged against the AI's own number. Should a manual override clear the mark?
- **Changed title vs. manual target.** Renaming a task triggers a new estimate that replaces a manual target. Should a manual target be "sticky" instead?

## Phase 5

- **When is a day "closed"?** Pressing "Close the day" sets `closed_at` (once) and opens the panel. A closed day always shows the panel. There is no "reopen" and no way to clear `closed_at`, but all fields stay editable. Is that the intended meaning?
- **Rating toggle.** Tapping the selected rating again clears it (null). Is that OK, or should a rating, once set, only be changeable?
- **Review extras.** The review shows "· not closed" on days that have data but were never closed. It shows no average rating, even though `reviewWeek` computes one. Should the week header show the average?
- **Weekly-task-linked day tasks** (`day_tasks.week_task_id`) aren't used anywhere in the UI or the review. The brief defines the column but no behavior for it.

## Phase 6

- **Row focus vs. input focus (keyboard).** The brief says "on a focused row, Space toggles done and keys 1–5 set pomodoros", but every row is mostly a text input, where Space and digits must type. Decision:
  - While a text field (title, target editor) has focus, all keys type normally. **Escape** in a title moves focus to the row itself (`tabIndex=-1`, outlined in darker sage). Clicking the row's empty space or a bubble also focuses the row.
  - With the row (or a bubble or the checkbox) focused: **Space** toggles done, **1–5** acts like clicking that bubble (so pressing the current count's key removes one, the same as the brief's bubble rule), and **Enter** goes back to the title. The checkbox and target box keep their native Space/Enter.
  - Week rows: Space and Enter only, since they have no pomodoros. Rows aren't extra Tab stops. Is Escape a good enough way in, or should rows be in the Tab order?
- **Contrast (WCAG AA, text on cream #F5F3EF).** muted #9A9A9A = 2.54:1, sage #A8C48F = 1.73:1, warm #D4A574 = 2.01:1. All fail 4.5:1 as text. **User decision (option A):** fills, bubbles and borders keep the tokens, and text uses new darker shades: `muted-text` #6B6B6B (4.81), `sage-text` #567540 (4.72), `warm-text` #8A6030 (4.99).
  - The same shade is used for placeholders, text-field focus underlines and the focus ring (2px `sage-text`), because sage itself is 1.73:1 and fails the 3:1 non-text minimum.
  - The day number on the selected (skyblue) day button is now full ink. It was ink/70, at 3.97:1.
  - Still below 3:1 and left as is (decorative, not the only cue): the hairline borders #E8E3DD, empty bubble outlines, and the skyblue selected-day fill (the selection is also exposed as `aria-current`).
- **Playwright login on hosted Supabase.** The smoke test reads the real magic-link email from Mailpit when `MAILPIT_URL` is set (local stack). This project runs on hosted Supabase without Docker, so here it gets the same link from the admin API (`generateLink`) instead. The Mailpit path hasn't been run (no Docker in the agent container).
- **README local setup not run end to end.** `supabase start` / `db reset` need Docker, which the agent container doesn't have. The commands follow the brief and the Supabase CLI docs.
