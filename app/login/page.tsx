"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initial: LoginState = { status: "idle" };

export default function LoginPage() {
  const [state, action, pending] = useActionState(sendMagicLink, initial);

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-sm bg-paper px-10 py-14 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <h1 className="mb-2 text-xs font-light uppercase tracking-[2px] text-muted">
          ADH Planner
        </h1>
        <p className="mb-8 text-sm italic text-muted">
          &ldquo;The secret of getting ahead is getting started.&rdquo;
        </p>

        {state.status === "sent" ? (
          <p className="text-sm">Check your email for a sign-in link.</p>
        ) : (
          <form action={action} className="flex flex-col gap-6">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[1px]">Email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                autoFocus
                className="border-b border-line bg-transparent py-1 text-[0.95rem] outline-none focus:border-sage"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="self-start text-xs uppercase tracking-[1px] text-ink underline decoration-sage underline-offset-4 disabled:text-muted"
            >
              {pending ? "Sending…" : "Send magic link"}
            </button>
            {state.status === "error" && (
              <p className="text-sm text-warm">{state.message}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
