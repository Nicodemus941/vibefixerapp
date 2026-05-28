import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { logEvent } from "@/lib/platform-events";
import type Stripe from "stripe";

// Stripe sends raw body; we need the unparsed text for signature verification.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return new NextResponse("stripe_not_configured", { status: 503 });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new NextResponse("missing_webhook_secret", { status: 503 });
  }

  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new NextResponse("missing_signature", { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature";
    return new NextResponse(`signature_error: ${msg}`, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const engagementId = session.metadata?.loop_engagement_id;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        if (engagementId && paymentIntentId) {
          await admin
            .from("engagements")
            .update({
              payment_method: "stripe",
              stripe_payment_intent_id: paymentIntentId,
            })
            .eq("id", engagementId);
          await logEvent("stripe_checkout_completed", null, {
            engagement_id: engagementId,
            session_id: session.id,
          });
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const engagementId = pi.metadata?.loop_engagement_id;
        const chargeId = pi.latest_charge as string | null;
        if (engagementId) {
          const patch: Record<string, string> = { payment_method: "stripe" };
          if (chargeId) patch.stripe_charge_id = chargeId;
          await admin
            .from("engagements")
            .update(patch as never)
            .eq("id", engagementId);
          await logEvent("stripe_payment_succeeded", null, {
            engagement_id: engagementId,
            payment_intent_id: pi.id,
          });
        }
        break;
      }
      case "account.updated": {
        const acct = event.data.object as Stripe.Account;
        const userId = acct.metadata?.loop_user_id;
        if (userId) {
          const active =
            acct.charges_enabled && acct.payouts_enabled && acct.details_submitted;
          const status: "onboarding" | "active" | "disabled" = active
            ? "active"
            : acct.requirements?.disabled_reason
            ? "disabled"
            : "onboarding";
          await admin
            .from("profiles")
            .update({ stripe_account_status: status })
            .eq("id", userId);
          await logEvent("stripe_account_updated", userId, { status });
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const piId =
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id ?? null;
        if (piId) {
          await admin
            .from("engagements")
            .update({
              escrow_status: "refunded",
              completed_at: new Date().toISOString(),
            })
            .eq("stripe_payment_intent_id", piId);
          await logEvent("stripe_refund_applied", null, { payment_intent_id: piId });
        }
        break;
      }
      default:
        // No-op for unhandled events; Stripe will retry on 5xx, so we always 200
        // for events we don't care about.
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "handler error";
    return new NextResponse(`handler_error: ${msg}`, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
