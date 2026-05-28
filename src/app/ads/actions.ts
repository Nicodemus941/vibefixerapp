"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type SponsoredCard = {
  id: string;
  sponsor_id: string;
  organization_id: string | null;
  organization_slug: string | null;
  organization_name: string | null;
  organization_logo_url: string | null;
  headline: string;
  body: string;
  creative_url: string | null;
  cta_label: string;
  target_url: string;
};

export type AdSummary = {
  id: string;
  headline: string;
  status: string;
  impressions: number;
  clicks: number;
  budget_total_cents: number;
  budget_spent_cents: number;
  cost_per_impression_cents: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export async function createAd(input: {
  organizationId: string | null;
  headline: string;
  body: string;
  ctaLabel: string;
  targetUrl: string;
  creativeUrl: string | null;
  targetIndustries: string[];
  targetRevenueBands: string[];
  budgetDollars: number;
  costPerImpressionCents: number;
  startsAt: string | null;
  endsAt: string | null;
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!input.headline.trim()) return { error: "Headline is required." };
  if (!input.body.trim()) return { error: "Body is required." };
  if (!/^https?:\/\//.test(input.targetUrl)) return { error: "Target URL must start with http(s)://" };
  if (input.budgetDollars <= 0) return { error: "Budget must be greater than $0." };

  const budgetCents = Math.round(input.budgetDollars * 100);

  const { data, error } = await supabase
    .from("advertisements")
    .insert({
      sponsor_id: user.id,
      organization_id: input.organizationId,
      headline: input.headline.trim(),
      body: input.body.trim(),
      cta_label: input.ctaLabel.trim() || "Learn more",
      target_url: input.targetUrl.trim(),
      creative_url: input.creativeUrl?.trim() || null,
      target_industries: input.targetIndustries.length ? input.targetIndustries : null,
      target_revenue_bands: input.targetRevenueBands.length ? input.targetRevenueBands : null,
      budget_total_cents: budgetCents,
      cost_per_impression_cents: input.costPerImpressionCents,
      status: "draft",
      starts_at: input.startsAt,
      ends_at: input.endsAt,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await logEvent("ad_created", user.id, { id: data.id, budget_cents: budgetCents });
  revalidatePath("/ads");
  return { id: data.id };
}

export async function createAdForm(formData: FormData): Promise<void> {
  const industries = formData.getAll("target_industries").map(String).filter(Boolean);
  const revenueBands = formData.getAll("target_revenue_bands").map(String).filter(Boolean);
  const result = await createAd({
    organizationId: String(formData.get("organization_id") ?? "") || null,
    headline: String(formData.get("headline") ?? ""),
    body: String(formData.get("body") ?? ""),
    ctaLabel: String(formData.get("cta_label") ?? "Learn more"),
    targetUrl: String(formData.get("target_url") ?? ""),
    creativeUrl: String(formData.get("creative_url") ?? "") || null,
    targetIndustries: industries,
    targetRevenueBands: revenueBands,
    budgetDollars: Number(formData.get("budget_dollars") ?? 0),
    costPerImpressionCents: Number(formData.get("cost_per_impression_cents") ?? 1),
    startsAt: String(formData.get("starts_at") ?? "") || null,
    endsAt: String(formData.get("ends_at") ?? "") || null,
  });
  if (result.id) redirect(`/ads/${result.id}`);
  if (result.error) redirect(`/ads/new?error=${encodeURIComponent(result.error)}`);
}

export async function setAdStatus(
  id: string,
  status: "active" | "paused" | "archived",
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("advertisements")
    .update({ status })
    .eq("id", id)
    .eq("sponsor_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/ads");
  revalidatePath(`/ads/${id}`);
  return {};
}

export async function setAdStatusForm(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as "active" | "paused" | "archived";
  if (!id || !["active", "paused", "archived"].includes(status)) return;
  await setAdStatus(id, status);
}

export async function fetchMyAds(): Promise<AdSummary[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("advertisements")
    .select(
      "id, headline, status, impressions, clicks, budget_total_cents, budget_spent_cents, cost_per_impression_cents, starts_at, ends_at, created_at",
    )
    .eq("sponsor_id", user.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as AdSummary[];
}

export async function pickSponsoredCard(): Promise<SponsoredCard | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("pick_ad_for_viewer", {
    viewer_id: user.id,
  });
  if (error || !data || data.length === 0) return null;
  const ad = data[0];

  // Fire impression event (RLS allows authenticated insert with own viewer_id).
  // Don't await — race the render. The trigger handles dedupe of the
  // budget consequence at the row level.
  void supabase.from("ad_events").insert({
    ad_id: ad.id,
    viewer_id: user.id,
    event_type: "impression",
  });

  return ad as SponsoredCard;
}

export async function recordAdClick(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("ad_events").insert({
    ad_id: id,
    viewer_id: user?.id ?? null,
    event_type: "click",
  });
}
