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
