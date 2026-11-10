// "For you" ranking. The database does the work (feed_for_user, view
// 'personalized'); this mirrors its rules for tests and for the label on
// each card. Reactions, comments and reposts never change the order.
//
//   1. Needs you can help with: your offers vs their need, similarity at
//      least 0.5, posted in the last 14 days.
//   2. Offers that fit your needs: your needs vs their offer, same rules.
//   3. People you follow.
//   4. Everything else.
// Newest first inside each group.

export const RANK_MIN_SIMILARITY = 0.5;
export const RANK_FRESH_DAYS = 14;

export type RankReason = "can_help" | "fits_needs" | "following" | null;

const TIER: Record<Exclude<RankReason, null> | "none", number> = {
  can_help: 0,
  fits_needs: 1,
  following: 2,
  none: 3,
};

export function rankReasonFor(input: {
  kind: string;
  /** Similarity of this need to the viewer's offers, if it is a need. */
  helpSimilarity: number | null;
  /** Similarity of this offer to the viewer's needs, if it is an offer. */
  fitSimilarity: number | null;
  followed: boolean;
  createdAt: string | Date;
  now?: Date;
}): RankReason {
  const now = input.now ?? new Date();
  const fresh =
    now.getTime() - new Date(input.createdAt).getTime() <= RANK_FRESH_DAYS * 24 * 60 * 60 * 1000;
  if (fresh && input.kind === "need" && (input.helpSimilarity ?? 0) >= RANK_MIN_SIMILARITY) return "can_help";
  if (fresh && input.kind === "offer" && (input.fitSimilarity ?? 0) >= RANK_MIN_SIMILARITY) return "fits_needs";
  if (input.followed) return "following";
  return null;
}

export function rankTier(reason: RankReason | string | null | undefined): number {
  if (reason === "can_help" || reason === "fits_needs" || reason === "following") return TIER[reason];
  return TIER.none;
}

/** Sort order for ranked posts: group, then newest first. */
export function compareFeedRank(
  a: { rank_reason?: RankReason | string | null; created_at: string },
  b: { rank_reason?: RankReason | string | null; created_at: string },
): number {
  const t = rankTier(a.rank_reason) - rankTier(b.rank_reason);
  if (t !== 0) return t;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

export function rankReasonLabel(reason: RankReason | string | null | undefined): string | null {
  switch (reason) {
    case "can_help":
      return "You can help";
    case "fits_needs":
      return "Fits what you need";
    default:
      return null;
  }
}
