"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/embeddings";
import { logEvent } from "@/lib/platform-events";
import { extractHashtags } from "@/lib/hashtags";

const POST_BODY_MAX = 600;

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
};

export async function createPost(input: {
  body: string;
  kind?: "update" | "need" | "offer" | "win";
}): Promise<{ error?: string; postId?: string }> {
  const body = input.body.trim();
  if (!body) return { error: "Write something first." };
  if (body.length > POST_BODY_MAX)
    return { error: `Keep it under ${POST_BODY_MAX} characters.` };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const hashtags = extractHashtags(body);
  const kind = input.kind ?? "update";

  let embedding: string | null = null;
  try {
    embedding = await embed(body);
  } catch {
    // If embedding fails, still create the post — it just won't rank
    embedding = null;
  }

  // Use admin client to write the embedding (RLS on `embedding` column is
  // enforced via policy + the column is intentionally not in user-writable
  // surface).
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .insert({
      user_id: user.id,
      body,
      hashtags,
      kind,
      embedding,
    })
    .select("id")
    .single();

  if (error) return { error: `Could not post: ${error.message}` };

  await logEvent("post_created", user.id, { kind, hashtag_count: hashtags.length });

  revalidatePath("/feed");
  return { postId: data.id };
}

export async function editPost(input: {
  postId: string;
  body: string;
}): Promise<{ error?: string }> {
  const body = input.body.trim();
  if (!body) return { error: "Can't be empty." };
  if (body.length > POST_BODY_MAX)
    return { error: `Keep it under ${POST_BODY_MAX} characters.` };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const hashtags = extractHashtags(body);
  let embedding: string | null = null;
  try {
    embedding = await embed(body);
  } catch {
    embedding = null;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({ body, hashtags, embedding })
    .eq("id", input.postId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  await logEvent("post_edited", user.id, { post_id: input.postId });
  revalidatePath("/feed");
  return {};
}

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Owners + admins can also delete any post (moderation).
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = me?.role === "owner" || me?.role === "admin";

  let q = supabase.from("posts").delete().eq("id", postId);
  if (!isAdmin) q = q.eq("user_id", user.id);
  const { error } = await q;
  if (error) return { error: error.message };

  await logEvent("post_deleted", user.id, { post_id: postId, by_admin: isAdmin });
  revalidatePath("/feed");
  return {};
}

export async function fetchFeed(opts: {
  tag?: string | null;
  limit?: number;
  view?: "personalized" | "recent";
}): Promise<{ posts: FeedPost[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { posts: [], error: "Not signed in." };

  const { data, error } = await supabase.rpc("feed_for_user", {
    viewer_id: user.id,
    tag_filter: opts.tag ?? null,
    limit_count: opts.limit ?? 30,
    view_mode: opts.view ?? "personalized",
  });

  if (error) return { posts: [], error: error.message };
  return { posts: (data ?? []) as FeedPost[] };
}

export type ReactionKind = "fire" | "handshake" | "in";

export type ReactionStateMap = Record<
  string,
  { fire: number; handshake: number; in: number; mine: ReactionKind[] }
>;

export async function fetchReactionState(
  postIds: string[],
): Promise<ReactionStateMap> {
  const out: ReactionStateMap = {};
  for (const id of postIds) {
    out[id] = { fire: 0, handshake: 0, in: 0, mine: [] };
  }
  if (postIds.length === 0) return out;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return out;

  const { data } = await supabase
    .from("post_reactions")
    .select("post_id, kind, user_id")
    .in("post_id", postIds);

  for (const r of data ?? []) {
    const bucket = out[r.post_id];
    if (!bucket) continue;
    const k = r.kind as ReactionKind;
    if (k in bucket) bucket[k] = (bucket[k] as number) + 1;
    if (r.user_id === user.id) bucket.mine.push(k);
  }
  return out;
}

export async function toggleReaction(input: {
  postId: string;
  kind: ReactionKind;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  // Check whether the row exists; toggle accordingly.
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", input.postId)
    .eq("user_id", user.id)
    .eq("kind", input.kind)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", input.postId)
      .eq("user_id", user.id)
      .eq("kind", input.kind);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("post_reactions").insert({
      post_id: input.postId,
      user_id: user.id,
      kind: input.kind,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/feed");
  return {};
}

export type CommentRow = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_display_name: string;
};

export type CommentSummary = {
  count: number;
  recent: CommentRow[];
};

export type CommentSummaryMap = Record<string, CommentSummary>;

export async function fetchCommentSummaries(
  postIds: string[],
): Promise<CommentSummaryMap> {
  const out: CommentSummaryMap = {};
  for (const id of postIds) out[id] = { count: 0, recent: [] };
  if (postIds.length === 0) return out;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return out;

  // One pass to count and collect last 2 per post. (For MVP scale we just
  // pull all comments for the visible posts and bucket in app — posts table
  // caps at ~30 per feed page.)
  const { data: comments } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, body, created_at")
    .in("post_id", postIds)
    .order("created_at", { ascending: false });

  const authorIds = Array.from(
    new Set((comments ?? []).map((c) => c.user_id)),
  );
  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds)
      : { data: [] };
  const authorMap = new Map(
    (authors ?? []).map((a) => [a.id, a.display_name]),
  );

  for (const c of comments ?? []) {
    const bucket = out[c.post_id];
    if (!bucket) continue;
    bucket.count += 1;
    if (bucket.recent.length < 2) {
      bucket.recent.push({
        id: c.id,
        post_id: c.post_id,
        user_id: c.user_id,
        body: c.body,
        created_at: c.created_at as string,
        author_display_name: authorMap.get(c.user_id) ?? "Unknown",
      });
    }
  }
  // Show most recent at bottom (so it reads chronologically in the UI).
  for (const id of postIds) {
    out[id].recent.reverse();
  }
  return out;
}

export async function createComment(input: {
  postId: string;
  body: string;
}): Promise<{ error?: string }> {
  const body = input.body.trim();
  if (!body) return { error: "Write something." };
  if (body.length > 1000) return { error: "Comments are limited to 1000 chars." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase.from("post_comments").insert({
    post_id: input.postId,
    user_id: user.id,
    body,
  });
  if (error) return { error: error.message };

  revalidatePath("/feed");
  return {};
}

export async function fetchTrendingTags(): Promise<
  Array<{ tag: string; count: number }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("trending_hashtags", {
    since_hours: 168,
    limit_count: 8,
  });
  if (error) return [];
  return (data ?? []) as Array<{ tag: string; count: number }>;
}
