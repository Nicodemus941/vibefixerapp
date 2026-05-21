"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice, relativeTime } from "@/lib/format";

export interface InboxOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: string;
  counter_amount: number | null;
  created_at: string;
  listing_title: string;
  listing_price: number;
  listing_status: string;
  other_party_name: string;
}

export function OffersInbox({
  offers,
  currentUserId,
  role,
}: {
  offers: InboxOffer[];
  currentUserId: string;
  role: "seller" | "buyer";
}) {
  if (!offers.length) {
    return (
      <div className="ak-card p-6 text-center text-sm text-[var(--color-ink-muted)]">
        {role === "seller"
          ? "No offers received yet."
          : "You haven't made any offers yet."}
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {offers.map((o) => (
        <OfferRow
          key={o.id}
          offer={o}
          currentUserId={currentUserId}
          role={role}
        />
      ))}
    </ul>
  );
}

function OfferRow({
  offer,
  currentUserId,
  role,
}: {
  offer: InboxOffer;
  currentUserId: string;
  role: "seller" | "buyer";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [counterMode, setCounterMode] = useState(false);
  const [counterValue, setCounterValue] = useState(
    String(Math.round((offer.amount + offer.listing_price) / 2)),
  );

  async function act(action: "accept" | "decline" | "withdraw" | "counter") {
    setBusy(true);
    setErr(null);
    const supabase = createSupabaseBrowserClient();
    let update: Record<string, unknown> = {};
    if (action === "accept") {
      update = { status: "accepted" };
    } else if (action === "decline") {
      update = { status: "declined" };
    } else if (action === "withdraw") {
      update = { status: "withdrawn" };
    } else if (action === "counter") {
      const c = Number(counterValue);
      if (!c) {
        setErr("Enter counter amount");
        setBusy(false);
        return;
      }
      update = { status: "countered", counter_amount: c };
    }
    const { error } = await supabase
      .from("offers")
      .update(update)
      .eq("id", offer.id);
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    if (action === "accept") {
      // mark listing pending so it disappears from active search
      await supabase
        .from("listings")
        .update({ status: "pending" })
        .eq("id", offer.listing_id)
        .eq("seller_id", currentUserId);
    }
    setBusy(false);
    setCounterMode(false);
    router.refresh();
  }

  const isSeller = role === "seller";
  const isPending = offer.status === "pending";
  const isCountered = offer.status === "countered";

  return (
    <li className="ak-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/listings/${offer.listing_id}`}
            className="text-sm font-semibold hover:underline"
          >
            {offer.listing_title}
          </Link>
          <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
            Listed at {formatPrice(offer.listing_price)} •{" "}
            {isSeller ? "Offer from" : "Offer to"}{" "}
            <span className="font-medium">{offer.other_party_name}</span> •{" "}
            {relativeTime(offer.created_at)}
          </p>
          {offer.message && (
            <p className="mt-2 rounded bg-[var(--color-bg)] p-2 text-xs italic">
              "{offer.message}"
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tracking-tight">
            {formatPrice(offer.amount)}
          </div>
          {isCountered && offer.counter_amount && (
            <div className="text-xs">
              Counter:{" "}
              <span className="font-semibold">
                {formatPrice(offer.counter_amount)}
              </span>
            </div>
          )}
          <StatusPill status={offer.status} />
        </div>
      </div>

      {isPending && isSeller && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {counterMode ? (
            <>
              <input
                className="ak-input w-28 text-sm"
                value={counterValue}
                onChange={(e) =>
                  setCounterValue(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="$"
              />
              <button
                onClick={() => act("counter")}
                disabled={busy}
                className="ak-btn ak-btn-primary text-sm disabled:opacity-50"
              >
                Send counter
              </button>
              <button
                onClick={() => setCounterMode(false)}
                className="ak-btn ak-btn-ghost text-sm"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => act("accept")}
                disabled={busy}
                className="ak-btn ak-btn-primary text-sm disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => setCounterMode(true)}
                disabled={busy}
                className="ak-btn ak-btn-ghost border text-sm"
              >
                Counter
              </button>
              <button
                onClick={() => act("decline")}
                disabled={busy}
                className="text-sm font-medium text-[var(--color-bad)] hover:underline"
              >
                Decline
              </button>
            </>
          )}
        </div>
      )}

      {isPending && !isSeller && (
        <div className="mt-3 flex gap-2 border-t pt-3">
          <button
            onClick={() => act("withdraw")}
            disabled={busy}
            className="text-sm font-medium text-[var(--color-ink-muted)] hover:underline"
          >
            Withdraw offer
          </button>
        </div>
      )}

      {err && (
        <p className="mt-2 text-xs text-[var(--color-bad)]">{err}</p>
      )}
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    accepted: "bg-green-100 text-green-800",
    declined: "bg-red-100 text-red-800",
    withdrawn: "bg-gray-100 text-gray-600",
    countered: "bg-blue-100 text-blue-800",
    expired: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
        map[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
