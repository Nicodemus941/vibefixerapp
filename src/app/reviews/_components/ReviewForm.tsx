"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { createReview } from "../actions";

export function ReviewForm({
  engagementId,
  counterpartyName,
  onDone,
}: {
  engagementId: string;
  counterpartyName: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    setError(null);
    if (rating < 1) {
      setError("Pick a rating first.");
      return;
    }
    if (!body.trim()) {
      setError("Write a short review.");
      return;
    }
    startTransition(async () => {
      const r = await createReview({ engagementId, rating, body: body.trim() });
      if (r.error) setError(r.error);
      else {
        setRating(0);
        setBody("");
        onDone?.();
        router.refresh();
      }
    });
  }

  const active = hoverRating || rating;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--fg)]">
        How was working with{" "}
        <span className="font-medium">{counterpartyName}</span>?
      </p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={pending}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="press-shrink p-0.5"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                n <= active
                  ? "fill-[var(--accent)] text-[var(--accent)]"
                  : "text-[var(--fg-subtle)]"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 font-mono text-xs text-[var(--fg-subtle)] tabular-nums">
          {rating > 0 ? `${rating}/5` : "tap a star"}
        </span>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, 2000))}
        placeholder="What did they deliver? What was great? What could be better? Other founders will read this."
        rows={4}
        disabled={pending}
        className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
          {2000 - body.length} chars left
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !body.trim() || rating < 1}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Star className="h-4 w-4" />
          )}
          Post review
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
