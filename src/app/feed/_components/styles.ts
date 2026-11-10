// Shared class strings for feed cards. Plain module (not "use client") so
// both server and client components can import the values.

export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-1)]";

/** The one big action on a card: I can help, Message, Reply. */
export const PRIMARY_BTN = `press-shrink inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] transition-colors ${FOCUS}`;

/** Quieter variant, used for Reply on a plain post or a shipped deal. */
export const PRIMARY_SOFT_BTN = `press-shrink inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-4 text-sm font-semibold text-[var(--accent-text)] hover:brightness-95 transition-[filter] ${FOCUS}`;

export const KIND_STYLE: Record<string, { label: string; chip: string; rail: string }> = {
  need: { label: "Need", chip: "bg-[var(--need-bg)] text-[var(--need-fg)]", rail: "bg-[var(--need)]" },
  offer: { label: "Offer", chip: "bg-[var(--offer-bg)] text-[var(--offer-fg)]", rail: "bg-[var(--offer)]" },
  win: { label: "Shipped", chip: "bg-[var(--shipped-bg)] text-[var(--shipped-fg)]", rail: "bg-[var(--shipped)]" },
  job: { label: "Job", chip: "bg-[var(--job-bg)] text-[var(--job-fg)]", rail: "bg-[var(--job)]" },
};
