"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { createGroupPost } from "../actions";
import { extractHashtags } from "@/lib/hashtags";

const MAX = 600;

export function GroupComposer({ slug }: { slug: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const tags = extractHashtags(body);
  const remaining = MAX - body.length;

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await createGroupPost({ groupSlug: slug, body });
      if (r.error) setError(r.error);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value.slice(0, MAX))}
        placeholder="Post to this group…"
        rows={3}
        disabled={pending}
        className="w-full resize-none bg-transparent text-[var(--fg)] placeholder:text-[var(--fg-subtle)] outline-none text-base leading-relaxed"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            if (body.trim()) submit();
          }
        }}
      />
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="font-mono text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/12 text-[var(--accent)] border border-[var(--accent)]/30"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
        <span
          className={`font-mono text-xs tabular-nums ${
            remaining < 40 ? "text-[var(--danger)]" : "text-[var(--fg-subtle)]"
          }`}
        >
          {remaining}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || pending}
          className="press-shrink inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
