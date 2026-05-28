"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2, MoreHorizontal, ShieldOff, X } from "lucide-react";
import { blockUser, unblockUser, fileReport } from "@/app/moderation/actions";

export function ProfileModerationMenu({
  targetId,
  initiallyBlocked,
}: {
  targetId: string;
  initiallyBlocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [reportMode, setReportMode] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  function toggleBlock() {
    startTransition(async () => {
      const r = blocked ? await unblockUser(targetId) : await blockUser(targetId);
      if (r.error) setError(r.error);
      else {
        setBlocked(!blocked);
        setOpen(false);
        router.refresh();
      }
    });
  }

  function submitReport() {
    if (!reason.trim()) {
      setError("Tell us what's wrong.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await fileReport({
        targetKind: "user",
        targetId,
        reason,
      });
      if (r.error) setError(r.error);
      else {
        setSent(true);
        setReason("");
        setReportMode(false);
        setOpen(false);
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setReportMode(false);
          setError(null);
        }}
        aria-label="More"
        className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 shadow-xl z-50">
          {!reportMode ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={toggleBlock}
                disabled={pending}
                className="press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.04]"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                {blocked ? "Unblock" : "Block"}
              </button>
              <button
                type="button"
                onClick={() => setReportMode(true)}
                disabled={pending}
                className="press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.04]"
              >
                <Flag className="h-3.5 w-3.5" />
                Report
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
                  Report user
                </p>
                <button
                  type="button"
                  onClick={() => setReportMode(false)}
                  className="text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 2000))}
                placeholder="What's wrong?"
                rows={3}
                disabled={pending}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={submitReport}
                disabled={pending || !reason.trim()}
                className="press-shrink w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
                Send report
              </button>
            </div>
          )}
          {error && <p className="text-xs text-[var(--danger)] mt-2">{error}</p>}
          {sent && <p className="text-xs text-[var(--accent)] mt-2">Report sent.</p>}
        </div>
      )}
    </div>
  );
}
