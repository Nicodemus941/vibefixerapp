"use client";
import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    if (error) setErr(error.message);
    else setDone(true);
  }

  if (done) {
    return (
      <div className="ak-card p-5 text-sm">
        ✓ If an account exists for <b>{email}</b>, we sent a reset link. Check
        your inbox (and spam).{" "}
        <Link href="/auth/sign-in" className="font-semibold underline">
          Back to sign in
        </Link>
        .
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="ak-card space-y-4 p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
          Email
        </label>
        <input
          className="ak-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
      </div>
      {err && (
        <div className="rounded-md bg-[var(--color-bad-soft)] p-2 text-xs text-[var(--color-bad)]">
          {err}
        </div>
      )}
      <button
        type="submit"
        disabled={busy}
        className="ak-btn ak-btn-primary w-full disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-xs text-[var(--color-ink-muted)]">
        <Link href="/auth/sign-in" className="underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
