# Development environment

**Decision (user, step 0):** we use a **hosted Supabase project**, not the local Docker stack.
Docker is not needed. All checks run in the agent container (Linux, root).

## Tools

| Tool | Check | Notes |
|---|---|---|
| Node.js LTS (≥ 20) | `node --version` | container: v22 |
| git | `git --version` | |
| Supabase CLI | `npx supabase@latest --version` | container: 3.1.0, no global install needed |
| psql | `psql --version` | `apt-get install -y postgresql-client` (container: 15.x client, server is Postgres 17) |

## Secrets / env vars

Stored in the project Secrets (available as env vars in the agent's `run_command`) and written into `.env.local` (gitignored).
Variable names only — never commit values. See `.env.example`.

| Var | Use |
|---|---|
| `SUPABASE_URL` | Supabase project URL. **The current value has `/rest/v1/` on the end.** Use only the origin (`https://<ref>.supabase.co`), e.g. `new URL(process.env.SUPABASE_URL!).origin`, or fix the secret |
| `SUPABASE_ANON_KEY` | publishable key (`sb_publishable_…`, new key format), used by the browser/server clients under RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | secret key (`sb_secret_…`), server/tests only (create test users for the RLS check) |
| `SUPABASE_DB_URL` | Postgres connection string, for migrations and psql checks |
| `OPENAI_API_KEY` | phase 4, `gpt-4o-mini`, server-only. The user uses the same key locally |

## Migrations (instead of `supabase start` / `db reset`)

```
npx supabase@latest migration new <name>
npx supabase@latest db push --db-url "$SUPABASE_DB_URL"        # apply
npx supabase@latest db push --db-url "$SUPABASE_DB_URL" --include-seed   # apply + seed.sql
psql "$SUPABASE_DB_URL" -c '\dt public.*'                       # verify
npx supabase@latest gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > lib/db-types.ts
```

The app must keep working without `OPENAI_API_KEY` (AI disabled → targets stay empty, no error shown).
