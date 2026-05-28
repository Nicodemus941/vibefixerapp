"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type Organization = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  size_band: string | null;
  headquarters: string | null;
  verified: boolean;
  member_count: number;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

export async function createOrganization(input: {
  name: string;
  industry?: string | null;
  size_band?: string | null;
  website?: string | null;
  headquarters?: string | null;
  description?: string | null;
}): Promise<{ slug?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = input.name.trim();
  if (!name) return { error: "Name is required." };
  if (name.length > 120) return { error: "Name is too long." };

  let baseSlug = slugify(name);
  if (baseSlug.length < 2) baseSlug = "co-" + baseSlug;
  // Try the base slug, then -2, -3, … until insert succeeds.
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        slug: candidate,
        name,
        industry: input.industry?.trim() || null,
        size_band: input.size_band || null,
        website: input.website?.trim() || null,
        headquarters: input.headquarters?.trim() || null,
        description: input.description?.trim() || null,
        created_by: user.id,
      })
      .select("slug")
      .single();
    if (!error && data) {
      await logEvent("organization_created", user.id, { slug: data.slug });
      revalidatePath("/organizations");
      return { slug: data.slug };
    }
    // 23505 = unique_violation; retry with bumped slug.
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return { error: error.message };
    }
  }
  return { error: "Could not generate a unique slug — try a more specific name." };
}

export async function createOrganizationForm(formData: FormData): Promise<void> {
  const result = await createOrganization({
    name: String(formData.get("name") ?? ""),
    industry: String(formData.get("industry") ?? "") || null,
    size_band: String(formData.get("size_band") ?? "") || null,
    website: String(formData.get("website") ?? "") || null,
    headquarters: String(formData.get("headquarters") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
  });
  if (result.slug) redirect(`/o/${result.slug}`);
  if (result.error) redirect(`/organizations/new?error=${encodeURIComponent(result.error)}`);
}

export async function searchOrganizations(query: string): Promise<
  Array<{ id: string; slug: string; name: string; industry: string | null; logo_url: string | null; member_count: number }>
> {
  const q = query.trim();
  if (q.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("search_organizations", {
    query: q,
    limit_count: 8,
  });
  return data ?? [];
}

export type PositionInput = {
  organizationId: string | null;
  organizationName: string | null;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
};

export async function addPosition(input: PositionInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = input.title.trim();
  if (!title) return { error: "Title is required." };
  if (!input.organizationId && !(input.organizationName?.trim())) {
    return { error: "Pick a company or type a company name." };
  }
  if (!input.startDate) return { error: "Start date is required." };
  if (!input.isCurrent && !input.endDate) {
    return { error: "Set an end date or mark as current." };
  }
  if (input.endDate && input.endDate < input.startDate) {
    return { error: "End date can't be before start date." };
  }

  const { error } = await supabase.from("positions").insert({
    user_id: user.id,
    organization_id: input.organizationId,
    organization_name: input.organizationId ? null : input.organizationName?.trim() || null,
    title,
    start_date: input.startDate,
    end_date: input.isCurrent ? null : input.endDate,
    is_current: input.isCurrent,
    description: input.description?.trim() || null,
  });
  if (error) return { error: error.message };

  await logEvent("position_added", user.id, { title });
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  if (input.organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", input.organizationId)
      .maybeSingle();
    if (org?.slug) revalidatePath(`/o/${org.slug}`);
  }
  return {};
}

export async function deletePosition(positionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Read first so we can revalidate the org page if there was one.
  const { data: row } = await supabase
    .from("positions")
    .select("organization_id, organizations:organization_id(slug)")
    .eq("id", positionId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase
    .from("positions")
    .delete()
    .eq("id", positionId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  const orgSlug = (row?.organizations as unknown as { slug: string } | null | undefined)?.slug;
  if (orgSlug) revalidatePath(`/o/${orgSlug}`);
  return {};
}

export type PositionRow = {
  id: string;
  organization_id: string | null;
  organization_name: string | null;
  organization_slug: string | null;
  organization_logo_url: string | null;
  resolved_name: string;
  title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
};

export async function fetchUserPositions(userId: string): Promise<PositionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("positions")
    .select(
      "id, organization_id, organization_name, title, start_date, end_date, is_current, description, organizations:organization_id(slug, name, logo_url)",
    )
    .eq("user_id", userId)
    .order("is_current", { ascending: false })
    .order("start_date", { ascending: false });
  if (!data) return [];
  return data.map((p) => {
    const org = p.organizations as unknown as { slug: string; name: string; logo_url: string | null } | null;
    return {
      id: p.id,
      organization_id: p.organization_id,
      organization_name: p.organization_name,
      organization_slug: org?.slug ?? null,
      organization_logo_url: org?.logo_url ?? null,
      resolved_name: org?.name ?? p.organization_name ?? "Unknown",
      title: p.title,
      start_date: p.start_date as string,
      end_date: (p.end_date as string) ?? null,
      is_current: p.is_current,
      description: p.description,
    };
  });
}

export type OrganizationDetail = Organization & {
  current_members: Array<{
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    title: string;
    industry: string | null;
  }>;
};

export async function fetchOrganizationBySlug(slug: string): Promise<OrganizationDetail | null> {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) return null;

  const { data: positions } = await supabase
    .from("positions")
    .select("user_id, title, profiles:user_id(display_name, avatar_url, industry)")
    .eq("organization_id", org.id)
    .eq("is_current", true)
    .order("start_date", { ascending: true });

  const members =
    positions?.map((p) => {
      const pr = p.profiles as unknown as { display_name: string; avatar_url: string | null; industry: string | null } | null;
      return {
        user_id: p.user_id,
        display_name: pr?.display_name ?? "Founder",
        avatar_url: pr?.avatar_url ?? null,
        title: p.title,
        industry: pr?.industry ?? null,
      };
    }) ?? [];

  return {
    id: org.id,
    slug: org.slug,
    name: org.name,
    description: org.description,
    website: org.website,
    logo_url: org.logo_url,
    industry: org.industry,
    size_band: org.size_band,
    headquarters: org.headquarters,
    verified: org.verified,
    member_count: org.member_count,
    current_members: members,
  };
}
