import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  CommentRow,
  CommentSummary,
  DealStrip,
  FeedBundle,
  FeedPost,
  LinkPreview,
  PostDocument,
  PostExtras,
  PostMedia,
  ReactionState,
  TrackRecord,
} from "@/lib/feed-types";
import { emptyReactionCounts, isReactionKind } from "@/lib/reactions";

type Client = SupabaseClient<Database>;

export const POST_COLUMNS =
  "id, user_id, body, hashtags, kind, created_at, media, document, link_preview, repost_of_id, quoted_post_id, group_id";

// Comments shown under each post in a list, and replies per comment.
const PREVIEW_TOP_LEVEL = 2;
const PREVIEW_REPLIES = 2;

function asMedia(v: Json | null | undefined): PostMedia[] {
  return Array.isArray(v) ? (v as unknown as PostMedia[]) : [];
}
function asDocument(v: Json | null | undefined): PostDocument | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as unknown as PostDocument) : null;
}
function asPreview(v: Json | null | undefined): LinkPreview | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as unknown as LinkPreview) : null;
}

type PostRowLike = {
  id: string;
  user_id: string;
  body: string;
  hashtags: string[];
  kind: string;
  created_at: string | null;
  media?: Json;
  document?: Json | null;
  link_preview?: Json | null;
  repost_of_id?: string | null;
  quoted_post_id?: string | null;
  similarity?: number | null;
  rank_reason?: string | null;
  author_display_name?: string;
  author_company_name?: string | null;
  author_industry?: string | null;
  author_avatar_url?: string | null;
};

export function toFeedPost(
  row: PostRowLike,
  author?: {
    display_name: string;
    company_name: string | null;
    industry: string | null;
    avatar_url: string | null;
  } | null,
): FeedPost {
  return {
    id: row.id,
    user_id: row.user_id,
    body: row.body,
    hashtags: row.hashtags ?? [],
    kind: row.kind,
    created_at: (row.created_at as string) ?? new Date(0).toISOString(),
    similarity: row.similarity ?? null,
    author_display_name: author?.display_name ?? row.author_display_name ?? "Unknown",
    author_company_name: author?.company_name ?? row.author_company_name ?? null,
    author_industry: author?.industry ?? row.author_industry ?? null,
    author_avatar_url: author?.avatar_url ?? row.author_avatar_url ?? null,
    media: asMedia(row.media),
    document: asDocument(row.document),
    link_preview: asPreview(row.link_preview),
    repost_of_id: row.repost_of_id ?? null,
    quoted_post_id: row.quoted_post_id ?? null,
    rank_reason: row.rank_reason ?? null,
  };
}

// Load posts by id under the viewer's RLS (blocked or deleted posts simply
// don't come back), with author profiles.
export async function loadPostsByIds(supabase: Client, ids: string[]): Promise<FeedPost[]> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return [];
  const { data: rows } = await supabase.from("posts").select(POST_COLUMNS).in("id", unique);
  const list = (rows ?? []).filter((r) => r.group_id === null || r.group_id === undefined);
  const authorIds = Array.from(new Set(list.map((r) => r.user_id)));
  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, company_name, industry, avatar_url")
          .in("id", authorIds)
      : { data: [] };
  const byId = new Map((authors ?? []).map((a) => [a.id, a]));
  return list.map((r) => toFeedPost(r, byId.get(r.user_id) ?? null));
}

// The post a feed item's buttons act on: the original for a plain repost.
export function interactiveId(p: FeedPost): string {
  return p.repost_of_id ?? p.id;
}

export async function hydrateFeed(
  supabase: Client,
  viewerId: string,
  posts: FeedPost[],
  opts: { commentMode?: "preview" | "full" } = {},
): Promise<FeedBundle> {
  const byId: Record<string, FeedPost> = {};
  for (const p of posts) byId[p.id] = p;

  // Two rounds: originals of reposts and quoted posts, then anything the
  // originals themselves quote.
  for (let round = 0; round < 2; round++) {
    const missing = new Set<string>();
    for (const p of Object.values(byId)) {
      for (const ref of [p.repost_of_id, p.quoted_post_id]) {
        if (ref && !byId[ref]) missing.add(ref);
      }
    }
    if (missing.size === 0) break;
    const loaded = await loadPostsByIds(supabase, [...missing]);
    for (const p of loaded) byId[p.id] = p;
  }

  const ids = Array.from(
    new Set(
      posts
        .map((p) => (p.repost_of_id ? (byId[p.repost_of_id] ? p.repost_of_id : null) : p.id))
        .filter((x): x is string => Boolean(x)),
    ),
  );

  const offerAuthors = Array.from(
    new Set(ids.map((id) => byId[id]).filter((p) => p && p.kind === "offer").map((p) => p!.user_id)),
  );
  const winIds = ids.filter((id) => byId[id]?.kind === "win");

  const [reactions, comments, extras, deals, tracks] = await Promise.all([
    loadReactions(supabase, viewerId, ids),
    loadComments(supabase, viewerId, ids, opts.commentMode ?? "preview"),
    loadExtras(supabase, viewerId, ids, byId),
    loadDeals(supabase, winIds),
    loadTracks(supabase, offerAuthors),
  ]);

  return { posts: byId, reactions, comments, extras, deals, tracks };
}

async function loadReactions(
  supabase: Client,
  viewerId: string,
  ids: string[],
): Promise<Record<string, ReactionState>> {
  const out: Record<string, ReactionState> = {};
  for (const id of ids) out[id] = { counts: emptyReactionCounts(), total: 0, mine: null };
  if (ids.length === 0) return out;
  const { data } = await supabase.from("post_reactions").select("post_id, kind, user_id").in("post_id", ids);
  for (const r of data ?? []) {
    const b = out[r.post_id];
    if (!b || !isReactionKind(r.kind)) continue;
    b.counts[r.kind] += 1;
    b.total += 1;
    if (r.user_id === viewerId) b.mine = r.kind;
  }
  return out;
}

async function loadComments(
  supabase: Client,
  viewerId: string,
  ids: string[],
  mode: "preview" | "full",
): Promise<Record<string, CommentSummary>> {
  const out: Record<string, CommentSummary> = {};
  for (const id of ids) out[id] = { count: 0, top_level_count: 0, recent: [] };
  if (ids.length === 0) return out;

  const { data: rows } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, body, created_at, parent_comment_id")
    .in("post_id", ids)
    .order("created_at", { ascending: true });
  const all = rows ?? [];

  // Pick what will be shown before fetching likes and authors.
  const shown = new Map<string, CommentRow>();
  const topByPost = new Map<string, typeof all>();
  const repliesByParent = new Map<string, typeof all>();
  for (const c of all) {
    const bucket = out[c.post_id];
    if (!bucket) continue;
    bucket.count += 1;
    if (c.parent_comment_id) {
      const list = repliesByParent.get(c.parent_comment_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_comment_id, list);
    } else {
      bucket.top_level_count += 1;
      const list = topByPost.get(c.post_id) ?? [];
      list.push(c);
      topByPost.set(c.post_id, list);
    }
  }

  const make = (c: (typeof all)[number]): CommentRow => ({
    id: c.id,
    post_id: c.post_id,
    user_id: c.user_id,
    body: c.body,
    created_at: (c.created_at as string) ?? new Date(0).toISOString(),
    parent_comment_id: c.parent_comment_id,
    author_display_name: "Unknown",
    author_avatar_url: null,
    like_count: 0,
    liked_by_me: false,
    replies: [],
    hidden_reply_count: 0,
  });

  for (const [postId, tops] of topByPost) {
    const chosen = mode === "full" ? tops : tops.slice(-PREVIEW_TOP_LEVEL);
    const bucket = out[postId];
    for (const t of chosen) {
      const row = make(t);
      shown.set(row.id, row);
      const replies = repliesByParent.get(t.id) ?? [];
      const pick = mode === "full" ? replies : replies.slice(-PREVIEW_REPLIES);
      row.hidden_reply_count = replies.length - pick.length;
      for (const r of pick) {
        const rr = make(r);
        shown.set(rr.id, rr);
        row.replies.push(rr);
      }
      bucket.recent.push(row);
    }
  }

  const shownIds = [...shown.keys()];
  const authorIds = Array.from(new Set([...shown.values()].map((c) => c.user_id)));
  const [{ data: likes }, { data: authors }] = await Promise.all([
    shownIds.length > 0
      ? supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", shownIds)
      : Promise.resolve({ data: [] as Array<{ comment_id: string; user_id: string }> }),
    authorIds.length > 0
      ? supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; display_name: string; avatar_url: string | null }> }),
  ]);
  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
  for (const c of shown.values()) {
    const a = authorMap.get(c.user_id);
    if (a) {
      c.author_display_name = a.display_name;
      c.author_avatar_url = a.avatar_url;
    }
  }
  for (const l of likes ?? []) {
    const c = shown.get(l.comment_id);
    if (!c) continue;
    c.like_count += 1;
    if (l.user_id === viewerId) c.liked_by_me = true;
  }
  return out;
}

async function loadExtras(
  supabase: Client,
  viewerId: string,
  ids: string[],
  byId: Record<string, FeedPost>,
): Promise<Record<string, PostExtras>> {
  const out: Record<string, PostExtras> = {};
  for (const id of ids) out[id] = { repostCount: 0, myRepostId: null, saved: false, views: null, poll: null };
  if (ids.length === 0) return out;

  const [counts, mine, saves, polls, details] = await Promise.all([
    supabase.rpc("post_repost_counts", { post_ids: ids }),
    supabase.from("posts").select("id, repost_of_id").eq("user_id", viewerId).in("repost_of_id", ids),
    supabase.from("post_saves").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    supabase.rpc("poll_results", { post_ids: ids }),
    supabase.from("posts").select("id, details").in("id", ids),
  ]);
  // details is new (20261110300700); an error just means no wells.
  for (const r of details.data ?? []) if (out[r.id] && r.details) out[r.id].details = r.details;

  for (const r of counts.data ?? []) if (out[r.post_id]) out[r.post_id].repostCount = Number(r.reposts);
  for (const r of mine.data ?? []) if (r.repost_of_id && out[r.repost_of_id]) out[r.repost_of_id].myRepostId = r.id;
  for (const r of saves.data ?? []) if (out[r.post_id]) out[r.post_id].saved = true;
  for (const r of polls.data ?? []) {
    if (!out[r.post_id]) continue;
    out[r.post_id].poll = {
      options: r.options,
      ends_at: r.ends_at,
      my_vote: r.my_vote,
      total_votes: Number(r.total_votes),
      counts: r.counts ? r.counts.map(Number) : null,
      show_results: r.show_results,
    };
  }
  return out;
}

// Deal strips for Shipped posts that point at a released deal.
async function loadDeals(supabase: Client, ids: string[]): Promise<Record<string, DealStrip>> {
  const out: Record<string, DealStrip> = {};
  if (ids.length === 0) return out;
  const { data, error } = await supabase.rpc("post_deal_strips", { post_ids: ids });
  if (error) return out;
  for (const r of data ?? []) {
    out[r.post_id] = {
      amount: Number(r.amount),
      delivered_days: Number(r.delivered_days ?? 0),
      provider_id: r.provider_id,
      provider_name: r.provider_name,
      seeker_id: r.seeker_id,
      seeker_name: r.seeker_name,
      review_rating: r.review_rating === null ? null : Number(r.review_rating),
      review_body: r.review_body,
    };
  }
  return out;
}

// "Track record" well on offers: deals delivered and rating, no amounts.
async function loadTracks(supabase: Client, userIds: string[]): Promise<Record<string, TrackRecord>> {
  const out: Record<string, TrackRecord> = {};
  if (userIds.length === 0) return out;
  const { data, error } = await supabase.rpc("member_track_records", { user_ids: userIds });
  if (error) return out;
  for (const r of data ?? []) {
    out[r.user_id] = {
      deals_delivered: Number(r.deals_delivered ?? 0),
      avg_rating: r.avg_rating === null ? null : Number(r.avg_rating),
      review_count: Number(r.review_count ?? 0),
    };
  }
  return out;
}
