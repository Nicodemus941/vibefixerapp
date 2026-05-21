import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice, relativeTime } from "@/lib/format";
import { MyListingActions } from "@/components/my-listing-actions";
import { StatusBadge } from "@/components/status-badge";
import { OffersInbox, InboxOffer } from "@/components/offers-inbox";
import { SavedSearchesList, SavedSearch } from "@/components/saved-searches-list";
import { ListingStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface OfferRow {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  message: string | null;
  status: string;
  counter_amount: number | null;
  created_at: string;
  listings: {
    title: string;
    price: number;
    status: string;
  } | null;
  buyer: { full_name: string | null } | null;
  seller: { full_name: string | null } | null;
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/account");

  const [
    { data: profile },
    { data: myListings },
    { data: received },
    { data: sent },
    { data: savedSearches },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("listings")
      .select("id,title,price,status,created_at,photos")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select(
        "id,listing_id,buyer_id,seller_id,amount,message,status,counter_amount,created_at, listings(title,price,status), buyer:profiles!offers_buyer_id_fkey(full_name)",
      )
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("offers")
      .select(
        "id,listing_id,buyer_id,seller_id,amount,message,status,counter_amount,created_at, listings(title,price,status), seller:profiles!offers_seller_id_fkey(full_name)",
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_searches")
      .select("id,name,query,alerts_enabled,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const receivedOffers = mapOffers(received as OfferRow[] | null, "seller");
  const sentOffers = mapOffers(sent as OfferRow[] | null, "buyer");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Your account</h1>

      <div className="ak-card mt-6 grid gap-4 p-5 sm:grid-cols-2">
        <Detail label="Name" value={profile?.full_name ?? "—"} />
        <Detail label="Email" value={user.email ?? "—"} />
        <Detail
          label="Verified"
          value={profile?.is_verified ? "Yes" : "Pending"}
        />
        <Detail
          label="Member since"
          value={
            profile?.created_at
              ? relativeTime(profile.created_at)
              : relativeTime(user.created_at ?? new Date().toISOString())
          }
        />
      </div>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Your listings</h2>
          <Link href="/sell" className="ak-btn ak-btn-primary">
            + New listing
          </Link>
        </div>
        {!myListings?.length ? (
          <div className="ak-card mt-4 p-8 text-center text-sm text-[var(--color-ink-muted)]">
            You haven't listed a car yet.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {myListings.map((l) => (
              <li
                key={l.id}
                className="ak-card flex flex-col gap-3 p-3 md:flex-row md:items-center"
              >
                {l.photos?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photos[0]}
                    alt=""
                    className="h-16 w-24 flex-none rounded-md object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/listings/${l.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {l.title}
                    </Link>
                    <StatusBadge status={l.status as ListingStatus} />
                  </div>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {formatPrice(l.price)} • Listed {relativeTime(l.created_at)}
                  </p>
                </div>
                <MyListingActions
                  listingId={l.id}
                  status={l.status as ListingStatus}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Offers received</h2>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Accept, decline, or counter offers from buyers. Accepting marks the
          listing as Sale pending.
        </p>
        <div className="mt-3">
          <OffersInbox
            offers={receivedOffers}
            currentUserId={user.id}
            role="seller"
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Offers you've made</h2>
        <div className="mt-3">
          <OffersInbox
            offers={sentOffers}
            currentUserId={user.id}
            role="buyer"
          />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">Saved searches</h2>
        <p className="text-xs text-[var(--color-ink-muted)]">
          Get an email whenever a new listing matches.
        </p>
        <div className="mt-3">
          <SavedSearchesList
            searches={(savedSearches as SavedSearch[] | null) ?? []}
          />
        </div>
      </section>
    </div>
  );
}

function mapOffers(
  rows: OfferRow[] | null,
  perspective: "seller" | "buyer",
): InboxOffer[] {
  return (rows ?? []).map((r) => ({
    id: r.id,
    listing_id: r.listing_id,
    buyer_id: r.buyer_id,
    seller_id: r.seller_id,
    amount: Number(r.amount),
    message: r.message,
    status: r.status,
    counter_amount: r.counter_amount != null ? Number(r.counter_amount) : null,
    created_at: r.created_at,
    listing_title: r.listings?.title ?? "Listing",
    listing_price: Number(r.listings?.price ?? 0),
    listing_status: r.listings?.status ?? "active",
    other_party_name:
      (perspective === "seller"
        ? r.buyer?.full_name
        : r.seller?.full_name) ?? "Someone",
  }));
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
