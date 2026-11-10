"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { PasswordField } from "@/components/PasswordField";
import { checkPassword, friendlyAuthError } from "@/lib/auth-flow";

/** Sets a new password for the signed in member (reset flow and Settings). */
export function NewPasswordForm({
  submitLabel,
  onDone,
}: {
  submitLabel: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!checkPassword(password).ok) {
      setError("Please use at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(friendlyAuthError(error)?.message || "Something went wrong. Please try again.");
      return;
    }
    setPassword("");
    setConfirm("");
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PasswordField
        label="New password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        disabled={busy}
        showStrength
      />
      <PasswordField
        label="Type it again"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        disabled={busy}
      />
      <button
        type="submit"
        disabled={!password || !confirm || busy}
        className="press-shrink inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 text-[15px] font-semibold text-[var(--fg-on-accent)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {submitLabel}
      </button>
      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </form>
  );
}
