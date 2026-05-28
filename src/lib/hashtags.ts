// Shared hashtag parsing — usable from client and server.
const HASHTAG_RX = /#([a-z0-9_]{2,32})/gi;

export function extractHashtags(body: string): string[] {
  const tags = new Set<string>();
  for (const m of body.matchAll(HASHTAG_RX)) {
    tags.add(m[1].toLowerCase());
  }
  return [...tags];
}
