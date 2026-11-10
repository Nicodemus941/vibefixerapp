import "server-only";

// Cloudflare Turnstile, verified on the server. Needs both
// NEXT_PUBLIC_TURNSTILE_SITE_KEY (widget) and TURNSTILE_SECRET_KEY (this
// check). When either is missing the check is skipped and a warning is
// logged once per process, so local development and preview deploys keep
// working.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

let warned = false;

export function turnstileEnabled(): boolean {
  const on = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
  if (!on && !warned) {
    warned = true;
    console.warn(
      "[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY or TURNSTILE_SECRET_KEY is not set. Skipping human checks.",
    );
  }
  return on;
}

export type TurnstileResult = { ok: true; skipped: boolean } | { ok: false; error: string };

export async function verifyTurnstile(token: string | null | undefined, ip?: string | null): Promise<TurnstileResult> {
  if (!turnstileEnabled()) return { ok: true, skipped: true };
  if (!token) return { ok: false, error: "Please confirm you are a person first." };
  try {
    const body = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, { method: "POST", body, cache: "no-store" });
    const json = (await res.json()) as { success?: boolean };
    if (json.success) return { ok: true, skipped: false };
    return { ok: false, error: "That check did not go through. Please try it again." };
  } catch {
    return { ok: false, error: "We could not reach the human check. Please try again." };
  }
}
