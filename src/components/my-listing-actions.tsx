"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ListingStatus, STATUS_LABEL } from "@/lib/types";

const NEXT_STATUSES: ListingStatus[] = ["active", "pending", "sold"];

export function MyListingActions({
  listingId,
  status,
}: {
  listingId: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function changeStatus(next: ListingStatus) {
    if (next === status) return;
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const update: Record<string, unknown> = { status: next };
    if (next === "sold") update.sold_at = new Date().toISOString();
    if (next === "active") update.sold_at = null;

    // When flipping to sold, record a sale row from the most recent accepted
    // offer (if any) so the dashboard can show transaction history.
    if (next === "sold") {
      const [listingRes, offerRes] = await Promise.all([
        supabase
          .from("listings")
          .select("price, seller_id")
          .eq("id", listingId)
          .maybeSingle(),
        supabase
          .from("offers")
          .select("id, buyer_id, amount")
          .eq("listing_id", listingId)
          .eq("status", "accepted")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      const listing = listingRes.data as { price: number; seller_id: string } | null;
      const accepted = offerRes.data as { id: string; buyer_id: string; amount: number } | null;
      if (listing) {
        await supabase
          .from("sales")
          .upsert(
            {
              listing_id: listingId,
              seller_id: listing.seller_id,
              buyer_id: accepted?.buyer_id ?? null,
              offer_id: accepted?.id ?? null,
              sale_price: accepted?.amount ?? listing.price,
              list_price: listing.price,
              sold_at: new Date().toISOString(),
            },
            { onConflict: "listing_id" },
          );
      }
    }

    const { error } = await supabase
      .from("listings")
      .update(update)
      .eq("id", listingId);
    setBusy(false);
    if (error) setErr(error.message);
    else router.refresh();
  }

  async function remove() {
    setErr(null);
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);
    setBusy(false);
    if (error) setErr(error.message);
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => changeStatus(e.target.value as ListingStatus)}
        className="ak-input w-auto text-xs"
        aria-label="Listing status"
      >
        {NEXT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <Link
        href={`/listings/${listingId}/edit`}
        className="ak-btn ak-btn-ghost border text-xs"
      >
        Edit
      </Link>
      {!confirmDelete ? (
        <button
          onClick={() => setConfirmDelete(true)}
          className="text-xs font-medium text-[var(--color-bad)] hover:underline"
          disabled={busy}
        >
          Delete
        </button>
      ) : (
        <span className="flex items-center gap-1 text-xs">
          <span>Are you sure?</span>
          <button
            onClick={remove}
            disabled={busy}
            className="rounded bg-[var(--color-bad)] px-2 py-1 font-semibold text-white disabled:opacity-50"
          >
            Yes, delete
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-2 py-1 text-[var(--color-ink-muted)]"
          >
            Cancel
          </button>
        </span>
      )}
      {err && (
        <span className="text-xs text-[var(--color-bad)]">{err}</span>
      )}
    </div>
  );
}
