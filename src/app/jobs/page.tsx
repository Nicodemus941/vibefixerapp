import Link from "next/link";
import { redirect } from "next/navigation";
import { Briefcase, Building2, MapPin, Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { fetchJobMatches } from "./actions";

export const dynamic = "force-dynamic";

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

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/jobs");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const matches = await fetchJobMatches(40);
  const personalized = matches.some((m) => m.similarity != null);

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
              <Briefcase className="h-5 w-5" />
              Jobs
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              {personalized
                ? "Ranked by similarity to what you said you need."
                : "Newest job postings across Loop."}
            </p>
          </div>
          <Link
            href="/jobs/new"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs font-medium text-[var(--bg)] hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            Post a job
          </Link>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <Briefcase className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
            <p className="text-[var(--fg-muted)]">
              No open jobs yet. Be the first —{" "}
              <Link href="/jobs/new" className="text-[var(--accent)] hover:underline">
                post one
              </Link>
              .
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
