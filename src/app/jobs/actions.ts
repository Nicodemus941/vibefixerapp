"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embed } from "@/lib/embeddings";
import { logEvent } from "@/lib/platform-events";

export type JobMatch = {
  id: string;
  poster_id: string;
  organization_id: string | null;
  organization_slug: string | null;
  organization_name: string | null;
  organization_logo_url: string | null;
  title: string;
  description: string;
  employment_type: string;
  remote_policy: string;
  location: string | null;
  compensation_min: number | null;
  compensation_max: number | null;
  compensation_period: string | null;
  currency: string;
  application_url: string | null;
  application_email: string | null;
  created_at: string;
  similarity: number | null;
};

export type JobDetail = JobMatch & {
  status: string;
  expires_at: string | null;
};

export async function createJobListing(input: {
  organizationId: string | null;
  title: string;
  description: string;
  employmentType: "full_time" | "part_time" | "contract" | "internship" | "volunteer";
  remotePolicy: "remote" | "hybrid" | "onsite";
  location: string | null;
  compensationMin: number | null;
  compensationMax: number | null;
  compensationPeriod: "hour" | "month" | "year" | "project" | null;
  currency: string;
  applicationUrl: string | null;
  applicationEmail: string | null;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) return { error: "Title is required." };
  if (description.length < 10) return { error: "Add a real description." };
  if (!input.applicationUrl && !input.applicationEmail) {
    return { error: "Add an application URL or email so people can apply." };
  }
  if (
    input.compensationMax != null &&
    input.compensationMin != null &&
    input.compensationMax < input.compensationMin
  ) {
    return { error: "Max compensation can't be less than min." };
  }

  let embedding: string | null = null;
  try {
    embedding = await embed(`${title}\n${description}`);
  } catch {
    embedding = null;
  }

  // Use admin client so the embedding column write isn't blocked by RLS.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_listings")
    .insert({
      poster_id: user.id,
      organization_id: input.organizationId,
      title,
      description,
      employment_type: input.employmentType,
      remote_policy: input.remotePolicy,
      location: input.location?.trim() || null,
      compensation_min: input.compensationMin,
      compensation_max: input.compensationMax,
      compensation_period: input.compensationPeriod,
      currency: input.currency,
      application_url: input.applicationUrl?.trim() || null,
      application_email: input.applicationEmail?.trim() || null,
      embedding,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await logEvent("job_listing_created", user.id, { id: data.id });
  revalidatePath("/jobs");
  if (input.organizationId) {
    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", input.organizationId)
      .maybeSingle();
    if (org?.slug) revalidatePath(`/o/${org.slug}`);
  }
  return { id: data.id };
}

export async function createJobListingForm(formData: FormData): Promise<void> {
  const orgId = String(formData.get("organization_id") ?? "");
  const result = await createJobListing({
    organizationId: orgId || null,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    employmentType: (String(formData.get("employment_type") ?? "full_time") as "full_time"
      | "part_time"
      | "contract"
      | "internship"
      | "volunteer"),
    remotePolicy: (String(formData.get("remote_policy") ?? "remote") as "remote" | "hybrid" | "onsite"),
    location: String(formData.get("location") ?? "") || null,
    compensationMin: parseNumber(formData.get("compensation_min")),
    compensationMax: parseNumber(formData.get("compensation_max")),
    compensationPeriod: (String(formData.get("compensation_period") ?? "") || null) as "hour" | "month" | "year" | "project" | null,
    currency: String(formData.get("currency") ?? "USD") || "USD",
    applicationUrl: String(formData.get("application_url") ?? "") || null,
    applicationEmail: String(formData.get("application_email") ?? "") || null,
  });
  if (result.id) redirect(`/jobs/${result.id}`);
  if (result.error) redirect(`/jobs/new?error=${encodeURIComponent(result.error)}`);
}

function parseNumber(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export type JobFilters = {
  employmentType?: string | null;
  remotePolicy?: string | null;
};

function applyFilters(jobs: JobMatch[], filters: JobFilters): JobMatch[] {
  return jobs.filter((j) => {
    if (filters.employmentType && j.employment_type !== filters.employmentType) return false;
    if (filters.remotePolicy && j.remote_policy !== filters.remotePolicy) return false;
    return true;
  });
}

export async function fetchJobMatches(limit = 30, filters: JobFilters = {}): Promise<JobMatch[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated viewer: rank by similarity to their needs embedding.
  // Filtering is applied in memory after the embedding rank because the
  // RPC doesn't take filter args — fine at this scale (<= 60 rows).
  if (user) {
    const { data, error } = await supabase.rpc("match_jobs_for_user", {
      viewer_id: user.id,
      limit_count: limit * 2,
    });
    if (error) return [];
    const rows = (data ?? []) as JobMatch[];
    return applyFilters(rows, filters).slice(0, limit);
  }

  // Anonymous visitor: open jobs by recency, no personalization.
  let query = supabase
    .from("job_listings")
    .select(
      `id, poster_id, organization_id, title, description, employment_type, remote_policy,
       location, compensation_min, compensation_max, compensation_period, currency,
       application_url, application_email, created_at,
       organizations:organization_id(slug, name, logo_url)`,
    )
    .eq("status", "open")
    .or("expires_at.is.null,expires_at.gt.now()");
  if (filters.employmentType) query = query.eq("employment_type", filters.employmentType);
  if (filters.remotePolicy) query = query.eq("remote_policy", filters.remotePolicy);
  const { data } = await query
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((row) => {
    const org = row.organizations as unknown as
      | { slug: string; name: string; logo_url: string | null }
      | null;
    return {
      id: row.id,
      poster_id: row.poster_id,
      organization_id: row.organization_id,
      organization_slug: org?.slug ?? null,
      organization_name: org?.name ?? null,
      organization_logo_url: org?.logo_url ?? null,
      title: row.title,
      description: row.description,
      employment_type: row.employment_type,
      remote_policy: row.remote_policy,
      location: row.location,
      compensation_min: row.compensation_min,
      compensation_max: row.compensation_max,
      compensation_period: row.compensation_period,
      currency: row.currency,
      application_url: row.application_url,
      application_email: row.application_email,
      created_at: row.created_at as string,
      similarity: null,
    };
  });
}

export async function fetchJobListing(id: string): Promise<JobDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_listings")
    .select(
      `id, poster_id, organization_id, title, description, employment_type, remote_policy,
       location, compensation_min, compensation_max, compensation_period, currency,
       application_url, application_email, created_at, status, expires_at,
       organizations:organization_id(slug, name, logo_url)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const org = data.organizations as unknown as
    | { slug: string; name: string; logo_url: string | null }
    | null;
  return {
    id: data.id,
    poster_id: data.poster_id,
    organization_id: data.organization_id,
    organization_slug: org?.slug ?? null,
    organization_name: org?.name ?? null,
    organization_logo_url: org?.logo_url ?? null,
    title: data.title,
    description: data.description,
    employment_type: data.employment_type,
    remote_policy: data.remote_policy,
    location: data.location,
    compensation_min: data.compensation_min,
    compensation_max: data.compensation_max,
    compensation_period: data.compensation_period,
    currency: data.currency,
    application_url: data.application_url,
    application_email: data.application_email,
    created_at: data.created_at as string,
    similarity: null,
    status: data.status,
    expires_at: data.expires_at as string | null,
  };
}

export async function closeJobListing(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase
    .from("job_listings")
    .update({ status: "closed" })
    .eq("id", id)
    .eq("poster_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  return {};
}
