import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice, relativeTime } from "@/lib/format";
import { MyListingActions } from "@/components/my-listing-actions";
import { StatusBadge } from "@/components/status-badge";
import { OffersInbox, InboxOffer } from "@/components/offers-inbox";
import { SavedSearchesList, SavedSearch } from "@/components/saved-searches-list";
import { ListingStatus } from "@/lib/types";
import { DashboardStats } from "@/components/dashboard-stats";
import { VerifyBanner } from "@/components/verify-banner";

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
  const { data: { user } } = await supabase.auth.getUser();
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

  const savedPreview = await loadSavedPreview(supabase, user.id);
  const savedCount = savedPreview.length;

  const messagePreview = await loadMessagePreview(supabase, user.id);
  const messageCount = messagePreview.filter((m) => m.unread).length;

  const listingIds = (myListings ?? []).map((l) => l.id);
  const analytics = await loadListingAnalytics(supabase, listingIds);

  const receivedOffers = mapOffers(received as OfferRow[] | null, "seller");
  const sentOffers = mapOffers(sent as OfferRow[] | null, "buyer");

  const listingCount = myListings?.length ?? 0;
  const receivedOpenCount = receivedOffers.filter((o) => o.status === "pending").length;
  const sentOpenCount = sentOffers.filter((o) => o.status === "pending").length;
  const isSeller = listingCount > 0 || receivedOpenCount > 0;

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {isSeller
              ? "Manage your listings and offers, or browse cars."
              : "Track your offers, saved cars, and searches."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/sell" className="ak-btn ak-btn-primary">
            + List a car
          </Link>
          <Link href="/search" className="ak-btn ak-btn-ghost border">
            Browse cars
          </Link>
        </div>
      </div>

      <VerifyBanner verified={!!profile?.is_verified} />

      <div className="mt-6">
        <DashboardStats
          stats={[
            { label: "Active listings", value: listingCount, href: "#listings" },
            { label: "Open offers", value: isSeller ? receivedOpenCount : sentOpenCount, href: isSeller ? "#offers-received" : "#offers-sent", emphasize: true },
            { label: "Unread messages", value: messageCount, href: "/messages", emphasize: true },
            { label: "Saved cars", value: savedCount, href: "/saved" },
          ]}
        />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          {isSeller && (
            <section id="listings">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold">Your listings</h2>
                <Link href="/sell" className="text-sm font-medium text-[var(--color-brand)] hover:underline">
                  + New listing
                </Link>
              </div>
              {!myListings?.length ? (
                <EmptyState
                  title="You haven't listed a car yet."
                  ctaLabel="List your first car →"
                  ctaHref="/sell"
                />
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
                          {formatPrice(l.price)} • Listed{" "}
                          {relativeTime(l.created_at)}
                        </p>
                        <ListingMetrics
                          stats={analytics[l.id] ?? { saves: 0, conversations: 0, offers: 0 }}
                        />
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
          )}

          {isSeller && (
            <section id="offers-received">
              <h2 className="text-lg font-semibold">Offers received</h2>
              <p className="text-xs text-[var(--color-ink-muted)]">
                Accept, decline, or counter. Accepting marks the listing as
                Sale pending.
              </p>
              <div className="mt-3">
                <OffersInbox
                  offers={receivedOffers}
                  currentUserId={user.id}
                  role="seller"
                />
              </div>
            </section>
          )}

          <section id="offers-sent">
            <h2 className="text-lg font-semibold">Offers you've made</h2>
            <div className="mt-3">
              <OffersInbox
                offers={sentOffers}
                currentUserId={user.id}
                role="buyer"
              />
            </div>
          </section>

          <section id="searches">
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

        <aside className="space-y-8">
          <section>
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-lg font-semibold">Saved cars</h2>
              <Link
                href="/saved"
                className="text-xs font-medium text-[var(--color-brand)] hover:underline"
              >
                See all →
              </Link>
            </div>
            {!savedPreview.length ? (
              <EmptyState
                title="No saved cars yet."
                ctaLabel="Browse cars →"
                ctaHref="/search"
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {savedPreview.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/listings/${s.id}`}
                      className="ak-card flex items-center gap-3 p-2 hover:shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.photo}
                        alt=""
                        className="h-12 w-16 flex-none rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-ink-muted)]">
                          {formatPrice(s.price)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-lg font-semibold">Recent messages</h2>
              <Link
                href="/messages"
                className="text-xs font-medium text-[var(--color-brand)] hover:underline"
              >
                See all →
              </Link>
            </div>
            {!messagePreview.length ? (
              <EmptyState title="No messages yet." />
            ) : (
              <ul className="mt-3 space-y-2">
                {messagePreview.slice(0, 4).map((m) => (
                  <li
                    key={m.id}
                    className={`ak-card p-3 text-xs ${
                      m.unread ? "border-2 border-[var(--color-brand)]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/listings/${m.listing_id}`}
                        className="font-semibold hover:underline"
                      >
                        {m.listing_title}
                      </Link>
                      {m.unread && (
                        <span className="rounded-full bg-[var(--color-brand)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[var(--color-ink-muted)]">
                      <b>{m.from}:</b> {m.body}
                    </p>
                    {m.flagged && (
                      <span className="mt-1 inline-block rounded bg-[var(--color-warn-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-warn)]">
                        Flagged
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Account</h2>
            <div className="ak-card mt-3 space-y-2 p-4 text-sm">
              <DetailRow label="Name" value={profile?.full_name ?? "—"} />
              <DetailRow label="Email" value={user.email ?? "—"} />
              <DetailRow
                label="Verified"
                value={profile?.is_verified ? "Yes" : "Pending"}
              />
              <DetailRow
                label="Joined"
                value={relativeTime(
                  profile?.created_at ??
                    user.created_at ??
                    new Date().toISOString(),
                )}
              />
              <div className="pt-2 text-xs">
                <Link
                  href="/account/profile"
                  className="font-medium text-[var(--color-brand)] hover:underline"
                >
                  Edit profile or change password →
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function loadListingAnalytics(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listingIds: string[],
): Promise<Record<string, { saves: number; conversations: number; offers: number }>> {
  if (!listingIds.length) return {};
  const [saves, convos, offers] = await Promise.all([
    supabase
      .from("saved_listings")
      .select("listing_id")
      .in("listing_id", listingIds),
    supabase
      .from("conversations")
      .select("listing_id")
      .in("listing_id", listingIds),
    supabase
      .from("offers")
      .select("listing_id,status")
      .in("listing_id", listingIds)
      .eq("status", "pending"),
  ]);
  const out: Record<
    string,
    { saves: number; conversations: number; offers: number }
  > = {};
  for (const id of listingIds)
    out[id] = { saves: 0, conversations: 0, offers: 0 };
  for (const r of saves.data ?? []) {
    const k = (r as { listing_id: string }).listing_id;
    if (out[k]) out[k].saves++;
  }
  for (const r of convos.data ?? []) {
    const k = (r as { listing_id: string }).listing_id;
    if (out[k]) out[k].conversations++;
  }
  for (const r of offers.data ?? []) {
    const k = (r as { listing_id: string }).listing_id;
    if (out[k]) out[k].offers++;
  }
  return out;
}

function ListingMetrics({
  stats,
}: {
  stats: { saves: number; conversations: number; offers: number };
}) {
  const { saves, conversations: convos, offers } = stats;
  if (!saves && !convos && !offers) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--color-ink-muted)]">
      <span>
        <b>{saves}</b> save{saves === 1 ? "" : "s"}
      </span>
      <span>•</span>
      <span>
        <b>{convos}</b> message{convos === 1 ? "" : "s"}
      </span>
      <span>•</span>
      <span>
        <b>{offers}</b> open offer{offers === 1 ? "" : "s"}
      </span>
    </p>
  );
}

async function loadSavedPreview(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("saved_listings")
    .select("listing_id, listings(id,title,price,photos)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(4);
  return (data ?? [])
    .map((row) => {
      const l = (row as unknown as { listings: { id: string; title: string; price: number; photos: string[] } | null }).listings;
      if (!l) return null;
      return { id: l.id, title: l.title, price: Number(l.price), photo: l.photos?.[0] ?? "" };
    })
    .filter(Boolean) as { id: string; title: string; price: number; photo: string }[];
}

async function loadMessagePreview(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, seller_id, buyer_read_at, seller_read_at, listings(title), messages(body,created_at,sender_id,flagged_scam)",
    )
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(4);
  return (data ?? []).map((c) => {
    type M = { body: string; created_at: string; sender_id: string; flagged_scam: boolean };
    const messages = ((c as unknown as { messages: M[] }).messages ?? [])
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const last = messages[0];
    const cast = c as unknown as {
      id: string;
      listing_id: string;
      buyer_id: string;
      seller_id: string;
      buyer_read_at: string | null;
      seller_read_at: string | null;
      listings: { title: string } | null;
    };
    const myReadAt =
      cast.buyer_id === userId ? cast.buyer_read_at : cast.seller_read_at;
    const threshold = myReadAt ? new Date(myReadAt).getTime() : 0;
    const unread =
      last != null &&
      last.sender_id !== userId &&
      new Date(last.created_at).getTime() > threshold;
    return {
      id: cast.id,
      listing_id: cast.listing_id,
      listing_title: cast.listings?.title ?? "Listing",
      body: last?.body ?? "—",
      from: last?.sender_id === userId ? "You" : "Other party",
      flagged: !!last?.flagged_scam,
      unread,
    };
  });
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs uppercase tracking-wide text-[var(--color-ink-muted)]">
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function EmptyState({
  title,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="ak-card mt-3 p-6 text-center text-sm text-[var(--color-ink-muted)]">
      <p>{title}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-2 inline-block text-sm font-semibold text-[var(--color-brand)] hover:underline"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
