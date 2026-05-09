"use client";

import { useEffect, useRef } from "react";

type Props = {
  children: React.ReactNode;
  // Lag factor — small positive number. 0.08 = element appears 8% slower
  // than the page scroll. Anything above 0.15 starts to feel weird.
  speed?: number;
  className?: string;
};

// Subtle parallax — translates the wrapped element DOWN as the user scrolls
// down, creating the impression that it lags behind the rest of the page.
// Uses a single rAF + passive scroll listener. Skipped entirely for users
// with prefers-reduced-motion. Bails out when the element is far off-screen
// to keep the animation budget tight.
export default function Parallax({
  children,
  speed = 0.08,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let frame = 0;
    let active = true;

    const update = () => {
      if (!active || !el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Only apply transform while the element is roughly in view (with margin)
      // — saves cycles once user has scrolled well past the hero.
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      const offset = Math.max(0, window.scrollY) * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      active = false;
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
