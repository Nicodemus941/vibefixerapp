"use client";

import { useEffect, useState } from "react";
import { BUSINESS } from "../config";

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-40 transition lg:hidden ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"
      }`}
    >
      <div className="mx-auto flex max-w-md items-stretch gap-2 rounded-2xl border border-amber/40 bg-ink/95 p-1.5 shadow-pop backdrop-blur-md">
        <a
          href={`tel:${BUSINESS.phoneDial}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-extrabold text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.05-.24c1.16.39 2.41.6 3.7.6a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A18 18 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.29.21 2.54.6 3.7a1 1 0 0 1-.24 1.05l-2.24 2.04Z" />
          </svg>
          Call now
        </a>
        <a
          href="/book"
          className="flex flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white"
        >
          Book online
        </a>
      </div>
    </div>
  );
}
