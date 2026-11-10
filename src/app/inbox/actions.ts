"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";
import { composeColdMessage, friendlyMessageError, validateHelpLine } from "@/lib/cold-dm";
import { createAdminClient } from "@/lib/supabase/admin";
import { turnstileEnabled, verifyTurnstile } from "@/lib/turnstile";

type Supa = Awaited<ReturnType<typeof createClient>>;

// Turnstile runs once, before a member's first message ever. True when this
// member still needs it (and Turnstile is configured).
async function needsHumanCheck(supabase: Supa, userId: string): Promise<boolean> {
  if (!turnstileEnabled()) return false;
  const [{ data: verified }, { count }] = await Promise.all([
    supabase.from("human_verifications").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", userId),
  ]);
  return !verified && (count ?? 0) === 0;
}

export async function fetchNeedsHumanCheck(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  return needsHumanCheck(supabase, user.id);
}

export async function startDmAndRedirect(otherUserId: string, origin: "post" | "profile" = "post") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.id === otherUserId) redirect("/feed");

  const { data, error } = await supabase.rpc("start_or_get_dm", {
    other_user_id: otherUserId,
    conv_origin: origin,
  });

  if (error || !data) {
    redirect(`/feed?dm_error=${encodeURIComponent(error?.message ?? "unknown")}`);
  }

  await logEvent("dm_started", user.id, { other_user_id: otherUserId, origin });
  redirect(`/inbox/${data}`);
}

// "I can help" on a need: opens the DM with its author and records the
// offer of help (it counts toward Most helpful once they reply).
export async function offerHelpAndRedirect(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/p/${postId}`);

  const { data, error } = await supabase.rpc("offer_help", { target_post: postId });
  if (error || !data) {
    redirect(`/feed?dm_error=${encodeURIComponent(error?.message ?? "That need is no longer available.")}`);
  }
  await logEvent("help_offered", user.id, { post_id: postId });
  redirect(`/inbox/${data}?help=${postId}`);
}

export async function sendMessage(formData: FormData): Promise<{ error?: string }> {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const helpLine = String(formData.get("help_line") ?? "");
  const rest = String(formData.get("body") ?? "").trim();
  const offerId = String(formData.get("offer_id") ?? "") || null;
  if (!conversationId) return { error: "That conversation no longer exists." };

  // Cold DMs open with how the sender can help. The database checks the
  // same rule; checking here first gives a friendlier message.
  let body = rest;
  if (formData.has("help_line")) {
    const problem = validateHelpLine(helpLine);
    if (problem) return { error: problem };
    body = composeColdMessage(helpLine, rest);
  }
  if (!body) return { error: "Write a message first." };
  if (body.length > 4000) return { error: "Keep messages under 4000 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to send messages." };

  if (await needsHumanCheck(supabase, user.id)) {
    const check = await verifyTurnstile(String(formData.get("turnstile_token") ?? "") || null);
    if (!check.ok) return { error: check.error };
    if (!check.skipped) {
      await createAdminClient()
        .from("human_verifications")
        .upsert({ user_id: user.id, method: "turnstile" }, { onConflict: "user_id" });
    }
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
    offer_id: offerId,
  });

  if (error) return { error: friendlyMessageError(error.message) };

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
  return {};
}

export type DmStatus = {
  isCold: boolean;
  hasOffer: boolean;
  coldLeftToday: number;
  topOffer: { id: string; title: string; category: string } | null;
};

// What the composer needs before the first message to someone new. Null
// when the pair already talked, or the migration is not applied yet.
export async function fetchDmStatus(otherUserId: string): Promise<DmStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data, error }, { data: offer }] = await Promise.all([
    supabase.rpc("viewer_dm_status", { other: otherUserId }),
    supabase
      .from("offers")
      .select("id, title, category")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    isCold: row.is_cold === true,
    hasOffer: row.has_offer === true,
    coldLeftToday: Number(row.cold_left_today ?? 0),
    topOffer: offer ?? null,
  };
}

export type InboxRow = {
  id: string;
  origin: string;
  last_message_at: string | null;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_company: string | null;
  counterparty_avatar_url: string | null;
  preview: string | null;
  preview_sender_is_me: boolean;
  /** Most recent deal with this person, if any. */
  deal: { status: string; amount: number } | null;
};

export async function fetchInbox(): Promise<InboxRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, origin, last_message_at, participant_a, participant_b")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (!convs || convs.length === 0) return [];

  const counterpartyIds = convs.map((c) =>
    c.participant_a === user.id ? c.participant_b : c.participant_a,
  );

  const [{ data: profiles }, { data: previews }, { data: deals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, company_name, avatar_url")
      .in("id", counterpartyIds),
    supabase
      .from("messages")
      .select("conversation_id, body, sender_id, created_at")
      .in(
        "conversation_id",
        convs.map((c) => c.id),
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("engagements")
      .select("seeker_id, provider_id, amount, escrow_status, created_at")
      .or(`seeker_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  // Latest deal per counterparty (engagements are per pair, not per thread).
  const dealMap = new Map<string, { status: string; amount: number }>();
  for (const d of deals ?? []) {
    const other = d.seeker_id === user.id ? d.provider_id : d.seeker_id;
    if (!dealMap.has(other)) {
      dealMap.set(other, { status: d.escrow_status ?? "held", amount: Number(d.amount) });
    }
  }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const previewMap = new Map<string, { body: string; sender_id: string }>();
  for (const m of previews ?? []) {
    if (!previewMap.has(m.conversation_id)) {
      previewMap.set(m.conversation_id, { body: m.body, sender_id: m.sender_id });
    }
  }

  return convs.map((c) => {
    const otherId = c.participant_a === user.id ? c.participant_b : c.participant_a;
    const p = profileMap.get(otherId);
    const pv = previewMap.get(c.id);
    return {
      id: c.id,
      origin: c.origin,
      last_message_at: c.last_message_at,
      counterparty_id: otherId,
      counterparty_name: p?.display_name ?? "Unknown",
      counterparty_company: p?.company_name ?? null,
      counterparty_avatar_url: p?.avatar_url ?? null,
      preview: pv?.body ?? null,
      preview_sender_is_me: pv?.sender_id === user.id,
      deal: dealMap.get(otherId) ?? null,
    };
  });
}

export type ThreadMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_cold?: boolean;
  offer_id?: string | null;
};

export type ThreadOffer = {
  id: string;
  title: string;
  description: string;
  category: string;
  price_min: number | null;
  price_max: number | null;
  pricing_model: string | null;
};

export type ThreadHeader = {
  id: string;
  origin: string;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_company: string | null;
  counterparty_industry: string | null;
};

export async function fetchThread(
  conversationId: string,
): Promise<{
  header: ThreadHeader | null;
  messages: ThreadMessage[];
  offers: Record<string, ThreadOffer>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { header: null, messages: [], offers: {}, error: "not signed in" };

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, origin, participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();

  if (convErr || !conv) {
    return { header: null, messages: [], offers: {}, error: "conversation not found" };
  }
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    return { header: null, messages: [], offers: {}, error: "not a participant" };
  }

  const otherId = conv.participant_a === user.id ? conv.participant_b : conv.participant_a;

  const [{ data: profile }, { data: msgs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, company_name, industry")
      .eq("id", otherId)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at, is_cold, offer_id")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  // Offers attached to the opening of a cold DM, so the recipient sees what
  // the sender can do for them.
  const offerIds = Array.from(
    new Set((msgs ?? []).map((m) => m.offer_id).filter((x): x is string => Boolean(x))),
  );
  const { data: offerRows } =
    offerIds.length > 0
      ? await supabase
          .from("offers")
          .select("id, title, description, category, price_min, price_max, pricing_model")
          .in("id", offerIds)
      : { data: [] as ThreadOffer[] };
  const offers: Record<string, ThreadOffer> = {};
  for (const o of offerRows ?? []) offers[o.id] = o;

  return {
    offers,
    header: {
      id: conv.id,
      origin: conv.origin,
      counterparty_id: otherId,
      counterparty_name: profile?.display_name ?? "Unknown",
      counterparty_company: profile?.company_name ?? null,
      counterparty_industry: profile?.industry ?? null,
    },
    messages: (msgs ?? []) as ThreadMessage[],
  };
}
