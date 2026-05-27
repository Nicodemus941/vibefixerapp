import "server-only";
import type { Json } from "./supabase/database.types";
import { createAdminClient } from "./supabase/admin";

export async function logEvent(
  eventType: string,
  userId: string | null,
  payload?: Json,
) {
  const supabase = createAdminClient();
  await supabase.from("platform_events").insert({
    event_type: eventType,
    user_id: userId,
    payload: payload ?? null,
  });
}
