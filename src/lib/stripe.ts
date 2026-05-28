import "server-only";
import Stripe from "stripe";

// Lazy: don't crash the build if STRIPE_SECRET_KEY isn't set yet — instead
// surface a clear "stripe_not_configured" error at call time.
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("stripe_not_configured");
  }
  client = new Stripe(key, {
    // Pinned API version for reproducible behaviour.
    apiVersion: "2025-09-30.clover" as Stripe.LatestApiVersion,
    typescript: true,
  });
  return client;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Public site URL for redirects from Stripe-hosted flows. Uses the env
// override when present, otherwise loopfounders.com.
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://loopfounders.com"
  ).replace(/\/$/, "");
}
