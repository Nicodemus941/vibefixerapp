import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { formatReplyRate } from "./reply-rate";

// Reads the aggregate from member_reply_stats and turns it into the line
// shown on /u and /c. Returns null (show nothing) below 5 conversations,
// across a block, or if the migration is not applied yet.
export async function fetchReplyRateLine(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("member_reply_stats", { target: userId });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return formatReplyRate({
    eligible: Number(row.eligible ?? 0),
    rate: row.reply_rate === null ? null : Number(row.reply_rate),
    medianSeconds: row.median_reply_seconds === null ? null : Number(row.median_reply_seconds),
  });
}
