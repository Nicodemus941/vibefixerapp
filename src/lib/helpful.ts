// "Most helpful this month". Mirrors leaderboard_most_helpful() in SQL so
// the weights are tested and the page can explain them.

export const HELP_WEIGHTS = {
  dealsDelivered: 3,
  needsHelped: 2,
  reviewsReceived: 1,
} as const;

export type HelpCounts = {
  dealsDelivered: number;
  needsHelped: number;
  reviewsReceived: number;
};

export function helpfulScore(c: HelpCounts): number {
  return (
    c.dealsDelivered * HELP_WEIGHTS.dealsDelivered +
    c.needsHelped * HELP_WEIGHTS.needsHelped +
    c.reviewsReceived * HELP_WEIGHTS.reviewsReceived
  );
}

/** Plain English summary, e.g. "2 deals delivered, 3 needs helped, 1 review". */
export function describeHelp(c: HelpCounts): string {
  const parts: string[] = [];
  const add = (n: number, one: string, many: string) => {
    if (n > 0) parts.push(`${n} ${n === 1 ? one : many}`);
  };
  add(c.dealsDelivered, "deal delivered", "deals delivered");
  add(c.needsHelped, "need helped", "needs helped");
  add(c.reviewsReceived, "review", "reviews");
  return parts.join(", ");
}

export type HelpfulRow = HelpCounts & { name: string; avgRating: number | null };

/** Score first, then rating, then name. Same order as the SQL. */
export function compareHelpful(a: HelpfulRow, b: HelpfulRow): number {
  const s = helpfulScore(b) - helpfulScore(a);
  if (s !== 0) return s;
  const r = (b.avgRating ?? 0) - (a.avgRating ?? 0);
  if (r !== 0) return r;
  return a.name.localeCompare(b.name);
}
