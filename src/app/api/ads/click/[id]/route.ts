import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Click-tracking redirect. Logs the click into ad_events (the trigger
// increments advertisements.clicks), then 302s to the ad's target_url.
// Falls back to /feed on any error so a user click never dead-ends.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: ad } = await supabase
      .from("advertisements")
      .select("target_url")
      .eq("id", id)
      .maybeSingle();

    if (!ad?.target_url) return NextResponse.redirect(new URL("/feed", _req.url));

    const {
      data: { user },
    } = await supabase.auth.getUser();
    void supabase.from("ad_events").insert({
      ad_id: id,
      viewer_id: user?.id ?? null,
      event_type: "click",
    });
    return NextResponse.redirect(ad.target_url);
  } catch {
    return NextResponse.redirect(new URL("/feed", _req.url));
  }
}
