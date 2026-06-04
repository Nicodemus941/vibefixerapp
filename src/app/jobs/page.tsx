import Link from "next/link";
import { Briefcase, Building2, MapPin, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { fetchJobMatches } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Founder jobs · Loop",
  description:
    "Roles posted by founders, for founders. Browse open positions across SaaS, fintech, growth marketing, design, and engineering on Loop.",
};

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
  volunteer: "Volunteer",
};

const REMOTE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

const EMPLOYMENT_FILTERS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "volunteer", label: "Volunteer" },
];

const REMOTE_FILTERS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; remote?: string }>;
}) {
  const sp = await searchParams;
  const employmentType =
    sp.type && EMPLOYMENT_FILTERS.some((f) => f.value === sp.type) ? sp.type : null;
  const remotePolicy =
    sp.remote && REMOTE_FILTERS.some((f) => f.value === sp.remote) ? sp.remote : null;
  const filtersActive = Boolean(employmentType || remotePolicy);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const matches = await fetchJobMatches(40, {
    employmentType,
    remotePolicy,
  });
  const personalized = matches.some((m) => m.similarity != null);

  function filterUrl(next: Partial<{ type: string | null; remote: string | null }>) {
    const params = new URLSearchParams();
    const t = next.type !== undefined ? next.type : employmentType;
    const r = next.remote !== undefined ? next.remote : remotePolicy;
    if (t) params.set("type", t);
    if (r) params.set("remote", r);
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {user ? (
        <FeedHeader
          displayName={profile?.display_name ?? "founder"}
          role={profile?.role ?? "user"}
        />
      ) : (
        <PublicHeader nextPath="/jobs" />
      )}
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Jobs
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              {personalized
                ? "Ranked by similarity to what you said you need."
                : user
                ? "Newest job postings across Loop."
                : "Roles posted by founders, for founders."}
            </p>
          </div>
          <Link
            href={user ? "/jobs/new" : "/login?next=/jobs/new"}
            className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-[var(--bg)] hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            Post a job
          </Link>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <FilterRow label="Type" all={filterUrl({ type: null })} active={!employmentType}>
            {EMPLOYMENT_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                href={filterUrl({ type: f.value })}
                active={employmentType === f.value}
                label={f.label}
              />
            ))}
          </FilterRow>
          <FilterRow label="Location" all={filterUrl({ remote: null })} active={!remotePolicy}>
            {REMOTE_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                href={filterUrl({ remote: f.value })}
                active={remotePolicy === f.value}
                label={f.label}
              />
            ))}
          </FilterRow>
          {filtersActive && (
            <Link
              href="/jobs"
              className="inline-flex items-center text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--fg)]"
            >
              Clear filters ↺
            </Link>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <Briefcase className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
            <p className="text-[var(--fg-muted)]">
              {filtersActive ? (
                <>
                  No matches with these filters.{" "}
                  <Link href="/jobs" className="text-[var(--accent)] hover:underline">
                    Clear them
                  </Link>{" "}
                  to see everything.
                </>
              ) : (
                <>
                  No open jobs yet. Be the first —{" "}
                  <Link href="/jobs/new" className="text-[var(--accent)] hover:underline">
                    post one
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {matches.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/jobs/${m.id}`}
                  className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:p-5 hover:border-[var(--border-strong)] transition-colors"
                >
                  <header className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--surface-3)] flex items-center justify-center text-[var(--fg-muted)] overflow-hidden">
                      {m.organization_logo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={m.organization_logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--fg)] break-words">{m.title}</p>
                      <p className="text-sm text-[var(--fg-muted)] break-words">
                        {m.organization_slug ? (
                          <span className="hover:underline underline-offset-2">{m.organization_name}</span>
                        ) : (
                          <span className="text-[var(--fg-subtle)] italic">Independent</span>
                        )}
                      </p>
                    </div>
                    {m.similarity != null && m.similarity > 0.5 && (
                      <span
                        className="shrink-0 font-mono text-[10px] tabular-nums px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 inline-flex items-center gap-1"
                        title="Embedding similarity to your needs"
                      >
                        <Sparkles className="h-3 w-3" />
                        match {Math.round(m.similarity * 100)}%
                      </span>
                    )}
                  </header>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
                    <Pill>{TYPE_LABELS[m.employment_type]}</Pill>
                    <Pill>{REMOTE_LABELS[m.remote_policy]}</Pill>
                    {m.location && (
                      <Pill>
                        <MapPin className="h-3 w-3 inline mr-0.5" />
                        {m.location}
                      </Pill>
                    )}
                    {(m.compensation_min || m.compensation_max) && (
                      <Pill>{formatCompensation(m.compensation_min, m.compensation_max, m.compensation_period, m.currency)}</Pill>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-[var(--fg-muted)] line-clamp-2 whitespace-pre-wrap">
                    {m.description}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--fg-muted)]">
      {children}
    </span>
  );
}

function formatCompensation(
  min: number | null,
  max: number | null,
  period: string | null,
  currency: string,
): string {
  const fmt = (n: number) =>
    `${currency === "USD" ? "$" : ""}${n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : n}`;
  const periodLabel = period === "hour" ? "/hr" : period === "month" ? "/mo" : period === "year" ? "/yr" : "";
  if (min && max) return `${fmt(min)}–${fmt(max)}${periodLabel}`;
  if (min) return `${fmt(min)}+${periodLabel}`;
  if (max) return `up to ${fmt(max)}${periodLabel}`;
  return "";
}

function FilterRow({
  label,
  all,
  active,
  children,
}: {
  label: string;
  all: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] w-16 shrink-0">
        {label}
      </span>
      <FilterChip href={all} active={active} label="All" />
      {children}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
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
