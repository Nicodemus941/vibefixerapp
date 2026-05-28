"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { createComment, type CommentRow } from "../actions";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString();
}

export function CommentThread({
  postId,
  totalCount,
  recent,
}: {
  postId: string;
  totalCount: number;
  recent: CommentRow[];
}) {
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    const text = body.trim();
    if (!text || pending) return;
    setError(null);
    startTransition(async () => {
      const r = await createComment({ postId, body: text });
      if (r.error) setError(r.error);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  const hiddenCount = Math.max(0, totalCount - recent.length);

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-2.5">
      {hiddenCount > 0 && (
        <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
          {hiddenCount} earlier comment{hiddenCount === 1 ? "" : "s"} hidden
        </p>
      )}
      {recent.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5 text-sm">
          <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-xs font-mono text-[var(--fg-muted)]">
            {(c.author_display_name[0] ?? "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="leading-snug">
              <Link
                href={`/u/${c.user_id}`}
                className="font-medium text-[var(--fg)] hover:underline underline-offset-2"
              >
                {c.author_display_name}
              </Link>{" "}
              <span className="text-[var(--fg)]">{c.body}</span>
            </p>
            <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-0.5">
              {timeAgo(c.created_at)}
            </p>
          </div>
        </div>
      ))}

      <div className="flex items-end gap-2 pt-1">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Reply with a quick thought…"
          maxLength={1000}
          disabled={pending}
          className="flex-1 h-9 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || pending}
          aria-label="Send comment"
          className="press-shrink shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter]"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}
