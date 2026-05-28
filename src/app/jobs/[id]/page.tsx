import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, ExternalLink, Mail, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { ShareButton } from "@/components/ShareButton";
import { fetchJobListing } from "../actions";

export const dynamic = "force-dynamic";

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
  volunteer: "VOLUNTEER",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchJobListing(id);
  if (!job) {
    return { title: "Job not found · Loop" };
  }
  const orgTag = job.organization_name ? ` at ${job.organization_name}` : "";
  const title = `${job.title}${orgTag} · Loop`;
  const description = job.description.length > 160
    ? `${job.description.slice(0, 157).trim()}…`
    : job.description;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://loopfounders.com/jobs/${job.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const job = await fetchJobListing(id);
  if (!job) notFound();
  const isOwn = user ? job.poster_id === user.id : false;

  const jobPostingLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    validThrough: job.expires_at ?? undefined,
    employmentType: EMPLOYMENT_TYPE_MAP[job.employment_type],
    hiringOrganization: job.organization_name
      ? {
          "@type": "Organization",
          name: job.organization_name,
          sameAs: job.organization_slug
            ? `https://loopfounders.com/o/${job.organization_slug}`
            : undefined,
        }
      : { "@type": "Organization", name: "Independent" },
    jobLocation:
      job.remote_policy === "remote"
        ? undefined
        : {
            "@type": "Place",
            address: { "@type": "PostalAddress", addressLocality: job.location },
          },
    jobLocationType: job.remote_policy === "remote" ? "TELECOMMUTE" : undefined,
    baseSalary:
      job.compensation_min || job.compensation_max
        ? {
            "@type": "MonetaryAmount",
            currency: job.currency,
            value: {
              "@type": "QuantitativeValue",
              minValue: job.compensation_min ?? undefined,
              maxValue: job.compensation_max ?? undefined,
              unitText:
                job.compensation_period === "year"
                  ? "YEAR"
                  : job.compensation_period === "month"
                  ? "MONTH"
                  : job.compensation_period === "hour"
                  ? "HOUR"
                  : undefined,
            },
          }
        : undefined,
    applicantLocationRequirements: undefined,
    directApply: !!job.application_url,
    url: `https://loopfounders.com/jobs/${job.id}`,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {user ? (
        <FeedHeader
          displayName={profile?.display_name ?? "founder"}
          role={profile?.role ?? "user"}
        />
      ) : (
        <PublicHeader nextPath={`/jobs/${id}`} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All jobs
        </Link>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 sm:p-6">
          <header className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-[var(--surface-3)] flex items-center justify-center text-[var(--fg-muted)] overflow-hidden">
              {job.organization_logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={job.organization_logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">{job.title}</h1>
              <p className="mt-1 text-sm text-[var(--fg-muted)] break-words">
                {job.organization_slug ? (
                  <Link
                    href={`/o/${job.organization_slug}`}
                    className="hover:underline underline-offset-2"
                  >
                    {job.organization_name}
                  </Link>
                ) : (
                  <span className="text-[var(--fg-subtle)] italic">Independent posting</span>
                )}
              </p>
              {job.status !== "open" && (
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                  {job.status === "closed" ? "Closed" : "Filled"}
                </p>
              )}
            </div>
          </header>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
            <Pill>
              <Briefcase className="h-3 w-3 inline mr-1" />
              {TYPE_LABELS[job.employment_type]}
            </Pill>
            <Pill>{REMOTE_LABELS[job.remote_policy]}</Pill>
            {job.location && (
              <Pill>
                <MapPin className="h-3 w-3 inline mr-0.5" />
                {job.location}
              </Pill>
            )}
            {(job.compensation_min || job.compensation_max) && (
              <Pill>
                {formatCompensation(job.compensation_min, job.compensation_max, job.compensation_period, job.currency)}
              </Pill>
            )}
          </div>

          <p className="mt-5 text-sm text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-words">
            {job.description}
          </p>

          {job.status === "open" && (
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
              <ShareButton
                url={`/jobs/${job.id}`}
                title={`${job.title}${job.organization_name ? ` at ${job.organization_name}` : ""}`}
                text={job.description.slice(0, 200)}
              />
              {user ? (
                <>
                  {job.application_url && (
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
                    >
                      Apply
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {job.application_email && (
                    <a
                      href={`mailto:${job.application_email}?subject=Application for ${encodeURIComponent(job.title)}`}
                      className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-4 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.05]"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </a>
                  )}
                </>
              ) : (
                <Link
                  href={`/login?next=/jobs/${id}`}
                  className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
                >
                  Sign in to apply
                </Link>
              )}
            </div>
          )}

          {isOwn && (
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
              You posted this. <Link href="/jobs" className="text-[var(--accent)] hover:underline">Back to all jobs</Link>.
            </p>
          )}
        </article>
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
  const periodLabel = period === "hour" ? "/hr" : period === "month" ? "/mo" : period === "year" ? "/yr" : period === "project" ? "/project" : "";
  if (min && max) return `${fmt(min)}–${fmt(max)}${periodLabel}`;
  if (min) return `${fmt(min)}+${periodLabel}`;
  if (max) return `up to ${fmt(max)}${periodLabel}`;
  return "";
}
