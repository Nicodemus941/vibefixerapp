import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// These actions are intentionally NOT marked "use server" — they're
// only called from server components that render publicly readable
// pages (/discover, /c/[userId]). They use the admin client so the
// fetch works without an auth context, but they project to a strict
// allowlist of fields. The profiles table's RLS stays authenticated-
// only; sensitive fields (revenue_band, notification_prefs, stripe
// account info, email) never leave the server.

export type PublicProviderCard = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  industry: string | null;
  bio: string | null;
  company_name: string | null;
  current_position_title: string | null;
  current_position_org_slug: string | null;
  current_position_org_name: string | null;
  reputation_score: number;
  review_count: number;
  offers: Array<{
    id: string;
    title: string;
    category: string;
    price_min: number | null;
    price_max: number | null;
    pricing_model: string | null;
  }>;
};

const SAFE_OFFER_COLS = "id, user_id, title, description, category, price_min, price_max, pricing_model";

// Public listing. Filterable by industry (profile) + category (offer).
// Returns one card per provider with their active offers grouped in.
export async function fetchPublicProviders(opts: {
  industry?: string | null;
  category?: string | null;
  limit?: number;
}): Promise<PublicProviderCard[]> {
  const admin = createAdminClient();
  const limit = opts.limit ?? 30;

  // Find user_ids with at least one active offer matching the optional
  // category filter, then resolve profiles separately so we can apply
  // the industry filter on profiles without giving up the offer join.
  let offerQuery = admin
    .from("offers")
    .select(SAFE_OFFER_COLS)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (opts.category) offerQuery = offerQuery.eq("category", opts.category);
  const { data: rawOffers } = await offerQuery.limit(500);
  if (!rawOffers || rawOffers.length === 0) return [];

  const userIds = Array.from(new Set(rawOffers.map((o) => o.user_id)));

  let profilesQuery = admin
    .from("profiles")
    .select(
      "id, display_name, avatar_url, industry, bio, company_name, reputation_score",
    )
    .in("id", userIds)
    .eq("onboarding_complete", true);
  if (opts.industry) profilesQuery = profilesQuery.eq("industry", opts.industry);
  const { data: profiles } = await profilesQuery;
  if (!profiles || profiles.length === 0) return [];

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const offersByUser = new Map<string, typeof rawOffers>();
  for (const o of rawOffers) {
    if (!profileById.has(o.user_id)) continue;
    if (!offersByUser.has(o.user_id)) offersByUser.set(o.user_id, []);
    offersByUser.get(o.user_id)!.push(o);
  }

  // Resolve current position (one position with is_current per user)
  const { data: positions } = await admin
    .from("positions")
    .select("user_id, title, organization_id, organizations:organization_id(slug, name)")
    .in("user_id", Array.from(offersByUser.keys()))
    .eq("is_current", true);
  const positionByUser = new Map<string, { title: string; slug: string | null; name: string | null }>();
  for (const p of positions ?? []) {
    if (positionByUser.has(p.user_id)) continue; // first current position wins
    const org = p.organizations as unknown as { slug: string; name: string } | null;
    positionByUser.set(p.user_id, { title: p.title, slug: org?.slug ?? null, name: org?.name ?? null });
  }

  // Review counts per user (single round-trip aggregate)
  const reviewCounts = new Map<string, number>();
  const { data: reviewRows } = await admin
    .from("reviews")
    .select("reviewee_id")
    .in("reviewee_id", Array.from(offersByUser.keys()));
  for (const r of reviewRows ?? []) {
    reviewCounts.set(r.reviewee_id, (reviewCounts.get(r.reviewee_id) ?? 0) + 1);
  }

  const cards: PublicProviderCard[] = [];
  for (const [userId, offers] of offersByUser) {
    const profile = profileById.get(userId);
    if (!profile) continue;
    const pos = positionByUser.get(userId);
    cards.push({
      user_id: userId,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      industry: profile.industry,
      bio: profile.bio,
      company_name: profile.company_name,
      current_position_title: pos?.title ?? null,
      current_position_org_slug: pos?.slug ?? null,
      current_position_org_name: pos?.name ?? null,
      reputation_score: Number(profile.reputation_score ?? 0),
      review_count: reviewCounts.get(userId) ?? 0,
      offers: offers.slice(0, 3).map((o) => ({
        id: o.id,
        title: o.title,
        category: o.category,
        price_min: o.price_min,
        price_max: o.price_max,
        pricing_model: o.pricing_model,
      })),
    });
  }

  // Rank: most reviews first, then highest reputation, then most recent offer
  cards.sort((a, b) =>
    b.review_count - a.review_count ||
    b.reputation_score - a.reputation_score,
  );
  return cards.slice(0, limit);
}

export async function fetchPublicProvider(userId: string): Promise<PublicProviderCard | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select(
      "id, display_name, avatar_url, industry, bio, company_name, reputation_score, onboarding_complete",
    )
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !profile.onboarding_complete) return null;

  const { data: offers } = await admin
    .from("offers")
    .select(SAFE_OFFER_COLS)
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: position } = await admin
    .from("positions")
    .select("title, organizations:organization_id(slug, name)")
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: reviewCount } = await admin
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewee_id", userId);

  const org = position?.organizations as unknown as { slug: string; name: string } | null;
  return {
    user_id: userId,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    industry: profile.industry,
    bio: profile.bio,
    company_name: profile.company_name,
    current_position_title: position?.title ?? null,
    current_position_org_slug: org?.slug ?? null,
    current_position_org_name: org?.name ?? null,
    reputation_score: Number(profile.reputation_score ?? 0),
    review_count: reviewCount ?? 0,
    offers: (offers ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      category: o.category,
      price_min: o.price_min,
      price_max: o.price_max,
      pricing_model: o.pricing_model,
    })),
  };
}
