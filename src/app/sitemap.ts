import type { MetadataRoute } from "next";

// Only the publicly reachable routes go in the sitemap. Everything else
// requires authentication and redirects crawlers to /login — useless to
// list. If we later open /jobs and /o pages to anonymous reads (huge SEO
// unlock), add their dynamic entries here as a Promise<MetadataRoute>.
const SITE_URL = "https://loopfounders.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
