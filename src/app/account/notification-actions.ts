"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  NOTIFICATION_KINDS,
  isNotificationKind,
  resolvePreferences,
  type NotificationKind,
  type ResolvedPref,
} from "@/lib/notification-kinds";

export type NotificationSettingsState = {
  prefs: Record<NotificationKind, ResolvedPref>;
  digest: boolean;
  paused: boolean;
  unsubscribed: boolean;
};

export async function loadNotificationSettings(): Promise<NotificationSettingsState | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: rows }, { data: settings }] = await Promise.all([
    supabase.from("notification_preferences").select("kind, in_app, email").eq("user_id", user.id),
    supabase
      .from("notification_settings")
      .select("email_digest, emails_paused, unsubscribed_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  return {
    prefs: resolvePreferences(rows ?? []),
    digest: Boolean(settings?.email_digest),
    paused: Boolean(settings?.emails_paused),
    unsubscribed: Boolean(settings?.unsubscribed_at),
  };
}

export type SaveNotificationInput = {
  prefs: Array<{ kind: string; inApp: boolean; email: boolean }>;
  digest: boolean;
  paused: boolean;
};

// RLS limits both tables to the signed in member's own rows.
export async function saveNotificationSettings(input: SaveNotificationInput): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  const now = new Date().toISOString();
  const rows = input.prefs
    .filter((p) => isNotificationKind(p.kind))
    .slice(0, NOTIFICATION_KINDS.length)
    .map((p) => ({
      user_id: user.id,
      kind: p.kind,
      in_app: Boolean(p.inApp),
      email: Boolean(p.email),
      updated_at: now,
    }));

  if (rows.length) {
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(rows, { onConflict: "user_id,kind" });
    if (error) return { error: "Could not save your choices. Please try again." };
  }

  const paused = Boolean(input.paused);
  const { error: settingsError } = await supabase.from("notification_settings").upsert(
    {
      user_id: user.id,
      email_digest: Boolean(input.digest),
      emails_paused: paused,
      // Turning emails back on here also undoes a one click unsubscribe.
      ...(paused ? {} : { unsubscribed_at: null }),
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (settingsError) return { error: "Could not save your choices. Please try again." };

  revalidatePath("/account");
  return {};
}
