"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { LoopMark } from "@/components/LoopMark";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/Turnstile";
import { inputClass } from "@/components/PasswordField";
import { checkHuman } from "@/app/auth/actions";
import { friendlyAuthError } from "@/lib/auth-flow";

function ForgotInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") ? "That reset link has expired or was already used. Request a new one below." : null,
  );
  const [humanToken, setHumanToken] = useState<string | null>(null);
  const [humanReset, setHumanReset] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setError(null);
    setBusy(true);
    if (TURNSTILE_SITE_KEY) {
      if (!humanToken) {
        setError("Please confirm you are a person first.");
        setBusy(false);
        return;
      }
      const r = await checkHuman(humanToken);
      setHumanReset((k) => k + 1);
      setHumanToken(null);
      if (!r.ok) {
        setError(r.error ?? "That check did not go through. Please try it again.");
        setBusy(false);
        return;
      }
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(addr, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
    });
    setBusy(false);
    const f = friendlyAuthError(error);
    if (f?.rateLimited) {
      setError(f.message);
      return;
    }
    // Same answer whether or not the address has an account.
    setSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--fg)] px-4 py-10">
      <Link href="/" aria-label="Loop home" className="mb-6 inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-[-0.02em] rounded-lg">
        <LoopMark size={30} />
        Loop
      </Link>
      <div className="surface-card w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.025em]">
          {sent ? "Check your email" : "Reset your password"}
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          {sent
            ? "If that email has a Loop account, a reset link is on its way. It works once and is good for an hour."
            : "Enter the email you use for Loop and we will send you a link to choose a new password."}
        </p>

        {sent ? (
          <div className="mt-7 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 text-sm">
            <p className="flex items-start gap-2">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden />
              <span>
                Sent to <span className="font-semibold text-[var(--accent-text)] break-all">{email.trim()}</span>.
              </span>
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="mt-1 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[13px] font-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourstartup.com"
                className={inputClass}
                disabled={busy}
                autoFocus
              />
            </div>
            {TURNSTILE_SITE_KEY && <Turnstile onToken={setHumanToken} resetKey={humanReset} />}
            <button
              type="submit"
              disabled={!email.trim() || busy}
              className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}

        <p className="mt-6 text-sm text-[var(--fg-muted)]">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent-text)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotInner />
    </Suspense>
  );
}
