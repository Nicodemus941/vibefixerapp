import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";

export const dynamic = "force-dynamic";

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/ads/${id}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: ad } = await supabase
    .from("advertisements")
    .select("*")
    .eq("id", id)
    .eq("sponsor_id", user.id)
    .maybeSingle();
  if (!ad) notFound();

  const total = ad.budget_total_cents / 100;
  const spent = ad.budget_spent_cents / 100;
  const pct = total > 0 ? Math.min(100, (ad.budget_spent_cents / ad.budget_total_cents) * 100) : 0;
  const ctr = ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <Link
          href="/ads"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All ads
        </Link>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <h1 className="text-xl font-semibold tracking-tight break-words">{ad.headline}</h1>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
              {ad.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--fg-muted)] whitespace-pre-wrap break-words">{ad.body}</p>
          {ad.creative_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={ad.creative_url} alt="" className="mt-3 rounded-xl border border-[var(--border)] max-h-64 w-full object-cover" />
          )}
          <a
            href={ad.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs font-mono text-[var(--accent)] hover:underline break-all"
          >
            {ad.cta_label} → {ad.target_url}
          </a>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Impressions" value={ad.impressions.toLocaleString()} />
            <Stat label="Clicks" value={ad.clicks.toLocaleString()} />
            <Stat label="CTR" value={ad.impressions > 0 ? `${ctr.toFixed(2)}%` : "—"} />
            <Stat label="CPM" value={`$${((ad.cost_per_impression_cents * 10) / 100).toFixed(2)}`} />
          </div>
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-[var(--fg-subtle)]">
              <span>${spent.toFixed(2)} of ${total.toFixed(2)} spent</span>
              <span>{pct.toFixed(0)}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {ad.target_industries && ad.target_industries.length > 0 && (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mb-1">
                Targeting industries
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ad.target_industries.map((i) => (
                  <span
                    key={i}
                    className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)]"
                  >
                    {i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
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
