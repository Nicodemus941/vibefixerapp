import type { LinkPreview } from "./og-parse";
import type { PostDocument, PostMedia } from "./post-media";
import type { ReactionKind } from "./reactions";

export type { LinkPreview } from "./og-parse";
export type { PostDocument, PostMedia } from "./post-media";
export type { ReactionKind } from "./reactions";

export type FeedPost = {
  id: string;
  user_id: string;
  body: string;
  hashtags: string[];
  kind: string;
  created_at: string;
  similarity: number | null;
  author_display_name: string;
  author_company_name: string | null;
  author_industry: string | null;
  author_avatar_url: string | null;
  media?: PostMedia[];
  document?: PostDocument | null;
  link_preview?: LinkPreview | null;
  repost_of_id?: string | null;
  quoted_post_id?: string | null;
  /** Why "For you" placed it: 'can_help' | 'fits_needs' | 'following'. */
  rank_reason?: string | null;
};

export type ReactionState = {
  counts: Record<ReactionKind, number>;
  total: number;
  mine: ReactionKind | null;
};

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  parent_comment_id: string | null;
  author_display_name: string;
  author_avatar_url: string | null;
  like_count: number;
  liked_by_me: boolean;
  replies: CommentRow[];
  hidden_reply_count: number;
};

export type CommentSummary = {
  count: number;
  top_level_count: number;
  recent: CommentRow[];
};

export type PollState = {
  options: string[];
  ends_at: string;
  my_vote: number | null;
  total_votes: number;
  counts: number[] | null;
  show_results: boolean;
};

export type PostExtras = {
  repostCount: number;
  myRepostId: string | null;
  saved: boolean;
  views: number | null;
  poll: PollState | null;
  /** Need and offer wells (posts.details). */
  details?: unknown;
};

/** Public facts of the released deal behind a Shipped post. */
export type DealStrip = {
  amount: number;
  delivered_days: number;
  provider_id: string;
  provider_name: string;
  seeker_id: string;
  seeker_name: string;
  review_rating: number | null;
  review_body: string | null;
};

export type TrackRecord = {
  deals_delivered: number;
  avg_rating: number | null;
  review_count: number;
};

// Everything a list of posts needs to render, keyed by post id.
export type FeedBundle = {
  posts: Record<string, FeedPost>;
  reactions: Record<string, ReactionState>;
  comments: Record<string, CommentSummary>;
  extras: Record<string, PostExtras>;
  /** Keyed by post id. */
  deals?: Record<string, DealStrip>;
  /** Keyed by author id, for offer authors. */
  tracks?: Record<string, TrackRecord>;
};

export type FeedView = "personalized" | "following" | "recent";
