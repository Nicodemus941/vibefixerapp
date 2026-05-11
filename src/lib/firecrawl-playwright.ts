import type { ScrapeResult } from "./firecrawl";

/**
 * Playwright fallback for JS-heavy sites Firecrawl can't read.
 * This runs in a Node.js runtime only (not edge). Mark the calling route with
 * `export const runtime = 'nodejs'` and add the chromium binary in deployment.
 */
export async function scrapePlaywright(url: string, _firecrawlError: unknown): Promise<ScrapeResult> {
  // Lazy import: avoids bundling Playwright into the default scrape path.
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });

    const title = await page.title();
    const description =
      (await page.locator('meta[name="description"]').first().getAttribute("content")) ?? "";
    const headings = await page.locator("h1, h2, h3").allInnerTexts();
    const bodyText = (await page.locator("body").innerText()).slice(0, 8000);

    const imgs = await page.locator("img").evaluateAll((els) =>
      els.slice(0, 30).map((e) => {
        const img = e as HTMLImageElement;
        return { src: img.src, alt: img.alt || undefined };
      }),
    );

    const colors = await page.evaluate(() => {
      const out = new Set<string>();
      for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 500)) {
        const cs = getComputedStyle(el as Element);
        out.add(cs.color);
        out.add(cs.backgroundColor);
      }
      return Array.from(out).filter((c) => c && c !== "rgba(0, 0, 0, 0)").slice(0, 12);
    });

    const fonts = await page.evaluate(() => {
      const out = new Set<string>();
      for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 200)) {
        out.add(getComputedStyle(el as Element).fontFamily);
      }
      return Array.from(out).slice(0, 6);
    });

    const ctaCount = await page.locator("a, button").count();
    const sectionCount = await page.locator("section").count();
    const hasHero = (await page.locator('[class*="hero"], section:first-of-type').count()) > 0;
    const hasNav = (await page.locator("nav").count()) > 0;

    return {
      copy: { title, description, headings: headings.slice(0, 30), bodyText },
      images: imgs,
      colors,
      fonts,
      structure: { hasHero, hasNav, sectionCount, ctaCount },
      source: "playwright",
    };
  } finally {
    await browser.close();
  }
}
