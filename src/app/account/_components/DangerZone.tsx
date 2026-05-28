"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteOwnAccount } from "../actions";

export function DangerZone({ email }: { email: string | null | undefined }) {
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  const enabled = confirm === "delete";

  function go() {
    startTransition(async () => {
      await deleteOwnAccount();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger)]/[0.05] p-5 space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--fg)]">Delete account</p>
        <p className="text-xs text-[var(--fg-muted)] mt-1">
          Permanently deletes your profile, posts, comments, reactions,
          messages, matches, engagements, documents, and reviews.{" "}
          <span className="text-[var(--danger)]">Cannot be undone.</span>
          {email && (
            <>
              {" "}
              Signed in as{" "}
              <span className="font-mono text-[var(--fg-muted)]">{email}</span>.
            </>
          )}
        </p>
      </div>
      <input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder='Type "delete" to confirm'
        disabled={pending}
        className="w-full h-10 rounded-xl border border-[var(--danger)]/40 bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
      />
      <button
        type="button"
        onClick={go}
        disabled={!enabled || pending}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete my account
      </button>
    </div>
  );
}
