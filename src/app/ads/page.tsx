import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { fetchMyAds, setAdStatusForm } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdsDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/ads");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const ads = await fetchMyAds();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Ads
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              Sponsored slots in the feed. Pay per impression. Pause anytime.
            </p>
          </div>
          <Link
            href="/ads/new"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-[var(--bg)] hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            New ad
          </Link>
        </div>

        {ads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <Megaphone className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
            <p className="text-[var(--fg-muted)]">
              You haven&apos;t created any ads yet.{" "}
              <Link href="/ads/new" className="text-[var(--accent)] hover:underline">
                Create one
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {ads.map((a) => {
              const spent = a.budget_spent_cents / 100;
              const total = a.budget_total_cents / 100;
              const pct = total > 0 ? Math.min(100, (a.budget_spent_cents / a.budget_total_cents) * 100) : 0;
              const ctr =
                a.impressions > 0 ? ((a.clicks / a.impressions) * 100).toFixed(1) : "—";
              return (
                <li
                  key={a.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5 space-y-3"
                >
                  <header className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/ads/${a.id}`}
                        className="font-medium text-[var(--fg)] hover:underline underline-offset-2 break-words"
                      >
                        {a.headline}
                      </Link>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                        {a.status}
                      </p>
                    </div>
                    <span
                      className={[
                        "shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        a.status === "active"
                          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                          : a.status === "exhausted"
                          ? "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]"
                          : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--fg-muted)]",
                      ].join(" ")}
                    >
                      {a.status}
                    </span>
                  </header>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <Stat label="Impressions" value={a.impressions.toLocaleString()} />
                    <Stat label="Clicks" value={a.clicks.toLocaleString()} />
                    <Stat label="CTR" value={`${ctr}${ctr === "—" ? "" : "%"}`} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between font-mono text-[10px] text-[var(--fg-subtle)]">
                      <span>
                        ${spent.toFixed(2)} of ${total.toFixed(2)} spent
                      </span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-3">
                    {a.status === "draft" && (
                      <StatusButton id={a.id} status="active" label="Launch" primary />
                    )}
                    {a.status === "active" && (
                      <StatusButton id={a.id} status="paused" label="Pause" />
                    )}
                    {a.status === "paused" && (
                      <StatusButton id={a.id} status="active" label="Resume" primary />
                    )}
                    {a.status !== "archived" && (
                      <StatusButton id={a.id} status="archived" label="Archive" danger />
                    )}
                    <Link
                      href={`/ads/${a.id}`}
                      className="press-shrink ml-auto inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
                    >
                      Details
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
        {label}
      </p>
      <p className="text-sm tabular-nums">{value}</p>
    </div>
  );
}

function StatusButton({
  id,
  status,
  label,
  primary,
  danger,
}: {
  id: string;
  status: "active" | "paused" | "archived";
  label: string;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <form action={setAdStatusForm}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={[
          "press-shrink inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium",
          primary
            ? "bg-[var(--accent)] text-[var(--bg)] hover:brightness-110"
            : danger
            ? "border border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)] hover:bg-[var(--danger)]/15"
            : "border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05]",
        ].join(" ")}
      >
        {label}
      </button>
    </form>
  );
}
