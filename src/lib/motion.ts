"use client";

// Motion primitives for Loop's landing — no external deps.
// All effects short-circuit on prefers-reduced-motion.

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Reveal sections / children as they enter the viewport.
// Mark elements with `.reveal` (or any selector you pass).
export function initRevealObserver(
  selector = "[data-reveal]",
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
): () => void {
  if (typeof window === "undefined") return () => {};
  if (prefersReducedMotion()) {
    // Skip animation entirely; mark everything revealed.
    document.querySelectorAll(selector).forEach((el) => {
      (el as HTMLElement).dataset.revealed = "true";
    });
    return () => {};
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        (entry.target as HTMLElement).dataset.revealed = "true";
        io.unobserve(entry.target);
      }
    }
  }, options);

  document.querySelectorAll(selector).forEach((el) => io.observe(el));
  return () => io.disconnect();
}

// Scroll-linked parallax. Attach with data-parallax="0.3" (factor; 0 = no movement, 1 = scrolls with page).
// Element y-offset = -scrollY * (1 - factor)  (so factor < 1 moves slower).
export function initParallax(selector = "[data-parallax]"): () => void {
  if (typeof window === "undefined") return () => {};
  if (prefersReducedMotion()) return () => {};

  const items: Array<{ el: HTMLElement; factor: number; top: number; height: number }> = [];

  function measure() {
    items.length = 0;
    document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const factor = parseFloat(el.dataset.parallax ?? "0.5");
      const rect = el.getBoundingClientRect();
      items.push({
        el,
        factor,
        top: rect.top + window.scrollY,
        height: rect.height,
      });
    });
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      for (const item of items) {
        // Only translate when item is roughly in viewport (cheap viewport cull)
        const distance = y - item.top;
        if (distance < -window.innerHeight || distance > item.height + window.innerHeight) {
          continue;
        }
        const offset = distance * (1 - item.factor);
        item.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      }
      ticking = false;
    });
  }

  measure();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure, { passive: true });

  return () => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", measure);
  };
}
