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
