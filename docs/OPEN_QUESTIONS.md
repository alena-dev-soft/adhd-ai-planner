# Open questions

- **Hosted Supabase instead of local stack (step 0).** CLAUDE.md phases 1–2 assume `supabase start`, Inbucket/Mailpit and `supabase db reset`. The user chose a hosted project, so:
  - Magic-link emails go to real inboxes, and Supabase's built-in SMTP has a low hourly rate limit. For automated checks we can create users and generate links with the admin API (`auth.admin.generateLink`) using the service key.
  - We can't run `db reset`. Migrations are applied with `db push --db-url`; seed with `--include-seed` or psql.
  - Auth → URL Configuration in the dashboard must allow `http://localhost:3000/**` (and later the Vercel URL) as a redirect URL. We couldn't check this with the keys we have; the user needs to confirm it.
- **`SUPABASE_URL` secret has `/rest/v1/` on the end.** Either the user fixes the secret, or the code uses `new URL(...).origin`.
- **Env var names.** Client-side Supabase needs `NEXT_PUBLIC_*` vars. Phase 1 should map `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` from these values (e.g. in `next.config`) or add them to `.env.local`.
