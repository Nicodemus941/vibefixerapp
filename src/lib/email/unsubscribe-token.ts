// Signed one click unsubscribe tokens. Format: <userId>.<base64url hmac>.
// The secret is UNSUBSCRIBE_SECRET, or one derived from CRON_SECRET when
// that is not set. Tokens never expire: an unsubscribe link must keep
// working for as long as the email sits in someone's inbox.

import { createHmac, timingSafeEqual } from "node:crypto";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function unsubscribeSecret(env: Record<string, string | undefined> = process.env): string | null {
  if (env.UNSUBSCRIBE_SECRET) return env.UNSUBSCRIBE_SECRET;
  if (env.CRON_SECRET) return `derived:${env.CRON_SECRET}`;
  return null;
}

function sign(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(`unsubscribe:v1:${userId.toLowerCase()}`).digest("base64url");
}

export function signUnsubscribeToken(userId: string, secret: string): string {
  if (!UUID_RE.test(userId)) throw new Error("invalid user id");
  if (!secret) throw new Error("missing secret");
  return `${userId.toLowerCase()}.${sign(userId, secret)}`;
}

/** Returns the user id when the token is genuine, otherwise null. */
export function verifyUnsubscribeToken(token: string | null | undefined, secret: string | null): string | null {
  if (!token || !secret) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!UUID_RE.test(userId)) return null;
  const expected = Buffer.from(sign(userId, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length) return null;
  return timingSafeEqual(expected, given) ? userId.toLowerCase() : null;
}
