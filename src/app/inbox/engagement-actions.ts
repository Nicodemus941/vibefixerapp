"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type Engagement = {
  id: string;
  amount: number;
  platform_fee: number;
  seeker_id: string;
  provider_id: string;
  escrow_status: "held" | "released" | "refunded" | "disputed";
  delivery_due_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export async function fetchEngagementsBetween(
  otherUserId: string,
): Promise<Engagement[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("engagements")
    .select(
      "id, amount, platform_fee, seeker_id, provider_id, escrow_status, delivery_due_at, completed_at, created_at",
    )
    .or(
      `and(seeker_id.eq.${user.id},provider_id.eq.${otherUserId}),and(seeker_id.eq.${otherUserId},provider_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: false });

  return (data ?? []) as Engagement[];
}

export async function startEngagement(input: {
  otherUserId: string;
  amount: number;
  conversationId: string;
  asProvider: boolean;
  deliveryDueAt?: string;
}): Promise<{ error?: string; engagementId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Amount must be a positive number" };
  }

  const { data, error } = await supabase.rpc("start_engagement_for_dm", {
    other_user_id: input.otherUserId,
    amount: input.amount,
    delivery_due_at: input.deliveryDueAt ?? null,
    as_provider: input.asProvider,
  });

  if (error) return { error: error.message };

  // Drop a system message into the thread so both sides see the deal show up.
  const sideLabel = input.asProvider ? "Provider" : "Seeker";
  await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: user.id,
    body: `📑 Deal opened — $${input.amount} (escrow held). ${sideLabel}: ${user.id === input.otherUserId ? "you" : "them"}.`,
  });

  await logEvent("engagement_started", user.id, {
    engagement_id: data,
    amount: input.amount,
    as_provider: input.asProvider,
  });
  revalidatePath(`/inbox/${input.conversationId}`);
  return { engagementId: data as string };
}

export async function markDelivered(
  engagementId: string,
  conversationId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: eng } = await supabase
    .from("engagements")
    .select("id, seeker_id, provider_id, escrow_status, amount")
    .eq("id", engagementId)
    .maybeSingle();

  if (!eng) return { error: "engagement not found" };
  // Only the seeker (the one paying) releases the funds — guards against
  // a provider unilaterally marking their own work delivered.
  if (eng.seeker_id !== user.id) {
    return { error: "Only the seeker can release escrow" };
  }
  if (eng.escrow_status !== "held") {
    return { error: `Already ${eng.escrow_status}` };
  }

  const { error } = await supabase
    .from("engagements")
    .update({
      escrow_status: "released",
      completed_at: new Date().toISOString(),
    })
    .eq("id", engagementId);

  if (error) return { error: error.message };

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: `✅ Escrow released — $${eng.amount} delivered to the provider.`,
  });

  await logEvent("engagement_released", user.id, {
    engagement_id: engagementId,
  });
  revalidatePath(`/inbox/${conversationId}`);
  return {};
}

export async function refundEngagement(
  engagementId: string,
  conversationId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: eng } = await supabase
    .from("engagements")
    .select("id, seeker_id, provider_id, escrow_status, amount")
    .eq("id", engagementId)
    .maybeSingle();
  if (!eng) return { error: "engagement not found" };
  if (eng.escrow_status !== "held") {
    return { error: `Cannot refund — status is ${eng.escrow_status}` };
  }
  // Either side can refund a held engagement (mutual cancellation).
  if (eng.seeker_id !== user.id && eng.provider_id !== user.id) {
    return { error: "not a participant" };
  }

  const { error } = await supabase
    .from("engagements")
    .update({ escrow_status: "refunded", completed_at: new Date().toISOString() })
    .eq("id", engagementId);
  if (error) return { error: error.message };

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: `↩️ Deal refunded — $${eng.amount} returned to the seeker.`,
  });

  await logEvent("engagement_refunded", user.id, { engagement_id: engagementId });
  revalidatePath(`/inbox/${conversationId}`);
  return {};
}
