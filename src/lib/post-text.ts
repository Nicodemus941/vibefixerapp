// Post and comment text helpers, shared by client and server.
//
// Mentions are stored inline as @[Display Name](user-uuid) so the body is
// self describing and survives edits. The composer shows plain "@Name"
// while typing and converts picked names to the stored form on submit.
//
// This file has no imports so the pure functions can be unit tested with
// `node --test` directly (see tests/).

export const POST_BODY_MAX = 3000;
export const COMMENT_BODY_MAX = 1000;
export const MAX_MENTIONS = 10;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const MENTION_SRC = `@\\[([^\\]\\n]{1,80})\\]\\((${UUID})\\)`;
const HASHTAG_SRC = "#([a-z0-9_]{2,32})";
const URL_SRC = "https?:\\/\\/[^\\s<>\"']+";

export type MentionPick = { id: string; name: string };

export type TextToken =
  | { type: "text"; value: string }
  | { type: "mention"; id: string; name: string }
  | { type: "hashtag"; tag: string }
  | { type: "url"; href: string; label: string };

// Characters commonly glued to the end of a URL in prose that are not part
// of it ("see https://x.com/a." or "(https://x.com)").
function trimUrl(raw: string): string {
  let url = raw;
  while (/[.,;:!?)\]}'"]$/.test(url)) {
    if (url.endsWith(")") && (url.match(/\(/g)?.length ?? 0) >= (url.match(/\)/g)?.length ?? 0)) break;
    url = url.slice(0, -1);
  }
  return url;
}

export function tokenize(body: string): TextToken[] {
  const rx = new RegExp(`${MENTION_SRC}|${URL_SRC}|${HASHTAG_SRC}`, "gi");
  const out: TextToken[] = [];
  let last = 0;
  const pushText = (value: string) => {
    if (!value) return;
    const prev = out[out.length - 1];
    if (prev && prev.type === "text") prev.value += value;
    else out.push({ type: "text", value });
  };
  for (const m of body.matchAll(rx)) {
    const start = m.index ?? 0;
    const whole = m[0];
    pushText(body.slice(last, start));
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push({ type: "mention", name: m[1], id: m[2].toLowerCase() });
      last = start + whole.length;
    } else if (m[3] !== undefined) {
      out.push({ type: "hashtag", tag: m[3].toLowerCase() });
      last = start + whole.length;
    } else {
      const href = trimUrl(whole);
      out.push({ type: "url", href, label: href.replace(/^https?:\/\//i, "") });
      last = start + href.length;
    }
  }
  pushText(body.slice(last));
  return out;
}

// Stored body -> what a person reads ("@[Ana](id)" -> "@Ana").
export function toDisplayText(body: string): string {
  return body.replace(new RegExp(MENTION_SRC, "gi"), (_m, name: string) => `@${name}`);
}

export function extractMentionIds(body: string): string[] {
  const ids = new Set<string>();
  for (const m of body.matchAll(new RegExp(MENTION_SRC, "gi"))) {
    ids.add(m[2].toLowerCase());
    if (ids.size >= MAX_MENTIONS) break;
  }
  return [...ids];
}

// Composer text + picked people -> stored body. Each pick converts every
// "@Name" occurrence (whole word) that is still plain text.
export function toStoredText(text: string, picks: MentionPick[]): string {
  let out = text;
  const seen = new Set<string>();
  // Longest names first so "@Ana Lopez" wins over "@Ana".
  const ordered = [...picks].sort((a, b) => b.name.length - a.name.length);
  for (const p of ordered) {
    if (seen.has(p.id) || !p.name.trim()) continue;
    seen.add(p.id);
    const safeName = p.name.replace(/[\]\n]/g, " ").slice(0, 80);
    const escaped = p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Not already inside "@[" markup, and not followed by more word chars.
    const rx = new RegExp(`(^|[^\\[\\w])@${escaped}(?![\\w])`, "g");
    out = out.replace(rx, (_m, lead: string) => `${lead}@[${safeName}](${p.id})`);
  }
  return out;
}

// Stored body -> editable composer text + the picks it contains.
export function toEditable(body: string): { text: string; picks: MentionPick[] } {
  const picks: MentionPick[] = [];
  const seen = new Set<string>();
  for (const m of body.matchAll(new RegExp(MENTION_SRC, "gi"))) {
    const id = m[2].toLowerCase();
    if (seen.has(id)) continue;
    seen.add(id);
    picks.push({ id, name: m[1] });
  }
  return { text: toDisplayText(body), picks };
}

// The "@query" being typed right before the caret, if any.
export function activeMentionQuery(
  text: string,
  caret: number,
): { query: string; start: number } | null {
  const before = text.slice(0, caret);
  const m = before.match(/(^|[\s(])@([^\s@[\]()]{1,30}(?: [^\s@[\]()]{1,30})?)$/);
  if (!m) return null;
  const query = m[2];
  return { query, start: caret - query.length - 1 };
}

export function extractFirstUrl(body: string): string | null {
  for (const t of tokenize(body)) {
    if (t.type === "url") return t.href;
  }
  return null;
}

export function extractHashtagsFromBody(body: string): string[] {
  const tags = new Set<string>();
  for (const t of tokenize(body)) if (t.type === "hashtag") tags.add(t.tag);
  return [...tags];
}
