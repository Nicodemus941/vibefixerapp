import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ListingEditor } from "@/components/listing-editor";
import { Listing } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/sign-in?next=/listings/${id}/edit`);

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single<Listing>();

  if (!listing) notFound();
  if (listing.seller_id !== user.id) redirect(`/listings/${id}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">
        Edit your listing
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        Changes go live immediately. Updates the listing's "Last verified"
        timestamp so it stays fresh in search.
      </p>
      <ListingEditor initial={listing} />
    </div>
  );
}
