import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { startDmAndRedirect } from "@/app/inbox/actions";
import type { FeedPost } from "../actions";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.round(diffMs / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function kindLabel(kind: string): { label: string; color: string } | null {
  switch (kind) {
    case "need":
      return { label: "NEED", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
    case "offer":
      return { label: "OFFER", color: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/30" };
    case "win":
      return { label: "WIN", color: "text-sky-400 bg-sky-400/10 border-sky-400/30" };
    default:
      return null;
  }
}

// Render the body with #hashtags as links to /feed?tag=…
function renderBody(body: string) {
  const parts: Array<string | { tag: string }> = [];
  const rx = /#([a-z0-9_]{2,32})/gi;
  let last = 0;
  for (const m of body.matchAll(rx)) {
    const start = m.index ?? 0;
    if (start > last) parts.push(body.slice(last, start));
    parts.push({ tag: m[1].toLowerCase() });
    last = start + m[0].length;
  }
  if (last < body.length) parts.push(body.slice(last));

  return parts.map((p, i) =>
    typeof p === "string" ? (
      <span key={i}>{p}</span>
    ) : (
      <Link
        key={i}
        href={`/feed?tag=${encodeURIComponent(p.tag)}`}
        className="text-[var(--accent)] hover:underline font-medium"
      >
        #{p.tag}
      </Link>
    ),
  );
}

export function PostCard({
  post,
  viewerId,
}: {
  post: FeedPost;
  viewerId: string;
}) {
  const k = kindLabel(post.kind);
  const isOwn = viewerId === post.user_id;
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 hover:border-[var(--border-strong)] transition-colors">
      <header className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
          {(post.author_display_name?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <Link
              href={`/u/${post.user_id}`}
              className="font-medium text-[var(--fg)] truncate hover:underline underline-offset-2"
            >
              {post.author_display_name}
            </Link>
            {post.author_company_name && (
              <span className="text-[var(--fg-subtle)] text-sm truncate">
                · {post.author_company_name}
              </span>
            )}
            <span className="font-mono text-xs text-[var(--fg-subtle)]">
              · {timeAgo(post.created_at)}
            </span>
          </div>
          {post.author_industry && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
              {post.author_industry}
            </p>
          )}
        </div>
        {k && (
          <span
            className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${k.color}`}
          >
            {k.label}
          </span>
        )}
      </header>
      <p className="mt-3 text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-words">
        {renderBody(post.body)}
      </p>
      <footer className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        {post.similarity !== null ? (
          <p
            className="font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums"
            title="Cosine similarity to the average of your need embeddings"
          >
            match {(post.similarity * 100).toFixed(0)}%
          </p>
        ) : (
          <span />
        )}
        {!isOwn && (
          <form action={startDmAndRedirect.bind(null, post.user_id, "post")}>
            <button
              type="submit"
              className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Message
            </button>
          </form>
        )}
      </footer>
    </article>
  );
}
