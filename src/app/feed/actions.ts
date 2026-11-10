"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { embed } from "@/lib/embeddings";
import { logEvent } from "@/lib/platform-events";
import { fetchLinkPreview } from "@/lib/link-preview";
import {
  COMMENT_BODY_MAX,
  POST_BODY_MAX,
  extractFirstUrl,
  extractHashtagsFromBody,
  extractMentionIds,
  toDisplayText,
} from "@/lib/post-text";
import { POST_MEDIA_BUCKET, sanitizeDocument, sanitizeMedia } from "@/lib/post-media";
import { isReactionKind, type ReactionKind } from "@/lib/reactions";
import type { FeedPost, FeedView } from "@/lib/feed-types";
import { toFeedPost } from "./data";

export type {
  FeedPost,
  ReactionKind,
  ReactionState,
  CommentRow,
  CommentSummary,
} from "@/lib/feed-types";

type PostKind = "update" | "need" | "offer" | "win";

function friendlyError(message: string | undefined): string {
  if (!message) return "Something went wrong.";
  if (message.includes("post_unavailable")) return "This post is unavailable.";
  if (message.includes("comment_unavailable")) return "That comment is unavailable.";
  if (message.includes("row-level security")) return "You can't do that right now.";
  if (message.includes("duplicate key")) return "Already done.";
  return message;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

type Supa = Awaited<ReturnType<typeof createClient>>;

async function isActive(supabase: Supa): Promise<boolean> {
  const { data, error } = await supabase.rpc("viewer_is_active");
  // Fail open only if the RPC itself is missing; RLS still guards writes
  // made with the user client.
  if (error) return true;
  return data !== false;
}

// Keep post_mentions in step with the mentions in a body. Only new
// mentions are inserted, so edits don't re-notify people.
async function syncMentions(
  supabase: Supa,
  args: { authorId: string; postId: string; commentId: string | null; body: string },
) {
  const wanted = extractMentionIds(args.body).filter((id) => id !== args.authorId);
  let existingQ = supabase
    .from("post_mentions")
    .select("id, mentioned_user_id")
    .eq("post_id", args.postId)
    .eq("author_id", args.authorId);
  existingQ = args.commentId ? existingQ.eq("comment_id", args.commentId) : existingQ.is("comment_id", null);
  const { data: existing } = await existingQ;
  const have = new Map((existing ?? []).map((m) => [m.mentioned_user_id, m.id]));

  const removed = [...have.entries()].filter(([uid]) => !wanted.includes(uid)).map(([, id]) => id);
  if (removed.length > 0) await supabase.from("post_mentions").delete().in("id", removed);

  const toAdd = wanted.filter((id) => !have.has(id));
  if (toAdd.length === 0) return;
  // Only real profiles. RLS rejects anyone blocked either way, so insert
  // one at a time and let a blocked pair fail quietly.
  const { data: real } = await supabase.from("profiles").select("id").in("id", toAdd);
  for (const p of real ?? []) {
    await supabase.from("post_mentions").insert({
      post_id: args.postId,
      comment_id: args.commentId,
      author_id: args.authorId,
      mentioned_user_id: p.id,
    });
  }
}

async function embedOrNull(text: string): Promise<string | null> {
  const plain = toDisplayText(text).trim();
  if (!plain) return null;
  try {
    return await embed(plain);
  } catch {
    // If embedding fails, still create the post. It just won't rank.
    return null;
  }
}

// ============================================
// Posts
// ============================================

export async function createPost(input: {
  body: string;
  kind?: PostKind;
  media?: unknown;
  document?: unknown;
  quotedPostId?: string | null;
  poll?: { options: string[]; durationDays: number } | null;
}): Promise<{ error?: string; postId?: string }> {
  const body = (input.body ?? "").trim();
  if (body.length > POST_BODY_MAX) return { error: `Keep it under ${POST_BODY_MAX} characters.` };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!(await isActive(supabase))) return { error: "Posting is paused on your account." };

  const media = sanitizeMedia(user.id, input.media);
  if (media === null) return { error: "Those images couldn't be attached." };
  const document = sanitizeDocument(user.id, input.document);
  if (document === "invalid") return { error: "That document couldn't be attached." };
  if (document && media.length > 0) return { error: "Attach images or a document, not both." };

  let poll: { options: string[]; durationDays: 1 | 3 | 7 } | null = null;
  if (input.poll) {
    const options = (input.poll.options ?? []).map((o) => String(o).trim()).filter(Boolean);
    const d = Number(input.poll.durationDays);
    if (options.length < 2 || options.length > 4) return { error: "Polls need 2 to 4 options." };
    if (options.some((o) => o.length > 80)) return { error: "Keep each option under 80 characters." };
    if (new Set(options.map((o) => o.toLowerCase())).size !== options.length)
      return { error: "Each option needs to be different." };
    if (d !== 1 && d !== 3 && d !== 7) return { error: "Pick 1, 3 or 7 days." };
    if (!body) return { error: "Ask your question in the post." };
    if (media.length > 0 || document) return { error: "A poll can't have attachments." };
    poll = { options, durationDays: d };
  }

  const quotedPostId = input.quotedPostId ?? null;
  if (quotedPostId && poll) return { error: "A quote can't include a poll." };
  if (!body && media.length === 0 && !document) return { error: "Write something first." };

  const hashtags = extractHashtagsFromBody(body);
  const kind = input.kind ?? "update";

  // Link preview: only when there is no other attachment, like LinkedIn.
  const firstUrl = media.length === 0 && !document && !quotedPostId ? extractFirstUrl(body) : null;
  const [embedding, linkPreview] = await Promise.all([
    embedOrNull(body),
    firstUrl ? fetchLinkPreview(firstUrl) : Promise.resolve(null),
  ]);

  // Admin client writes the embedding column (kept off the user writable
  // surface). The validate_post_media and validate_post_refs triggers still
  // run and enforce paths, blocks and repost rules.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("posts")
    .insert({
      user_id: user.id,
      body,
      hashtags,
      kind,
      embedding,
      media: media as unknown as Json,
      document: (document ?? null) as unknown as Json,
      link_preview: (linkPreview ?? null) as unknown as Json,
      quoted_post_id: quotedPostId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: `Could not post: ${friendlyError(error?.message)}` };

  if (poll) {
    const { error: pollError } = await supabase.from("post_polls").insert({
      post_id: data.id,
      options: poll.options,
      duration_days: poll.durationDays,
    });
    if (pollError) {
      await admin.from("posts").delete().eq("id", data.id).eq("user_id", user.id);
      return { error: `Could not create the poll: ${friendlyError(pollError.message)}` };
    }
  }

  await syncMentions(supabase, { authorId: user.id, postId: data.id, commentId: null, body });

  await logEvent("post_created", user.id, {
    kind,
    hashtag_count: hashtags.length,
    images: media.length,
    document: Boolean(document),
    link_preview: Boolean(linkPreview),
    quote: Boolean(quotedPostId),
    poll: Boolean(poll),
  });

  revalidatePath("/feed");
  return { postId: data.id };
}

export async function editPost(input: {
  postId: string;
  body: string;
}): Promise<{ error?: string }> {
  const body = input.body.trim();
  if (body.length > POST_BODY_MAX) return { error: `Keep it under ${POST_BODY_MAX} characters.` };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: current } = await supabase
    .from("posts")
    .select("id, user_id, body, media, document, repost_of_id, quoted_post_id")
    .eq("id", input.postId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!current) return { error: "Post not found." };
  if (current.repost_of_id) return { error: "Reposts can't be edited." };
  const hasAttachment =
    (Array.isArray(current.media) && current.media.length > 0) || current.document !== null;
  if (!body && !hasAttachment) return { error: "Can't be empty." };

  const hashtags = extractHashtagsFromBody(body);
  const oldUrl = extractFirstUrl(current.body);
  const newUrl = !hasAttachment && !current.quoted_post_id ? extractFirstUrl(body) : null;

  const embedding = await embedOrNull(body);
  const update: {
    body: string;
    hashtags: string[];
    embedding: string | null;
    link_preview?: Json | null;
  } = { body, hashtags, embedding };
  if (newUrl !== oldUrl || !newUrl) {
    update.link_preview = newUrl ? ((await fetchLinkPreview(newUrl)) as unknown as Json) : null;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update(update)
    .eq("id", input.postId)
    .eq("user_id", user.id);
  if (error) return { error: friendlyError(error.message) };

  await syncMentions(supabase, { authorId: user.id, postId: input.postId, commentId: null, body });

  await logEvent("post_edited", user.id, { post_id: input.postId });
  revalidatePath("/feed");
  revalidatePath(`/p/${input.postId}`);
  return {};
}

export async function deletePost(postId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  // Owners + admins can also delete any post (moderation).
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = me?.role === "owner" || me?.role === "admin";

  const { data: target } = await supabase
    .from("posts")
    .select("id, user_id, media, document")
    .eq("id", postId)
    .maybeSingle();

  let q = supabase.from("posts").delete().eq("id", postId);
  if (!isAdmin) q = q.eq("user_id", user.id);
  const { error } = await q;
  if (error) return { error: error.message };

  // Clean up the attachments. Best effort: a leftover object is harmless.
  if (target && (isAdmin || target.user_id === user.id)) {
    const paths: string[] = [];
    if (Array.isArray(target.media)) {
      for (const m of target.media as Array<{ path?: unknown }>) {
        if (m && typeof m.path === "string") paths.push(m.path);
      }
    }
    const doc = target.document as { path?: unknown } | null;
    if (doc && typeof doc.path === "string") paths.push(doc.path);
    if (paths.length > 0) {
      try {
        await createAdminClient().storage.from(POST_MEDIA_BUCKET).remove(paths);
      } catch {
        // ignore
      }
    }
  }

  await logEvent("post_deleted", user.id, { post_id: postId, by_admin: isAdmin });
  revalidatePath("/feed");
  return {};
}

export async function fetchFeed(opts: {
  tag?: string | null;
  limit?: number;
  view?: FeedView;
}): Promise<{ posts: FeedPost[]; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { posts: [], error: "Not signed in." };

  const { data, error } = await supabase.rpc("feed_for_user", {
    viewer_id: user.id,
    tag_filter: opts.tag ?? null,
    limit_count: opts.limit ?? 30,
    view_mode: opts.view ?? "personalized",
  });

  if (error) return { posts: [], error: error.message };

  // A plain repost and its original can both rank. Show each original once.
  const seen = new Set<string>();
  const posts: FeedPost[] = [];
  for (const row of data ?? []) {
    const key = row.repost_of_id ?? row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    posts.push(toFeedPost(row));
  }
  return { posts };
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

// ============================================
// Reposts
// ============================================

export async function repostPost(postId: string): Promise<{ error?: string; repostId?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  // User client: posts_insert_own_active RLS applies. The DB trigger
  // copies kind, hashtags and embedding from the original and rejects
  // deleted, group or blocked originals.
  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: user.id, body: "", repost_of_id: postId })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyError(error?.message) };

  await logEvent("post_reposted", user.id, { post_id: postId });
  revalidatePath("/feed");
  return { repostId: data.id };
}

export async function undoRepost(postId: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("user_id", user.id)
    .eq("repost_of_id", postId);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/feed");
  return {};
}

// ============================================
// Reactions
// ============================================

export async function setReaction(input: {
  postId: string;
  kind: ReactionKind | null;
}): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  if (input.kind === null) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", input.postId)
      .eq("user_id", user.id);
    if (error) return { error: friendlyError(error.message) };
  } else {
    if (!isReactionKind(input.kind)) return { error: "Unknown reaction." };
    const { data: existing } = await supabase
      .from("post_reactions")
      .select("kind")
      .eq("post_id", input.postId)
      .eq("user_id", user.id)
      .maybeSingle();
    const { error } = existing
      ? await supabase
          .from("post_reactions")
          .update({ kind: input.kind })
          .eq("post_id", input.postId)
          .eq("user_id", user.id)
      : await supabase
          .from("post_reactions")
          .insert({ post_id: input.postId, user_id: user.id, kind: input.kind });
    if (error) return { error: friendlyError(error.message) };
  }

  revalidatePath("/feed");
  return {};
}

export type Reactor = {
  user_id: string;
  display_name: string;
  company_name: string | null;
  avatar_url: string | null;
  kind: ReactionKind;
};

export async function fetchReactors(postId: string): Promise<{ reactors: Reactor[]; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { reactors: [], error: "Not signed in." };

  // RLS hides reactions from anyone blocked either way.
  const { data: rows, error } = await supabase
    .from("post_reactions")
    .select("user_id, kind, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return { reactors: [], error: error.message };
  const ids = (rows ?? []).map((r) => r.user_id);
  const { data: profiles } =
    ids.length > 0
      ? await supabase.from("profiles").select("id, display_name, company_name, avatar_url").in("id", ids)
      : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  const reactors: Reactor[] = [];
  for (const r of rows ?? []) {
    const p = byId.get(r.user_id);
    if (!p || !isReactionKind(r.kind)) continue;
    reactors.push({
      user_id: r.user_id,
      display_name: p.display_name,
      company_name: p.company_name,
      avatar_url: p.avatar_url,
      kind: r.kind,
    });
  }
  return { reactors };
}

// ============================================
// Comments
// ============================================

export async function createComment(input: {
  postId: string;
  body: string;
  parentCommentId?: string | null;
}): Promise<{ error?: string }> {
  const body = input.body.trim();
  if (!body) return { error: "Write something." };
  if (body.length > COMMENT_BODY_MAX) return { error: `Comments are limited to ${COMMENT_BODY_MAX} characters.` };

  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: input.postId,
      user_id: user.id,
      body,
      parent_comment_id: input.parentCommentId ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: friendlyError(error?.message) };

  await syncMentions(supabase, { authorId: user.id, postId: input.postId, commentId: data.id, body });

  revalidatePath("/feed");
  revalidatePath(`/p/${input.postId}`);
  return {};
}

export async function toggleCommentLike(commentId: string): Promise<{ error?: string; liked?: boolean }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", user.id);
    if (error) return { error: friendlyError(error.message) };
    return { liked: false };
  }
  const { error } = await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
  if (error) return { error: friendlyError(error.message) };
  return { liked: true };
}

// ============================================
// Mentions autocomplete
// ============================================

export type MentionCandidate = {
  id: string;
  display_name: string;
  company_name: string | null;
  avatar_url: string | null;
};

export async function searchMentions(q: string): Promise<MentionCandidate[]> {
  const query = q.trim().slice(0, 60);
  if (!query) return [];
  const { supabase, user } = await requireUser();
  if (!user) return [];
  const { data } = await supabase.rpc("mention_candidates", { q: query, limit_count: 6 });
  return (data ?? []) as MentionCandidate[];
}

// ============================================
// Saves
// ============================================

export async function toggleSave(postId: string): Promise<{ error?: string; saved?: boolean }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  const { data: existing } = await supabase
    .from("post_saves")
    .select("post_id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase.from("post_saves").delete().eq("user_id", user.id).eq("post_id", postId);
    if (error) return { error: friendlyError(error.message) };
    revalidatePath("/saved");
    return { saved: false };
  }
  const { error } = await supabase.from("post_saves").insert({ user_id: user.id, post_id: postId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/saved");
  return { saved: true };
}

// ============================================
// Polls
// ============================================

export async function votePoll(input: {
  postId: string;
  optionIndex: number;
}): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  const idx = Math.trunc(input.optionIndex);
  if (!Number.isFinite(idx) || idx < 0 || idx > 3) return { error: "Pick an option." };
  const { error } = await supabase
    .from("poll_votes")
    .insert({ post_id: input.postId, user_id: user.id, option_index: idx });
  if (error) {
    if (error.message.includes("duplicate key")) return { error: "You already voted." };
    if (error.message.includes("row-level security")) return { error: "This poll is closed." };
    return { error: friendlyError(error.message) };
  }
  revalidatePath("/feed");
  return {};
}

// ============================================
// Impressions
// ============================================

export async function recordImpressions(postIds: string[]): Promise<void> {
  const ids = Array.from(new Set(postIds.filter((id) => /^[0-9a-f-]{36}$/.test(id)))).slice(0, 50);
  if (ids.length === 0) return;
  const { supabase, user } = await requireUser();
  if (!user) return;
  // Only posts the viewer can see and didn't write (RLS would reject the
  // whole batch otherwise).
  const { data: visible } = await supabase
    .from("posts")
    .select("id")
    .in("id", ids)
    .neq("user_id", user.id);
  const rows = (visible ?? []).map((p) => ({ post_id: p.id, viewer_id: user.id }));
  if (rows.length === 0) return;
  await supabase
    .from("post_impressions")
    .upsert(rows, { onConflict: "post_id,viewer_id", ignoreDuplicates: true });
}
