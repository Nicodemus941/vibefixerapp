// Referral helpers — turn each booking into a share-friendly code.
//
// MVP without a database: the code is a deterministic hash of the customer's
// phone (last 10 digits). Same phone always produces the same code, so when
// a friend uses ref=ABC123, Eric can decode it manually if needed by hashing
// known customer numbers. (When we add a DB, we'll switch to a stored map.)
//
// Why this matters (Hormozi compounding):
//   1. Customer books → site shows a permanent share link with their code.
//   2. They text it to a friend.
//   3. Friend opens the home page → sees a "Your friend gets you $25 off"
//      welcome banner.
//   4. Friend books → ref code carries through every step into Eric's
//      notification, so Eric knows who referred whom and can credit both.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L for legibility

// Tiny, dependency-free hash → 6-char code in our alphabet.
// Not cryptographically secure; we just need uniqueness across the customer
// base + non-confusable rendering.
export function codeForPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length < 7) return "";
  // FNV-1a-ish 32-bit fold
  let h = 0x811c9dc5;
  for (let i = 0; i < digits.length; i++) {
    h ^= digits.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[h % ALPHABET.length];
    h = Math.floor(h / ALPHABET.length) >>> 0;
    if (h === 0) h = 0x9e3779b1; // re-seed if we exhaust entropy
  }
  return code;
}

// Light validation — code must be 6 chars from our alphabet.
const CODE_RE = new RegExp(`^[${ALPHABET}]{6}$`);
export function isValidCode(code: string): boolean {
  return CODE_RE.test(code.toUpperCase());
}

export function normalizeCode(code: string | null | undefined): string {
  if (!code) return "";
  const upper = code.trim().toUpperCase();
  return isValidCode(upper) ? upper : "";
}

// Reward amounts surfaced everywhere — single source of truth.
// Adjust here, the banner / SMS / email all update.
export const REFERRAL_REWARD_USD = 25;

export function shareUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;
}
