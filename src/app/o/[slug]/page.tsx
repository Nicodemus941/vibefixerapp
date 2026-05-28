import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Building2, ExternalLink, MapPin, Network, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { fetchOrganizationBySlug } from "@/app/organizations/actions";
import { viewerConnectionsAtOrg } from "@/app/follows/actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await fetchOrganizationBySlug(slug);
  if (!org) {
    return { title: "Company not found · Loop" };
  }
  const title = `${org.name} · Loop`;
  const description = org.description
    ? org.description.length > 160
      ? `${org.description.slice(0, 157).trim()}…`
      : org.description
    : `${org.member_count} ${org.member_count === 1 ? "founder" : "founders"} on Loop work${org.member_count === 1 ? "s" : ""} at ${org.name}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://loopfounders.com/o/${org.slug}`,
      images: org.logo_url ? [{ url: org.logo_url }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const org = await fetchOrganizationBySlug(slug);
  if (!org) notFound();

  // Viewer can "post a job" if they currently work here.
  const { data: ownPos } = user
    ? await supabase
        .from("positions")
        .select("id")
        .eq("user_id", user.id)
        .eq("organization_id", org.id)
        .eq("is_current", true)
        .limit(1)
        .maybeSingle()
    : { data: null };
  const canPostJob = Boolean(ownPos);

  // Open jobs at this org + how many of your connections work here
  const [{ data: orgJobs }, connectionCount] = await Promise.all([
    supabase
      .from("job_listings")
      .select("id, title, employment_type, remote_policy, location")
      .eq("organization_id", org.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(10),
    viewerConnectionsAtOrg(org.id),
  ]);

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    url: `https://loopfounders.com/o/${org.slug}`,
    logo: org.logo_url ?? undefined,
    description: org.description ?? undefined,
    sameAs: org.website ? [org.website] : undefined,
    industry: org.industry ?? undefined,
    address: org.headquarters
      ? { "@type": "PostalAddress", addressLocality: org.headquarters }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {user ? (
        <FeedHeader
          displayName={profile?.display_name ?? "founder"}
          role={profile?.role ?? "user"}
        />
      ) : (
        <PublicHeader nextPath={`/o/${slug}`} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 sm:p-6">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className="h-16 w-16 shrink-0 rounded-2xl bg-[var(--surface-3)] flex items-center justify-center text-2xl font-semibold text-[var(--fg-muted)] overflow-hidden">
              {org.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={org.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-7 w-7" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">
                  {org.name}
                </h1>
                {org.verified && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40">
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--fg-muted)]">
                {org.industry && (
                  <span className="font-mono">{org.industry}</span>
                )}
                {org.size_band && (
                  <span className="font-mono">{org.size_band} employees</span>
                )}
                {org.headquarters && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {org.headquarters}
                  </span>
                )}
              </div>
              {org.website && (
                <a
                  href={org.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-mono text-[var(--accent)] hover:underline break-all"
                >
                  {org.website.replace(/^https?:\/\//, "")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          {org.description && (
            <p className="mt-4 text-sm text-[var(--fg)] leading-relaxed whitespace-pre-wrap">
              {org.description}
            </p>
          )}
        </header>

        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              {org.member_count === 0
                ? "No one on Loop has tagged this company yet"
                : org.member_count === 1
                ? "1 founder works here"
                : `${org.member_count} founders work here`}
            </h2>
            <Link
              href={
                user
                  ? `/account?add=position&org_id=${org.id}&org_name=${encodeURIComponent(org.name)}`
                  : `/login?next=/o/${slug}`
              }
              className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110"
            >
              <Briefcase className="h-3 w-3" />
              <span className="hidden sm:inline">{user ? "I work here" : "Sign in to add"}</span>
              <span className="sm:hidden">{user ? "Add role" : "Sign in"}</span>
            </Link>
          </div>

          {connectionCount > 0 && (
            <div className="mb-3 rounded-xl border border-sky-400/30 bg-sky-400/[0.05] px-3 py-2 inline-flex items-center gap-2">
              <Network className="h-3.5 w-3.5 text-sky-300" />
              <p className="text-xs text-sky-100">
                <span className="font-mono tabular-nums">{connectionCount}</span>{" "}
                of your connection{connectionCount === 1 ? "" : "s"} work{connectionCount === 1 ? "s" : ""} here.
              </p>
            </div>
          )}

          {canPostJob && (
            <div className="mb-3">
              <Link
                href={`/jobs/new?org_id=${org.id}`}
                className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-mono text-[var(--accent)] hover:bg-[var(--accent)]/15"
              >
                <Briefcase className="h-3 w-3" />
                Post a job at this company
              </Link>
            </div>
          )}

          {(orgJobs?.length ?? 0) > 0 && (
            <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
              <p className="eyebrow mb-2">Open roles</p>
              <ul className="space-y-1.5">
                {orgJobs!.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="press-shrink flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-white/[0.04]"
                    >
                      <span className="text-sm text-[var(--fg)] truncate">{j.title}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] shrink-0">
                        {j.remote_policy === "remote" ? "Remote" : j.location ?? j.remote_policy}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!user ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-6 text-center">
              <Users className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
              <p className="text-sm text-[var(--fg-muted)]">
                {org.member_count > 0 ? (
                  <>
                    <Link
                      href={`/login?next=/o/${slug}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      Sign in
                    </Link>{" "}
                    to see who works here.
                  </>
                ) : (
                  <>
                    No one on Loop has tagged this company yet.{" "}
                    <Link
                      href={`/login?next=/o/${slug}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      Sign in
                    </Link>{" "}
                    to be the first.
                  </>
                )}
              </p>
            </div>
          ) : org.current_members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-6 text-center">
              <p className="text-sm text-[var(--fg-muted)]">
                Be the first to list your role here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {org.current_members.map((m) => (
                <li
                  key={m.user_id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-3 sm:p-4 flex items-center gap-3"
                >
                  <Link href={`/u/${m.user_id}`} aria-label={`View ${m.display_name}`}>
                    <Avatar name={m.display_name} url={m.avatar_url} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/u/${m.user_id}`}
                      className="font-medium text-[var(--fg)] hover:underline underline-offset-2 truncate block"
                    >
                      {m.display_name}
                    </Link>
                    <p className="text-sm text-[var(--fg-muted)] truncate">
                      {m.title}
                      {m.industry && (
                        <span className="text-[var(--fg-subtle)]"> · {m.industry}</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
