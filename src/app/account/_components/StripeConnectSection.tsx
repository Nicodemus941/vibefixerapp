"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import {
  refreshStripeConnectStatus,
  startStripeConnectOnboarding,
  type StripeConnectStatus,
} from "@/app/stripe/actions";

export function StripeConnectSection({ status }: { status: StripeConnectStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!status.configured) {
    return (
      <div className="text-sm text-[var(--fg-muted)]">
        <p>Stripe Connect isn&apos;t configured yet.</p>
        <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-1">
          Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for the webhook)
          in Vercel and redeploy. Code is ready; just needs the keys.
        </p>
      </div>
    );
  }

  const s = status.status;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--fg)]">
            {s === "active" && (
              <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
                <CheckCircle2 className="h-4 w-4" />
                Connected and ready to receive payments
              </span>
            )}
            {s === "onboarding" && "Stripe onboarding started — finish to receive payments."}
            {s === "disabled" && (
              <span className="text-[var(--danger)]">
                Stripe disabled this account. Check requirements.
              </span>
            )}
            {s === "none" && "Connect a Stripe account to send + receive payments via Loop."}
          </p>
          {status.accountId && (
            <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-1">
              account: {status.accountId}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            startTransition(async () => {
              const r = await refreshStripeConnectStatus();
              if (r.status) router.refresh();
            });
          }}
          disabled={pending}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Refresh
        </button>
      </div>

      {s !== "active" && (
        <form action={startStripeConnectOnboarding}>
          <button
            type="submit"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {s === "none" ? "Connect Stripe" : "Continue Stripe setup"}
          </button>
        </form>
      )}
    </div>
  );
}
