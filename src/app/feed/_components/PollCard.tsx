"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { PollState } from "@/lib/feed-types";
import { votePoll } from "../actions";
import { FOCUS_RING } from "./Modal";

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Poll closed";
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) {
    const d = Math.round(h / 24);
    return `${d} day${d === 1 ? "" : "s"} left`;
  }
  if (h >= 1) return `${h} hour${h === 1 ? "" : "s"} left`;
  const m = Math.max(1, Math.round(ms / 60_000));
  return `${m} minute${m === 1 ? "" : "s"} left`;
}

export function PollCard({ postId, poll }: { postId: string; poll: PollState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ended = new Date(poll.ends_at).getTime() <= Date.now();
  const canVote = poll.my_vote === null && !ended;

  function vote(i: number) {
    if (!canVote || pending) return;
    setChoosing(i);
    setError(null);
    startTransition(async () => {
      const r = await votePoll({ postId, optionIndex: i });
      if (r.error) setError(r.error);
      router.refresh();
    });
  }

  const total = poll.total_votes;
  return (
    <fieldset className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <legend className="sr-only">Poll</legend>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          if (poll.show_results && poll.counts) {
            const n = poll.counts[i] ?? 0;
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            const mine = poll.my_vote === i;
            return (
              <div
                key={i}
                className="relative overflow-hidden rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                aria-label={`${opt}: ${pct} percent${mine ? ", your vote" : ""}`}
              >
                <span
                  aria-hidden
                  className={`absolute inset-y-0 left-0 ${mine ? "bg-[var(--accent)]/25" : "bg-[var(--surface-2)]"}`}
                  style={{ width: `${pct}%` }}
                />
                <span className="relative flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5 text-[var(--fg)]">
                    <span className="truncate">{opt}</span>
                    {mine && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" aria-hidden />}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[var(--fg-muted)]">{pct}%</span>
                </span>
              </div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => vote(i)}
              disabled={!canVote || pending}
              className={`press-shrink flex w-full items-center justify-center gap-2 rounded-full border border-[var(--accent)]/60 px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50 ${FOCUS_RING}`}
            >
              {pending && choosing === i && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {opt}
            </button>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[11px] text-[var(--fg-subtle)]" aria-live="polite">
        {total} vote{total === 1 ? "" : "s"} · {timeLeft(poll.ends_at)}
        {!poll.show_results && canVote ? " · Results show after you vote" : ""}
      </p>
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}
