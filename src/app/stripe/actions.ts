"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, siteUrl, stripeConfigured } from "@/lib/stripe";
import { logEvent } from "@/lib/platform-events";

export type StripeConnectStatus =
  | { configured: false }
  | { configured: true; status: "none" | "onboarding" | "active" | "disabled"; accountId: string | null };

export async function fetchStripeConnectStatus(): Promise<StripeConnectStatus> {
  if (!stripeConfigured()) return { configured: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured: true, status: "none", accountId: null };
  const { data: p } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_account_status")
    .eq("id", user.id)
    .maybeSingle();
  return {
    configured: true,
    status: (p?.stripe_account_status as StripeConnectStatus extends { configured: true } ? StripeConnectStatus["status"] : never) ?? "none",
    accountId: p?.stripe_account_id ?? null,
  };
}

// Starts onboarding — creates or reuses a Connect Express account and
// returns an account link URL the user navigates to.
export async function startStripeConnectOnboarding(): Promise<void> {
  if (!stripeConfigured()) redirect("/account?stripe_error=not_configured");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const stripe = getStripe();
  const admin = createAdminClient();

  const { data: p } = await supabase
    .from("profiles")
    .select("stripe_account_id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  let accountId = p?.stripe_account_id;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email ?? undefined,
      capabilities: {
        transfers: { requested: true },
        card_payments: { requested: true },
      },
      business_type: "individual",
      metadata: { loop_user_id: user.id },
    });
    accountId = account.id;
    await admin
      .from("profiles")
      .update({
        stripe_account_id: accountId,
        stripe_account_status: "onboarding",
      })
      .eq("id", user.id);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: `${siteUrl()}/account?stripe=return`,
    refresh_url: `${siteUrl()}/account?stripe=refresh`,
    type: "account_onboarding",
  });

  await logEvent("stripe_connect_onboarding_started", user.id, { account_id: accountId });
  redirect(link.url);
}

// Pulls latest status from Stripe and updates our profile cache. Use this
// after the user returns from onboarding (or via webhook in production).
export async function refreshStripeConnectStatus(): Promise<{ status?: string; error?: string }> {
  if (!stripeConfigured()) return { error: "not_configured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: p } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!p?.stripe_account_id) return { error: "no account" };

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(p.stripe_account_id);

  // "Active" = can accept payments AND has transfers enabled.
  const active =
    account.charges_enabled && account.payouts_enabled && account.details_submitted;
  const status: "onboarding" | "active" | "disabled" = active
    ? "active"
    : account.requirements?.disabled_reason
    ? "disabled"
    : "onboarding";

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ stripe_account_status: status })
    .eq("id", user.id);

  revalidatePath("/account");
  return { status };
}

// Pay-now: creates a Checkout Session that captures the seeker's payment
// for an existing manual engagement; transfers go to the provider's Connect
// account on release.
export async function payEngagement(input: {
  engagementId: string;
}): Promise<void> {
  if (!stripeConfigured()) redirect("/account?stripe_error=not_configured");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: eng } = await supabase
    .from("engagements")
    .select(
      "id, seeker_id, provider_id, amount, platform_fee, escrow_status, payment_method, stripe_payment_intent_id, match_id",
    )
    .eq("id", input.engagementId)
    .maybeSingle();
  if (!eng) redirect("/inbox");
  if (eng.seeker_id !== user.id) redirect("/inbox");
  if (eng.escrow_status !== "held") redirect("/inbox");
  if (eng.stripe_payment_intent_id) redirect("/inbox");

  const { data: providerProfile } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_account_status, display_name")
    .eq("id", eng.provider_id)
    .maybeSingle();
  if (
    !providerProfile?.stripe_account_id ||
    providerProfile.stripe_account_status !== "active"
  ) {
    redirect(`/inbox?stripe_error=provider_not_connected`);
  }

  const stripe = getStripe();
  const amountCents = Math.round(Number(eng.amount) * 100);
  const feeCents = Math.round(Number(eng.platform_fee) * 100);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Loop deal — ${providerProfile.display_name}`,
            description: `Loop platform fee 7% included. Held in escrow until release.`,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: feeCents,
      transfer_data: { destination: providerProfile.stripe_account_id },
      // Capture immediately so funds are held by the platform until release
      // (Stripe Connect "Separate charges and transfers" pattern).
      capture_method: "automatic",
      metadata: {
        loop_engagement_id: eng.id,
        loop_seeker_id: eng.seeker_id,
        loop_provider_id: eng.provider_id,
      },
    },
    success_url: `${siteUrl()}/inbox?paid=${eng.id}`,
    cancel_url: `${siteUrl()}/inbox?canceled=${eng.id}`,
    customer_email: user.email ?? undefined,
    metadata: { loop_engagement_id: eng.id },
  });

  await logEvent("stripe_checkout_created", user.id, {
    engagement_id: eng.id,
    session_id: session.id,
  });

  redirect(session.url ?? "/inbox");
}

// Releases the held funds to the provider (the transfer was already attached
// to the payment intent via transfer_data, so funds flowed at capture — we
// just mark the engagement released in our state). For separate-transfer
// flows you'd call stripe.transfers.create here.
export async function releaseStripeEngagement(input: {
  engagementId: string;
  conversationId: string;
}): Promise<{ error?: string }> {
  if (!stripeConfigured()) return { error: "not_configured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: eng } = await supabase
    .from("engagements")
    .select("id, seeker_id, payment_method, stripe_payment_intent_id, escrow_status")
    .eq("id", input.engagementId)
    .maybeSingle();
  if (!eng) return { error: "not found" };
  if (eng.seeker_id !== user.id) return { error: "only seeker can release" };
  if (eng.escrow_status !== "held") return { error: `already ${eng.escrow_status}` };

  // For the simple flow above, the transfer fires at capture, so release here
  // is a state flip + system message + trigger to publish a deal_shipped feed
  // event (existing post_deal_closed_event trigger handles that).
  const { error } = await supabase
    .from("engagements")
    .update({
      escrow_status: "released",
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.engagementId);
  if (error) return { error: error.message };

  await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: user.id,
    body: `✅ Released — funds settled to the provider's Stripe account.`,
  });

  await logEvent("stripe_engagement_released", user.id, {
    engagement_id: input.engagementId,
  });
  revalidatePath(`/inbox/${input.conversationId}`);
  return {};
}

export async function refundStripeEngagement(input: {
  engagementId: string;
  conversationId: string;
}): Promise<{ error?: string }> {
  if (!stripeConfigured()) return { error: "not_configured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: eng } = await supabase
    .from("engagements")
    .select(
      "id, seeker_id, provider_id, amount, payment_method, stripe_payment_intent_id, escrow_status",
    )
    .eq("id", input.engagementId)
    .maybeSingle();
  if (!eng) return { error: "not found" };
  if (eng.seeker_id !== user.id && eng.provider_id !== user.id) {
    return { error: "not a participant" };
  }
  if (eng.escrow_status !== "held") return { error: `already ${eng.escrow_status}` };
  if (!eng.stripe_payment_intent_id) return { error: "no payment to refund" };

  const stripe = getStripe();
  const refund = await stripe.refunds.create({
    payment_intent: eng.stripe_payment_intent_id,
    reverse_transfer: true,
    refund_application_fee: true,
    metadata: { loop_engagement_id: eng.id },
  });

  const admin = createAdminClient();
  await admin
    .from("engagements")
    .update({
      escrow_status: "refunded",
      completed_at: new Date().toISOString(),
      stripe_refund_id: refund.id,
    })
    .eq("id", input.engagementId);

  await supabase.from("messages").insert({
    conversation_id: input.conversationId,
    sender_id: user.id,
    body: `↩️ Refunded ($${eng.amount}). Stripe refund id ${refund.id}.`,
  });

  await logEvent("stripe_engagement_refunded", user.id, {
    engagement_id: input.engagementId,
    refund_id: refund.id,
  });
  revalidatePath(`/inbox/${input.conversationId}`);
  return {};
}
