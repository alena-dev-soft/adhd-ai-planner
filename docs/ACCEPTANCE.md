# MVP acceptance checklist

Run locally: `npm install && npm run dev` → http://localhost:3000 (hosted Supabase from `.env.local`).
Tick each line; note anything wrong under "Fixes".

## Pre-check (agent, before handing over)
- [x] `npm run lint` clean, `npm test` 83/83 green.
- [x] OpenAI: key now works (gpt-4o-mini, live estimates in 1–2.5 s, e.g. "Fix ABC database migration" → 3, warning).

## Walkthrough (human)
1. [ ] Login: magic link email arrives in your real inbox and opens the planner (redirect allow-list contains `http://localhost:3000/**`).
2. [ ] Week page: type 5 important + a few secondary tasks, Enter moves to the next slot; check one off.
3. [ ] Day page: type tasks with Enter. With AI: target fills and ✓/⚠/✕ mark + note appear within ~5 s. Without AI: task saves, target stays empty, no error.
4. [ ] Click the target box to override; set targets so the sum > 12 (warning) and > 15 ("no").
5. [ ] Bubbles: click bubble 3 → 3 filled; click bubble 3 again → 2. Keyboard: Escape in a title, then 1–5 / Space.
6. [ ] Notes: type, wait ~1 s, "saved" appears; reload → still there.
7. [ ] Night shift: after midnight and before 07:00 (Asia/Ho_Chi_Minh), open `/` → the selected day is still the **previous** date. Close the day (highlight, worked, didn't, rating). After 07:00 `/` shows the new date.
8. [ ] `/review` shows the closed day(s) with done / not done / highlight / rating / pomodoros.
9. [ ] Phone width (~390 px): pages stacked, week page collapsible.

## Fixes
None. The user accepted the MVP. The open-question answers were implemented (sign out, sticky manual target, average rating).
