import { SUPABASE_URL } from "./supabase/config";

// Post attachments live in the public "post-media" bucket under
// {user_id}/{uuid}.{ext}. The DB stores paths, never full URLs, and a
// trigger checks that every path sits in the author's own folder.

export const POST_MEDIA_BUCKET = "post-media";
export const MAX_IMAGES = 4;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const PDF_TYPE = "application/pdf";

export type PostMedia = {
  path: string;
  width: number | null;
  height: number | null;
  alt: string | null;
};

export type PostDocument = {
  path: string;
  name: string;
  size: number;
};

export function publicMediaUrl(path: string): string {
  const safe = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${POST_MEDIA_BUCKET}/${safe}`;
}

const IMAGE_PATH_RX = /^([0-9a-f-]{36})\/[a-z0-9-]+\.(jpg|jpeg|png|webp|gif)$/;
const PDF_PATH_RX = /^([0-9a-f-]{36})\/[a-z0-9-]+\.pdf$/;

function cleanDim(n: unknown): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 && n < 20000 ? Math.round(n) : null;
}

// Normalize untrusted media input from a client. Drops anything outside
// the user's folder. Returns null if the input is unusable.
export function sanitizeMedia(userId: string, input: unknown): PostMedia[] | null {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > MAX_IMAGES) return null;
  const out: PostMedia[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const path = typeof r.path === "string" ? r.path : "";
    const m = path.match(IMAGE_PATH_RX);
    if (!m || m[1] !== userId) return null;
    const alt = typeof r.alt === "string" ? r.alt.trim().slice(0, 300) : "";
    out.push({ path, width: cleanDim(r.width), height: cleanDim(r.height), alt: alt || null });
  }
  return out;
}

export function sanitizeDocument(userId: string, input: unknown): PostDocument | null | "invalid" {
  if (input == null) return null;
  if (typeof input !== "object") return "invalid";
  const r = input as Record<string, unknown>;
  const path = typeof r.path === "string" ? r.path : "";
  const m = path.match(PDF_PATH_RX);
  if (!m || m[1] !== userId) return "invalid";
  const name =
    (typeof r.name === "string" ? r.name : "")
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 160) || "Document.pdf";
  const size = typeof r.size === "number" && r.size > 0 && r.size <= MAX_FILE_BYTES ? Math.round(r.size) : 0;
  return { path, name, size };
}

export function formatBytes(n: number): string {
  if (!n) return "PDF";
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
