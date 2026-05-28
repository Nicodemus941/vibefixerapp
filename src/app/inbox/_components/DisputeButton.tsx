"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { openDispute, withdrawDispute, type DisputeRow } from "@/app/disputes/actions";

export function DisputeButton({
  engagementId,
  conversationId,
  existing,
}: {
  engagementId: string;
  conversationId: string;
  existing: DisputeRow | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    setError(null);
    if (!reason.trim()) {
      setError("Explain the issue.");
      return;
    }
    startTransition(async () => {
      const r = await openDispute({
        engagementId,
        reason,
        conversationId,
      });
      if (r.error) setError(r.error);
      else {
        setOpen(false);
        setReason("");
        router.refresh();
      }
    });
  }

  function withdraw() {
    if (!existing) return;
    if (!confirm("Withdraw this dispute? The deal goes back to held.")) return;
    startTransition(async () => {
      const r = await withdrawDispute({ disputeId: existing.id, conversationId });
      if (r.error) alert(r.error);
      router.refresh();
    });
  }

  if (existing && existing.status === "open") {
    return (
      <div className="mt-2 rounded-xl border border-amber-400/40 bg-amber-400/[0.08] p-3 text-xs">
        <p className="flex items-start gap-1.5 text-amber-400 font-medium">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Dispute open — awaiting admin resolution.
        </p>
        <p className="mt-2 text-[var(--fg-muted)] whitespace-pre-wrap">{existing.reason}</p>
        <button
          type="button"
          onClick={withdraw}
          disabled={pending}
          className="press-shrink mt-2 inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Withdraw
        </button>
      </div>
    );
  }

  if (existing && existing.status !== "open") {
    return (
      <p className="mt-2 font-mono text-[10px] text-[var(--fg-subtle)]">
        Dispute {existing.status.replace(/_/g, " ")} ·{" "}
        {existing.resolved_at && new Date(existing.resolved_at).toLocaleDateString()}
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="press-shrink inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/[0.06] px-3 py-1 text-xs text-amber-400 hover:bg-amber-400/[0.12]"
      >
        {open ? <X className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        {open ? "Cancel" : "Dispute"}
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/[0.05] p-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 4000))}
            placeholder="What happened? Be specific so the admin can resolve fairly."
            rows={3}
            disabled={pending}
            className="w-full rounded-lg border border-amber-400/40 bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="button"
            onClick={submit}
            disabled={pending || !reason.trim()}
            className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
            Open dispute
          </button>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        </div>
      )}
    </>
  );
}
