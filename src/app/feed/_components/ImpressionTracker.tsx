"use client";

import { useEffect, useRef } from "react";
import { recordImpressions } from "../actions";

// Counts a view when at least half of a post stays on screen for a second.
// Each post is sent once per page load; the DB keeps one row per viewer
// per post, so reloads never double count. Posts opt in with
// data-impression-id (skipped for the viewer's own posts).
export function ImpressionTracker({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const sent = new Set<string>();
    const pending = new Set<string>();
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      flushTimer = null;
      if (pending.size === 0) return;
      const ids = [...pending];
      pending.clear();
      recordImpressions(ids).catch(() => {});
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.impressionId;
          if (!id || sent.has(id)) continue;
          if (e.isIntersecting && e.intersectionRatio >= 0.5) {
            if (!timers.has(id)) {
              timers.set(
                id,
                setTimeout(() => {
                  timers.delete(id);
                  sent.add(id);
                  pending.add(id);
                  if (!flushTimer) flushTimer = setTimeout(flush, 1500);
                }, 1000),
              );
            }
          } else {
            const t = timers.get(id);
            if (t) clearTimeout(t);
            timers.delete(id);
          }
        }
      },
      { threshold: [0, 0.5] },
    );

    const observeAll = () => {
      root.querySelectorAll<HTMLElement>("[data-impression-id]").forEach((el) => io.observe(el));
    };
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });

    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);

    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onHide);
      timers.forEach((t) => clearTimeout(t));
      if (flushTimer) clearTimeout(flushTimer);
      flush();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
