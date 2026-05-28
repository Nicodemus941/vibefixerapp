import Link from "next/link";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/app/reviews/_components/ReviewList";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/leaderboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const [closers, earners, rated] = await Promise.all([
    supabase.rpc("leaderboard_top_closers", { since_days: 30, limit_count: 10 }),
    supabase.rpc("leaderboard_top_earners", { since_days: 30, limit_count: 10 }),
    supabase.rpc("leaderboard_top_rated", { limit_count: 10 }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--accent)]" />
            Leaderboard
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Receipts, not endorsements. Resets every 30 days for closers and earners.
          </p>
        </div>

        <Section
          title="Top closers — last 30 days"
          rows={(closers.data ?? []).map((r, i) => ({
            user_id: r.user_id,
            display_name: r.display_name,
            company_name: r.company_name,
            avatar_url: r.avatar_url,
            rank: i + 1,
            metric: `${r.deals_shipped} deal${r.deals_shipped === 1 ? "" : "s"}`,
            secondary: `$${Number(r.total_amount).toLocaleString()} total`,
          }))}
        />

        <Section
          title="Top earners — last 30 days"
          rows={(earners.data ?? []).map((r, i) => ({
            user_id: r.user_id,
            display_name: r.display_name,
            company_name: r.company_name,
            avatar_url: r.avatar_url,
            rank: i + 1,
            metric: `$${Number(r.earned).toLocaleString()}`,
            secondary: `${r.deals} deal${r.deals === 1 ? "" : "s"}`,
          }))}
        />

        <Section
          title="Top rated"
          rows={(rated.data ?? []).map((r, i) => ({
            user_id: r.user_id,
            display_name: r.display_name,
            company_name: r.company_name,
            avatar_url: r.avatar_url,
            rank: i + 1,
            metric: `${Number(r.reputation_score).toFixed(0)}`,
            secondary: `${r.review_count} review${r.review_count === 1 ? "" : "s"}`,
            stars: Math.round(Number(r.reputation_score) / 20),
          }))}
        />
      </main>
    </div>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    user_id: string;
    display_name: string;
    company_name: string | null;
    avatar_url: string | null;
    rank: number;
    metric: string;
    secondary: string;
    stars?: number;
  }>;
}) {
  return (
    <section className="space-y-2">
      <p className="eyebrow">{title}</p>
      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-6 text-center">
          <p className="text-sm text-[var(--fg-muted)]">No data yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
          {rows.map((r) => (
            <li key={r.user_id}>
              <Link
                href={`/u/${r.user_id}`}
                className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
              >
                <span className="w-6 font-mono text-sm text-[var(--fg-subtle)] tabular-nums">
                  {r.rank}
                </span>
                <Avatar name={r.display_name} url={r.avatar_url} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--fg)] truncate">{r.display_name}</p>
                  {r.company_name && (
                    <p className="text-xs text-[var(--fg-subtle)] truncate">
                      {r.company_name}
                    </p>
                  )}
                  {typeof r.stars === "number" && (
                    <div className="mt-1">
                      <Stars value={r.stars} />
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-sm text-[var(--accent)] tabular-nums">
                    {r.metric}
                  </p>
                  <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
                    {r.secondary}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
