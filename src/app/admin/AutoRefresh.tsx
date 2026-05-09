"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Polls Next.js to revalidate the route every `intervalMs` so new leads
// appear without the staff hitting refresh. Pauses when the tab is hidden
// to avoid burning cycles (and KV reads) when nobody's looking.
export default function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    timer = setInterval(tick, intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [router, intervalMs]);

  return null;
}
