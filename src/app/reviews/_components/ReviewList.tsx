import Link from "next/link";
import { Star } from "lucide-react";
import type { ReviewRow } from "../actions";
import { Avatar } from "@/components/Avatar";

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
    <ul>
      {reviews.map((r) => (
        <li
          key={r.id}
          className="border-t border-[var(--border)] py-4 first:border-t-0"
        >
          <div className="flex items-start gap-3">
            <Avatar name={r.reviewer_name} url={null} size="md" />
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
                <span className="text-xs text-[var(--fg-subtle)] ml-auto">
                  {timeAgo(r.created_at)}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Stars value={r.rating} />
                <span className="text-xs text-[var(--fg-subtle)]">
                  as {r.reviewer_role}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--fg)] leading-relaxed whitespace-pre-wrap">
                {r.body}
              </p>
              {r.media.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {r.media.map((m) =>
                    m.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a
                        key={m.id}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="press-shrink block aspect-square rounded-lg overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]"
                      >
                        <img
                          src={m.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ) : (
                      <video
                        key={m.id}
                        src={m.url}
                        controls
                        preload="metadata"
                        className="aspect-square w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] object-cover"
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={`flex items-center gap-0.5 ${className ?? ""}`}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={`h-3.5 w-3.5 ${
            n <= value
              ? "fill-[var(--star)] text-[var(--star)]"
              : "text-[var(--fg-subtle)]"
          }`}
        />
      ))}
    </div>
  );
}
