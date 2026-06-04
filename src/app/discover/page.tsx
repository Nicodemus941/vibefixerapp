import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { Avatar } from "@/components/Avatar";
import { INDUSTRIES } from "@/lib/industries";
import { fetchPublicProviders } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Discover founders · Loop",
  description:
    "Browse founders, freelancers, and operators offering services on Loop — by industry and category. Hire, collaborate, or trade help.",
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "Discover founders · Loop",
    description:
      "Browse founders offering services on Loop — by industry and category.",
    type: "website",
    url: "https://loopfounders.com/discover",
  },
};

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const industry = typeof sp.industry === "string" ? sp.industry : null;
  const category = typeof sp.category === "string" ? sp.category : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const providers = await fetchPublicProviders({ industry, category, limit: 40 });

  // Distinct categories across the visible set — surfaces the filter
  // bar dynamically instead of hardcoding category strings.
  const categorySet = new Set<string>();
  providers.forEach((p) => p.offers.forEach((o) => categorySet.add(o.category)));
  const categories = Array.from(categorySet).sort();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {user ? (
        <FeedHeader
          displayName={viewerProfile?.display_name ?? "founder"}
          role={viewerProfile?.role ?? "user"}
        />
      ) : (
        <PublicHeader nextPath="/discover" />
      )}
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Discover founders
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Founders, freelancers, and operators offering services on Loop. Filter by industry or category.
          </p>
        </div>

        <div className="space-y-2">
          <Filter label="Industry" all="/discover" current={industry}>
            {INDUSTRIES.map((i) => (
              <FilterChip
                key={i}
                href={`/discover?industry=${encodeURIComponent(i)}${category ? `&category=${encodeURIComponent(category)}` : ""}`}
                active={industry === i}
                label={i}
              />
            ))}
          </Filter>
          {categories.length > 0 && (
            <Filter label="Category" all="/discover" current={category}>
              {categories.map((c) => (
                <FilterChip
                  key={c}
                  href={`/discover?category=${encodeURIComponent(c)}${industry ? `&industry=${encodeURIComponent(industry)}` : ""}`}
                  active={category === c}
                  label={c}
                />
              ))}
            </Filter>
          )}
        </div>

        {providers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <p className="text-[var(--fg-muted)]">
              {industry || category
                ? "No matches with these filters yet."
                : "No active providers yet — be one of the first."}
            </p>
            {!user && (
              <Link
                href="/login?next=/onboarding"
                className="press-shrink mt-3 inline-flex items-center rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110"
              >
                Sign up to list your services
              </Link>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {providers.map((p) => (
              <li
                key={p.user_id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5"
              >
                <header className="flex items-start gap-3">
                  <Link href={`/c/${p.user_id}`} aria-label={`View ${p.display_name}'s card`}>
                    <Avatar name={p.display_name} url={p.avatar_url} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/c/${p.user_id}`}
                      className="font-medium text-[var(--fg)] hover:underline underline-offset-2 break-words"
                    >
                      {p.display_name}
                    </Link>
                    <p className="text-xs text-[var(--fg-muted)] break-words">
                      {p.current_position_title ? (
                        <>
                          {p.current_position_title}
                          {p.current_position_org_name &&
                            (p.current_position_org_slug ? (
                              <>
                                {" at "}
                                <Link href={`/o/${p.current_position_org_slug}`} className="hover:underline">
                                  {p.current_position_org_name}
                                </Link>
                              </>
                            ) : (
                              <> at {p.current_position_org_name}</>
                            ))}
                        </>
                      ) : (
                        p.company_name ?? <span className="text-[var(--fg-subtle)] italic">Independent</span>
                      )}
                    </p>
                    {p.industry && (
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mt-0.5">
                        {p.industry}
                      </p>
                    )}
                  </div>
                  {p.review_count > 0 && (
                    <span
                      className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] text-[var(--fg-muted)] tabular-nums"
                      title={`${p.review_count} reviews · reputation ${p.reputation_score.toFixed(0)}`}
                    >
                      <Star className="h-3 w-3" />
                      {p.review_count}
                    </span>
                  )}
                </header>
                {p.bio && (
                  <p className="mt-3 text-sm text-[var(--fg-muted)] line-clamp-2 whitespace-pre-wrap">
                    {p.bio}
                  </p>
                )}
                {p.offers.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {p.offers.map((o) => (
                      <li key={o.id} className="text-sm text-[var(--fg)] flex items-baseline justify-between gap-2">
                        <span className="truncate">{o.title}</span>
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                          {o.category}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 border-t border-[var(--border)] pt-3 flex items-center gap-2">
                  <Link
                    href={`/c/${p.user_id}`}
                    className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110"
                  >
                    View profile
                  </Link>
                  {!user && (
                    <Link
                      href={`/login?next=/c/${p.user_id}`}
                      className="press-shrink inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
                    >
                      Sign in to message
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function Filter({
  label,
  all,
  current,
  children,
}: {
  label: string;
  all: string;
  current: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={all} active={!current} label="All" />
        {children}
      </div>
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={[
        "press-shrink inline-flex items-center rounded-full px-2.5 py-1 text-xs font-mono transition-colors",
        active
          ? "bg-[var(--accent)] text-[var(--bg)]"
          : "border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.04]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}
