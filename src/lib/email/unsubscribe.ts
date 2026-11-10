import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { unsubscribeSecret, verifyUnsubscribeToken } from "./unsubscribe-token";

/** Pauses every notification email for the member a signed token names. */
export async function unsubscribeWithToken(token: string | null | undefined): Promise<boolean> {
  const userId = verifyUnsubscribeToken(token, unsubscribeSecret());
  if (!userId) return false;
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("notification_settings").upsert(
    { user_id: userId, emails_paused: true, unsubscribed_at: now, updated_at: now },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[unsubscribe]", error.message);
    return false;
  }
  return true;
}
