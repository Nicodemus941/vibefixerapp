"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "new_match"
  | "new_message"
  | "new_reaction"
  | "match_accepted";

export type NotificationRow = {
  id: string;
  kind: NotificationKind;
  actor_id: string | null;
  actor_name: string | null;
  related_post_id: string | null;
  related_match_id: string | null;
  related_conversation_id: string | null;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export async function fetchNotifications(limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, kind, actor_id, related_post_id, related_match_id, related_conversation_id, payload, read_at, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const actorIds = Array.from(
    new Set(data.map((n) => n.actor_id).filter(Boolean) as string[]),
  );
  const { data: actors } =
    actorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", actorIds)
      : { data: [] };
  const actorMap = new Map((actors ?? []).map((a) => [a.id, a.display_name]));

  return data.map((n) => ({
    id: n.id,
    kind: n.kind as NotificationKind,
    actor_id: n.actor_id,
    actor_name: n.actor_id ? actorMap.get(n.actor_id) ?? null : null,
    related_post_id: n.related_post_id,
    related_match_id: n.related_match_id,
    related_conversation_id: n.related_conversation_id,
    payload: (n.payload as Record<string, unknown> | null) ?? null,
    read_at: n.read_at,
    created_at: n.created_at as string,
  }));
}

export async function fetchUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);
  return count ?? 0;
}

export async function markAllRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/notifications");
  revalidatePath("/feed");
  revalidatePath("/inbox");
}
