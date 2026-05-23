import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Listing } from "@/lib/types";
import { ListingCard } from "@/components/listing-card";
import { HomeSearch } from "@/components/home-search";
import { CarWorldLogo } from "@/components/logo";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: featured } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("deal_score", { ascending: false, nullsFirst: false })
    .limit(8);

  const { data: fresh } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  const savedIds = await loadSavedIds(supabase);

  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader
          title="Today's best deals"
          subtitle="Sorted by deal score against market average — never by who paid the most."
          href="/search?sort=best-deal"
        />
        <Grid listings={featured ?? []} savedIds={savedIds} />

        <div className="mt-16" />
        <SectionHeader
          title="Just listed"
          subtitle="Fresh in the last 24 hours. Every listing is sold-status synced."
          href="/search?sort=newest"
        />
        <Grid listings={fresh ?? []} savedIds={savedIds} />

        <WhySection />
        <TrustSection />
        <Cta />
      </section>
    </div>
  );
}

async function loadSavedIds(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set<string>();
  const { data } = await supabase
    .from("saved_listings")
    .select("listing_id")
    .eq("user_id", user.id);
  return new Set((data ?? []).map((r) => r.listing_id));
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0710] via-[#3b0a14] to-[#7f1620] pb-16 pt-12 text-white md:pb-20 md:pt-16">
      <div className="absolute inset-0 opacity-20 mix-blend-screen [background-image:radial-gradient(circle_at_20%_20%,#f59e0b_0,transparent_40%),radial-gradient(circle_at_80%_70%,#dc2626_0,transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2 text-sm font-medium opacity-90">
          <CarWorldLogo className="h-6 w-6" />
          <span>Car World USA</span>
          <span className="ml-3 rounded-full bg-white/10 px-2 py-0.5 text-xs">
            New • the calmer way to car shop
          </span>
        </div>
        <div className="mt-8 grid items-end gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Buy and sell cars
              <br />
              <span className="text-[var(--color-accent)]">
                without the noise.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">
              A car marketplace without the dealer-ad blizzard. Verified
              sellers, honest deal scores against market average, no buried
              filters, no stale listings.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="ak-btn bg-white text-[var(--color-brand-ink)]"
              >
                Browse cars →
              </Link>
              <Link
                href="/sell"
                className="ak-btn border border-white/30 text-white hover:bg-white/10"
              >
                List your car free
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
              <Stat label="Avg deal vs market" value="−$1,840" />
              <Stat label="Verified sellers" value="92%" />
              <Stat label="Avg time to list" value="4 min" />
              <Stat label="Listing fee" value="$0" />
            </div>
          </div>
          <div className="md:pl-4">
            <HomeSearch variant="stacked" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">
        {label}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="hidden text-sm font-semibold text-[var(--color-brand)] hover:underline md:inline"
      >
        See all →
      </Link>
    </div>
  );
}

function Grid({
  listings,
  savedIds,
}: {
  listings: Listing[];
  savedIds: Set<string>;
}) {
  if (!listings.length) {
    return (
      <div className="ak-card p-10 text-center text-sm text-[var(--color-ink-muted)]">
        No listings yet. Be the first to{" "}
        <Link href="/sell" className="font-semibold text-[var(--color-brand)]">
          list a car
        </Link>
        .
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} saved={savedIds.has(l.id)} />
      ))}
    </div>
  );
}

function WhySection() {
  const items = [
    {
      title: "No dealer-ad clutter",
      body: "Sponsored listings are clearly tagged and capped at one per page. Search results aren't auctions for attention.",
    },
    {
      title: "Honest deal score",
      body: "Every listing gets a score against market average — visible on the card, not hidden behind a paywall.",
    },
    {
      title: "Visible filters",
      body: "Private-seller toggle, body type, year, mileage, deal score — all in the sticky filter rail, no menus.",
    },
    {
      title: "Fresh listings only",
      body: "Listings auto-expire and sellers are nudged weekly to confirm. Sold cars disappear in 24 hours.",
    },
    {
      title: "Scam-resistant messaging",
      body: "In-app messaging blocks off-platform payment requests. Verified-buyer badges shown to sellers.",
    },
    {
      title: "Quick list, free",
      body: "Paste a VIN, we auto-fill year/make/model/trim/specs. Most sellers list in under 5 minutes — $0.",
    },
  ];
  return (
    <section id="why" className="mt-24">
      <h2 className="text-3xl font-bold tracking-tight">
        Built around the things buyers and sellers actually want.
      </h2>
      <p className="mt-2 max-w-2xl text-[var(--color-ink-muted)]">
        We read every AutoTrader complaint we could find. Then we fixed them.
      </p>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <div key={i.title} className="ak-card p-6">
            <h3 className="text-base font-semibold">{i.title}</h3>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              {i.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section id="trust" className="ak-card mt-16 grid gap-6 p-8 md:grid-cols-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Trust & safety, built in.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Car World USA verifies seller phone and email before listings go live.
          Buyer DMs are screened for the common scam patterns sellers report on
          other platforms (wire transfers, off-platform payment requests, fake
          shipping companies).
        </p>
      </div>
      <ul className="grid gap-3 text-sm">
        <li className="flex gap-3">
          <Check />
          Phone + email verification on every listing
        </li>
        <li className="flex gap-3">
          <Check />
          Automatic VIN check — flagged if reported stolen or salvage
        </li>
        <li className="flex gap-3">
          <Check />
          Off-platform-payment language auto-blocked in DMs
        </li>
        <li className="flex gap-3">
          <Check />
          One-tap report — we act within 24 hours
        </li>
      </ul>
    </section>
  );
}

function Check() {
  return (
    <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[var(--color-good-soft)] text-[var(--color-good)]">
      ✓
    </span>
  );
}

function Cta() {
  return (
    <section className="mt-16 overflow-hidden rounded-2xl bg-[var(--color-brand)] p-8 text-white md:p-12">
      <div className="grid gap-4 md:grid-cols-[2fr_1fr] md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Selling? List in 4 minutes, free.
          </h2>
          <p className="mt-2 text-white/80">
            Paste your VIN and we'll auto-fill the boring parts. No surprise
            fees, no spotlight upsells.
          </p>
        </div>
        <div className="flex md:justify-end">
          <Link
            href="/sell"
            className="ak-btn bg-white text-[var(--color-brand-ink)]"
          >
            Start a free listing →
          </Link>
        </div>
      </div>
    </section>
  );
}
