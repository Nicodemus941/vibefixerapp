"use client";

import { Children, useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  // ms between each child's reveal start
  stepMs?: number;
  // ms before the first child reveals
  startDelayMs?: number;
  // override the per-child duration
  durationMs?: number;
  className?: string;
};

// Wraps direct children and reveals them sequentially when the wrapper
// enters the viewport. Each child gets translate-y + opacity transition
// staggered by `stepMs`. Renders each child inside a div, so use only
// where the children are block-level (sections, headings, paragraphs,
// CTA stacks). Respects prefers-reduced-motion.
export default function Stagger({
  children,
  stepMs = 110,
  startDelayMs = 0,
  durationMs = 500,
  className = "",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, i) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          style={{
            transitionDelay: `${startDelayMs + i * stepMs}ms`,
            transitionDuration: `${durationMs}ms`,
          }}
          className={`transition-all ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
