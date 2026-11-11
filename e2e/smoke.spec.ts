import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Smoke test: magic-link login → add a day task → fill a bubble → reload → still there.
//
// Login, two ways:
// - MAILPIT_URL set (local stack, `supabase status` → Mailpit/Inbucket URL): submit the
//   /login form and open the link from the email caught by Mailpit.
// - otherwise (hosted Supabase): ask the admin API for the same magic link the email
//   would contain (needs SUPABASE_SERVICE_ROLE_KEY), so no real email is sent.
// The throwaway user is deleted afterwards when the service key is available.

const email = `smoke-${Date.now()}@example.com`;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const mailpit = process.env.MAILPIT_URL?.replace(/\/$/, "");

const admin =
  supabaseUrl && serviceKey
    ? createClient(new URL(supabaseUrl).origin, serviceKey, { auth: { persistSession: false } })
    : null;

async function linkFromMailpit(page: Page): Promise<string> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("button", { name: /link/i }).click();
  await expect(page.getByText(/check your email/i)).toBeVisible();

  for (let i = 0; i < 30; i++) {
    const search = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const msg = (await (await fetch(`${mailpit}/api/v1/message/${messages[0].ID}`)).json()) as {
        Text: string;
      };
      const url = msg.Text.match(/https?:\/\/\S+\/auth\/v1\/verify\S+/)?.[0];
      if (url) return url.replace(/&amp;/g, "&").replace(/[)\]>]+$/, "");
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`no magic link for ${email} in Mailpit`);
}

async function linkFromAdmin(): Promise<string> {
  if (!admin) throw new Error("set MAILPIT_URL (local) or SUPABASE_SERVICE_ROLE_KEY (hosted)");
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const { hashed_token, verification_type } = data.properties;
  return `/auth/callback?token_hash=${hashed_token}&type=${verification_type}`;
}

test.afterAll(async () => {
  if (!admin) return;
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users.find((u) => u.email === email);
  if (user) await admin.auth.admin.deleteUser(user.id);
});

test("login → add day task → fill bubble → reload → still there", async ({ page }) => {
  const link = mailpit ? await linkFromMailpit(page) : await linkFromAdmin();
  await page.goto(link);
  await expect(page).toHaveURL(/\/(\?.*)?$/);

  const title = `Smoke task ${Date.now()}`;
  const row = page.getByRole("group", { name: "Day task 1", exact: true });
  const input = row.getByRole("textbox", { name: "Day task 1", exact: true });
  const status = page.getByRole("status");

  // A Server Action POST carries the Next-Action header; wait for it to finish.
  const saved = () =>
    page.waitForResponse((r) => r.request().method() === "POST" && !!r.request().headers()["next-action"]);

  await input.fill(title);
  await Promise.all([saved(), input.press("Enter")]); // saves the title, focus moves to slot 2

  const bubble1 = row.getByRole("button", { name: "Pomodoro 1" });
  await Promise.all([saved(), bubble1.click()]);
  await expect(bubble1).toHaveAttribute("aria-pressed", "true");
  await expect(status).toHaveText("saved");

  await page.reload();
  await expect(input).toHaveValue(title);
  await expect(bubble1).toHaveAttribute("aria-pressed", "true");
  await expect(row.getByRole("button", { name: "Pomodoro 2" })).toHaveAttribute("aria-pressed", "false");
});
