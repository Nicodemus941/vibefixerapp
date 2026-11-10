import Link from "next/link";
import { HandHeart, MessageSquare, Repeat2 } from "lucide-react";
import { offerHelpAndRedirect, startDmAndRedirect } from "@/app/inbox/actions";
import { rankReasonLabel } from "@/lib/feed-rank";
import { PRIMARY_BTN } from "./styles";
import { Avatar } from "@/components/Avatar";
import type { FeedBundle, FeedPost } from "@/lib/feed-types";
import { emptyReactionCounts } from "@/lib/reactions";
import { CommentThread } from "./CommentThread";
import { PostMenu } from "./PostMenu";
import { PostBody } from "./PostBody";
import { MediaGrid } from "./MediaGrid";
import { DocumentCard, LinkPreviewCard, QuotedPost, UnavailablePost } from "./Attachments";
import { PollCard } from "./PollCard";
import { PostActions } from "./PostActions";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]";

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
      <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
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
        <Link href={`/u/${userId}`} className="font-medium text-[var(--fg)] hover:underline underline-offset-2">
          {name}
        </Link>{" "}
        reposted this
      </span>
      <span className="ml-auto shrink-0 font-mono text-[10px] text-[var(--fg-subtle)]">{timeAgo(createdAt)}</span>
    </p>
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
}: {
  post: FeedPost;
  viewerId: string;
  viewerRole?: string;
  bundle?: FeedBundle;
  header?: React.ReactNode;
  commentMode?: "preview" | "full";
  allowRepost?: boolean;
}) {
  const k = kindLabel(post.kind);
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

  return (
    <article
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5 hover:border-[var(--border-strong)] transition-colors"
      data-impression-id={isOwn ? undefined : post.id}
      aria-label={`Post by ${post.author_display_name}`}
    >
      {header}
      <header className="flex items-start gap-3">
        <Link href={`/u/${post.user_id}`} aria-label={`View ${post.author_display_name}`} className={`rounded-full ${FOCUS}`}>
          <Avatar name={post.author_display_name} url={post.author_avatar_url} size="md" />
        </Link>
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
            <Link
              href={`/p/${post.id}`}
              className={`rounded font-mono text-xs text-[var(--fg-subtle)] hover:underline ${FOCUS}`}
              title={new Date(post.created_at).toLocaleString()}
            >
              · {timeAgo(post.created_at)}
            </Link>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
            {post.author_industry}
            {rankReasonLabel(post.rank_reason) && (
              <span
                className="normal-case tracking-normal"
                title="Why this is near the top of For you"
              >
                {post.author_industry ? " · " : ""}
                {rankReasonLabel(post.rank_reason)}
                {post.similarity !== null && (
                  <span className="tabular-nums"> ({(post.similarity * 100).toFixed(0)}% match)</span>
                )}
              </span>
            )}
          </p>
        </div>
        {k && (
          <span
            className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${k.color}`}
          >
            {k.label}
          </span>
        )}
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
            <form action={startDmAndRedirect.bind(null, post.user_id, "post")}>
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

