"use client";

import { useState } from "react";
import { NewPasswordForm } from "@/components/NewPasswordForm";

export function ChangePasswordSection() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) {
    return (
      <div className="space-y-2">
        {done && (
          <p role="status" className="text-sm text-[var(--accent-text)]">
            Password updated.
          </p>
        )}
        <p className="text-xs text-[var(--fg-muted)]">
          Signed up with a sign in link or GitHub? Set a password here to sign in with email and password.
        </p>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setDone(false);
          }}
          className="press-shrink inline-flex min-h-11 items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)]"
        >
          Change password
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <NewPasswordForm
        submitLabel="Save password"
        onDone={() => {
          setOpen(false);
          setDone(true);
        }}
      />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
      >
        Cancel
      </button>
    </div>
  );
}
