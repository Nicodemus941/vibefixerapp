"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Optional group cover image. Stored in the "covers" bucket under the
// uploading owner's folder: covers/{user_id}/group-{group_id}-{ts}.{ext}
// (covered by covers_storage_insert_own). The groups row is guarded by
// the existing groups_update_owner RLS policy; we also check here.

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorizeOwner(groupId: string) {
  if (!UUID_RX.test(groupId)) return { error: "Invalid group." } as const;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." } as const;
  const [{ data: member }, { data: group }] = await Promise.all([
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("groups").select("slug").eq("id", groupId).maybeSingle(),
  ]);
  if (!group) return { error: "Group not found." } as const;
  if (member?.role !== "owner") {
    return { error: "Only the group owner can change the cover." } as const;
  }
  return { supabase, user, slug: group.slug } as const;
}

export async function getGroupCoverUploadUrl(
  groupId: string,
  contentType: string,
): Promise<{ uploadUrl?: string; objectPath?: string; error?: string }> {
  const ext = EXT[contentType];
  if (!ext) return { error: "Use a JPEG, PNG or WebP image." };
  const auth = await authorizeOwner(groupId);
  if ("error" in auth) return { error: auth.error };
  const objectPath = `${auth.user.id}/group-${groupId}-${Date.now()}.${ext}`;
  const { data, error } = await auth.supabase.storage
    .from("covers")
    .createSignedUploadUrl(objectPath);
  if (error || !data) return { error: error?.message ?? "Could not start the upload." };
  return { uploadUrl: data.signedUrl, objectPath };
}

export async function setGroupCover(
  groupId: string,
  objectPath: string,
): Promise<{ error?: string }> {
  const auth = await authorizeOwner(groupId);
  if ("error" in auth) return { error: auth.error };
  const rx = new RegExp(`^${auth.user.id}/group-${groupId}-\\d+\\.(jpg|png|webp)$`);
  if (!rx.test(objectPath)) return { error: "Invalid upload." };
  const publicUrl = auth.supabase.storage.from("covers").getPublicUrl(objectPath).data
    .publicUrl;
  const { error } = await auth.supabase
    .from("groups")
    .update({ cover_url: publicUrl })
    .eq("id", groupId);
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/g/${auth.slug}`);
  return {};
}

export async function removeGroupCover(groupId: string): Promise<{ error?: string }> {
  const auth = await authorizeOwner(groupId);
  if ("error" in auth) return { error: auth.error };
  const { error } = await auth.supabase
    .from("groups")
    .update({ cover_url: null })
    .eq("id", groupId);
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/g/${auth.slug}`);
  return {};
}

function friendly(msg: string): string {
  if (/cover_url/.test(msg) && /column/.test(msg)) return "Cover images are not enabled yet.";
  return msg;
}
