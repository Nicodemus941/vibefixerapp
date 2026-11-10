// Minimal Open Graph / meta parser for link previews. Pure, no imports,
// unit tested in tests/. Works on the first chunk of an HTML document.

export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
};

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  "#39": "'",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+|#39);/gi, (m, code: string) => {
    const lower = code.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith("#x")) {
      const n = parseInt(lower.slice(2), 16);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    if (lower.startsWith("#")) {
      const n = parseInt(lower.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return m;
  });
}

function clean(s: string | undefined | null, max: number): string | null {
  if (!s) return null;
  // Strip control characters and collapse whitespace.
  // eslint-disable-next-line no-control-regex
  const v = decodeEntities(s).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!v) return null;
  return v.length > max ? `${v.slice(0, max - 1).trimEnd()}…` : v;
}

function attr(tag: string, name: string): string | undefined {
  const rx = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i");
  const m = tag.match(rx);
  if (!m) return undefined;
  return m[2] ?? m[3] ?? m[4];
}

export function parseOpenGraph(html: string, pageUrl: string): LinkPreview {
  const head = html.slice(0, 200_000);
  const meta = new Map<string, string>();
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const key = (attr(tag, "property") ?? attr(tag, "name") ?? "").toLowerCase();
    const content = attr(tag, "content");
    if (!key || content === undefined) continue;
    if (!meta.has(key)) meta.set(key, content);
  }
  const titleTag = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  const title = clean(meta.get("og:title") ?? meta.get("twitter:title") ?? titleTag, 200);
  const description = clean(
    meta.get("og:description") ?? meta.get("twitter:description") ?? meta.get("description"),
    300,
  );
  const siteName = clean(meta.get("og:site_name"), 80);

  let image: string | null = null;
  const rawImage = meta.get("og:image:secure_url") ?? meta.get("og:image") ?? meta.get("twitter:image");
  if (rawImage) {
    try {
      const abs = new URL(decodeEntities(rawImage.trim()), pageUrl);
      // https only, so the card never triggers mixed content.
      if (abs.protocol === "https:" && abs.href.length <= 1000) image = abs.href;
    } catch {
      image = null;
    }
  }

  let fallbackSite: string | null = null;
  try {
    fallbackSite = new URL(pageUrl).hostname.replace(/^www\./, "");
  } catch {
    fallbackSite = null;
  }

  return {
    url: pageUrl,
    title,
    description,
    image,
    site_name: siteName ?? fallbackSite,
  };
}
