"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type SocialCounts = {
  followers: number;
  following: number;
  connections: number;
};

export type FollowState = {
  isFollowing: boolean;
  followsYou: boolean;
};

export async function fetchSocialCounts(userId: string): Promise<SocialCounts> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("profile_social_counts", {
    target_user: userId,
  });
  if (error || !data || data.length === 0) {
    return { followers: 0, following: 0, connections: 0 };
  }
  const row = data[0];
  return {
    followers: Number(row.followers ?? 0),
    following: Number(row.following ?? 0),
    connections: Number(row.connections ?? 0),
  };
}

export async function fetchFollowState(targetUserId: string): Promise<FollowState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id === targetUserId) {
    return { isFollowing: false, followsYou: false };
  }

  const { data } = await supabase
    .from("follows")
    .select("follower_id, following_id")
    .or(
      `and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`,
    );
  const rows = data ?? [];
  return {
    isFollowing: rows.some(
      (r) => r.follower_id === user.id && r.following_id === targetUserId,
    ),
    followsYou: rows.some(
      (r) => r.follower_id === targetUserId && r.following_id === user.id,
    ),
  };
}

export async function followUser(targetUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };
  if (user.id === targetUserId) return { error: "can't follow yourself" };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetUserId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { error: error.message };
  }
  await logEvent("user_followed", user.id, { target_id: targetUserId });
  revalidatePath(`/u/${targetUserId}`);
  revalidatePath(`/u/${user.id}`);
  return {};
}

export async function unfollowUser(targetUserId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);
  if (error) return { error: error.message };
  revalidatePath(`/u/${targetUserId}`);
  revalidatePath(`/u/${user.id}`);
  return {};
}

export async function viewerConnectionsAtOrg(orgId: string): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase.rpc("viewer_connections_at_org", {
    viewer_id: user.id,
    target_org: orgId,
  });
  if (error) return 0;
  return Number(data ?? 0);
}

// ============================================
// Org follows (separate graph from people follows)
// ============================================

export type OrgFollowState = {
  isFollowing: boolean;
  followerCount: number;
};

export async function fetchOrgFollowState(orgId: string): Promise<OrgFollowState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data }, { data: countData }] = await Promise.all([
    user
      ? supabase
          .from("org_follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("organization_id", orgId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.rpc("org_follower_count", { target_org: orgId }),
  ]);

  return {
    isFollowing: Boolean(data),
    followerCount: Number(countData ?? 0),
  };
}

export async function followOrg(orgId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase
    .from("org_follows")
    .insert({ follower_id: user.id, organization_id: orgId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { error: error.message };
  }
  await logEvent("org_followed", user.id, { organization_id: orgId });

  const { data: org } = await supabase
    .from("organizations").select("slug").eq("id", orgId).maybeSingle();
  if (org?.slug) revalidatePath(`/o/${org.slug}`);
  return {};
}

export async function unfollowOrg(orgId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase
    .from("org_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("organization_id", orgId);
  if (error) return { error: error.message };

  const { data: org } = await supabase
    .from("organizations").select("slug").eq("id", orgId).maybeSingle();
  if (org?.slug) revalidatePath(`/o/${org.slug}`);
  return {};
}
