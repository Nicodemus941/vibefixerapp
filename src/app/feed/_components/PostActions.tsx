"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronUp, Eye, Loader2, MessageCircle, PenLine, Repeat2, Send } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import {
  REACTION_KINDS,
  REACTION_LABELS,
  topReactions,
  type ReactionKind,
} from "@/lib/reactions";
import { POST_BODY_MAX, toStoredText, type MentionPick } from "@/lib/post-text";
import type { ReactionState } from "@/lib/feed-types";
import {
  createPost,
  fetchReactors,
  repostPost,
  setReaction,
  undoRepost,
  type Reactor,
} from "../actions";
import { FOCUS_RING, Modal } from "./Modal";
import { MentionTextarea } from "./MentionTextarea";
import { REACTION_COLORS, REACTION_ICONS, ReactionBubble } from "./reaction-icons";

const ACTION_BTN = `press-shrink inline-flex min-w-0 flex-1 flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 rounded-lg px-1 sm:px-2 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium text-[var(--fg-muted)] hover:bg-white/[0.04] hover:text-[var(--fg)] transition-colors ${FOCUS_RING}`;

type QuoteKind = "need" | "offer" | "win";

export function PostActions({
  postId,
  postKind,
  initialReactions,
  commentCount,
  repostCount,
  myRepostId,
  allowRepost = true,
  views,
  quotePreview,
  messageSlot,
}: {
  postId: string;
  postKind: string;
  initialReactions: ReactionState;
  commentCount: number;
  repostCount: number;
  myRepostId: string | null;
  allowRepost?: boolean;
  views: number | null;
  quotePreview: React.ReactNode;
  messageSlot?: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [reactions, applyReaction] = useOptimistic(
    initialReactions,
    (prev: ReactionState, next: ReactionKind | null): ReactionState => {
      const counts = { ...prev.counts };
      let total = prev.total;
      if (prev.mine) {
        counts[prev.mine] = Math.max(0, counts[prev.mine] - 1);
        total -= 1;
      }
      if (next) {
        counts[next] += 1;
        total += 1;
      }
      return { counts, total: Math.max(0, total), mine: next };
    },
  );

  function react(next: ReactionKind | null) {
    setError(null);
    startTransition(async () => {
      applyReaction(next);
      const r = await setReaction({ postId, kind: next });
      if (r.error) setError(r.error);
      router.refresh();
    });
  }

  const [reposted, applyRepost] = useOptimistic(
    { mine: Boolean(myRepostId), count: repostCount },
    (prev, on: boolean) => ({ mine: on, count: Math.max(0, prev.count + (on ? 1 : -1)) }),
  );

  function toggleRepost() {
    setError(null);
    const on = !reposted.mine;
    startTransition(async () => {
      applyRepost(on);
      const r = on ? await repostPost(postId) : await undoRepost(postId);
      if (r.error) setError(r.error);
      router.refresh();
    });
  }

  const [reactorsOpen, setReactorsOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);

  const top = topReactions(reactions.counts);
  const hasSummary = reactions.total > 0 || commentCount > 0 || reposted.count > 0 || views !== null;

  return (
    <>
      {hasSummary && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--fg-subtle)]">
          {reactions.total > 0 && (
            <button
              type="button"
              onClick={() => setReactorsOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded hover:text-[var(--fg)] hover:underline ${FOCUS_RING}`}
              aria-label={`${reactions.total} reaction${reactions.total === 1 ? "" : "s"}. See who reacted`}
            >
              <span className="flex -space-x-1">
                {top.map((k) => (
                  <ReactionBubble key={k} kind={k} />
                ))}
              </span>
              <span className="font-mono tabular-nums">{reactions.total}</span>
            </button>
          )}
          <span className="ml-auto flex items-center gap-3">
            {commentCount > 0 && (
              <Link href={`/p/${postId}`} className={`rounded hover:text-[var(--fg)] hover:underline ${FOCUS_RING}`}>
                <span className="font-mono tabular-nums">{commentCount}</span> comment{commentCount === 1 ? "" : "s"}
              </Link>
            )}
            {reposted.count > 0 && (
              <span>
                <span className="font-mono tabular-nums">{reposted.count}</span> repost{reposted.count === 1 ? "" : "s"}
              </span>
            )}
            {views !== null && (
              <span className="inline-flex items-center gap-1" title="People who saw this post. Only you can see this.">
                <Eye className="h-3.5 w-3.5" aria-hidden />
                <span className="font-mono tabular-nums">{views}</span> view{views === 1 ? "" : "s"}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-stretch gap-1 border-t border-[var(--border)] pt-1.5">
        <ReactButton mine={reactions.mine} onReact={react} />
        <button
          type="button"
          className={ACTION_BTN}
          onClick={() => document.getElementById(`comment-input-${postId}`)?.focus()}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Comment
        </button>
        {allowRepost && (
          <RepostMenu
            reposted={reposted.mine}
            onToggle={toggleRepost}
            onQuote={() => setQuoteOpen(true)}
          />
        )}
        {messageSlot}
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}

      <ReactorsDialog
        open={reactorsOpen}
        onClose={() => setReactorsOpen(false)}
        postId={postId}
        counts={reactions.counts}
        total={reactions.total}
      />
      <QuoteDialog
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        postId={postId}
        defaultKind={postKind === "need" || postKind === "offer" || postKind === "win" ? postKind : "need"}
        preview={quotePreview}
      />
    </>
  );
}

// "Like" button. Click toggles Like (or clears your reaction). Hover on a
// pointer device, long press on touch, or the arrow button opens the picker.
function ReactButton({
  mine,
  onReact,
}: {
  mine: ReactionKind | null;
  onReact: (k: ReactionKind | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [focusPicker, setFocusPicker] = useState(false);

  const Icon = REACTION_ICONS[mine ?? "like"];
  const label = mine ? REACTION_LABELS[mine] : "Like";

  useEffect(() => {
    if (open && focusPicker) firstItemRef.current?.focus();
  }, [open, focusPicker]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const clearTimers = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  function pick(k: ReactionKind) {
    setOpen(false);
    setFocusPicker(false);
    onReact(mine === k ? null : k);
  }

  return (
    <div
      ref={wrapRef}
      className="relative flex flex-1"
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimers();
        hoverTimer.current = setTimeout(() => setOpen(true), 450);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimers();
        if (!focusPicker) hoverTimer.current = setTimeout(() => setOpen(false), 300);
      }}
    >
      <button
        type="button"
        aria-pressed={Boolean(mine)}
        aria-label={mine ? `${label}. Press to remove your reaction` : "Like"}
        onTouchStart={() => {
          longPressed.current = false;
          pressTimer.current = setTimeout(() => {
            longPressed.current = true;
            setOpen(true);
          }, 450);
        }}
        onTouchEnd={() => {
          if (pressTimer.current) clearTimeout(pressTimer.current);
        }}
        onTouchMove={() => {
          if (pressTimer.current) clearTimeout(pressTimer.current);
        }}
        onContextMenu={(e) => {
          if (longPressed.current) e.preventDefault();
        }}
        onClick={(e) => {
          if (longPressed.current) {
            e.preventDefault();
            longPressed.current = false;
            return;
          }
          setOpen(false);
          onReact(mine ? null : "like");
        }}
        className={`${ACTION_BTN} select-none ${mine ? REACTION_COLORS[mine] : ""}`}
        style={{ WebkitTouchCallout: "none" }}
      >
        <Icon className="h-4 w-4" aria-hidden />
        {label}
      </button>
      <button
        ref={toggleRef}
        type="button"
        aria-label="Choose a reaction"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setFocusPicker(true);
          setOpen((o) => !o);
        }}
        className={`press-shrink hidden sm:inline-flex items-center justify-center rounded-lg px-1 text-[var(--fg-subtle)] hover:bg-white/[0.04] hover:text-[var(--fg)] ${FOCUS_RING}`}
      >
        <ChevronUp className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Reactions"
          className="absolute bottom-full left-0 z-50 mb-2 flex items-center gap-0.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] p-1 shadow-xl"
          onKeyDown={(e) => {
            const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
            const i = items.indexOf(document.activeElement as HTMLButtonElement);
            if (e.key === "ArrowRight") {
              e.preventDefault();
              items[(i + 1) % items.length]?.focus();
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              items[(i - 1 + items.length) % items.length]?.focus();
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
              setFocusPicker(false);
              toggleRef.current?.focus();
            }
          }}
        >
          {REACTION_KINDS.map((k, i) => {
            const KIcon = REACTION_ICONS[k];
            return (
              <button
                key={k}
                ref={i === 0 ? firstItemRef : undefined}
                type="button"
                role="menuitemradio"
                aria-checked={mine === k}
                aria-label={REACTION_LABELS[k]}
                title={REACTION_LABELS[k]}
                onClick={() => pick(k)}
                className={`press-shrink inline-flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:-translate-y-0.5 hover:scale-110 hover:bg-white/[0.06] ${REACTION_COLORS[k]} ${mine === k ? "bg-white/[0.08]" : ""} ${FOCUS_RING}`}
              >
                <KIcon className="h-5 w-5" aria-hidden />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RepostMenu({
  reposted,
  onToggle,
  onQuote,
}: {
  reposted: boolean;
  onToggle: () => void;
  onQuote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    firstRef.current?.focus();
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="relative flex flex-1"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${ACTION_BTN} ${reposted ? "text-[var(--accent)]" : ""}`}
      >
        <Repeat2 className="h-4 w-4" aria-hidden />
        {reposted ? "Reposted" : "Repost"}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-50 mb-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-1.5 shadow-xl"
        >
          <button
            ref={firstRef}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onToggle();
            }}
            className={`press-shrink flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--fg)] hover:bg-white/[0.04] ${FOCUS_RING}`}
          >
            <Repeat2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="block font-medium">{reposted ? "Undo repost" : "Repost"}</span>
              <span className="block text-xs text-[var(--fg-subtle)]">
                {reposted ? "Remove it from your followers' feeds." : "Share it with your followers right away."}
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onQuote();
            }}
            className={`press-shrink flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[var(--fg)] hover:bg-white/[0.04] ${FOCUS_RING}`}
          >
            <PenLine className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              <span className="block font-medium">Repost with your thoughts</span>
              <span className="block text-xs text-[var(--fg-subtle)]">Write a post that quotes this one.</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

function ReactorsDialog({
  open,
  onClose,
  postId,
  counts,
  total,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  counts: Record<ReactionKind, number>;
  total: number;
}) {
  const [filter, setFilter] = useState<ReactionKind | "all">("all");
  const [rows, setRows] = useState<Reactor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setRows(null);
    setError(null);
    fetchReactors(postId).then((r) => {
      if (!alive) return;
      if (r.error) setError(r.error);
      setRows(r.reactors);
    });
    return () => {
      alive = false;
    };
  }, [open, postId]);

  const tabs: Array<{ key: ReactionKind | "all"; label: string; n: number }> = [
    { key: "all", label: "All", n: total },
    ...REACTION_KINDS.filter((k) => counts[k] > 0).map((k) => ({ key: k, label: REACTION_LABELS[k], n: counts[k] })),
  ];
  const visible = (rows ?? []).filter((r) => filter === "all" || r.kind === filter);

  return (
    <Modal open={open} onClose={onClose} title="Reactions">
      <div role="tablist" aria-label="Filter reactions" className="flex gap-1 overflow-x-auto border-b border-[var(--border)] px-3 py-2">
        {tabs.map((t) => {
          const Icon = t.key === "all" ? null : REACTION_ICONS[t.key];
          const selected = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(t.key)}
              className={[
                "press-shrink inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
                selected ? "bg-[var(--accent)] text-[var(--bg)]" : "text-[var(--fg-muted)] hover:bg-white/[0.04] hover:text-[var(--fg)]",
                FOCUS_RING,
              ].join(" ")}
            >
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
              {t.label}
              <span className="font-mono tabular-nums">{t.n}</span>
            </button>
          );
        })}
      </div>
      <div className="min-h-[8rem] overflow-y-auto p-2">
        {rows === null && !error && (
          <p className="flex items-center justify-center gap-2 p-6 text-sm text-[var(--fg-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading
          </p>
        )}
        {error && <p className="p-4 text-sm text-[var(--danger)]">{error}</p>}
        {rows !== null && visible.length === 0 && !error && (
          <p className="p-6 text-center text-sm text-[var(--fg-muted)]">No reactions to show.</p>
        )}
        <ul>
          {visible.map((r) => (
            <li key={r.user_id}>
              <Link
                href={`/u/${r.user_id}`}
                className={`flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04] ${FOCUS_RING}`}
              >
                <span className="relative">
                  <Avatar name={r.display_name} url={r.avatar_url} size="sm" />
                  <ReactionBubble kind={r.kind} className="absolute -bottom-1 -right-1" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--fg)]">{r.display_name}</span>
                  {r.company_name && (
                    <span className="block truncate text-xs text-[var(--fg-subtle)]">{r.company_name}</span>
                  )}
                </span>
                <span className="sr-only">reacted {REACTION_LABELS[r.kind]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

function QuoteDialog({
  open,
  onClose,
  postId,
  defaultKind,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  defaultKind: QuoteKind;
  preview: React.ReactNode;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [picks, setPicks] = useState<MentionPick[]>([]);
  const [kind, setKind] = useState<QuoteKind>(defaultKind);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const stored = toStoredText(text, picks);
  const remaining = POST_BODY_MAX - stored.length;

  function submit() {
    if (!text.trim() || pending || remaining < 0) return;
    setError(null);
    startTransition(async () => {
      const r = await createPost({ body: stored, kind, quotedPostId: postId });
      if (r.error) setError(r.error);
      else {
        setText("");
        setPicks([]);
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Repost with your thoughts">
      <div className="overflow-y-auto p-4 space-y-3">
        <div role="radiogroup" aria-label="Post kind" className="flex gap-1.5">
          {(["need", "offer", "win"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className={[
                "press-shrink rounded-full px-3 py-1.5 text-xs font-medium capitalize",
                kind === k
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)]",
                FOCUS_RING,
              ].join(" ")}
            >
              {k}
            </button>
          ))}
        </div>
        <MentionTextarea
          value={text}
          onChange={setText}
          picks={picks}
          onPicksChange={setPicks}
          ariaLabel="Your thoughts"
          placeholder="Add your take. Type @ to mention someone."
          rows={4}
          disabled={pending}
          onSubmit={submit}
          className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        {preview}
        {error && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span
            className={`font-mono text-xs tabular-nums ${remaining < 100 ? "text-[var(--danger)]" : "text-[var(--fg-subtle)]"}`}
          >
            {remaining}
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim() || pending || remaining < 0}
            className={`press-shrink inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-40 hover:brightness-110 ${FOCUS_RING}`}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
            Post
          </button>
        </div>
      </div>
    </Modal>
  );
}
