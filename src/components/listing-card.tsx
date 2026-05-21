import Link from "next/link";
import { Listing } from "@/lib/types";
import { formatMileage, formatPrice, relativeTime } from "@/lib/format";
import { DealBadge } from "@/components/deal-badge";
import { SaveButton } from "@/components/save-button";

export function ListingCard({
  listing,
  saved = false,
}: {
  listing: Listing;
  saved?: boolean;
}) {
  const cover = listing.photos[0] ?? null;
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="ak-card group block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-[var(--color-bg)]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-ink-muted)]">
            No photo
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {listing.is_promoted && (
            <span className="ak-chip bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-transparent">
              Sponsored
            </span>
          )}
          {listing.seller_type === "private" && (
            <span className="ak-chip">Private seller</span>
          )}
          {listing.is_verified_seller && (
            <span className="ak-chip bg-[var(--color-good-soft)] text-[var(--color-good)] border-transparent">
              ✓ Verified
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <SaveButton listingId={listing.id} initialSaved={saved} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">
            {listing.title}
          </h3>
          <DealBadge score={listing.deal_score} />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight">
            {formatPrice(listing.price)}
          </span>
          {listing.market_price_estimate &&
            listing.price < listing.market_price_estimate && (
              <span className="text-xs text-[var(--color-good)]">
                {formatPrice(listing.market_price_estimate - listing.price)} below market
              </span>
            )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-ink-muted)]">
          <span>{formatMileage(listing.mileage)}</span>
          <span>•</span>
          <span>
            {listing.location_city}, {listing.location_state}
          </span>
          <span>•</span>
          <span>Listed {relativeTime(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
