import { createAdminClient } from "@/lib/supabase/admin";

// Server component. Fetches live counts and only renders the strip
// when there's enough activity to be credible (>= 10 onboarded
// founders). Below that threshold we return null so the landing
// doesn't read like "3 people use this product".
//
// All reads go through the admin client because profiles RLS is
// authenticated-only — this section needs to render for anonymous
// visitors hitting `/`. Counts only; no PII leaves the server.

const MIN_FOUNDERS_TO_SHOW = 10;

type Stat = { label: string; value: string };

async function fetchStats(): Promise<{ shown: boolean; stats: Stat[] }> {
  try {
    const admin = createAdminClient();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [foundersResp, offersResp, recentMatchesResp, dealsResp] = await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("onboarding_complete", true),
      admin.from("offers").select("id", { count: "exact", head: true }).eq("is_active", true),
      admin.from("matches").select("id", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      admin.from("engagements").select("amount").eq("escrow_status", "released"),
    ]);

    const founders = foundersResp.count ?? 0;
    if (founders < MIN_FOUNDERS_TO_SHOW) {
      return { shown: false, stats: [] };
    }

    const offers = offersResp.count ?? 0;
    const matchesThisWeek = recentMatchesResp.count ?? 0;
    const totalVolume = (dealsResp.data ?? []).reduce(
      (sum, e) => sum + Number(e.amount ?? 0),
      0,
    );
    const volumeLabel =
      totalVolume >= 1_000_000
        ? `$${(totalVolume / 1_000_000).toFixed(1)}M`
        : totalVolume >= 1_000
        ? `$${Math.round(totalVolume / 1_000)}k`
        : `$${Math.round(totalVolume)}`;

    return {
      shown: true,
      stats: [
        { label: "founders shipping", value: founders.toLocaleString() },
        { label: "active offers", value: offers.toLocaleString() },
        { label: "matches this week", value: matchesThisWeek.toLocaleString() },
        { label: "value moved", value: volumeLabel },
      ],
    };
  } catch {
    return { shown: false, stats: [] };
  }
}

export async function LandingStats() {
  const { shown, stats } = await fetchStats();
  if (!shown) return null;

  return (
    <section
      aria-label="Loop activity"
      className="relative py-12 sm:py-16 px-6 border-t border-[var(--border)]"
    >
      <div data-reveal className="reveal max-w-5xl mx-auto">
        <p className="eyebrow text-center mb-6">Real receipts</p>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="reveal-child rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/70 px-4 py-5 text-center"
              style={{ ["--stagger-delay" as string]: `${i * 80}ms` }}
            >
              <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                {s.label}
              </dt>
              <dd className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight tabular-nums text-[var(--fg)]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
