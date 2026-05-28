"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, Flag, Loader2, MoreHorizontal, Trash2, X } from "lucide-react";
import { deletePost, editPost } from "../actions";
import { fileReport } from "@/app/moderation/actions";

export function PostMenu({
  postId,
  body,
  isOwn,
  canModerate,
}: {
  postId: string;
  body: string;
  isOwn: boolean;
  canModerate: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "edit" | "report">("menu");
  const [draft, setDraft] = useState(body);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  function close() {
    setOpen(false);
    setMode("menu");
    setError(null);
  }

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

  function onEditSave() {
    setError(null);
    startTransition(async () => {
      const r = await editPost({ postId, body: draft });
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setMode("menu");
          setError(null);
        }}
        aria-label="Post menu"
        className="press-shrink inline-flex items-center justify-center h-7 w-7 rounded-full text-[var(--fg-subtle)] hover:bg-white/[0.04] hover:text-[var(--fg)]"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 shadow-xl z-50">
          {mode === "menu" && (
            <div className="space-y-1.5">
              {isOwn && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("edit")}
                    className="press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.04]"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={pending}
                    className="press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--danger)] hover:bg-white/[0.04]"
                  >
                    {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Delete
                  </button>
                </>
              )}
              {!isOwn && (
                <button
                  type="button"
                  onClick={() => setMode("report")}
                  className="press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.04]"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Report
                </button>
              )}
              {!isOwn && canModerate && (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={pending}
                  className="press-shrink w-full text-left flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[var(--danger)] hover:bg-white/[0.04]"
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
                  className="text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 600))}
                rows={4}
                disabled={pending}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums">
                  {draft.length}/600
                </span>
                <button
                  type="button"
                  onClick={onEditSave}
                  disabled={pending || !draft.trim()}
                  className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
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
                  className="text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 2000))}
                placeholder="What's wrong?"
                rows={3}
                disabled={pending}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={onReport}
                disabled={pending || !reason.trim()}
                className="press-shrink w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
              >
                {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
                Send report
              </button>
            </div>
          )}
          {error && <p className="text-xs text-[var(--danger)] mt-2">{error}</p>}
          {sent && <p className="text-xs text-[var(--accent)] mt-2">Report sent.</p>}
        </div>
      )}
    </div>
  );
}
