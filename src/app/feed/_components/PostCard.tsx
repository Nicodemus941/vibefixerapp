import Link from "next/link";
import { Check, HandHeart, MessageSquare, Repeat2, Star } from "lucide-react";
import { offerHelpAndRedirect, startDmAndRedirect } from "@/app/inbox/actions";
import { Avatar } from "@/components/Avatar";
import type { DealStrip, FeedBundle, FeedPost, TrackRecord } from "@/lib/feed-types";
import { rankReasonLabel } from "@/lib/feed-rank";
import { detailWells } from "@/lib/post-details";
import { emptyReactionCounts } from "@/lib/reactions";
import { CommentThread } from "./CommentThread";
import { PostMenu } from "./PostMenu";
import { PostBody } from "./PostBody";
import { MediaGrid } from "./MediaGrid";
import { DocumentCard, LinkPreviewCard, QuotedPost, UnavailablePost } from "./Attachments";
import { PollCard } from "./PollCard";
import { PostActions } from "./PostActions";
import { FOCUS, KIND_STYLE, PRIMARY_BTN } from "./styles";

const CARD =
  "rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5 shadow-[var(--shadow-1)]";

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

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function money(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}

const EMPTY_BUNDLE: FeedBundle = { posts: {}, reactions: {}, comments: {}, extras: {} };

// A feed entry. Plain reposts render the original with a "X reposted"
// line; buttons on it act on the original.
export function FeedItem({
  post,
  bundle,
  viewerId,
  viewerRole,
  commentMode = "preview",
  allowRepost = true,
}: {
  post: FeedPost;
  bundle: FeedBundle;
  viewerId: string;
  viewerRole?: string;
  commentMode?: "preview" | "full";
  allowRepost?: boolean;
}) {
  if (!post.repost_of_id) {
    return (
      <PostCard
        post={post}
        bundle={bundle}
        viewerId={viewerId}
        viewerRole={viewerRole}
        commentMode={commentMode}
        allowRepost={allowRepost}
      />
    );
  }
  const original = bundle.posts[post.repost_of_id];
  const header = (
    <RepostHeader
      userId={post.user_id}
      name={post.user_id === viewerId ? "You" : post.author_display_name}
      avatarUrl={post.author_avatar_url}
      createdAt={post.created_at}
    />
  );
  if (!original) {
    return (
      <article className={CARD}>
        {header}
        <UnavailablePost />
      </article>
    );
  }
  return (
    <PostCard
      post={original}
      bundle={bundle}
      viewerId={viewerId}
      viewerRole={viewerRole}
      header={header}
      commentMode={commentMode}
      rankReason={post.rank_reason}
    />
  );
}

function RepostHeader({
  userId,
  name,
  avatarUrl,
  createdAt,
}: {
  userId: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}) {
  return (
    <p className="-mt-1 mb-3 flex items-center gap-2 border-b border-[var(--border)] pb-2.5 text-xs text-[var(--fg-muted)]">
      <Repeat2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <Avatar name={name} url={avatarUrl} size="xs" />
      <span className="min-w-0 truncate">
        <Link href={`/u/${userId}`} className="font-semibold text-[var(--fg)] hover:underline underline-offset-2">
          {name}
        </Link>{" "}
        reposted this
      </span>
      <span className="ml-auto shrink-0 text-xs text-[var(--fg-subtle)]">{timeAgo(createdAt)}</span>
    </p>
  );
}

function Wells({ items }: { items: Array<{ label: string; value: string }> }) {
  if (items.length === 0) return null;
  return (
    <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((w) => (
        <div key={w.label} className="min-w-0 rounded-[var(--r-md)] bg-[var(--surface-2)] px-3 py-2">
          <dt className="text-[11px] font-semibold text-[var(--fg-subtle)]">{w.label}</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--fg)]" title={w.value}>
            {w.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function trackWell(t: TrackRecord | undefined): { label: string; value: string } | null {
  if (!t || t.deals_delivered === 0) return null;
  const deals = `${t.deals_delivered} deal${t.deals_delivered === 1 ? "" : "s"}`;
  return { label: "Track record", value: t.avg_rating !== null ? `${deals} · ${t.avg_rating.toFixed(1)}` : deals };
}

function DealStripView({ deal }: { deal: DealStrip }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center gap-3 rounded-[var(--r-md)] bg-[var(--surface-2)] px-3 py-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--offer-bg)] text-[var(--offer-fg)]"
          aria-hidden
        >
          <Check className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--fg)]">
            {deal.provider_name} delivered for {deal.seeker_name}
          </p>
          <p className="text-xs text-[var(--fg-muted)]">
            {deal.delivered_days > 0
              ? `Delivered in ${deal.delivered_days} day${deal.delivered_days === 1 ? "" : "s"} · `
              : ""}
            <span className="num">{money(deal.amount)}</span> released to {firstName(deal.provider_name)} · No Loop fee
          </p>
        </div>
        <span className="hidden xs:inline-flex shrink-0 rounded-full bg-[var(--offer-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--offer-fg)]">
          Released
        </span>
      </div>
      {deal.review_body && (
        <blockquote className="border-l-2 border-[var(--border-strong)] pl-3 text-sm text-[var(--fg)]">
          {deal.review_rating !== null && (
            <span className="mr-1 inline-flex align-[-2px]" aria-label={`${deal.review_rating} out of 5 stars`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < (deal.review_rating ?? 0) ? "fill-[var(--star)] text-[var(--star)]" : "text-[var(--border-strong)]"}`}
                  aria-hidden
                />
              ))}
            </span>
          )}
          &ldquo;{deal.review_body}&rdquo;{" "}
          <span className="text-[var(--fg-subtle)]">{firstName(deal.seeker_name)}, who hired them</span>
        </blockquote>
      )}
    </div>
  );
}

export function PostCard({
  post,
  viewerId,
  viewerRole,
  bundle = EMPTY_BUNDLE,
  header,
  commentMode = "preview",
  allowRepost = true,
  rankReason,
}: {
  post: FeedPost;
  viewerId: string;
  viewerRole?: string;
  bundle?: FeedBundle;
  header?: React.ReactNode;
  commentMode?: "preview" | "full";
  allowRepost?: boolean;
  /** For a repost, why "For you" ranked the repost row. */
  rankReason?: string | null;
}) {
  const kind = KIND_STYLE[post.kind];
  const isOwn = viewerId === post.user_id;
  const reactions = bundle.reactions[post.id] ?? { counts: emptyReactionCounts(), total: 0, mine: null };
  const comments = bundle.comments[post.id] ?? { count: 0, top_level_count: 0, recent: [] };
  const extras = bundle.extras[post.id] ?? {
    repostCount: 0,
    myRepostId: null,
    saved: false,
    views: null,
    poll: null,
  };
  const media = post.media ?? [];
  const quoted = post.quoted_post_id ? bundle.posts[post.quoted_post_id] : undefined;
  const reason = rankReasonLabel(rankReason ?? post.rank_reason);

  const wells = detailWells(post.kind, extras.details);
  if (post.kind === "offer") {
    const t = trackWell(bundle.tracks?.[post.user_id]);
    if (t && wells.length < 3) wells.push(t);
  }
  const deal = post.kind === "win" ? bundle.deals?.[post.id] : undefined;

  const subtitle = [post.author_company_name ?? post.author_industry].filter(Boolean).join("");

  return (
    <article
      className={CARD}
      data-impression-id={isOwn ? undefined : post.id}
      aria-label={`${kind ? `${kind.label} by` : "Post by"} ${post.author_display_name}`}
    >
      {header}
      <header className="flex items-start gap-3">
        <Link href={`/u/${post.user_id}`} aria-label={`View ${post.author_display_name}`} className={`rounded-full ${FOCUS}`}>
          <Avatar name={post.author_display_name} url={post.author_avatar_url} size="md" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <Link
              href={`/u/${post.user_id}`}
              className="min-w-0 truncate font-semibold text-[var(--fg)] hover:underline underline-offset-2"
            >
              {post.author_display_name}
            </Link>
            {kind && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${kind.chip}`}>
                {kind.label}
              </span>
            )}
          </div>
          <p className="text-[13px] text-[var(--fg-subtle)] truncate">
            {subtitle && <>{subtitle} · </>}
            <Link
              href={`/p/${post.id}`}
              className={`rounded hover:underline ${FOCUS}`}
              title={new Date(post.created_at).toLocaleString()}
            >
              {timeAgo(post.created_at)}
            </Link>
          </p>
          {reason && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-text)]">
              {reason}
              {post.similarity !== null && (
                <span className="num font-normal">· {(post.similarity * 100).toFixed(0)}% match</span>
              )}
            </p>
          )}
        </div>
        <PostMenu
          postId={post.id}
          body={post.body}
          isOwn={isOwn}
          canModerate={viewerRole === "owner" || viewerRole === "admin"}
          canEdit={!post.repost_of_id}
          saved={extras.saved}
        />
      </header>

      <PostBody body={post.body} className="mt-3" lines={commentMode === "full" ? 40 : 5} />

      <Wells items={wells} />
      {deal && <DealStripView deal={deal} />}

      {media.length > 0 && <MediaGrid media={media} authorName={post.author_display_name} />}
      {post.document && <DocumentCard doc={post.document} />}
      {media.length === 0 && !post.document && !post.quoted_post_id && post.link_preview && (
        <LinkPreviewCard preview={post.link_preview} />
      )}
      {post.quoted_post_id && <QuotedPost post={quoted} />}
      {extras.poll && <PollCard postId={post.id} poll={extras.poll} />}

      <PostActions
        postId={post.id}
        postKind={post.kind}
        initialReactions={reactions}
        commentCount={comments.count}
        repostCount={extras.repostCount}
        myRepostId={extras.myRepostId}
        allowRepost={allowRepost}
        views={null}
        quotePreview={<QuotedPost post={post} />}
        primarySlot={
          isOwn ? undefined : post.kind === "need" ? (
            <form action={offerHelpAndRedirect.bind(null, post.id)}>
              <button type="submit" className={PRIMARY_BTN}>
                <HandHeart className="h-4 w-4" aria-hidden />
                I can help
              </button>
            </form>
          ) : post.kind === "offer" ? (
            <form action={startDmAndRedirect.bind(null, post.user_id, "post")} className="min-w-0">
              <button type="submit" className={`${PRIMARY_BTN} max-w-full`}>
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">Message {firstName(post.author_display_name)}</span>
              </button>
            </form>
          ) : undefined
        }
      />

      <CommentThread
        postId={post.id}
        totalCount={comments.count}
        topLevelCount={comments.top_level_count}
        recent={comments.recent}
        showAllLink={commentMode === "preview"}
      />
    </article>
  );
}
