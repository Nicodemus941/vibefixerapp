// Tiny analytics shim — calls GA4 + Meta Pixel safely if either is loaded,
// silently no-ops otherwise. Use from client components only.
//
// Conventions:
//   - Event names are snake_case (Meta accepts standard or custom; GA4 too)
//   - Always include a category-style "section" so we can filter by funnel
//   - Money-shaped events also pass `value` and `currency: USD` for GA4 + Meta

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

const META_STANDARD_EVENTS: Record<string, string> = {
  lead_submitted: "Lead",
  booking_completed: "Schedule",
  contact_clicked: "Contact",
  booking_started: "InitiateCheckout",
};

export function track(name: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  // Strip undefined values so the providers don't store empty fields.
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) clean[k] = v;
  }

  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", name, clean);
    } catch {
      /* swallow */
    }
  }
  if (typeof window.fbq === "function") {
    try {
      const stdName = META_STANDARD_EVENTS[name];
      if (stdName) {
        window.fbq("track", stdName, clean);
      } else {
        window.fbq("trackCustom", name, clean);
      }
    } catch {
      /* swallow */
    }
  }
}
