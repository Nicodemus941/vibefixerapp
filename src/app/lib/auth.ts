import "server-only";

// Tiny shared-password auth for the ops dashboard. NextAuth would be overkill
// for 3 family members. Single ADMIN_PASSWORD env var → HMAC-signed cookie
// → middleware checks the signature on every /admin/* request.
//
// If ADMIN_PASSWORD isn't set, the dashboard is open (preview mode). In prod
// it should always be set in Vercel env vars.

const COOKIE_NAME = "fast_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "fast-family-autoglass-dev-secret";
}

// Web Crypto HMAC-SHA256, base64url-encoded.
async function hmac(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return base64url(new Uint8Array(sig));
}

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function makeToken(): Promise<string> {
  const issuedAt = Date.now();
  const payload = `v1.${issuedAt}`;
  const sig = await hmac(payload, getSecret());
  return `${payload}.${sig}`;
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [v, issuedAtStr, sig] = parts;
  if (v !== "v1") return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt)) return false;
  // 30-day window
  if (Date.now() - issuedAt > COOKIE_MAX_AGE * 1000) return false;
  const expected = await hmac(`${v}.${issuedAtStr}`, getSecret());
  // Constant-time compare
  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return true; // no password set → open mode (preview)
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isAuthDisabled(): boolean {
  return !process.env.ADMIN_PASSWORD;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
export const AUTH_COOKIE_MAX_AGE = COOKIE_MAX_AGE;
