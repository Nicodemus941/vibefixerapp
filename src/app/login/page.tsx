"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.07.78 2.16 0 1.56-.01 2.81-.01 3.19 0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
import { createClient } from "@/lib/supabase/browser";

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/feed";
  const [loading, setLoading] = useState<"github" | "magic" | null>(null);
  const [magicSent, setMagicSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function signInWithGithub() {
    setLoading("github");
    setError(null);
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

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading("magic");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(null);
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--fg)] px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 30% 40%, rgba(16,185,129,0.15) 0%, transparent 60%), radial-gradient(50% 50% at 70% 60%, rgba(139,92,246,0.12) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/80 backdrop-blur-md p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/loop-mark.svg"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 mb-5"
        />
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Loop
        </h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Reciprocity required. Every founder gives and receives.
        </p>

        {magicSent ? (
          <div className="mt-7 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.06] p-4 text-sm">
            <p className="text-[var(--fg)]">
              Check{" "}
              <span className="font-mono text-[var(--accent)]">{email}</span> for
              your sign-in link.
            </p>
            <p className="mt-2 text-[var(--fg-muted)] text-xs">
              The link is good for an hour and only works once.
            </p>
            <button
              type="button"
              onClick={() => {
                setMagicSent(false);
                setEmail("");
              }}
              className="mt-3 text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)] underline underline-offset-2"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={sendMagicLink} className="mt-7 space-y-2">
              <label
                htmlFor="email"
                className="block eyebrow !text-[var(--fg-subtle)]"
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
                className="w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                disabled={loading !== null}
              />
              <button
                type="submit"
                disabled={!email.trim() || loading !== null}
                className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter]"
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
              className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-white/[0.03] px-5 py-3 text-sm font-medium text-[var(--fg)] disabled:opacity-40 hover:bg-white/[0.06] transition-colors"
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

        {error && (
          <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
        )}
      </div>
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
