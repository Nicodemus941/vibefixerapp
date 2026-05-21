import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMileage, formatPrice, relativeTime } from "@/lib/format";
import { DealBadge } from "@/components/deal-badge";
import { PhotoGallery } from "@/components/photo-gallery";
import { ContactSeller } from "@/components/contact-seller";
import { SaveButton } from "@/components/save-button";
import { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single<Listing>();

  if (!listing) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let saved = false;
  if (user) {
    const { data } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();
    saved = !!data;
  }

  const { data: similar } = await supabase
    .from("listings")
    .select("id,title,price,year,make,model,mileage,photos,deal_score")
    .neq("id", id)
    .eq("status", "active")
    .eq("body_type", listing.body_type ?? "")
    .order("deal_score", { ascending: false, nullsFirst: false })
    .limit(4);

  const priceDelta = listing.market_price_estimate
    ? listing.price - listing.market_price_estimate
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
        <Link href="/search" className="hover:underline">
          ← Back to results
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <PhotoGallery photos={listing.photos} alt={listing.title} />

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {listing.is_verified_seller && (
                  <span className="ak-chip bg-[var(--color-good-soft)] text-[var(--color-good)] border-transparent">
                    ✓ Verified seller
                  </span>
                )}
                <span className="ak-chip">
                  {listing.seller_type === "private"
                    ? "Private seller"
                    : "Dealer"}
                </span>
                <DealBadge score={listing.deal_score} />
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {listing.title}
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)]">
                {listing.location_city}, {listing.location_state} • Listed{" "}
                {relativeTime(listing.created_at)} • Last verified{" "}
                {relativeTime(listing.last_verified_at)}
              </p>
            </div>
            <SaveButton listingId={listing.id} initialSaved={saved} />
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <div className="text-4xl font-bold tracking-tight">
              {formatPrice(listing.price)}
            </div>
            {priceDelta != null && priceDelta < 0 && (
              <span className="text-sm font-semibold text-[var(--color-good)]">
                {formatPrice(-priceDelta)} below market avg
              </span>
            )}
            {priceDelta != null && priceDelta > 0 && (
              <span className="text-sm font-semibold text-[var(--color-bad)]">
                {formatPrice(priceDelta)} above market avg
              </span>
            )}
          </div>

          <dl className="ak-card mt-6 grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm md:grid-cols-4">
            <Spec label="Year" value={String(listing.year)} />
            <Spec label="Mileage" value={formatMileage(listing.mileage)} />
            <Spec label="Body" value={listing.body_type ?? "—"} />
            <Spec label="Transmission" value={listing.transmission ?? "—"} />
            <Spec label="Drivetrain" value={listing.drivetrain ?? "—"} />
            <Spec label="Fuel" value={listing.fuel_type ?? "—"} />
            <Spec label="Exterior" value={listing.exterior_color ?? "—"} />
            <Spec label="Interior" value={listing.interior_color ?? "—"} />
          </dl>

          {listing.description && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Seller's description</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-ink-muted)]">
                {listing.description}
              </p>
            </section>
          )}

          {!!listing.features?.length && (
            <section className="mt-8">
              <h2 className="text-lg font-semibold">Features</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {listing.features.map((f) => (
                  <span key={f} className="ak-chip">
                    {f}
                  </span>
                ))}
              </div>
            </section>
          )}

          {!!similar?.length && (
            <section className="mt-12">
              <h2 className="text-lg font-semibold">Similar cars</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                {similar.map((s) => (
                  <Link
                    key={s.id}
                    href={`/listings/${s.id}`}
                    className="ak-card overflow-hidden"
                  >
                    {s.photos?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photos[0]}
                        alt=""
                        className="aspect-[4/3] w-full object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold">{s.title}</p>
                      <p className="text-xs text-[var(--color-ink-muted)]">
                        {formatPrice(s.price)} • {formatMileage(s.mileage)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          {listing.seller_id && (
            <ContactSeller
              listingId={listing.id}
              sellerId={listing.seller_id}
            />
          )}
          <div className="ak-card p-5 text-sm">
            <h4 className="font-semibold">Why AK Rooster is safer</h4>
            <ul className="mt-2 space-y-2 text-xs text-[var(--color-ink-muted)]">
              <li>• Seller phone & email verified</li>
              <li>• Off-platform payment requests are blocked</li>
              <li>• Sold cars auto-disappear in 24 hrs</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
