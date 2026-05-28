"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logEvent } from "@/lib/platform-events";
import { rerankMatch, type RerankInput } from "@/lib/claude-rerank";

export type PendingMatch = {
  id: string;
  role: "seeker" | "provider";
  match_score: number;
  created_at: string;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_company: string | null;
  counterparty_industry: string | null;
  need_id: string;
  need_title: string;
  need_urgency: string | null;
  offer_id: string;
  offer_title: string;
  offer_category: string;
  seeker_status: string | null;
  provider_status: string | null;
  ai_intro_draft: string | null;
  ai_rationale: string | null;
  ai_reranked_at: string | null;
};

export async function fetchMyMatches(): Promise<PendingMatch[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("pending_matches_for", {
    viewer_id: user.id,
  });
  if (error || !data) return [];
  return data as PendingMatch[];
}

export async function passMatch(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: m } = await supabase
    .from("matches")
    .select("id, seeker_id, provider_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!m) return;

  const sideField =
    m.seeker_id === user.id
      ? { seeker_status: "passed" as const }
      : m.provider_id === user.id
      ? { provider_status: "passed" as const }
      : null;
  if (!sideField) return;

  await supabase.from("matches").update(sideField).eq("id", matchId);
  await logEvent("match_passed", user.id, { match_id: matchId });
  revalidatePath("/matches");
}

export async function acceptMatch(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: m } = await supabase
    .from("matches")
    .select("id, seeker_id, provider_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!m) redirect("/matches");

  const otherId = m.seeker_id === user.id ? m.provider_id : m.seeker_id;
  const sideField =
    m.seeker_id === user.id
      ? { seeker_status: "accepted" as const }
      : { provider_status: "accepted" as const };

  await supabase.from("matches").update(sideField).eq("id", matchId);

  const { data: convId } = await supabase.rpc("start_or_get_dm", {
    other_user_id: otherId,
    conv_origin: "match",
  });

  await logEvent("match_accepted", user.id, { match_id: matchId });

  if (convId) redirect(`/inbox/${convId}`);
  redirect("/inbox");
}

export async function runMatcherNowForm(): Promise<void> {
  await runMatcherNow();
}

// Score-weighted blend of the embedding similarity (already in match_score)
// and Claude's rubric score. Embeddings get 40%, Claude 60% — Claude knows
// stage/budget/urgency/reciprocity context the cosine distance can't see.
function blendScores(embeddingScore: number, claudeScore: number): number {
  return Math.round(embeddingScore * 0.4 + claudeScore * 0.6);
}

export async function rerankPendingMatchesNow(): Promise<{
  reranked: number;
  failed: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { reranked: 0, failed: 0, error: "not signed in" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { reranked: 0, failed: 0, error: "owner only" };
  }

  const admin = createAdminClient();

  const { data: matches, error: matchErr } = await admin
    .from("matches")
    .select("id, need_id, offer_id, seeker_id, provider_id, match_score")
    .is("ai_reranked_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (matchErr) return { reranked: 0, failed: 0, error: matchErr.message };
  if (!matches || matches.length === 0) return { reranked: 0, failed: 0 };

  const needIds = Array.from(new Set(matches.map((m) => m.need_id)));
  const offerIds = Array.from(new Set(matches.map((m) => m.offer_id)));
  const profileIds = Array.from(
    new Set(matches.flatMap((m) => [m.seeker_id, m.provider_id])),
  );

  const [{ data: needs }, { data: offers }, { data: profiles }] = await Promise.all([
    admin
      .from("needs")
      .select("id, title, description, category, budget_min, budget_max, urgency")
      .in("id", needIds),
    admin
      .from("offers")
      .select("id, title, description, category, price_min, price_max, pricing_model")
      .in("id", offerIds),
    admin
      .from("profiles")
      .select("id, display_name, company_name, industry, bio, revenue_band")
      .in("id", profileIds),
  ]);

  const needMap = new Map((needs ?? []).map((n) => [n.id, n]));
  const offerMap = new Map((offers ?? []).map((o) => [o.id, o]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let reranked = 0;
  let failed = 0;

  // Sequential — keeps the system-prompt cache hot on subsequent requests
  // and avoids fanning out parallel API calls before the first one has
  // written the cache.
  for (const m of matches) {
    const need = needMap.get(m.need_id);
    const offer = offerMap.get(m.offer_id);
    const seeker = profileMap.get(m.seeker_id);
    const provider = profileMap.get(m.provider_id);
    if (!need || !offer || !seeker || !provider) {
      failed += 1;
      continue;
    }

    const embeddingScore = Number(m.match_score) / 100;
    const input: RerankInput = {
      seeker: {
        name: seeker.display_name,
        company: seeker.company_name,
        industry: seeker.industry,
        bio: seeker.bio,
        revenueBand: seeker.revenue_band,
      },
      provider: {
        name: provider.display_name,
        company: provider.company_name,
        industry: provider.industry,
        bio: provider.bio,
        revenueBand: provider.revenue_band,
      },
      need: {
        title: need.title,
        description: need.description,
        category: need.category,
        budgetMin: need.budget_min,
        budgetMax: need.budget_max,
        urgency: need.urgency,
      },
      offer: {
        title: offer.title,
        description: offer.description,
        category: offer.category,
        priceMin: offer.price_min,
        priceMax: offer.price_max,
        pricingModel: offer.pricing_model,
      },
      embeddingScore,
    };

    const result = await rerankMatch(input);
    if (!result) {
      failed += 1;
      continue;
    }

    const blended = blendScores(Number(m.match_score), result.score);
    const { error: updateErr } = await admin
      .from("matches")
      .update({
        match_score: blended,
        ai_intro_draft: result.draftIntro,
        ai_rationale: result.rationale,
        ai_model: result.model,
        ai_reranked_at: new Date().toISOString(),
      })
      .eq("id", m.id);
    if (updateErr) failed += 1;
    else reranked += 1;
  }

  await logEvent("matches_reranked", user.id, { reranked, failed });
  revalidatePath("/matches");
  return { reranked, failed };
}

export async function rerankPendingMatchesForm(): Promise<void> {
  await rerankPendingMatchesNow();
}

export async function runMatcherNow(): Promise<{ inserted: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { inserted: 0, error: "not signed in" };

  // Owner-only escape hatch — fire the daily matcher on demand.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "owner" && profile?.role !== "admin") {
    return { inserted: 0, error: "owner only" };
  }

  const { data, error } = await supabase.rpc("run_daily_matcher");
  if (error) return { inserted: 0, error: error.message };
  await logEvent("matcher_run_manual", user.id, { inserted: data ?? 0 });
  revalidatePath("/matches");
  return { inserted: data ?? 0 };
}
