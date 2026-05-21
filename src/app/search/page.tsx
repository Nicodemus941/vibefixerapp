import { Suspense } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListingFilters } from "@/components/listing-filters";
import { ListingCard } from "@/components/listing-card";
import { SortSelect } from "@/components/sort-select";
import { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | undefined>>;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("listings").select("*").eq("status", "active");

  if (sp.q) {
    const term = sp.q.replace(/[%_]/g, "");
    query = query.or(
      `title.ilike.%${term}%,description.ilike.%${term}%,make.ilike.%${term}%,model.ilike.%${term}%`,
    );
  }
  if (sp.make) query = query.eq("make", sp.make);
  if (sp.body) query = query.eq("body_type", sp.body);
  if (sp.yearMin) query = query.gte("year", Number(sp.yearMin));
  if (sp.yearMax) query = query.lte("year", Number(sp.yearMax));
  if (sp.priceMin) query = query.gte("price", Number(sp.priceMin));
  if (sp.priceMax) query = query.lte("price", Number(sp.priceMax));
  if (sp.mileageMax) query = query.lte("mileage", Number(sp.mileageMax));
  if (sp.sellerType && sp.sellerType !== "any")
    query = query.eq("seller_type", sp.sellerType);
  if (sp.state) query = query.eq("location_state", sp.state);

  switch (sp.sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "mileage-asc":
      query = query.order("mileage", { ascending: true });
      break;
    case "year-desc":
      query = query.order("year", { ascending: false });
      break;
    default:
      query = query.order("deal_score", { ascending: false, nullsFirst: false });
  }

  const { data: listings, error } = await query.limit(60);

  const savedIds = await loadSavedIds(supabase);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Browse cars</h1>
          <p className="text-sm text-[var(--color-ink-muted)]">
            {listings?.length ?? 0} results • Sponsored listings are tagged, never disguised.
          </p>
        </div>
        <Suspense>
          <SortSelect />
        </Suspense>
      </div>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <Suspense>
          <ListingFilters />
        </Suspense>
        <section>
          {error && (
            <div className="ak-card border-[var(--color-bad)] bg-[var(--color-bad-soft)] p-4 text-sm text-[var(--color-bad)]">
              Couldn't load listings: {error.message}
            </div>
          )}
          {!listings?.length && !error && (
            <div className="ak-card p-10 text-center text-sm text-[var(--color-ink-muted)]">
              No matches. Try widening your filters.
            </div>
          )}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {(listings as Listing[] | null)?.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                saved={savedIds.has(l.id)}
              />
            ))}
          </div>
        </section>
      </div>
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
