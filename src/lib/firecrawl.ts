import FirecrawlApp from "@mendable/firecrawl-js";
import { env } from "./env";

export type ScrapeResult = {
  copy: { title: string; description: string; headings: string[]; bodyText: string };
  images: Array<{ src: string; alt?: string }>;
  colors: string[];
  fonts: string[];
  structure: { hasHero: boolean; hasNav: boolean; sectionCount: number; ctaCount: number };
  source: "firecrawl" | "playwright";
};

let _client: FirecrawlApp | null = null;
function client(): FirecrawlApp {
  if (!_client) _client = new FirecrawlApp({ apiKey: env.firecrawlApiKey() });
  return _client;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    const fc = client();
    const r = await fc.scrapeUrl(url, { formats: ["markdown", "html", "links"] });
    if (!r.success) throw new Error(`Firecrawl failed: ${r.error}`);
    return extractFromFirecrawl(r);
  } catch (e) {
    // Brief calls for a Playwright fallback for JS-heavy sites.
    // Implemented in scrapePlaywright; we lazy-import so the dep isn't loaded in the happy path.
    const { scrapePlaywright } = await import("./firecrawl-playwright");
    return scrapePlaywright(url, e);
  }
}

function extractFromFirecrawl(r: {
  markdown?: string;
  html?: string;
  metadata?: { title?: string; description?: string; ogImage?: string };
  links?: string[];
}): ScrapeResult {
  const html = r.html ?? "";
  const md = r.markdown ?? "";

  const headings = Array.from(md.matchAll(/^#{1,3}\s+(.+)$/gm)).map((m) => m[1].trim());
  const imgMatches = Array.from(
    html.matchAll(/<img\s+[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi),
  );
  const images = imgMatches.map((m) => ({ src: m[1], alt: m[2] }));

  // Crude color extraction from inline styles.
  const colorMatches = Array.from(html.matchAll(/(?:#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))/g));
  const colors = Array.from(new Set(colorMatches.map((m) => m[0]))).slice(0, 12);

  const fontMatches = Array.from(html.matchAll(/font-family\s*:\s*([^;"']+)/gi));
  const fonts = Array.from(new Set(fontMatches.map((m) => m[1].trim()))).slice(0, 6);

  const ctaCount = (html.match(/<(a|button)[^>]*>[^<]{1,40}<\/(a|button)>/gi) ?? []).length;
  const sectionCount = (html.match(/<section\b/gi) ?? []).length;

  return {
    copy: {
      title: r.metadata?.title ?? "",
      description: r.metadata?.description ?? "",
      headings: headings.slice(0, 30),
      bodyText: md.slice(0, 8000),
    },
    images: images.slice(0, 30),
    colors,
    fonts,
    structure: {
      hasHero: /<(section|div)[^>]*hero/i.test(html),
      hasNav: /<nav\b/i.test(html),
      sectionCount,
      ctaCount,
    },
    source: "firecrawl",
  };
}
