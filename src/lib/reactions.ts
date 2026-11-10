// LinkedIn style reaction set. Shared by client and server.
export const REACTION_KINDS = [
  "like",
  "celebrate",
  "support",
  "insightful",
  "love",
  "funny",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

export const REACTION_LABELS: Record<ReactionKind, string> = {
  like: "Like",
  celebrate: "Celebrate",
  support: "Support",
  insightful: "Insightful",
  love: "Love",
  funny: "Funny",
};

// Past tense, for notifications ("Ana celebrated your post").
export const REACTION_VERBS: Record<ReactionKind, string> = {
  like: "liked",
  celebrate: "celebrated",
  support: "supported",
  insightful: "found insight in",
  love: "loved",
  funny: "laughed at",
};

export function isReactionKind(v: unknown): v is ReactionKind {
  return typeof v === "string" && (REACTION_KINDS as readonly string[]).includes(v);
}

export function emptyReactionCounts(): Record<ReactionKind, number> {
  return { like: 0, celebrate: 0, support: 0, insightful: 0, love: 0, funny: 0 };
}

// Most used kinds first, for the summary icons. Ties keep display order.
export function topReactions(counts: Record<ReactionKind, number>, n = 3): ReactionKind[] {
  return REACTION_KINDS.filter((k) => counts[k] > 0)
    .map((k, i) => ({ k, c: counts[k], i }))
    .sort((a, b) => b.c - a.c || a.i - b.i)
    .slice(0, n)
    .map((x) => x.k);
}
