import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export const dynamic = "force-dynamic";

// GDPR-style "download all my data" endpoint. Authenticated user only,
// reads everything they own across the public schema, returns a JSON file.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const uid = user.id;

  const [
    profile,
    posts,
    postComments,
    postReactions,
    needs,
    offers,
    matches,
    engagements,
    documents,
    documentSignatures,
    reviews,
    reviewMedia,
    messages,
    conversations,
    notifications,
    groupsOwnedOrJoined,
    groupMemberships,
    blocks,
    reports,
    feedEvents,
    reputationEvents,
    coldDmQuota,
    platformEvents,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("posts").select("*").eq("user_id", uid),
    supabase.from("post_comments").select("*").eq("user_id", uid),
    supabase.from("post_reactions").select("*").eq("user_id", uid),
    supabase.from("needs").select("*").eq("user_id", uid),
    supabase.from("offers").select("*").eq("user_id", uid),
    supabase
      .from("matches")
      .select("*")
      .or(`seeker_id.eq.${uid},provider_id.eq.${uid}`),
    supabase
      .from("engagements")
      .select("*")
      .or(`seeker_id.eq.${uid},provider_id.eq.${uid}`),
    supabase
      .from("documents")
      .select("*")
      .or(`creator_id.eq.${uid},counterparty_id.eq.${uid}`),
    supabase.from("document_signatures").select("*").eq("user_id", uid),
    supabase
      .from("reviews")
      .select("*")
      .or(`reviewer_id.eq.${uid},reviewee_id.eq.${uid}`),
    supabase.from("review_media").select("*").eq("uploader_id", uid),
    supabase.from("messages").select("*").eq("sender_id", uid),
    supabase
      .from("conversations")
      .select("*")
      .or(`participant_a.eq.${uid},participant_b.eq.${uid}`),
    supabase.from("notifications").select("*").eq("user_id", uid),
    supabase.from("groups").select("*").eq("created_by", uid),
    supabase.from("group_members").select("*").eq("user_id", uid),
    supabase.from("blocks").select("*").eq("blocker_id", uid),
    supabase.from("reports").select("*").eq("reporter_id", uid),
    supabase
      .from("feed_events")
      .select("*")
      .or(`primary_user_id.eq.${uid},secondary_user_id.eq.${uid}`),
    supabase.from("reputation_events").select("*").eq("user_id", uid),
    supabase.from("cold_dm_quota").select("*").eq("user_id", uid),
    supabase.from("platform_events").select("*").eq("user_id", uid),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: { id: uid, email: user.email },
    profile: profile.data ?? null,
    posts: posts.data ?? [],
    post_comments: postComments.data ?? [],
    post_reactions: postReactions.data ?? [],
    needs: needs.data ?? [],
    offers: offers.data ?? [],
    matches: matches.data ?? [],
    engagements: engagements.data ?? [],
    documents: documents.data ?? [],
    document_signatures: documentSignatures.data ?? [],
    reviews: reviews.data ?? [],
    review_media: reviewMedia.data ?? [],
    conversations: conversations.data ?? [],
    messages: messages.data ?? [],
    notifications: notifications.data ?? [],
    groups_owned: groupsOwnedOrJoined.data ?? [],
    group_memberships: groupMemberships.data ?? [],
    blocks: blocks.data ?? [],
    reports: reports.data ?? [],
    feed_events: feedEvents.data ?? [],
    reputation_events: reputationEvents.data ?? [],
    cold_dm_quota: coldDmQuota.data ?? [],
    platform_events: platformEvents.data ?? [],
  };

  await logEvent("data_exported", uid, {
    post_count: payload.posts.length,
    message_count: payload.messages.length,
  });

  const filename = `loop-export-${uid.slice(0, 8)}-${Date.now()}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
