"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type ReviewMedia = {
  id: string;
  kind: "image" | "video";
  url: string;
  position: number;
};

export type ReviewRow = {
  id: string;
  engagement_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  body: string;
  reviewer_role: "seeker" | "provider";
  created_at: string;
  reviewer_name: string;
  reviewer_company: string | null;
  media: ReviewMedia[];
};

export async function fetchReviewsForUser(
  userId: string,
  limit = 20,
): Promise<ReviewRow[]> {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, engagement_id, reviewer_id, reviewee_id, rating, body, reviewer_role, created_at",
    )
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!reviews || reviews.length === 0) return [];

  const reviewerIds = Array.from(new Set(reviews.map((r) => r.reviewer_id)));
  const reviewIds = reviews.map((r) => r.id);

  const [{ data: profiles }, { data: media }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, company_name")
      .in("id", reviewerIds),
    supabase
      .from("review_media")
      .select("id, review_id, kind, url, position")
      .in("review_id", reviewIds)
      .order("position", { ascending: true }),
  ]);

  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const mediaByReview = new Map<string, ReviewMedia[]>();
  for (const m of media ?? []) {
    const arr = mediaByReview.get(m.review_id) ?? [];
    arr.push({
      id: m.id,
      kind: m.kind as "image" | "video",
      url: m.url,
      position: m.position,
    });
    mediaByReview.set(m.review_id, arr);
  }

  return reviews.map((r) => {
    const p = pmap.get(r.reviewer_id);
    return {
      id: r.id,
      engagement_id: r.engagement_id,
      reviewer_id: r.reviewer_id,
      reviewee_id: r.reviewee_id,
      rating: r.rating,
      body: r.body,
      reviewer_role: r.reviewer_role as "seeker" | "provider",
      created_at: r.created_at as string,
      reviewer_name: p?.display_name ?? "Unknown",
      reviewer_company: p?.company_name ?? null,
      media: mediaByReview.get(r.id) ?? [],
    };
  });
}

export type PendingReviewRow = {
  engagement_id: string;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_company: string | null;
  amount: number;
  reviewer_role: "seeker" | "provider";
  conversation_id: string | null;
  completed_at: string;
};

// "Engagements you closed and haven't reviewed yet." Used for an inline
// nudge on the inbox thread + a strip on /matches.
export async function fetchPendingReviews(): Promise<PendingReviewRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: engs } = await supabase
    .from("engagements")
    .select(
      "id, seeker_id, provider_id, amount, escrow_status, completed_at, match_id",
    )
    .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`)
    .eq("escrow_status", "released")
    .order("completed_at", { ascending: false })
    .limit(50);
  if (!engs || engs.length === 0) return [];

  const { data: alreadyReviewed } = await supabase
    .from("reviews")
    .select("engagement_id")
    .eq("reviewer_id", user.id)
    .in(
      "engagement_id",
      engs.map((e) => e.id),
    );
  const reviewedSet = new Set((alreadyReviewed ?? []).map((r) => r.engagement_id));

  const pending = engs.filter((e) => !reviewedSet.has(e.id));
  if (pending.length === 0) return [];

  const counterparties = Array.from(
    new Set(
      pending.map((e) => (e.seeker_id === user.id ? e.provider_id : e.seeker_id)),
    ),
  );
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, company_name")
    .in("id", counterparties);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Best-effort look-up of the conversation id (so we can deep-link).
  // We look for the canonical no-match DM for each counterparty pair.
  const { data: convs } = await supabase
    .from("conversations")
    .select("id, participant_a, participant_b")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`);
  const convMap = new Map<string, string>();
  for (const c of convs ?? []) {
    const other = c.participant_a === user.id ? c.participant_b : c.participant_a;
    if (!convMap.has(other)) convMap.set(other, c.id);
  }

  return pending.map((e) => {
    const other = e.seeker_id === user.id ? e.provider_id : e.seeker_id;
    const p = pmap.get(other);
    return {
      engagement_id: e.id,
      counterparty_id: other,
      counterparty_name: p?.display_name ?? "Unknown",
      counterparty_company: p?.company_name ?? null,
      amount: Number(e.amount),
      reviewer_role: e.seeker_id === user.id ? "seeker" : "provider",
      conversation_id: convMap.get(other) ?? null,
      completed_at: e.completed_at as string,
    };
  });
}

export type ReviewMediaInput = {
  kind: "image" | "video";
  url: string;
};

export async function createReview(input: {
  engagementId: string;
  rating: number;
  body: string;
  media?: ReviewMediaInput[];
}): Promise<{ error?: string; reviewId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { error: "Rating must be 1-5" };
  }
  if (!input.body.trim()) return { error: "Write a short review" };

  const { data: eng } = await supabase
    .from("engagements")
    .select("id, seeker_id, provider_id, escrow_status")
    .eq("id", input.engagementId)
    .maybeSingle();
  if (!eng) return { error: "engagement not found" };
  if (eng.escrow_status !== "released")
    return { error: "Can only review released deals" };
  if (eng.seeker_id !== user.id && eng.provider_id !== user.id) {
    return { error: "not a participant" };
  }

  const role: "seeker" | "provider" =
    eng.seeker_id === user.id ? "seeker" : "provider";
  const reviewee = role === "seeker" ? eng.provider_id : eng.seeker_id;

  const { data: inserted, error } = await supabase
    .from("reviews")
    .insert({
      engagement_id: input.engagementId,
      reviewer_id: user.id,
      reviewee_id: reviewee,
      rating: input.rating,
      body: input.body.trim(),
      reviewer_role: role,
    })
    .select("id")
    .single();
  if (error || !inserted) return { error: error?.message ?? "insert failed" };

  if (input.media && input.media.length > 0) {
    const rows = input.media.slice(0, 6).map((m, i) => ({
      review_id: inserted.id,
      uploader_id: user.id,
      kind: m.kind,
      url: m.url,
      position: i,
    }));
    const { error: mediaErr } = await supabase.from("review_media").insert(rows);
    if (mediaErr) {
      // Don't fail the whole review if media insert hiccups — log it.
      await logEvent("review_media_insert_failed", user.id, {
        review_id: inserted.id,
        error: mediaErr.message,
      });
    }
  }

  await logEvent("review_created", user.id, {
    engagement_id: input.engagementId,
    rating: input.rating,
    media_count: input.media?.length ?? 0,
  });
  revalidatePath(`/u/${reviewee}`);
  revalidatePath("/matches");
  return { reviewId: inserted.id };
}

// Returns a signed upload URL for the review-media bucket. The client PUTs
// the file there, then passes the public URL into createReview.
export async function getReviewMediaUploadUrl(input: {
  filename: string;
}): Promise<{ uploadUrl?: string; publicUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const objectPath = `${user.id}/${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from("review-media")
    .createSignedUploadUrl(objectPath);
  if (error || !data) return { error: error?.message ?? "could not get upload url" };

  const publicUrl = supabase.storage.from("review-media").getPublicUrl(objectPath).data
    .publicUrl;

  return { uploadUrl: data.signedUrl, publicUrl };
}
