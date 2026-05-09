"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeCode, REFERRAL_REWARD_USD } from "../lib/referral";

const STORAGE_KEY = "fast.ref.code";

// Fixed bar that shows up only when the visitor arrived via a /?ref=… link.
// Persists across navigation via localStorage so the code carries to /book
// and /quote even if they wander around first.
export default function ReferralBanner() {
  const params = useSearchParams();
  const urlCode = normalizeCode(params.get("ref"));
  const [code, setCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (urlCode) {
      try {
        sessionStorage.setItem(STORAGE_KEY, urlCode);
      } catch {
        /* private browsing — fine, just won't persist */
      }
      setCode(urlCode);
      return;
    }
    // No URL code, but we may already have one in this session.
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setCode(normalizeCode(stored) || null);
    } catch {
      /* noop */
    }
  }, [urlCode]);

  if (!code || dismissed) return null;

  return (
    <div className="sticky top-0 z-40 border-b border-amber/40 bg-amber text-ink">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-sm sm:px-8">
        <span className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-amber sm:inline-flex">
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M16.5 6c1.93 0 3.5 1.57 3.5 3.5S18.43 13 16.5 13H13l-2 8H9l2-8H7.5C5.57 13 4 11.43 4 9.5S5.57 6 7.5 6c1.05 0 2 .47 2.65 1.21L12 9.59l1.85-2.38A3.5 3.5 0 0 1 16.5 6Z"
            />
          </svg>
        </span>
        <p className="flex-1 text-[13px] font-semibold leading-snug sm:text-sm">
          <span className="font-extrabold">Welcome — your friend's referral gets you ${REFERRAL_REWARD_USD} off</span>{" "}
          your first install.
          <span className="ml-2 hidden rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider text-amber sm:inline">
            Code · {code}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full bg-ink/10 p-1 text-ink/60 transition hover:bg-ink/20 hover:text-ink"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="currentColor"
              d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
