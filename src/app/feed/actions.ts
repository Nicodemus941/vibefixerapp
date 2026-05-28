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

export async function fetchFeed(opts: {
  tag?: string | null;
  limit?: number;
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
