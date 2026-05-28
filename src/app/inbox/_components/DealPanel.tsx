"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import {
  type Engagement,
  startEngagement,
  markDelivered,
  refundEngagement,
} from "../engagement-actions";
import { ReviewForm } from "@/app/reviews/_components/ReviewForm";
import { DisputeButton } from "./DisputeButton";
import type { DisputeRow } from "@/app/disputes/actions";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.round(diff / 3600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

function statusPill(s: Engagement["escrow_status"]) {
  switch (s) {
    case "held":
      return "border-amber-400/40 text-amber-400 bg-amber-400/10";
    case "released":
      return "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10";
    case "refunded":
      return "border-[var(--border-strong)] text-[var(--fg-muted)] bg-white/[0.02]";
    default:
      return "border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/10";
  }
}

export function DealPanel({
  conversationId,
  otherUserId,
  viewerId,
  initial,
  counterpartyName,
  pendingReviewEngagementIds,
  disputesByEngagementId,
}: {
  conversationId: string;
  otherUserId: string;
  viewerId: string;
  initial: Engagement[];
  counterpartyName: string;
  pendingReviewEngagementIds: string[];
  disputesByEngagementId: Record<string, DisputeRow | null>;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [asProvider, setAsProvider] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    setError(null);
    const a = parseFloat(amount);
    if (!Number.isFinite(a) || a <= 0) {
      setError("Enter an amount in dollars.");
      return;
    }
    startTransition(async () => {
      const r = await startEngagement({
        otherUserId,
        amount: a,
        conversationId,
        asProvider,
        deliveryDueAt: dueAt || undefined,
      });
      if (r.error) setError(r.error);
      else {
        setOpen(false);
        setAmount("");
        setDueAt("");
        router.refresh();
      }
    });
  }

  function release(id: string) {
    startTransition(async () => {
      const r = await markDelivered(id, conversationId);
      if (r.error) setError(r.error);
      router.refresh();
    });
  }

  function refund(id: string) {
    if (!confirm("Refund this deal? Both sides will be notified.")) return;
    startTransition(async () => {
      const r = await refundEngagement(id, conversationId);
      if (r.error) setError(r.error);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-[var(--fg)]">Deals</p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Close" : "Convert to deal"}
        </button>
      </div>

      {open && (
        <div className="mb-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="eyebrow block mb-1">Amount (USD)</span>
              <input
                type="number"
                inputMode="decimal"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                disabled={pending}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>
            <label className="block">
              <span className="eyebrow block mb-1">Due date</span>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                disabled={pending}
                className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            <button
              type="button"
              onClick={() => setAsProvider(false)}
              className={`press-shrink rounded-full px-3 py-1 border ${!asProvider ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] bg-white/[0.02]"}`}
            >
              I&apos;m paying
            </button>
            <ArrowLeftRight className="h-3 w-3 text-[var(--fg-subtle)]" />
            <button
              type="button"
              onClick={() => setAsProvider(true)}
              className={`press-shrink rounded-full px-3 py-1 border ${asProvider ? "border-[var(--accent)]/60 bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--border)] bg-white/[0.02]"}`}
            >
              I&apos;m delivering
            </button>
          </div>
          <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
            Loop fee: 7% on closed deals. Funds are conceptually held in escrow
            until the seeker marks delivered. (Real Stripe payments wire into
            this same flow later.)
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={pending || !amount}
            className="press-shrink w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] disabled:opacity-40 hover:brightness-110 transition-[filter]"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Open deal
          </button>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        </div>
      )}

      {initial.length === 0 ? (
        <p className="text-xs text-[var(--fg-subtle)]">
          No deals yet. When you both agree on terms, open one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {initial.map((e) => {
            const iAmSeeker = e.seeker_id === viewerId;
            return (
              <li
                key={e.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono tabular-nums text-base text-[var(--fg)]">
                      ${Number(e.amount).toLocaleString()}
                      <span className="font-sans text-xs text-[var(--fg-subtle)] ml-1.5">
                        ({iAmSeeker ? "you pay" : "you deliver"})
                      </span>
                    </p>
                    <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
                      fee ${Number(e.platform_fee).toLocaleString()} · opened {timeAgo(e.created_at)} ago
                      {e.delivery_due_at && ` · due ${new Date(e.delivery_due_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill(e.escrow_status)}`}
                  >
                    {e.escrow_status}
                  </span>
                </div>
                {e.escrow_status === "held" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {iAmSeeker && (
                      <button
                        type="button"
                        onClick={() => release(e.id)}
                        disabled={pending}
                        className="press-shrink inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-medium text-[var(--bg)] hover:brightness-110"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Mark delivered
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => refund(e.id)}
                      disabled={pending}
                      className="press-shrink inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
                    >
                      Refund
                    </button>
                    <DisputeButton
                      engagementId={e.id}
                      conversationId={conversationId}
                      existing={disputesByEngagementId[e.id] ?? null}
                    />
                  </div>
                )}
                {(e.escrow_status === "disputed" ||
                  (disputesByEngagementId[e.id] &&
                    disputesByEngagementId[e.id]!.status !== "open")) && (
                  <DisputeButton
                    engagementId={e.id}
                    conversationId={conversationId}
                    existing={disputesByEngagementId[e.id] ?? null}
                  />
                )}
                {e.escrow_status === "released" &&
                  pendingReviewEngagementIds.includes(e.id) && (
                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--accent)] mb-2">
                        Leave a review
                      </p>
                      <ReviewForm
                        engagementId={e.id}
                        counterpartyName={counterpartyName}
                      />
                    </div>
                  )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
