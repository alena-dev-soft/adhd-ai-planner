# Progress

## Step 0 — Local environment & keys (human prerequisites)

What was done:
- Added `docs/SETUP.md`: required tools (Node LTS, git, Docker running, Supabase CLI) with check commands, and how to obtain/store `OPENAI_API_KEY`.
- Fixed `.gitignore`: the repo shipped with a Visual Studio template that did **not** ignore `.env.local`, `node_modules/` or `.next/`. Added Node/Next/Supabase/Playwright entries and `.env` / `.env*.local` (with `!.env.example`). Verified: `git check-ignore -v .env.local` → ignored.

Verified in the agent container: Node v22, npm 10.9, git 2.39, `npx supabase --version` → 3.1.0.
Not available in the agent container: Docker (so `supabase start` cannot run there). Docker/Supabase on the human dev machine must be confirmed by the user — see status below.

Open points:
- Human dev machine confirmation (`docker ps`, `supabase --version`, OpenAI key ready): see "Human confirmation" below.
