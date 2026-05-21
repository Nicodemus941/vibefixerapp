"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/format";

export function MakeOfferDialog({
  listingId,
  sellerId,
  listingPrice,
}: {
  listingId: string;
  sellerId: string;
  listingPrice: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    String(Math.round(listingPrice * 0.95)),
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setErr(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setErr("Enter an offer amount.");
      return;
    }
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push(`/auth/sign-in?next=/listings/${listingId}`);
      return;
    }
    const { error } = await supabase.from("offers").insert({
      listing_id: listingId,
      buyer_id: userData.user.id,
      seller_id: sellerId,
      amount: value,
      message: message || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) setErr(error.message);
    else {
      setDone(true);
      router.refresh();
    }
  }

  if (done) {
    return (
      <div className="ak-card bg-[var(--color-good-soft)] p-4 text-sm text-[var(--color-good)]">
        ✓ Offer sent for {formatPrice(Number(amount))}. Track it in{" "}
        <a className="font-semibold underline" href="/account">
          your account
        </a>
        .
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ak-btn ak-btn-primary w-full"
      >
        Make an offer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="ak-card w-full max-w-md space-y-4 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">Make an offer</h3>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  Listed at {formatPrice(listingPrice)}. The seller can accept,
                  decline, or counter.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-[var(--color-ink-muted)]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                Your offer ($)
              </label>
              <input
                className="ak-input"
                inputMode="numeric"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9]/g, ""))
                }
              />
              {amount && Number(amount) < listingPrice && (
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  {formatPrice(listingPrice - Number(amount))} below ask (
                  {Math.round(
                    ((listingPrice - Number(amount)) / listingPrice) * 100,
                  )}
                  % off)
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
                Note to seller (optional)
              </label>
              <textarea
                rows={3}
                className="ak-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. I can pick up this weekend with cash."
              />
            </div>

            {err && (
              <div className="rounded-md bg-[var(--color-bad-soft)] p-2 text-xs text-[var(--color-bad)]">
                {err}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="ak-btn ak-btn-ghost border"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="ak-btn ak-btn-primary disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
