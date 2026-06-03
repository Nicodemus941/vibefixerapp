"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Share2 } from "lucide-react";

// Share button with three-tier fallback:
//   1. navigator.share — native share sheet on mobile and modern desktops
//   2. navigator.clipboard.writeText — copy the URL, show a toast
//   3. document.execCommand fallback — for older browsers / non-secure
//      contexts (e.g. http localhost) where clipboard isn't available
//
// The variant prop controls visual treatment so the same component fits
// across the action rows on /jobs/[id], /o/[slug], and /u/[userId].
type Variant = "primary" | "ghost" | "icon";

export function ShareButton({
  url,
  title,
  text,
  variant = "ghost",
  label = "Share",
}: {
  url: string;
  title: string;
  text?: string;
  variant?: Variant;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function copyFallback(value: string): boolean {
    try {
      const el = document.createElement("textarea");
      el.value = value;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }

  function onClick() {
    const fullUrl = new URL(url, window.location.origin).toString();

    startTransition(async () => {
      // Tier 1: native share sheet
      if (typeof navigator !== "undefined" && "share" in navigator) {
        try {
          await navigator.share({ title, text, url: fullUrl });
          return;
        } catch (err) {
          // User cancelled or share failed — fall through to copy
          const e = err as { name?: string };
          if (e.name === "AbortError") return;
        }
      }
      // Tier 2: secure clipboard
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(fullUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
          return;
        }
      } catch {
        // fall through
      }
      // Tier 3: execCommand
      if (copyFallback(fullUrl)) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    });
  }

  const labelText = copied ? "Copied" : label;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-label={labelText}
        title={labelText}
        className="press-shrink inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
      >
        {copied ? <Check className="h-4 w-4 text-[var(--accent)]" /> : pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
      </button>
    );
  }

  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs sm:text-sm font-medium text-[var(--bg)] hover:brightness-110"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
        {labelText}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-2 text-xs sm:text-sm text-[var(--fg)] hover:bg-white/[0.05]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent)]" /> : pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
      {labelText}
    </button>
  );
}
