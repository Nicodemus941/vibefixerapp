"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, HandCoins, Loader2, Send, Trophy } from "lucide-react";
import { createPost } from "../actions";
import { extractHashtags } from "@/lib/hashtags";

const MAX = 600;

type PostKind = "need" | "offer" | "win";

const KIND_OPTIONS: Array<{
  value: PostKind;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  placeholder: string;
}> = [
  {
    value: "need",
    label: "Need",
    icon: Briefcase,
    hint: "Something you're looking to get done.",
    placeholder:
      "What do you need today? Be specific — budget, timeline, the shape of the work. Tag with #design #cfo #ios so the right founders see it.",
  },
  {
    value: "offer",
    label: "Offer",
    icon: HandCoins,
    hint: "Something you can deliver for another founder.",
    placeholder:
      "What can you deliver this month? Who it's for, the scope, how to engage. Tag with the categories you serve.",
  },
  {
    value: "win",
    label: "Win",
    icon: Trophy,
    hint: "Receipts only — a thing you actually shipped or closed.",
    placeholder:
      "What did you ship? Who did you work with? Concrete is better than vague.",
  },
];

export function Composer({ displayName }: { displayName: string }) {
  const [kind, setKind] = useState<PostKind>("need");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const tags = extractHashtags(body);
  const remaining = MAX - body.length;
  const active = KIND_OPTIONS.find((o) => o.value === kind)!;

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createPost({ body, kind });
      if (res.error) setError(res.error);
      else {
        setBody("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5">
      <div role="tablist" aria-label="Post kind" className="flex items-center gap-1.5 mb-3">
        {KIND_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = kind === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setKind(opt.value)}
              className={[
                "press-shrink inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
        <p className="ml-auto hidden sm:block font-mono text-[10px] text-[var(--fg-subtle)] truncate">
          {active.hint}
        </p>
      </div>

      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
          {(displayName?.[0] ?? "?").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            placeholder={active.placeholder}
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

      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

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
              Post {active.label.toLowerCase()}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
