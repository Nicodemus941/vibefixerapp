"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Bookmark,
  BookmarkCheck,
  Check,
  Edit3,
  Flag,
  Link2,
  Loader2,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { deletePost, editPost, toggleSave } from "../actions";
import { fileReport } from "@/app/moderation/actions";
import { POST_BODY_MAX, toEditable, toStoredText, type MentionPick } from "@/lib/post-text";
import { FOCUS_RING } from "./Modal";
import { MentionTextarea } from "./MentionTextarea";

const ITEM = `press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-[var(--surface-2)] ${FOCUS_RING}`;

export function PostMenu({
  postId,
  body,
  isOwn,
  canModerate,
  canEdit = true,
  saved = false,
}: {
  postId: string;
  body: string;
  isOwn: boolean;
  canModerate: boolean;
  canEdit?: boolean;
  saved?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "edit" | "report">("menu");
  const [draft, setDraft] = useState(() => toEditable(body).text);
  const [picks, setPicks] = useState<MentionPick[]>(() => toEditable(body).picks);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    setMode("menu");
    setError(null);
  }

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onDelete() {
    if (!confirm("Delete this post? This can't be undone.")) return;
    startTransition(async () => {
      const r = await deletePost(postId);
      if (r.error) setError(r.error);
      else {
        close();
        router.refresh();
      }
    });
  }

  const storedDraft = toStoredText(draft.trim(), picks);

  function onEditSave() {
    setError(null);
    startTransition(async () => {
      const r = await editPost({ postId, body: storedDraft });
      if (r.error) setError(r.error);
      else {
        close();
        router.refresh();
      }
    });
  }

  function onReport() {
    if (!reason.trim()) {
      setError("Tell us what's wrong.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await fileReport({ targetKind: "post", targetId: postId, reason });
      if (r.error) setError(r.error);
      else {
        setSent(true);
        setReason("");
        setMode("menu");
        setTimeout(close, 1200);
      }
    });
  }

  function onReportBot() {
    setError(null);
    startTransition(async () => {
      const r = await fileReport({
        targetKind: "post",
        targetId: postId,
        reason: "Reported as bot or spam",
        category: "bot_spam",
      });
      if (r.error) setError(r.error);
      else {
        setSent(true);
        setTimeout(close, 1200);
      }
    });
  }

  function onToggleSave() {
    const next = !isSaved;
    setIsSaved(next);
    setError(null);
    startTransition(async () => {
      const r = await toggleSave(postId);
      if (r.error) {
        setIsSaved(!next);
        setError(r.error);
      } else {
        router.refresh();
      }
    });
  }

  async function onCopyLink() {
    const url = new URL(`/p/${postId}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setMode("menu");
          setError(null);
        }}
        aria-label="Post menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`press-shrink inline-flex items-center justify-center h-9 w-9 -mr-1.5 rounded-full text-[var(--fg-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] ${FOCUS_RING}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 shadow-xl z-50">
          {mode === "menu" && (
            <div className="space-y-1.5" role="menu" aria-label="Post actions">
              <button type="button" role="menuitem" onClick={onToggleSave} className={`${ITEM} text-[var(--fg)]`}>
                {isSaved ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                {isSaved ? "Unsave" : "Save"}
              </button>
              <button type="button" role="menuitem" onClick={onCopyLink} className={`${ITEM} text-[var(--fg)]`}>
                {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : <Link2 className="h-3.5 w-3.5" />}
                <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
              </button>
              {isOwn && canEdit && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMode("edit")}
                  className={`${ITEM} text-[var(--fg)]`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {isOwn && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={onDelete}
                  disabled={pending}
                  className={`${ITEM} text-[var(--danger)]`}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete
                </button>
              )}
              {!isOwn && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setMode("report")}
                  className={`${ITEM} text-[var(--fg)]`}
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report
                </button>
              )}
              {!isOwn && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={onReportBot}
                  disabled={pending}
                  className={`${ITEM} text-[var(--fg)]`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  Report as bot or spam
                </button>
              )}
              {!isOwn && canModerate && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={onDelete}
                  disabled={pending}
                  className={`${ITEM} text-[var(--danger)]`}
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Delete (admin)
                </button>
              )}
            </div>
          )}
          {mode === "edit" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
                  Edit post
                </p>
                <button
                  type="button"
                  onClick={() => setMode("menu")}
                  aria-label="Back to menu"
                  className={`rounded text-[var(--fg-subtle)] hover:text-[var(--fg)] ${FOCUS_RING}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <MentionTextarea
                value={draft}
                onChange={setDraft}
                picks={picks}
                onPicksChange={setPicks}
                ariaLabel="Edit post"
                rows={6}
                disabled={pending}
                onSubmit={onEditSave}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-[10px] tabular-nums ${storedDraft.length > POST_BODY_MAX ? "text-[var(--danger)]" : "text-[var(--fg-subtle)]"}`}
                >
                  {storedDraft.length}/{POST_BODY_MAX}
                </span>
                <button
                  type="button"
                  onClick={onEditSave}
                  disabled={pending || storedDraft.length > POST_BODY_MAX}
                  className={`press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 ${FOCUS_RING}`}
                >
                  {pending && <Loader2 className="h-3 w-3 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          )}
          {mode === "report" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
                  Report post
                </p>
                <button
                  type="button"
                  onClick={() => setMode("menu")}
                  aria-label="Back to menu"
                  className={`rounded text-[var(--fg-subtle)] hover:text-[var(--fg)] ${FOCUS_RING}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 2000))}
                placeholder="What's wrong?"
                aria-label="Reason for report"
                rows={3}
                disabled={pending}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={onReport}
                disabled={pending || !reason.trim()}
                className={`press-shrink w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 ${FOCUS_RING}`}
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
                Send report
              </button>
            </div>
          )}
          {error && <p role="alert" className="text-xs text-[var(--danger)] mt-2">{error}</p>}
          {sent && <p className="text-xs text-[var(--accent)] mt-2">Report sent.</p>}
        </div>
      )}
    </div>
  );
}
