import type { SupabaseClient } from "@supabase/supabase-js";

// Reads cover_url in its own query so a page keeps rendering before the
// cover migrations are applied (the column simply does not exist yet,
// the query errors, and we fall back to the brand gradient).
export async function fetchCoverUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  table: "profiles" | "organizations" | "groups",
  id: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("cover_url")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    const url = (data as { cover_url?: string | null }).cover_url;
    return typeof url === "string" && url.startsWith("https://") ? url : null;
  } catch {
    return null;
  }
}
