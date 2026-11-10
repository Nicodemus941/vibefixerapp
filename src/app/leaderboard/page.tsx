import Link from "next/link";
import { redirect } from "next/navigation";
import { HandHeart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import { Avatar } from "@/components/Avatar";
import { compareHelpful, describeHelp, HELP_WEIGHTS, type HelpfulRow } from "@/lib/helpful";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/leaderboard");

  const [{ data: profile }, { data, error }] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle(),
    supabase.rpc("leaderboard_most_helpful", { limit_count: 20 }),
  ]);

  const rows = (data ?? [])
    .map((r) => ({
      user_id: r.user_id,
      company_name: r.company_name,
      avatar_url: r.avatar_url,
      name: r.display_name,
      dealsDelivered: Number(r.deals_delivered),
      needsHelped: Number(r.needs_helped),
      reviewsReceived: Number(r.reviews_received),
      avgRating: r.avg_rating === null ? null : Number(r.avg_rating),
    }))
    .sort((a: HelpfulRow, b: HelpfulRow) => compareHelpful(a, b));

  const month = new Date().toLocaleString("en-US", { month: "long", timeZone: "UTC" });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader displayName={profile?.display_name ?? "founder"} role={profile?.role ?? "user"} />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <HandHeart className="h-5 w-5 text-[var(--accent)]" aria-hidden />
            Most helpful this month
          </h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            People who showed up for others in {month}. Ranked by deals delivered, needs they
            helped with that turned into a real conversation, and reviews received. No follower
            counts, no reactions, no money totals. Starts fresh on the 1st.
          </p>
        </div>

        {error ? (
          <p className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--fg-muted)]">
            The board is not available right now.
          </p>
        ) : rows.length === 0 ? (
          <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-1)] p-6 text-center">
            <p className="text-sm text-[var(--fg-muted)]">
              Nobody yet this month. Find a need you can help with on the{" "}
              <Link href="/feed" className="font-semibold text-[var(--accent-text)] hover:underline">
                feed
              </Link>
              .
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-[var(--border)] rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            {rows.map((r, i) => (
              <li key={r.user_id}>
                <Link
                  href={`/u/${r.user_id}`}
                  className="flex items-center gap-3 p-4 min-h-11 hover:bg-[var(--surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
                >
                  <span className="w-6 num text-sm text-[var(--fg-subtle)]" aria-label={`Rank ${i + 1}`}>
                    {i + 1}
                  </span>
                  <Avatar name={r.name} url={r.avatar_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--fg)] truncate">{r.name}</p>
                    {r.company_name && (
                      <p className="text-xs text-[var(--fg-subtle)] truncate">{r.company_name}</p>
                    )}
                    <p className="mt-0.5 text-[13px] text-[var(--fg-muted)]">{describeHelp(r)}</p>
                  </div>
                  {r.avgRating !== null && (
                    <span className="shrink-0 num text-sm text-[var(--fg-muted)]" aria-label={`Average rating ${r.avgRating} out of 5`}>
                      {r.avgRating.toFixed(1)} ★
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        )}

        <section className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--fg-muted)]">
          <h2 className="font-semibold text-[var(--fg)]">How it is counted</h2>
          <ul className="mt-2 space-y-1">
            <li>A deal you delivered and got released: {HELP_WEIGHTS.dealsDelivered} points.</li>
            <li>
              You pressed I can help on a need and they replied: {HELP_WEIGHTS.needsHelped} points.
            </li>
            <li>A review you received: {HELP_WEIGHTS.reviewsReceived} point.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
