"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

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
