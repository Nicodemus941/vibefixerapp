"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, Send } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { COMMENT_BODY_MAX, toStoredText, type MentionPick } from "@/lib/post-text";
import type { CommentRow } from "@/lib/feed-types";
import { createComment, toggleCommentLike } from "../actions";
import { FOCUS_RING } from "./Modal";
import { MentionTextarea, type MentionTextareaHandle } from "./MentionTextarea";
import { RichText } from "./PostBody";

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

const FIELD =
  "w-full h-9 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

export function CommentThread({
  postId,
  totalCount,
  topLevelCount,
  recent,
  showAllLink = true,
}: {
  postId: string;
  totalCount: number;
  topLevelCount?: number;
  recent: CommentRow[];
  showAllLink?: boolean;
}) {
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const hiddenTop = Math.max(0, (topLevelCount ?? recent.length) - recent.length);

  return (
    <div className="mt-3 border-t border-[var(--border)] pt-3 space-y-3">
      {showAllLink && hiddenTop > 0 && (
        <Link
          href={`/p/${postId}`}
          className={`inline-block rounded text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:underline ${FOCUS_RING}`}
        >
          View all {totalCount} comments
        </Link>
      )}
      {recent.map((c) => (
        <div key={c.id} className="space-y-2.5">
          <CommentItem comment={c} onReply={() => setReplyTo({ id: c.id, name: c.author_display_name })} />
          {(c.replies.length > 0 || c.hidden_reply_count > 0 || replyTo?.id === c.id) && (
            <div className="ml-9 space-y-2.5 border-l border-[var(--border)] pl-3">
              {c.hidden_reply_count > 0 && (
                <Link
                  href={`/p/${postId}`}
                  className={`inline-block rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] hover:underline ${FOCUS_RING}`}
                >
                  {c.hidden_reply_count} earlier repl{c.hidden_reply_count === 1 ? "y" : "ies"}
                </Link>
              )}
              {c.replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  small
                  onReply={() => setReplyTo({ id: c.id, name: r.author_display_name })}
                />
              ))}
              {replyTo?.id === c.id && (
                <CommentForm
                  postId={postId}
                  parentId={c.id}
                  replyingTo={replyTo.name}
                  autoFocus
                  onDone={() => setReplyTo(null)}
                  onCancel={() => setReplyTo(null)}
                />
              )}
            </div>
          )}
        </div>
      ))}

      <CommentForm postId={postId} inputId={`comment-input-${postId}`} />
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  small = false,
}: {
  comment: CommentRow;
  onReply: () => void;
  small?: boolean;
}) {
  const [liked, setLiked] = useState(comment.liked_by_me);
  const [count, setCount] = useState(comment.like_count);
  const [pending, startTransition] = useTransition();

  function like() {
    const next = !liked;
    setLiked(next);
    setCount((n) => Math.max(0, n + (next ? 1 : -1)));
    startTransition(async () => {
      const r = await toggleCommentLike(comment.id);
      if (r.error || r.liked !== next) {
        setLiked(!next);
        setCount((n) => Math.max(0, n + (next ? -1 : 1)));
      }
    });
  }

  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Link href={`/u/${comment.user_id}`} aria-label={`View ${comment.author_display_name}`} className={`rounded-full ${FOCUS_RING}`}>
        <Avatar name={comment.author_display_name} url={comment.author_avatar_url} size={small ? "xs" : "sm"} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-[var(--surface-2)] px-3 py-2">
          <Link
            href={`/u/${comment.user_id}`}
            className="font-medium text-[var(--fg)] hover:underline underline-offset-2"
          >
            {comment.author_display_name}
          </Link>
          <p className="mt-0.5 text-[var(--fg)] leading-snug whitespace-pre-wrap break-words">
            <RichText body={comment.body} />
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-1 font-mono text-[11px] text-[var(--fg-subtle)]">
          <span>{timeAgo(comment.created_at)}</span>
          <button
            type="button"
            onClick={like}
            disabled={pending}
            aria-pressed={liked}
            aria-label={liked ? "Unlike comment" : "Like comment"}
            className={`press-shrink inline-flex items-center gap-1 rounded hover:text-[var(--fg)] ${liked ? "text-rose-400" : ""} ${FOCUS_RING}`}
          >
            <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} aria-hidden />
            Like
            {count > 0 && <span className="tabular-nums">{count}</span>}
          </button>
          <button
            type="button"
            onClick={onReply}
            className={`press-shrink rounded hover:text-[var(--fg)] ${FOCUS_RING}`}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

function CommentForm({
  postId,
  parentId,
  replyingTo,
  inputId,
  autoFocus,
  onDone,
  onCancel,
}: {
  postId: string;
  parentId?: string;
  replyingTo?: string;
  inputId?: string;
  autoFocus?: boolean;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [text, setText] = useState("");
  const [picks, setPicks] = useState<MentionPick[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const fieldRef = useRef<MentionTextareaHandle>(null);

  useEffect(() => {
    if (autoFocus) fieldRef.current?.focus();
  }, [autoFocus]);

  function submit() {
    const stored = toStoredText(text.trim(), picks);
    if (!stored || pending) return;
    if (stored.length > COMMENT_BODY_MAX) {
      setError(`Comments are limited to ${COMMENT_BODY_MAX} characters.`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await createComment({ postId, body: stored, parentCommentId: parentId ?? null });
      if (r.error) setError(r.error);
      else {
        setText("");
        setPicks([]);
        onDone?.();
        router.refresh();
      }
    });
  }

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === "Escape" && onCancel) onCancel();
      }}
    >
      <div className="flex items-start gap-2">
        <div id={inputId} tabIndex={-1} className="sr-only" onFocus={() => fieldRef.current?.focus()} />
        <MentionTextarea
          ref={fieldRef}
          value={text}
          onChange={setText}
          picks={picks}
          onPicksChange={setPicks}
          multiline={false}
          maxLength={COMMENT_BODY_MAX}
          disabled={pending}
          ariaLabel={replyingTo ? `Reply to ${replyingTo}` : "Add a comment"}
          placeholder={replyingTo ? `Reply to ${replyingTo}…` : "Add a comment. Type @ to mention."}
          onSubmit={submit}
          className={FIELD}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || pending}
          aria-label={replyingTo ? "Send reply" : "Send comment"}
          className={`press-shrink shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter] ${FOCUS_RING}`}
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
