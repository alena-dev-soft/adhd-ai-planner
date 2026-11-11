"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

const emailSchema = z.email();

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    return { status: "error", message: "Please enter a valid email." };
  }

  const h = await headers();
  const origin =
    h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return { status: "error", message: "Could not send the link. Try again in a minute." };
  }
  return { status: "sent" };
}

/** Ends the session (clears the auth cookies) and goes back to /login. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
