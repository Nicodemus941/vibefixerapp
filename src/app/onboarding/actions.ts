"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedBatch } from "@/lib/embeddings";
import { logEvent } from "@/lib/platform-events";

export type ProfilePayload = {
  display_name: string;
  company_name: string;
  company_url: string;
  industry: string;
  revenue_band: string;
};

export type OfferPayload = {
  title: string;
  description: string;
  category: string;
  price_min: number | null;
  price_max: number | null;
  pricing_model: string;
};

export type NeedPayload = {
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  urgency: string;
};

const REVENUE_BANDS = [
  "pre-revenue",
  "0-10k",
  "10k-100k",
  "100k-1m",
  "1m-10m",
  "10m+",
];
const PRICING_MODELS = ["hourly", "fixed", "retainer", "equity", "revshare"];
const URGENCIES = ["now", "this_week", "this_month", "exploratory"];

function validateProfile(p: ProfilePayload): string | null {
  if (!p.display_name?.trim()) return "Display name is required";
  if (!p.industry?.trim()) return "Industry is required";
  if (!REVENUE_BANDS.includes(p.revenue_band)) return "Invalid revenue band";
  return null;
}

function validateOffer(o: OfferPayload, i: number): string | null {
  if (!o.title?.trim()) return `Offer ${i + 1}: title is required`;
  if (!o.description?.trim()) return `Offer ${i + 1}: description is required`;
  if (!o.category?.trim()) return `Offer ${i + 1}: category is required`;
  if (!PRICING_MODELS.includes(o.pricing_model))
    return `Offer ${i + 1}: invalid pricing model`;
  return null;
}

function validateNeed(n: NeedPayload, i: number): string | null {
  if (!n.title?.trim()) return `Need ${i + 1}: title is required`;
  if (!n.description?.trim()) return `Need ${i + 1}: description is required`;
  if (!n.category?.trim()) return `Need ${i + 1}: category is required`;
  if (!URGENCIES.includes(n.urgency)) return `Need ${i + 1}: invalid urgency`;
  return null;
}

export async function completeOnboarding(input: {
  profile: ProfilePayload;
  offers: OfferPayload[];
  needs: NeedPayload[];
}): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { profile, offers, needs } = input;

  const profileError = validateProfile(profile);
  if (profileError) return { error: profileError };

  if (offers.length < 1 || offers.length > 3) {
    return { error: "Provide between 1 and 3 offers" };
  }
  if (needs.length < 1 || needs.length > 3) {
    return { error: "Provide between 1 and 3 needs" };
  }
  for (let i = 0; i < offers.length; i++) {
    const err = validateOffer(offers[i], i);
    if (err) return { error: err };
  }
  for (let i = 0; i < needs.length; i++) {
    const err = validateNeed(needs[i], i);
    if (err) return { error: err };
  }

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      display_name: profile.display_name.trim(),
      company_name: profile.company_name.trim() || null,
      company_url: profile.company_url.trim() || null,
      industry: profile.industry.trim(),
      revenue_band: profile.revenue_band,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    return { error: `Profile save failed: ${profileUpdateError.message}` };
  }

  // Embed offers and needs in a single batch call for efficiency.
  const offerTexts = offers.map(
    (o) => `${o.title}\n${o.description}\nCategory: ${o.category}`,
  );
  const needTexts = needs.map(
    (n) => `${n.title}\n${n.description}\nCategory: ${n.category}`,
  );

  let embeddings: string[];
  try {
    embeddings = await embedBatch([...offerTexts, ...needTexts]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown embedding error";
    return { error: `Embedding generation failed: ${msg}` };
  }

  const offerEmbeddings = embeddings.slice(0, offers.length);
  const needEmbeddings = embeddings.slice(offers.length);

  // Admin client: embeddings are a server-only column and RLS doesn't permit
  // direct writes from the user. Insert via service role.
  const admin = createAdminClient();

  const offerRows = offers.map((o, i) => ({
    user_id: user.id,
    title: o.title.trim(),
    description: o.description.trim(),
    category: o.category.trim(),
    price_min: o.price_min,
    price_max: o.price_max,
    pricing_model: o.pricing_model,
    embedding: offerEmbeddings[i],
  }));
  const { error: offerInsertError } = await admin.from("offers").insert(offerRows);
  if (offerInsertError) {
    return { error: `Offer save failed: ${offerInsertError.message}` };
  }

  const needRows = needs.map((n, i) => ({
    user_id: user.id,
    title: n.title.trim(),
    description: n.description.trim(),
    category: n.category.trim(),
    budget_min: n.budget_min,
    budget_max: n.budget_max,
    urgency: n.urgency,
    embedding: needEmbeddings[i],
  }));
  const { error: needInsertError } = await admin.from("needs").insert(needRows);
  if (needInsertError) {
    return { error: `Need save failed: ${needInsertError.message}` };
  }

  const { error: completeError } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  if (completeError) {
    return { error: `Could not mark onboarding complete: ${completeError.message}` };
  }

  await logEvent("onboarding_completed", user.id, {
    offers_count: offers.length,
    needs_count: needs.length,
  });

  redirect("/feed");
}
