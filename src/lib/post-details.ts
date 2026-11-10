// Optional facts shown as wells on Need and Offer cards. Stored in
// posts.details (JSONB, capped at 400 bytes by a check constraint).

export const DETAIL_MAX = 40;

export const DETAIL_FIELDS = {
  need: [
    { key: "budget", label: "Budget", placeholder: "$4k to $6k a month" },
    { key: "timeline", label: "Timeline", placeholder: "Start in 2 weeks" },
    { key: "category", label: "Category", placeholder: "Finance" },
  ],
  offer: [
    { key: "price", label: "Price", placeholder: "From $8k" },
    { key: "model", label: "Model", placeholder: "Fixed scope" },
    { key: "category", label: "Category", placeholder: "Design" },
  ],
} as const;

export type DetailKind = keyof typeof DETAIL_FIELDS;
export type PostDetails = Partial<Record<"budget" | "timeline" | "category" | "price" | "model", string>>;

export function detailFieldsFor(kind: string) {
  return kind === "need" || kind === "offer" ? DETAIL_FIELDS[kind] : [];
}

/**
 * Keeps only the keys that belong to the kind, trims and drops empties.
 * Returns null when nothing is left, or "invalid" when a value is too long
 * or not a string.
 */
export function sanitizeDetails(kind: string, input: unknown): PostDetails | null | "invalid" {
  const fields = detailFieldsFor(kind);
  if (input === null || input === undefined || fields.length === 0) return null;
  if (typeof input !== "object" || Array.isArray(input)) return "invalid";
  const src = input as Record<string, unknown>;
  const out: PostDetails = {};
  for (const f of fields) {
    const v = src[f.key];
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") return "invalid";
    const t = v.replace(/\s+/g, " ").trim();
    if (!t) continue;
    if (t.length > DETAIL_MAX) return "invalid";
    out[f.key] = t;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** Reads a stored value back into labelled wells, in display order. */
export function detailWells(kind: string, details: unknown): Array<{ label: string; value: string }> {
  const clean = sanitizeDetails(kind, details);
  if (!clean || clean === "invalid") return [];
  return detailFieldsFor(kind)
    .filter((f) => clean[f.key])
    .map((f) => ({ label: f.label, value: clean[f.key]! }));
}
