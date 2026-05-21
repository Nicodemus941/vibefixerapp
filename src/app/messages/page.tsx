import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

interface Convo {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listings: { id: string; title: string; photos: string[] } | null;
  messages:
    | { body: string; created_at: string; flagged_scam: boolean }[]
    | null;
}

export default async function MessagesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/messages");

  const { data: convos } = await supabase
    .from("conversations")
    .select(
      "id, listing_id, buyer_id, seller_id, created_at, listings(id,title,photos), messages(body,created_at,flagged_scam)",
    )
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const list = (convos as Convo[] | null) ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        All conversations are screened for scam patterns. You'll see a warning
        on flagged messages.
      </p>

      {list.length === 0 ? (
        <div className="ak-card mt-6 p-10 text-center text-sm text-[var(--color-ink-muted)]">
          No conversations yet — start one from any listing.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((c) => {
            // Sort newest-first; stable secondary sort on body so simultaneous
            // writes have a deterministic ordering instead of relying on insert order.
            const last = c.messages
              ?.slice()
              .sort((a, b) => {
                if (a.created_at !== b.created_at)
                  return a.created_at < b.created_at ? 1 : -1;
                return a.body < b.body ? 1 : -1;
              })[0];
            return (
              <li key={c.id} className="ak-card p-4">
                <Link
                  href={`/listings/${c.listing_id}`}
                  className="flex items-start gap-3"
                >
                  {c.listings?.photos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.listings.photos[0]}
                      alt=""
                      className="h-16 w-20 flex-none rounded-md object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {c.listings?.title ?? "Listing"}
                    </p>
                    <p className="truncate text-xs text-[var(--color-ink-muted)]">
                      {last?.body ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      {last ? relativeTime(last.created_at) : ""}
                      {last?.flagged_scam && (
                        <span className="ml-2 rounded bg-[var(--color-warn-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-warn)]">
                          Flagged
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
