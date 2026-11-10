import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatBytes, publicMediaUrl, type PostDocument } from "@/lib/post-media";
import { toDisplayText } from "@/lib/post-text";
import type { FeedPost, LinkPreview } from "@/lib/feed-types";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

export function DocumentCard({ doc }: { doc: PostDocument }) {
  return (
    <a
      href={publicMediaUrl(doc.path)}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 hover:border-[var(--border-strong)] transition-colors ${FOCUS}`}
      aria-label={`Open document ${doc.name} in a new tab`}
    >
      <span className="inline-flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--danger)]/15 text-[var(--danger)]">
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--fg)]">{doc.name}</span>
        <span className="block font-mono text-[11px] text-[var(--fg-subtle)]">
          PDF · {formatBytes(doc.size)}
        </span>
      </span>
      <ExternalLink className="h-4 w-4 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
    </a>
  );
}

export function LinkPreviewCard({ preview }: { preview: LinkPreview }) {
  // Only ever link to http(s), and label the card with the real host so a
  // crafted site_name can't pass the link off as another site.
  let host: string | null = null;
  try {
    const u = new URL(preview.url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    host = u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const image = preview.image && preview.image.startsWith("https://") ? preview.image : null;
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className={`mt-3 block overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)] transition-colors ${FOCUS}`}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-[1.91/1] w-full object-cover bg-[var(--surface-3)]"
        />
      )}
      <span className="block p-3">
        <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] truncate">
          {host}
        </span>
        {preview.title && (
          <span className="mt-0.5 block text-sm font-medium text-[var(--fg)] line-clamp-2">
            {preview.title}
          </span>
        )}
        {preview.description && (
          <span className="mt-0.5 block text-xs text-[var(--fg-muted)] line-clamp-2">
            {preview.description}
          </span>
        )}
      </span>
    </a>
  );
}

export function UnavailablePost() {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/60 p-4 text-sm text-[var(--fg-muted)]">
      This post is unavailable.
    </div>
  );
}

// Compact card for a quoted post. Links to the permalink.
export function QuotedPost({ post }: { post: FeedPost | null | undefined }) {
  if (!post) return <UnavailablePost />;
  const firstImage = post.media?.[0];
  const text = toDisplayText(post.body);
  return (
    <Link
      href={`/p/${post.id}`}
      className={`mt-3 block rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 hover:border-[var(--border-strong)] transition-colors ${FOCUS}`}
      aria-label={`Quoted post by ${post.author_display_name}`}
    >
      <span className="flex items-center gap-2">
        <Avatar name={post.author_display_name} url={post.author_avatar_url} size="xs" />
        <span className="truncate text-sm font-medium text-[var(--fg)]">{post.author_display_name}</span>
        {post.author_company_name && (
          <span className="truncate text-xs text-[var(--fg-subtle)]">· {post.author_company_name}</span>
        )}
      </span>
      {text && (
        <span className="mt-2 block text-sm text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-words line-clamp-4">
          {text}
        </span>
      )}
      {firstImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={publicMediaUrl(firstImage.path)}
          alt={firstImage.alt ?? ""}
          loading="lazy"
          className="mt-2 max-h-56 w-full rounded-lg object-cover"
        />
      )}
      {post.document && (
        <span className="mt-2 flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <FileText className="h-3.5 w-3.5" /> {post.document.name}
        </span>
      )}
    </Link>
  );
}
