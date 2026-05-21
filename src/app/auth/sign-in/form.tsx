"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(params.get("err"));
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setErr(error.message);
      else {
        router.push(next);
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) setErr(error.message);
      else if (data.session) {
        router.push(next);
        router.refresh();
      } else {
        setCheck(true);
      }
    }
    setBusy(false);
  }

  if (check) {
    return (
      <div className="ak-card p-5 text-sm">
        Check your email to confirm your address, then come back and sign in.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="ak-card space-y-4 p-5">
      <div className="grid grid-cols-2 gap-1 rounded-lg border p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("in")}
          className={`rounded px-3 py-1.5 font-semibold ${
            mode === "in"
              ? "bg-[var(--color-brand)] text-white"
              : "text-[var(--color-ink-muted)]"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("up")}
          className={`rounded px-3 py-1.5 font-semibold ${
            mode === "up"
              ? "bg-[var(--color-brand)] text-white"
              : "text-[var(--color-ink-muted)]"
          }`}
        >
          Create account
        </button>
      </div>

      {mode === "up" && (
        <Field label="Full name">
          <input
            className="ak-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      )}
      <Field label="Email">
        <input
          className="ak-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
            Password
          </label>
          {mode === "in" && (
            <Link
              href="/auth/forgot"
              className="text-xs font-medium text-[var(--color-brand)] hover:underline"
            >
              Forgot password?
            </Link>
          )}
        </div>
        <input
          className="ak-input"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {busy
          ? "Working…"
          : mode === "in"
            ? "Sign in"
            : "Create my account"}
      </button>

      <p className="text-center text-xs text-[var(--color-ink-muted)]">
        By continuing you agree to AK Rooster's terms. We never sell your data.{" "}
        <Link href="/" className="underline">
          Back home
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}
