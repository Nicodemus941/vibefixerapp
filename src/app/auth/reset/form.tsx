"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(error.message);
    else {
      router.push("/account");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="ak-card space-y-4 p-5">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
          New password
        </label>
        <input
          className="ak-input"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
