"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/platform-events";

export type NotificationPrefs = {
  new_match: boolean;
  new_message: boolean;
  new_reaction: boolean;
  match_accepted: boolean;
  new_comment: boolean;
  new_document: boolean;
  document_signed: boolean;
  new_review: boolean;
  email_digest: "off" | "daily" | "weekly";
};

export type ProfileFormPayload = {
  display_name: string;
  company_name: string;
  company_url: string;
  industry: string;
  bio: string;
  revenue_band: string;
};

export async function updateOwnProfile(
  input: ProfileFormPayload,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  if (!input.display_name.trim()) return { error: "Name is required." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: input.display_name.trim(),
      company_name: input.company_name.trim() || null,
      company_url: input.company_url.trim() || null,
      industry: input.industry.trim() || null,
      bio: input.bio.trim() || null,
      revenue_band: input.revenue_band || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await logEvent("profile_updated", user.id, {});
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}

export async function updateNotificationPrefs(
  prefs: NotificationPrefs,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_prefs: prefs })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/account");
  return {};
}

export async function getAvatarUploadUrl(input: {
  filename: string;
}): Promise<{ uploadUrl?: string; publicUrl?: string; objectPath?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  // Stable per-user filename so the same URL works across re-uploads (we
  // append a cache-buster on read).
  const ext = (input.filename.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  const objectPath = `${user.id}/avatar.${ext}`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .createSignedUploadUrl(objectPath, { upsert: true });
  if (error || !data) return { error: error?.message ?? "could not get upload url" };

  const publicUrl = supabase.storage.from("avatars").getPublicUrl(objectPath).data
    .publicUrl;

  return { uploadUrl: data.signedUrl, publicUrl, objectPath };
}

export async function setAvatarUrl(publicUrl: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  // Cache-bust by appending a fresh ts.
  const bustingUrl = `${publicUrl.split("?")[0]}?v=${Date.now()}`;

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: bustingUrl })
    .eq("id", user.id);
  if (error) return { error: error.message };

  await logEvent("avatar_updated", user.id, {});
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}

export async function removeAvatar(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}

// Account deletion — last-resort hard delete. Uses admin client to remove
// the auth user (which cascades through profiles → posts → everything via
// FK ON DELETE CASCADE).
export async function deleteOwnAccount(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  await logEvent("account_deletion_started", user.id, {});

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(user.id);

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
