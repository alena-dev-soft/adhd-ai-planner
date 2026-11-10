# Local development prerequisites

Do this once on the dev machine before phase 1 (Skeleton). See CLAUDE.md §3.

| Tool | Check | Notes |
|---|---|---|
| Node.js LTS (≥ 20, 22 recommended) | `node --version` | https://nodejs.org |
| git | `git --version` | |
| Docker (daemon running) | `docker ps` | Docker Desktop / OrbStack / Colima. Supabase local stack runs in Docker. |
| Supabase CLI | `supabase --version` | `brew install supabase/tap/supabase` (macOS/Linux) or `scoop install supabase` (Windows). `npx supabase` also works (verified: CLI 3.1.0). |

Done when `docker ps` and `supabase --version` both run without errors.

## OpenAI API key (needed from phase 4)

1. Create a key at https://platform.openai.com/api-keys (project with access to `gpt-4o-mini`; add billing/credit).
2. Keep it ready. After the skeleton exists, put it **only** in `.env.local`:

   ```
   OPENAI_API_KEY=sk-...
   ```

3. Never commit it. `.env*.local` and `.env` are gitignored (verified with `git check-ignore -v .env.local`). Only `.env.example` (no real values) is committed.

The app must work without the key (AI disabled → targets stay empty, no error).
