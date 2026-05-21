import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrice, relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: myListings } = await supabase
    .from("listings")
    .select("id,title,price,status,created_at,photos")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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

      <div className="mt-10 flex items-end justify-between gap-3">
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
            <li key={l.id} className="ak-card flex items-center gap-3 p-3">
              {l.photos?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.photos[0]}
                  alt=""
                  className="h-16 w-20 flex-none rounded-md object-cover"
                />
              )}
              <div className="flex-1">
                <Link
                  href={`/listings/${l.id}`}
                  className="text-sm font-semibold hover:underline"
                >
                  {l.title}
                </Link>
                <p className="text-xs text-[var(--color-ink-muted)]">
                  {formatPrice(l.price)} • {l.status} •{" "}
                  {relativeTime(l.created_at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
