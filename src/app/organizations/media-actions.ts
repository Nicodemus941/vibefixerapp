"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Company page logo and cover uploads. Bucket "org-logos" (migration
// 20261110130000_org_logos_group_covers.sql, NOT applied yet): public
// read, write by the page creator or a platform admin. Paths are
// {org_id}/{logo|cover}-{ts}.{ext}. We check permission here as well as
// in storage and table RLS, and derive public URLs on the server.

type Kind = "logo" | "cover";
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authorize(orgId: string) {
  if (!UUID_RX.test(orgId)) return { error: "Invalid company." } as const;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." } as const;

  const [{ data: org }, { data: me }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, slug, created_by")
      .eq("id", orgId)
      .maybeSingle(),
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
  ]);
  if (!org) return { error: "Company not found." } as const;
  const isAdmin = me?.role === "admin" || me?.role === "owner";
  if (org.created_by !== user.id && !isAdmin) {
    return { error: "Only the page owner can change this." } as const;
  }
  return { supabase, org } as const;
}

export async function getOrgImageUploadUrl(
  orgId: string,
  kind: Kind,
  contentType: string,
): Promise<{ uploadUrl?: string; objectPath?: string; error?: string }> {
  if (kind !== "logo" && kind !== "cover") return { error: "Invalid image type." };
  const ext = EXT[contentType];
  if (!ext) return { error: "Use a JPEG, PNG or WebP image." };
  const auth = await authorize(orgId);
  if ("error" in auth) return { error: auth.error };

  const objectPath = `${orgId}/${kind}-${Date.now()}.${ext}`;
  const { data, error } = await auth.supabase.storage
    .from("org-logos")
    .createSignedUploadUrl(objectPath);
  if (error || !data) return { error: error?.message ?? "Could not start the upload." };
  return { uploadUrl: data.signedUrl, objectPath };
}

export async function setOrgImage(
  orgId: string,
  kind: Kind,
  objectPath: string,
): Promise<{ error?: string }> {
  if (kind !== "logo" && kind !== "cover") return { error: "Invalid image type." };
  const rx = new RegExp(`^${orgId}/${kind}-\\d+\\.(jpg|png|webp)$`);
  if (!UUID_RX.test(orgId) || !rx.test(objectPath)) return { error: "Invalid upload." };
  const auth = await authorize(orgId);
  if ("error" in auth) return { error: auth.error };

  const publicUrl = auth.supabase.storage.from("org-logos").getPublicUrl(objectPath)
    .data.publicUrl;
  const patch = kind === "logo" ? { logo_url: publicUrl } : { cover_url: publicUrl };
  const { error } = await auth.supabase.from("organizations").update(patch).eq("id", orgId);
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/o/${auth.org.slug}`);
  return {};
}

export async function removeOrgImage(orgId: string, kind: Kind): Promise<{ error?: string }> {
  if (kind !== "logo" && kind !== "cover") return { error: "Invalid image type." };
  const auth = await authorize(orgId);
  if ("error" in auth) return { error: auth.error };
  const patch = kind === "logo" ? { logo_url: null } : { cover_url: null };
  const { error } = await auth.supabase.from("organizations").update(patch).eq("id", orgId);
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/o/${auth.org.slug}`);
  return {};
}

function friendly(msg: string): string {
  if (/cover_url/.test(msg) && /column/.test(msg)) return "Cover images are not enabled yet.";
  return msg;
}
