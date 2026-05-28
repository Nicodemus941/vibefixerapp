import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = "https://loopfounders.com";

// Dynamic sitemap. /jobs/[id] and /o/[slug] are now publicly readable
// (RLS open + page no longer redirects anon), so we include them so
// crawlers can discover them. Profile pages stay auth-walled.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/jobs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Best-effort dynamic entries — if the DB is unreachable at build
  // time, fall back to the static set above.
  try {
    const supabase = await createClient();
    const [{ data: jobs }, { data: orgs }] = await Promise.all([
      supabase
        .from("job_listings")
        .select("id, created_at, expires_at, status")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5000),
      supabase
        .from("organizations")
        .select("slug, updated_at, member_count")
        .order("member_count", { ascending: false })
        .limit(10000),
    ]);

    for (const j of jobs ?? []) {
      if (j.expires_at && new Date(j.expires_at) < now) continue;
      entries.push({
        url: `${SITE_URL}/jobs/${j.id}`,
        lastModified: new Date(j.created_at as string),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const o of orgs ?? []) {
      entries.push({
        url: `${SITE_URL}/o/${o.slug}`,
        lastModified: new Date(o.updated_at as string),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch {
    // ignore — return the static set
  }

  return entries;
}
