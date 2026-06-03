import type { MetadataRoute } from "next";

// Crawlers see the landing + login. Auth-walled routes (feed, matches,
// inbox, profile, account, admin) redirect them to /login, so no point
// indexing — but no point disallowing either; the redirect handles it.
// Explicitly block API + Stripe webhook for cleanliness.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: "https://loopfounders.com/sitemap.xml",
    host: "https://loopfounders.com",
  };
}
