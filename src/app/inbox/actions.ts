"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

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

export async function sendMessage(formData: FormData) {
  const conversationId = String(formData.get("conversation_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!conversationId || !body) return;
  if (body.length > 4000) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });

  if (error) {
    revalidatePath(`/inbox/${conversationId}?error=${encodeURIComponent(error.message)}`);
    return;
  }

  revalidatePath(`/inbox/${conversationId}`);
  revalidatePath("/inbox");
}

export type InboxRow = {
  id: string;
  origin: string;
  last_message_at: string | null;
  counterparty_id: string;
  counterparty_name: string;
  counterparty_company: string | null;
  preview: string | null;
  preview_sender_is_me: boolean;
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

  const [{ data: profiles }, { data: previews }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, company_name")
      .in("id", counterpartyIds),
    supabase
      .from("messages")
      .select("conversation_id, body, sender_id, created_at")
      .in(
        "conversation_id",
        convs.map((c) => c.id),
      )
      .order("created_at", { ascending: false }),
  ]);

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
      preview: pv?.body ?? null,
      preview_sender_is_me: pv?.sender_id === user.id,
    };
  });
}

export type ThreadMessage = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
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
): Promise<{ header: ThreadHeader | null; messages: ThreadMessage[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { header: null, messages: [], error: "not signed in" };

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .select("id, origin, participant_a, participant_b")
    .eq("id", conversationId)
    .maybeSingle();

  if (convErr || !conv) {
    return { header: null, messages: [], error: "conversation not found" };
  }
  if (conv.participant_a !== user.id && conv.participant_b !== user.id) {
    return { header: null, messages: [], error: "not a participant" };
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
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  return {
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
