import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing-card";
import { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/saved");

  const { data: saved } = await supabase
    .from("saved_listings")
    .select("listing_id, listings(*)")
    .eq("user_id", user.id);

  const listings =
    (saved
      ?.map((row) => (row as unknown as { listings: Listing | null }).listings)
      .filter(Boolean) as Listing[] | undefined) ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Saved cars</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        We'll alert you if any of these drop in price or sell.
      </p>

      {listings.length === 0 ? (
        <div className="ak-card mt-8 p-10 text-center text-sm text-[var(--color-ink-muted)]">
          No saved cars yet.{" "}
          <Link href="/search" className="font-semibold text-[var(--color-brand)]">
            Find one →
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} saved />
          ))}
        </div>
      )}
    </div>
  );
}
