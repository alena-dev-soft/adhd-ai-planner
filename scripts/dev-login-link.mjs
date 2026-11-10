// Dev/test helper: print a one-time sign-in URL for the local app without sending an email.
// Needs SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in the env.
// Usage: node --env-file=.env.local scripts/dev-login-link.mjs you@example.com [http://localhost:3000]
import { createClient } from "@supabase/supabase-js";

const [email, appUrl = "http://localhost:3000"] = process.argv.slice(2);
if (!email) {
  console.error("usage: node --env-file=.env.local scripts/dev-login-link.mjs <email> [appUrl]");
  process.exit(1);
}

const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL).origin;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error) {
  console.error(error.message);
  process.exit(1);
}

const { hashed_token, verification_type } = data.properties;
console.log(`${appUrl}/auth/callback?token_hash=${hashed_token}&type=${verification_type}`);
