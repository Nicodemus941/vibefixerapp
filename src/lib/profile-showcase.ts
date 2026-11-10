// Profile showcase helpers (Featured, Achievements, Working toward, bio
// links). Shared by client and server. No imports, so the pure functions
// can be unit tested with `node --test` directly (see tests/).

export const FEATURED_MAX = 12;
export const ACHIEVEMENTS_MAX = 20;
export const GOALS_MAX = 5;

export const FEATURED_DESCRIPTION_MAX = 280;
export const FEATURED_TITLE_MAX = 200;
export const FEATURED_PUBLISHER_MAX = 120;
export const ACHIEVEMENT_TITLE_MAX = 160;
export const ACHIEVEMENT_ISSUER_MAX = 160;
export const ACHIEVEMENT_DESCRIPTION_MAX = 1000;
export const GOAL_STATEMENT_MAX = 200;
export const GOAL_HELP_MAX = 200;
export const URL_MAX = 2000;

export const FEATURED_KINDS = [
  "article",
  "publication",
  "press",
  "podcast",
  "video",
  "project",
  "other",
] as const;
export type FeaturedKind = (typeof FEATURED_KINDS)[number];

export const FEATURED_KIND_LABEL: Record<FeaturedKind, string> = {
  article: "Article",
  publication: "Publication",
  press: "Press",
  podcast: "Podcast",
  video: "Video",
  project: "Project",
  other: "Link",
};

export function isFeaturedKind(v: unknown): v is FeaturedKind {
  return typeof v === "string" && (FEATURED_KINDS as readonly string[]).includes(v);
}

// Normalise a member supplied link. Accepts http and https only; a bare
// domain ("example.com/post") gets https:// added. Rejects credentials,
// whitespace, single label hosts and anything over URL_MAX. Returns the
// canonical href or null.
export function normalizeHttpUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  let s = raw.trim();
  if (!s || s.length > URL_MAX) return null;
  if (/\s/.test(s)) return null;
  const scheme = s.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme) {
    const p = scheme[1].toLowerCase();
    if (p !== "http" && p !== "https") return null;
    // "https:example.com" without slashes is not a link we accept.
    if (!/^https?:\/\//i.test(s)) return null;
  } else {
    if (s.startsWith("//")) s = s.slice(2);
    s = `https://${s}`;
  }
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  const host = url.hostname.replace(/\.$/, "");
  if (!host || !host.includes(".")) {
    // Allow bracketed IPv6 literals; reject "localhost", "intranet" etc.
    if (!host.startsWith("[")) return null;
  }
  const href = url.href;
  return href.length > URL_MAX ? null : href;
}

// "" or null -> null (field left empty); otherwise the normalised URL, or
// an error marker so callers can tell "empty" from "invalid".
export function optionalUrl(raw: string | null | undefined): { ok: true; value: string | null } | { ok: false } {
  if (raw === null || raw === undefined || raw.trim() === "") return { ok: true, value: null };
  const v = normalizeHttpUrl(raw);
  return v ? { ok: true, value: v } : { ok: false };
}

export function isIsoDate(v: string | null | undefined): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

// Trim, collapse runs of blank lines, cap length. Empty -> null.
export function cleanText(v: string | null | undefined, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max).trimEnd() : t;
}

// ---------- ordering ----------

// Move the item with `id` one step up (-1) or down (+1). Returns a new
// array; unchanged copy if the id is missing or already at the edge.
export function moveById<T extends { id: string }>(list: readonly T[], id: string, delta: -1 | 1): T[] {
  const out = [...list];
  const i = out.findIndex((x) => x.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= out.length) return out;
  const [item] = out.splice(i, 1);
  out.splice(j, 0, item);
  return out;
}

// Positions to write after a reorder: 0..n-1 in list order, only for rows
// whose stored position differs.
export function positionUpdates(
  list: readonly { id: string; position: number }[],
): { id: string; position: number }[] {
  const out: { id: string; position: number }[] = [];
  list.forEach((x, i) => {
    if (x.position !== i) out.push({ id: x.id, position: i });
  });
  return out;
}

// Position for a newly added item: after everything that exists.
export function nextPosition(positions: readonly number[]): number {
  return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}

export function sortByPosition<T extends { position: number; created_at?: string | null }>(list: readonly T[]): T[] {
  return [...list].sort(
    (a, b) => a.position - b.position || String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")),
  );
}

// ---------- bio links ----------

export type BioToken = { type: "text"; value: string } | { type: "link"; href: string; label: string };

const BIO_URL_RX = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;

function trimTrailingPunctuation(raw: string): string {
  let url = raw;
  while (/[.,;:!?)\]}'"]$/.test(url)) {
    if (url.endsWith(")") && (url.match(/\(/g)?.length ?? 0) >= (url.match(/\)/g)?.length ?? 0)) break;
    url = url.slice(0, -1);
  }
  return url;
}

// Split plain bio text into text and link tokens. Only http(s) and www.
// links become links; everything else stays text (React escapes it, so no
// raw HTML ever renders).
export function bioTokens(text: string): BioToken[] {
  const out: BioToken[] = [];
  let last = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const prev = out[out.length - 1];
    if (prev && prev.type === "text") prev.value += value;
    else out.push({ type: "text", value });
  };
  for (const m of text.matchAll(BIO_URL_RX)) {
    const start = m.index ?? 0;
    const raw = trimTrailingPunctuation(m[0]);
    const href = normalizeHttpUrl(raw);
    pushText(text.slice(last, start));
    if (href) {
      const label = raw.replace(/^https?:\/\//i, "").replace(/\/$/, "");
      out.push({ type: "link", href, label: label.length > 60 ? `${label.slice(0, 57)}…` : label });
    } else {
      pushText(raw);
    }
    last = start + raw.length;
  }
  pushText(text.slice(last));
  return out;
}

export function hostLabel(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}
