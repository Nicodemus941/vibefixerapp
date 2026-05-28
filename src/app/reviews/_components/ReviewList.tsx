import Link from "next/link";
import { Star } from "lucide-react";
import type { ReviewRow } from "../actions";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.round(diff / 3600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export function ReviewList({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) return null;
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
              {(r.reviewer_name[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link
                  href={`/u/${r.reviewer_id}`}
                  className="font-medium text-[var(--fg)] truncate hover:underline underline-offset-2"
                >
                  {r.reviewer_name}
                </Link>
                {r.reviewer_company && (
                  <span className="text-sm text-[var(--fg-subtle)] truncate">
                    · {r.reviewer_company}
                  </span>
                )}
                <span className="font-mono text-[10px] text-[var(--fg-subtle)] ml-auto">
                  {timeAgo(r.created_at)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Stars value={r.rating} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                  as {r.reviewer_role}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--fg)] leading-relaxed whitespace-pre-wrap">
                {r.body}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${
            n <= value
              ? "fill-[var(--accent)] text-[var(--accent)]"
              : "text-[var(--fg-subtle)]"
          }`}
        />
      ))}
    </div>
  );
}
