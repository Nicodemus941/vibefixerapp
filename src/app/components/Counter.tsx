"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
};

// Animates a number from 0 → `to` with an ease-out cubic curve, fired once
// when the element enters the viewport. Reduce-motion users get the final
// value immediately. Wrap inline-level — renders as a <span>.
export default function Counter({
  to,
  durationMs = 1200,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }

    let rafId: number | null = null;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          obs.disconnect();
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / durationMs);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            setValue(to * eased);
            if (t < 1) rafId = requestAnimationFrame(tick);
            else setValue(to);
          };
          rafId = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
