"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type DisputeRow = {
  id: string;
  engagement_id: string;
  opener_id: string;
  reason: string;
  status: "open" | "resolved_for_seeker" | "resolved_for_provider" | "withdrawn";
  resolution_note: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
};

export async function fetchDisputeForEngagement(
  engagementId: string,
): Promise<DisputeRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("disputes")
    .select(
      "id, engagement_id, opener_id, reason, status, resolution_note, resolved_by, created_at, resolved_at",
    )
    .eq("engagement_id", engagementId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DisputeRow | null) ?? null;
}

export async function openDispute(input: {
  engagementId: string;
  reason: string;
  conversationId: string;
}): Promise<{ error?: string; disputeId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };
  if (!input.reason.trim()) return { error: "Explain the issue." };
  if (input.reason.length > 4000)
    return { error: "Keep it under 4000 chars." };

  const { data, error } = await supabase
    .from("disputes")
    .insert({
      engagement_id: input.engagementId,
      opener_id: user.id,
      reason: input.reason.trim(),
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: user.id,
    body: `⚠️ Dispute opened on deal $${input.engagementId.slice(0, 8)}…`,
  });

  await logEvent("dispute_opened", user.id, {
    engagement_id: input.engagementId,
    dispute_id: data.id,
  });
  revalidatePath(`/inbox/${input.conversationId}`);
  return { disputeId: data.id };
}

export async function withdrawDispute(input: {
  disputeId: string;
  conversationId: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase
    .from("disputes")
    .update({ status: "withdrawn", resolved_at: new Date().toISOString() })
    .eq("id", input.disputeId)
    .eq("opener_id", user.id);
  if (error) return { error: error.message };

  await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: user.id,
    body: `↩️ Dispute withdrawn.`,
  });

  revalidatePath(`/inbox/${input.conversationId}`);
  return {};
}

export async function fetchOpenDisputes(): Promise<
  Array<{
    id: string;
    engagement_id: string;
    opener_id: string;
    opener_name: string;
    reason: string;
    amount: number;
    seeker_id: string;
    provider_id: string;
    created_at: string;
  }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "owner" && me?.role !== "admin") return [];

  const { data: disputes } = await supabase
    .from("disputes")
    .select("id, engagement_id, opener_id, reason, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (!disputes || disputes.length === 0) return [];

  const engIds = disputes.map((d) => d.engagement_id);
  const openerIds = Array.from(new Set(disputes.map((d) => d.opener_id)));
  const [{ data: engs }, { data: profiles }] = await Promise.all([
    supabase
      .from("engagements")
      .select("id, amount, seeker_id, provider_id")
      .in("id", engIds),
    supabase.from("profiles").select("id, display_name").in("id", openerIds),
  ]);
  const eMap = new Map((engs ?? []).map((e) => [e.id, e]));
  const pMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return disputes.map((d) => {
    const e = eMap.get(d.engagement_id);
    return {
      id: d.id,
      engagement_id: d.engagement_id,
      opener_id: d.opener_id,
      opener_name: pMap.get(d.opener_id) ?? "Unknown",
      reason: d.reason,
      amount: Number(e?.amount ?? 0),
      seeker_id: e?.seeker_id ?? "",
      provider_id: e?.provider_id ?? "",
      created_at: d.created_at as string,
    };
  });
}

export async function resolveDispute(input: {
  disputeId: string;
  decision: "resolved_for_seeker" | "resolved_for_provider";
  note: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "owner" && me?.role !== "admin") return { error: "admin only" };

  const { error } = await supabase
    .from("disputes")
    .update({
      status: input.decision,
      resolution_note: input.note.trim() || null,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", input.disputeId);
  if (error) return { error: error.message };

  await logEvent("dispute_resolved", user.id, {
    dispute_id: input.disputeId,
    decision: input.decision,
  });
  revalidatePath("/admin/disputes");
  return {};
}
