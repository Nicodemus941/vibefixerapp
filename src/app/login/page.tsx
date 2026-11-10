"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Mail, MailCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { LoopMark } from "@/components/LoopMark";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/Turnstile";
import { PasswordField, inputClass } from "@/components/PasswordField";
import { checkHuman } from "@/app/auth/actions";
import { checkPassword, friendlyAuthError, safeNext } from "@/lib/auth-flow";

const LAST_EMAIL_KEY = "loop:last_email";

type Mode = "signin" | "signup";
type View = "form" | "verify_sent" | "magic_sent";
type Busy = "password" | "magic" | "resend" | null;

const CALLBACK_ERRORS: Record<string, string> = {
  verify: "Please verify your email before signing in. Check your inbox for the link we sent.",
  missing_code: "That link is not complete. Please request a new one.",
  link_expired: "That link has expired or was already used. Please request a new one.",
};

function LoginInner() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("mode") === "signup" ? "signup" : "signin");
  const [view, setView] = useState<View>("form");
  const [busy, setBusy] = useState<Busy>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    const e = params.get("error");
    return e ? CALLBACK_ERRORS[e] ?? CALLBACK_ERRORS.link_expired : null;
  });
  const [notice, setNotice] = useState<string | null>(
    params.get("reset") === "1" ? "Your password is updated. Sign in with your new password." : null,
  );
  const [needsVerification, setNeedsVerification] = useState(params.get("error") === "verify");
  // Turnstile on sign up and sign in. Without a site key it is skipped.
  const [humanToken, setHumanToken] = useState<string | null>(null);
  const [humanReset, setHumanReset] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_EMAIL_KEY);
      if (stored) setEmail(stored);
    } catch {
      // storage blocked
    }
  }, []);

  function rememberEmail(addr: string) {
    try {
      localStorage.setItem(LAST_EMAIL_KEY, addr);
    } catch {
      // ignore quota or blocked storage
    }
  }

  const callbackUrl = () =>
    `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

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
    setHumanToken(null);
    if (!r.ok) {
      setError(r.error ?? "That check did not go through. Please try it again.");
      return false;
    }
    return true;
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setNotice(null);
    setNeedsVerification(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || !password) return;
    setError(null);
    setNotice(null);
    setNeedsVerification(false);

    if (mode === "signup" && !checkPassword(password).ok) {
      setError("Please use at least 10 characters for your password.");
      return;
    }

    setBusy("password");
    if (!(await passHumanCheck())) {
      setBusy(null);
      return;
    }
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
      if (error) {
        const f = friendlyAuthError(error);
        setError(f?.message || "Something went wrong. Please try again.");
        setNeedsVerification(Boolean(f?.needsVerification));
        setBusy(null);
        return;
      }
      rememberEmail(addr);
      window.location.assign(next);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: addr,
      password,
      options: {
        emailRedirectTo: callbackUrl(),
        data: name.trim() ? { full_name: name.trim() } : undefined,
      },
    });
    setBusy(null);
    if (error) {
      const f = friendlyAuthError(error);
      setError(f?.message || "Something went wrong. Please try again.");
      return;
    }
    rememberEmail(addr);
    if (data.session) {
      // Only happens if email confirmation is switched off in Supabase.
      window.location.assign(next);
      return;
    }
    // Same screen whether the address is new or already has an account.
    setView("verify_sent");
  }

  async function sendMagicLink() {
    const addr = email.trim();
    if (!addr) {
      setError("Enter your email first.");
      return;
    }
    setError(null);
    setBusy("magic");
    if (!(await passHumanCheck())) {
      setBusy(null);
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: false },
    });
    setBusy(null);
    const f = friendlyAuthError(error);
    if (f?.rateLimited) {
      setError(f.message);
      return;
    }
    // Unknown addresses get the same answer, so the form never reveals
    // who has an account.
    rememberEmail(addr);
    setView("magic_sent");
  }

  async function resendVerification() {
    const addr = email.trim();
    if (!addr) {
      setError("Enter your email first.");
      return;
    }
    setBusy("resend");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: addr,
      options: { emailRedirectTo: callbackUrl() },
    });
    setBusy(null);
    const f = friendlyAuthError(error);
    if (f?.rateLimited) {
      setError(f.message);
      return;
    }
    setNeedsVerification(false);
    setNotice(`If ${addr} is waiting to be verified, a new link is on its way.`);
  }

  function startOver() {
    setView("form");
    setError(null);
    setNotice(null);
    setPassword("");
  }

  const title =
    view === "verify_sent"
      ? "Check your email to verify your account"
      : view === "magic_sent"
      ? "Check your email"
      : mode === "signup"
      ? "Create your Loop account"
      : "Sign in to Loop";

  const subtitle =
    view === "verify_sent"
      ? "Open the link we sent to finish signing up. It is good for 24 hours."
      : view === "magic_sent"
      ? "If that email has a Loop account, a sign in link is on its way. It works once and is good for an hour."
      : mode === "signup"
      ? "Free for founders. You will verify your email before you start."
      : "Welcome back.";

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
        <h1 className="text-[24px] font-bold leading-tight tracking-[-0.025em]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">{subtitle}</p>

        {view !== "form" ? (
          <div className="mt-7 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 text-sm">
            <p className="flex items-start gap-2 text-[var(--fg)]">
              <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden />
              <span>
                Sent to{" "}
                <span className="font-semibold text-[var(--accent-text)] break-all">{email.trim()}</span>.
              </span>
            </p>
            {view === "verify_sent" && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={busy !== null}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--accent-text)] hover:underline disabled:opacity-50"
              >
                {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Mail className="h-3.5 w-3.5" aria-hidden />}
                Resend verification email
              </button>
            )}
            <button
              type="button"
              onClick={startOver}
              className="mt-1 flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div
              role="tablist"
              aria-label="Sign in or create an account"
              className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
            >
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`min-h-10 rounded-full text-sm font-semibold transition-colors ${
                    mode === m
                      ? "bg-[var(--surface-1)] text-[var(--fg)] shadow-sm"
                      : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate={false}>
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[13px] font-semibold text-[var(--fg)]">
                    Your name <span className="font-normal text-[var(--fg-subtle)]">(optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ana Rivera"
                    className={inputClass}
                    disabled={busy !== null}
                    maxLength={80}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[13px] font-semibold text-[var(--fg)]">
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
                  disabled={busy !== null}
                />
              </div>
              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                disabled={busy !== null}
                showStrength={mode === "signup"}
              />
              {mode === "signin" && (
                <div className="-mt-1 text-right">
                  <Link
                    href={`/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-text)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
              <button
                type="submit"
                disabled={!email.trim() || !password || busy !== null}
                className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
              >
                {busy === "password" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {mode === "signup" ? "Creating account…" : "Signing in…"}
                  </>
                ) : mode === "signup" ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {mode === "signin" && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <span className="eyebrow !text-[var(--fg-subtle)]">or</span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <button
                  type="button"
                  onClick={sendMagicLink}
                  disabled={busy !== null}
                  className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-5 min-h-12 text-[15px] font-semibold text-[var(--fg)] disabled:opacity-40 hover:bg-[var(--surface-2)] transition-colors"
                >
                  {busy === "magic" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Sending link…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" aria-hidden />
                      Email me a sign in link
                    </>
                  )}
                </button>
              </>
            )}

            {TURNSTILE_SITE_KEY && (
              <div className="mt-5">
                <Turnstile onToken={setHumanToken} resetKey={humanReset} />
              </div>
            )}
          </>
        )}

        {notice && (
          <p role="status" className="mt-4 text-sm text-[var(--accent-text)]">
            {notice}
          </p>
        )}
        {error && (
          <div role="alert" className="mt-4 text-sm text-[var(--danger)]">
            <p>{error}</p>
            {needsVerification && (
              <button
                type="button"
                onClick={resendVerification}
                disabled={busy !== null}
                className="mt-1 inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--accent-text)] hover:underline disabled:opacity-50"
              >
                {busy === "resend" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Mail className="h-3.5 w-3.5" aria-hidden />}
                Resend verification email
              </button>
            )}
          </div>
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
