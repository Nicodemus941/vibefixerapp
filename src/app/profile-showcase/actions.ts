"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchLinkPreview } from "@/lib/link-preview";
import { logEvent } from "@/lib/platform-events";
import {
  ACHIEVEMENTS_MAX,
  ACHIEVEMENT_DESCRIPTION_MAX,
  ACHIEVEMENT_ISSUER_MAX,
  ACHIEVEMENT_TITLE_MAX,
  FEATURED_DESCRIPTION_MAX,
  FEATURED_MAX,
  FEATURED_PUBLISHER_MAX,
  FEATURED_TITLE_MAX,
  GOALS_MAX,
  GOAL_HELP_MAX,
  GOAL_STATEMENT_MAX,
  cleanText,
  isFeaturedKind,
  isIsoDate,
  moveById,
  nextPosition,
  normalizeHttpUrl,
  optionalUrl,
  positionUpdates,
  sortByPosition,
  type FeaturedKind,
} from "@/lib/profile-showcase";
import {
  readAchievements,
  readFeatured,
  readGoals,
  type AchievementRow,
  type FeaturedRow,
  type GoalRow,
} from "@/lib/profile-showcase-data";

// Owner writes for the profile showcase. RLS already limits writes to the
// owner; every query here also filters by user_id so a forged id can't
// touch someone else's row even if a policy regressed.

const BUCKET = "profile-media";
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Table = "profile_featured" | "profile_achievements" | "profile_goals";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function friendly(msg: string, cap?: number): string {
  if (/limit reached/i.test(msg)) return cap ? `You can add up to ${cap}.` : "Limit reached.";
  if (/does not exist|could not find the table|schema cache/i.test(msg)) {
    return "This section is not enabled yet. Try again after the next update.";
  }
  if (/violates check constraint/i.test(msg)) return "Something in that entry is not valid.";
  return msg;
}

function revalidateProfile(uid: string) {
  revalidatePath(`/u/${uid}`);
  revalidatePath(`/c/${uid}`);
  revalidatePath("/account");
}

// ---------- link preview ----------

export type FeaturedPrefill = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  publisher: string | null;
};

export async function previewFeaturedLink(rawUrl: string): Promise<{ prefill?: FeaturedPrefill; error?: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  const url = normalizeHttpUrl(rawUrl);
  if (!url) return { error: "Enter a link that starts with http or https." };
  const p = await fetchLinkPreview(url);
  if (!p) return { prefill: { url, title: null, description: null, image: null, publisher: null } };
  return {
    prefill: {
      url,
      title: cleanText(p.title, FEATURED_TITLE_MAX),
      description: cleanText(p.description, FEATURED_DESCRIPTION_MAX),
      image: p.image,
      publisher: cleanText(p.site_name, FEATURED_PUBLISHER_MAX),
    },
  };
}

// ---------- featured image upload ----------

export async function getFeaturedImageUploadUrl(
  contentType: string,
): Promise<{ uploadUrl?: string; objectPath?: string; error?: string }> {
  const ext = IMAGE_TYPES[contentType];
  if (!ext) return { error: "Use a JPEG, PNG or WebP image." };
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  const objectPath = `${user.id}/featured-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data) {
    return { error: /not found/i.test(error?.message ?? "") ? "Image uploads are not enabled yet." : error?.message ?? "Could not start the upload." };
  }
  return { uploadUrl: data.signedUrl, objectPath };
}

function ownMediaPath(uid: string, objectPath: string): boolean {
  return (
    /^[0-9a-f-]{36}\/featured-\d+\.(jpg|png|webp)$/.test(objectPath) && objectPath.startsWith(`${uid}/`)
  );
}

// Public URL -> object path, only for images this member uploaded.
function mediaPathFromUrl(uid: string, url: string | null): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  return ownMediaPath(uid, path) ? path : null;
}

// ---------- featured ----------

export type FeaturedImageChoice =
  | { mode: "keep" }
  | { mode: "none" }
  | { mode: "link" } // use the Open Graph image from the link, fetched here
  | { mode: "upload"; objectPath: string };

export type FeaturedInput = {
  id?: string;
  kind: FeaturedKind;
  title: string;
  url: string;
  publisher: string;
  publishedOn: string;
  description: string;
  image: FeaturedImageChoice;
};

export async function saveFeatured(input: FeaturedInput): Promise<{ row?: FeaturedRow; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (input.id && !UUID_RX.test(input.id)) return { error: "Unknown item." };

  const url = normalizeHttpUrl(input.url);
  if (!url) return { error: "Enter a link that starts with http or https." };
  if (!isFeaturedKind(input.kind)) return { error: "Pick a type." };
  if (input.publishedOn && !isIsoDate(input.publishedOn)) return { error: "Date is not valid." };

  let title = cleanText(input.title, FEATURED_TITLE_MAX);
  let description = cleanText(input.description, FEATURED_DESCRIPTION_MAX);
  let publisher = cleanText(input.publisher, FEATURED_PUBLISHER_MAX);

  let existing: { image_url: string | null } | null = null;
  if (input.id) {
    const { data } = await supabase
      .from("profile_featured")
      .select("image_url")
      .eq("id", input.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return { error: "Unknown item." };
    existing = data;
  }

  // Prefill anything left empty from the page's Open Graph tags. Fetched
  // server side through the SSRF guarded helper the feed uses.
  const needsPreview = !title || !description || !publisher || input.image.mode === "link";
  const preview = needsPreview ? await fetchLinkPreview(url) : null;
  if (preview) {
    title = title ?? cleanText(preview.title, FEATURED_TITLE_MAX);
    description = description ?? cleanText(preview.description, FEATURED_DESCRIPTION_MAX);
    publisher = publisher ?? cleanText(preview.site_name, FEATURED_PUBLISHER_MAX);
  }
  if (!title) return { error: "Add a title. We could not read one from that link." };

  let imageUrl: string | null = existing?.image_url ?? null;
  switch (input.image.mode) {
    case "keep":
      break;
    case "none":
      imageUrl = null;
      break;
    case "link":
      imageUrl = preview?.image && preview.image.startsWith("https://") ? preview.image : null;
      break;
    case "upload":
      if (!ownMediaPath(user.id, input.image.objectPath)) return { error: "Invalid upload." };
      imageUrl = supabase.storage.from(BUCKET).getPublicUrl(input.image.objectPath).data.publicUrl;
      break;
  }

  const fields = {
    kind: input.kind,
    title,
    url,
    publisher,
    published_on: input.publishedOn || null,
    description,
    image_url: imageUrl,
  };

  let row: FeaturedRow | null = null;
  if (input.id) {
    const { data, error } = await supabase
      .from("profile_featured")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select("id, kind, title, url, publisher, published_on, description, image_url, position, created_at")
      .single();
    if (error) return { error: friendly(error.message, FEATURED_MAX) };
    row = data as FeaturedRow;
  } else {
    const current = await readFeatured(supabase, user.id);
    if (current.length >= FEATURED_MAX) return { error: `You can add up to ${FEATURED_MAX}.` };
    const { data, error } = await supabase
      .from("profile_featured")
      .insert({ ...fields, user_id: user.id, position: nextPosition(current.map((r) => r.position)) })
      .select("id, kind, title, url, publisher, published_on, description, image_url, position, created_at")
      .single();
    if (error) return { error: friendly(error.message, FEATURED_MAX) };
    row = data as FeaturedRow;
    await logEvent("profile_featured_added", user.id, { kind: input.kind });
  }

  // Clean up a replaced upload.
  const oldPath = mediaPathFromUrl(user.id, existing?.image_url ?? null);
  if (oldPath && existing?.image_url !== imageUrl) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  revalidateProfile(user.id);
  return { row };
}

export async function deleteFeatured(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!UUID_RX.test(id)) return { error: "Unknown item." };
  const { data, error } = await supabase
    .from("profile_featured")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("image_url")
    .maybeSingle();
  if (error) return { error: friendly(error.message) };
  const path = mediaPathFromUrl(user.id, data?.image_url ?? null);
  if (path) await supabase.storage.from(BUCKET).remove([path]);
  revalidateProfile(user.id);
  return {};
}

// ---------- achievements ----------

export type AchievementInput = {
  id?: string;
  title: string;
  achievedOn: string;
  issuer: string;
  description: string;
  proofUrl: string;
};

export async function saveAchievement(input: AchievementInput): Promise<{ row?: AchievementRow; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (input.id && !UUID_RX.test(input.id)) return { error: "Unknown item." };

  const title = cleanText(input.title, ACHIEVEMENT_TITLE_MAX);
  if (!title) return { error: "Add a title." };
  if (input.achievedOn && !isIsoDate(input.achievedOn)) return { error: "Date is not valid." };
  const proof = optionalUrl(input.proofUrl);
  if (!proof.ok) return { error: "Proof link must start with http or https." };

  const fields = {
    title,
    achieved_on: input.achievedOn || null,
    issuer: cleanText(input.issuer, ACHIEVEMENT_ISSUER_MAX),
    description: cleanText(input.description, ACHIEVEMENT_DESCRIPTION_MAX),
    proof_url: proof.value,
  };
  const cols = "id, title, achieved_on, issuer, description, proof_url, position, created_at";

  if (input.id) {
    const { data, error } = await supabase
      .from("profile_achievements")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select(cols)
      .single();
    if (error) return { error: friendly(error.message, ACHIEVEMENTS_MAX) };
    revalidateProfile(user.id);
    return { row: data as AchievementRow };
  }

  const current = await readAchievements(supabase, user.id);
  if (current.length >= ACHIEVEMENTS_MAX) return { error: `You can add up to ${ACHIEVEMENTS_MAX}.` };
  const { data, error } = await supabase
    .from("profile_achievements")
    .insert({ ...fields, user_id: user.id, position: nextPosition(current.map((r) => r.position)) })
    .select(cols)
    .single();
  if (error) return { error: friendly(error.message, ACHIEVEMENTS_MAX) };
  await logEvent("profile_achievement_added", user.id, {});
  revalidateProfile(user.id);
  return { row: data as AchievementRow };
}

export async function deleteAchievement(id: string): Promise<{ error?: string }> {
  return deleteRow("profile_achievements", id);
}

// ---------- goals ----------

export type GoalInput = {
  id?: string;
  statement: string;
  targetDate: string;
  helpText: string;
};

export async function saveGoal(input: GoalInput): Promise<{ row?: GoalRow; error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (input.id && !UUID_RX.test(input.id)) return { error: "Unknown item." };

  const statement = cleanText(input.statement, GOAL_STATEMENT_MAX);
  if (!statement) return { error: "Write what you are working toward." };
  if (input.targetDate && !isIsoDate(input.targetDate)) return { error: "Date is not valid." };

  const fields = {
    statement,
    target_date: input.targetDate || null,
    help_text: cleanText(input.helpText, GOAL_HELP_MAX),
  };
  const cols = "id, statement, target_date, help_text, position, created_at";

  if (input.id) {
    const { data, error } = await supabase
      .from("profile_goals")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("user_id", user.id)
      .select(cols)
      .single();
    if (error) return { error: friendly(error.message, GOALS_MAX) };
    revalidateProfile(user.id);
    return { row: data as GoalRow };
  }

  const current = await readGoals(supabase, user.id);
  if (current.length >= GOALS_MAX) return { error: `You can add up to ${GOALS_MAX}.` };
  const { data, error } = await supabase
    .from("profile_goals")
    .insert({ ...fields, user_id: user.id, position: nextPosition(current.map((r) => r.position)) })
    .select(cols)
    .single();
  if (error) return { error: friendly(error.message, GOALS_MAX) };
  await logEvent("profile_goal_added", user.id, {});
  revalidateProfile(user.id);
  return { row: data as GoalRow };
}

export async function deleteGoal(id: string): Promise<{ error?: string }> {
  return deleteRow("profile_goals", id);
}

// ---------- shared ----------

async function deleteRow(table: Table, id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!UUID_RX.test(id)) return { error: "Unknown item." };
  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: friendly(error.message) };
  revalidateProfile(user.id);
  return {};
}

// Move one item up or down within its section. Rewrites positions 0..n-1
// for the rows that changed. Returns the new id order.
export async function moveShowcaseItem(
  section: "featured" | "achievements" | "goals",
  id: string,
  delta: -1 | 1,
): Promise<{ order?: string[]; error?: string }> {
  const table: Table =
    section === "featured" ? "profile_featured" : section === "achievements" ? "profile_achievements" : "profile_goals";
  const { supabase, user } = await requireUser();
  if (!user) return { error: "Not signed in." };
  if (!UUID_RX.test(id) || (delta !== -1 && delta !== 1)) return { error: "Unknown item." };

  const { data, error } = await supabase
    .from(table)
    .select("id, position, created_at")
    .eq("user_id", user.id);
  if (error) return { error: friendly(error.message) };
  const ordered = moveById(sortByPosition(data ?? []), id, delta);
  for (const u of positionUpdates(ordered)) {
    const { error: e } = await supabase
      .from(table)
      .update({ position: u.position })
      .eq("id", u.id)
      .eq("user_id", user.id);
    if (e) return { error: friendly(e.message) };
  }
  revalidateProfile(user.id);
  return { order: ordered.map((r) => r.id) };
}
