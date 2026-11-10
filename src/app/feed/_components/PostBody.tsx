"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { tokenize } from "@/lib/post-text";
import { FOCUS_RING } from "./Modal";

// Renders stored post or comment text: #hashtags, @mentions and URLs become
// links. Long text collapses to a few lines with a "see more" toggle.
export function RichText({ body }: { body: string }) {
  return (
    <>
      {tokenize(body).map((t, i) => {
        switch (t.type) {
          case "text":
            return <span key={i}>{t.value}</span>;
          case "hashtag":
            return (
              <Link
                key={i}
                href={`/feed?tag=${encodeURIComponent(t.tag)}`}
                className="text-[var(--accent)] hover:underline font-medium"
              >
                #{t.tag}
              </Link>
            );
          case "mention":
            return (
              <Link
                key={i}
                href={`/u/${t.id}`}
                className="text-[var(--accent)] hover:underline font-medium"
              >
                @{t.name}
              </Link>
            );
          case "url":
            return (
              <a
                key={i}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="text-[var(--accent)] hover:underline break-all"
              >
                {t.label.length > 60 ? `${t.label.slice(0, 57)}…` : t.label}
              </a>
            );
        }
      })}
    </>
  );
}

export function PostBody({
  body,
  lines = 5,
  className = "",
}: {
  body: string;
  lines?: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [body, expanded]);

  if (!body) return null;

  return (
    <div className={className}>
      <p
        ref={ref}
        className="text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-words"
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
        }
      >
        <RichText body={body} />
      </p>
      {overflows && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          className={`mt-1 rounded text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] hover:underline ${FOCUS_RING}`}
        >
          …see more
        </button>
      )}
    </div>
  );
}
