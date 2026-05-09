import "server-only";

// Tiny shared-credentials auth for the ops dashboard. NextAuth would be
// overkill for 3 family members. Single ADMIN_USERNAME + ADMIN_PASSWORD
// → HMAC-signed cookie → middleware checks the signature on every
// /admin/* request.
//
// Defaults to Demo1234/Demo1234 when env vars are unset, so previews and
// new clones work out of the box. Production should always set both.

const COOKIE_NAME = "fast_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const DEFAULT_USERNAME = "Demo1234";
const DEFAULT_PASSWORD = "Demo1234";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? "fast-family-autoglass-dev-secret";
}

function expectedUsername(): string {
  return process.env.ADMIN_USERNAME ?? DEFAULT_USERNAME;
}

function expectedPassword(): string {
  return process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
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
  if (Date.now() - issuedAt > COOKIE_MAX_AGE * 1000) return false;
  const expected = await hmac(`${v}.${issuedAtStr}`, getSecret());
  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function checkCredentials(username: string, password: string): boolean {
  return (
    constantTimeEquals(username, expectedUsername()) &&
    constantTimeEquals(password, expectedPassword())
  );
}

// Small helper for the login form to surface demo creds when defaults are in
// effect (i.e. nobody set their own).
export function isUsingDefaults(): boolean {
  return (
    !process.env.ADMIN_USERNAME &&
    !process.env.ADMIN_PASSWORD
  );
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
export const AUTH_COOKIE_MAX_AGE = COOKIE_MAX_AGE;
