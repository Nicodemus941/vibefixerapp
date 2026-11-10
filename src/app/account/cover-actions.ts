"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Profile cover images. Storage bucket "covers" (see migration
// 20261110120000_profile_covers.sql): public read, owner write under
// {user_id}/, 5 MB, jpeg/png/webp. The public URL is always derived on
// the server from a path we validated, never taken from the client.

export type UploadTicket = {
  uploadUrl?: string;
  objectPath?: string;
  error?: string;
};

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function getCoverUploadUrl(
  contentType: string,
): Promise<UploadTicket> {
  const ext = ALLOWED[contentType];
  if (!ext) return { error: "Use a JPEG, PNG or WebP image." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const objectPath = `${user.id}/cover-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("covers")
    .createSignedUploadUrl(objectPath);
  if (error || !data) {
    return { error: error?.message ?? "Could not start the upload." };
  }
  return { uploadUrl: data.signedUrl, objectPath };
}

export async function setCoverFromPath(
  objectPath: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (!/^[0-9a-f-]{36}\/cover-\d+\.(jpg|png|webp)$/.test(objectPath)) {
    return { error: "Invalid upload." };
  }
  if (!objectPath.startsWith(`${user.id}/`)) return { error: "Invalid upload." };

  const publicUrl = supabase.storage.from("covers").getPublicUrl(objectPath)
    .data.publicUrl;
  const { error } = await supabase
    .from("profiles")
    .update({ cover_url: publicUrl })
    .eq("id", user.id);
  if (error) return { error: friendly(error.message) };

  revalidatePath(`/u/${user.id}`);
  revalidatePath(`/c/${user.id}`);
  revalidatePath("/account");
  return {};
}

export async function removeCover(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ cover_url: null })
    .eq("id", user.id);
  if (error) return { error: friendly(error.message) };

  revalidatePath(`/u/${user.id}`);
  revalidatePath(`/c/${user.id}`);
  revalidatePath("/account");
  return {};
}

function friendly(msg: string): string {
  // Until the cover migration is applied the column does not exist.
  if (/cover_url/.test(msg) && /column/.test(msg)) {
    return "Cover images are not enabled yet.";
  }
  return msg;
}
