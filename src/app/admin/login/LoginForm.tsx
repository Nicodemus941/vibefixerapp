"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "./actions";

const initial: LoginState = { ok: true };

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-sm font-bold text-ink">Password</span>
        <input
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-1 block w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition placeholder:text-ink-muted focus:border-amber focus:ring-4 focus:ring-amber/20"
        />
        {state.error ? (
          <p className="mt-1 text-xs font-semibold text-flame">{state.error}</p>
        ) : null}
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-xl bg-amber px-5 py-3.5 text-base font-extrabold text-ink shadow-pop transition hover:-translate-y-0.5 hover:bg-amber-bold disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
