"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { createPost } from "../actions";
import { extractHashtags } from "@/lib/hashtags";

const MAX = 600;

export function Composer({ displayName }: { displayName: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const tags = extractHashtags(body);
  const remaining = MAX - body.length;

  function inferKind(): "update" | "need" | "offer" | "win" {
    const t = tags.map((x) => x.toLowerCase());
    if (t.some((x) => x.startsWith("need") || x === "lookingfor" || x === "hiring")) return "need";
    if (t.some((x) => x.startsWith("offer") || x === "available" || x === "selling")) return "offer";
    if (t.some((x) => x === "shipped" || x === "win" || x === "closed")) return "win";
    return "update";
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createPost({ body, kind: inferKind() });
      if (res.error) setError(res.error);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
          {(displayName?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            placeholder="What do you need today? Tag with #design #cfo #cold-email so the right founders see it."
            rows={3}
            className="w-full resize-none bg-transparent text-[var(--fg)] placeholder:text-[var(--fg-subtle)] outline-none text-base leading-relaxed"
            disabled={pending}
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
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
        <span
          className={[
            "font-mono text-xs tabular-nums shrink-0",
            remaining < 40 ? "text-[var(--danger)]" : "text-[var(--fg-subtle)]",
          ].join(" ")}
        >
          {remaining}
        </span>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || pending}
          className="press-shrink inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-[filter]"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Posting
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Post
            </>
          )}
        </button>
      </div>
    </div>
  );
}
