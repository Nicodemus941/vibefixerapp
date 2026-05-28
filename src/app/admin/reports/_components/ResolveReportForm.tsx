"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { resolveReport } from "@/app/moderation/actions";

export function ResolveReportForm({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function decide(decision: "reviewed" | "dismissed") {
    setError(null);
    startTransition(async () => {
      const r = await resolveReport({ reportId, decision });
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2 border-t border-amber-400/20 pt-3">
      <button
        type="button"
        onClick={() => decide("reviewed")}
        disabled={pending}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        Mark reviewed
      </button>
      <button
        type="button"
        onClick={() => decide("dismissed")}
        disabled={pending}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-3)] border border-[var(--border-strong)] px-3 py-1.5 text-xs text-[var(--fg)] hover:bg-white/[0.05] disabled:opacity-40"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Dismiss
      </button>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
