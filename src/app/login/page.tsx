"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, RotateCcw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { LoopMark } from "@/components/LoopMark";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/Turnstile";
import { checkHuman } from "@/app/auth/actions";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

const LAST_EMAIL_KEY = "loop:last_email";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/feed";
  const [loading, setLoading] = useState<"github" | "magic" | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Turnstile on sign up and sign in. Without a site key it is skipped.
  const [humanToken, setHumanToken] = useState<string | null>(null);
  const [humanReset, setHumanReset] = useState(0);

  // Remember the last email the user signed in with. Renders the page
  // as a one-tap "Continue as <you>" for returning visitors instead of
  // an empty signup-shaped form.
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_EMAIL_KEY);
      if (stored) {
        setRememberedEmail(stored);
        setEmail(stored);
      } else {
        setShowEmailForm(true);
      }
    } catch {
      setShowEmailForm(true);
    }
  }, []);

  const returning = Boolean(rememberedEmail);

  // Verifies the Turnstile token on the server. Tokens are single use, so
  // the widget is reset after every attempt.
  async function passHumanCheck(): Promise<boolean> {
    if (!TURNSTILE_SITE_KEY) return true;
    if (!humanToken) {
      setError("Please confirm you are a person first.");
      return false;
    }
    const r = await checkHuman(humanToken);
    setHumanReset((k) => k + 1);
    if (!r.ok) {
      setError(r.error ?? "That check did not go through. Please try it again.");
      return false;
    }
    return true;
  }

  async function signInWithGithub() {
    setLoading("github");
    setError(null);
    if (!(await passHumanCheck())) {
      setLoading(null);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  async function sendMagicLinkFor(addr: string) {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setLoading("magic");
    setError(null);
    if (!(await passHumanCheck())) {
      setLoading(null);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(null);
    if (error) {
      setError(error.message);
    } else {
      try {
        localStorage.setItem(LAST_EMAIL_KEY, trimmed);
      } catch {
        // ignore quota / blocked storage
      }
      setRememberedEmail(trimmed);
      setMagicSent(true);
    }
  }

  async function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMagicLinkFor(email);
  }

  function useDifferentEmail() {
    try {
      localStorage.removeItem(LAST_EMAIL_KEY);
    } catch {
      // ignore
    }
    setRememberedEmail(null);
    setEmail("");
    setShowEmailForm(true);
    setMagicSent(false);
  }

  const sentTo = magicSent ? email || rememberedEmail || "" : "";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg)] text-[var(--fg)] px-4 py-10">
      <Link
        href="/"
        aria-label="Loop home"
        className="mb-6 inline-flex min-h-11 items-center gap-2 text-xl font-bold tracking-[-0.02em] rounded-lg"
      >
        <LoopMark size={30} />
        Loop
      </Link>
      <div className="surface-card w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-[26px] font-bold tracking-[-0.025em]">
          {returning && !magicSent ? "Welcome back." : magicSent ? "Check your email." : "Sign in to Loop"}
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          {returning && !magicSent
            ? "Same one tap sign in. No password to remember."
            : magicSent
            ? "The link is good for an hour and only works once."
            : "Sign in or create your free account with one tap. No password."}
        </p>

        {magicSent ? (
          <div className="mt-7 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 text-sm">
            <p className="text-[var(--fg)]">
              Sent to{" "}
              <span className="font-semibold text-[var(--accent-text)] break-all">{sentTo}</span>.
            </p>
            <button
              type="button"
              onClick={useDifferentEmail}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              <RotateCcw className="h-3 w-3" />
              Use a different email
            </button>
          </div>
        ) : returning && !showEmailForm ? (
          <>
            <div className="mt-7 space-y-2">
              <button
                type="button"
                onClick={() => sendMagicLinkFor(rememberedEmail!)}
                disabled={loading !== null}
                className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
              >
                {loading === "magic" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Continue as <span className="truncate opacity-90">{rememberedEmail}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                disabled={loading !== null}
                className="press-shrink w-full min-h-11 text-center text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Use a different email
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="eyebrow !text-[var(--fg-subtle)]">or</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <button
              type="button"
              onClick={signInWithGithub}
              disabled={loading !== null}
              className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg)] disabled:opacity-40 hover:bg-[var(--surface-2)] transition-colors"
            >
              {loading === "github" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <GithubIcon className="h-4 w-4" />
                  Continue with GitHub
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <form onSubmit={onFormSubmit} className="mt-7 space-y-2">
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold text-[var(--fg)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourstartup.com"
                className="w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 text-[15px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--ring)]/25"
                disabled={loading !== null}
                autoFocus
              />
              <button
                type="submit"
                disabled={!email.trim() || loading !== null}
                className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
              >
                {loading === "magic" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending link…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send magic link
                  </>
                )}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <span className="eyebrow !text-[var(--fg-subtle)]">or</span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <button
              type="button"
              onClick={signInWithGithub}
              disabled={loading !== null}
              className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg)] disabled:opacity-40 hover:bg-[var(--surface-2)] transition-colors"
            >
              {loading === "github" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                <>
                  <GithubIcon className="h-4 w-4" />
                  Continue with GitHub
                </>
              )}
            </button>
          </>
        )}

        {!magicSent && TURNSTILE_SITE_KEY && (
          <div className="mt-5">
            <Turnstile onToken={setHumanToken} resetKey={humanReset} />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
      </div>
      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-[var(--fg-subtle)]">
        Loop is free. By continuing you agree to the{" "}
        <Link href="/terms" className="font-semibold text-[var(--accent-text)] hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-[var(--accent-text)] hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
