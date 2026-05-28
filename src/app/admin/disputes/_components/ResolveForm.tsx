"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { resolveDispute } from "@/app/disputes/actions";

export function ResolveForm({ disputeId }: { disputeId: string }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function decide(decision: "resolved_for_seeker" | "resolved_for_provider") {
    setError(null);
    startTransition(async () => {
      const r = await resolveDispute({ disputeId, decision, note });
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-2 border-t border-amber-400/20 pt-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 2000))}
        placeholder="Resolution note (optional, both parties see it)…"
        rows={2}
        disabled={pending}
        className="w-full rounded-lg border border-amber-400/30 bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => decide("resolved_for_seeker")}
          disabled={pending}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-3)] border border-[var(--border-strong)] px-3 py-1.5 text-xs text-[var(--fg)] hover:bg-white/[0.05]"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Refund seeker
        </button>
        <button
          type="button"
          onClick={() => decide("resolved_for_provider")}
          disabled={pending}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110"
        >
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          Release to provider
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
