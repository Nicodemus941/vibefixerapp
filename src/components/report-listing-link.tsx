"use client";
import { useState } from "react";

export function ReportListingLink({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-bad)] hover:underline"
      >
        Report this listing
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="ak-card w-full max-w-md space-y-3 bg-white p-6">
            <h3 className="text-lg font-bold">Report this listing</h3>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Help keep Car World USA safe. Send a quick note to our trust team
              and they'll review within 24 hours.
            </p>
            <a
              href={`mailto:trust@carworldusa.com?subject=Report listing ${listingId}&body=Reason:%0A%0A`}
              className="ak-btn ak-btn-primary w-full"
            >
              Open email to trust team
            </a>
            <button
              onClick={() => setOpen(false)}
              className="ak-btn ak-btn-ghost border w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
