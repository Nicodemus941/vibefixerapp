import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, Building2, ExternalLink, MapPin, Network, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { ShareButton } from "@/components/ShareButton";
import { CoverBand } from "@/components/CoverBand";
import { ImageUploadControl } from "@/components/ImageUploadControl";
import { getOrgImageUploadUrl, removeOrgImage, setOrgImage } from "@/app/organizations/media-actions";
import { fetchOrganizationBySlug } from "@/app/organizations/actions";
import { fetchOrgFollowState, viewerConnectionsAtOrg } from "@/app/follows/actions";
import { FollowOrgButton } from "./_components/FollowOrgButton";

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
  const canManage =
    Boolean(user) &&
    (org.created_by === user?.id || profile?.role === "admin" || profile?.role === "owner");
  const initials = org.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Open jobs at this org + how many of your connections work here
  // + whether the viewer follows it
  const [{ data: orgJobs }, connectionCount, orgFollow] = await Promise.all([
    supabase
      .from("job_listings")
      .select("id, title, employment_type, remote_policy, location")
      .eq("organization_id", org.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(10),
    viewerConnectionsAtOrg(org.id),
    fetchOrgFollowState(org.id),
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
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-5 sm:py-8 space-y-5">
        <header className="surface-card overflow-hidden">
          <CoverBand url={org.cover_url} alt={`${org.name} cover image`} className="h-28 sm:h-44">
            {canManage && (
              <div className="absolute right-3 top-3">
                <ImageUploadControl
                  label="cover"
                  tone="overlay"
                  size="sm"
                  hasImage={Boolean(org.cover_url)}
                  requestUpload={getOrgImageUploadUrl.bind(null, org.id, "cover")}
                  commit={setOrgImage.bind(null, org.id, "cover")}
                  remove={removeOrgImage.bind(null, org.id, "cover")}
                  removeConfirm="Remove the cover image?"
                />
              </div>
            )}
          </CoverBand>
          <div className="px-4 sm:px-6 pb-5">
            <div className="-mt-10 sm:-mt-12 flex flex-col gap-3">
              <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-[18px] bg-[var(--ink-2)] text-[var(--fg-on-ink)] ring-4 ring-[var(--surface-1)] flex items-center justify-center text-2xl font-extrabold tracking-[-0.03em] overflow-hidden">
                {org.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={org.logo_url} alt={`${org.name} logo`} className="h-full w-full object-cover bg-[var(--surface-1)]" />
                ) : initials ? (
                  <span aria-hidden>{initials}</span>
                ) : (
                  <Building2 className="h-8 w-8" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[26px] sm:text-[30px] font-bold leading-tight tracking-[-0.025em] break-words">
                    {org.name}
                  </h1>
                  {org.verified && <span className="chip chip-offer">Verified</span>}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--fg-muted)]">
                  {org.industry && <span>{org.industry}</span>}
                  {org.size_band && <span>{org.size_band} employees</span>}
                  {org.headquarters && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {org.headquarters}
                    </span>
                  )}
                </div>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex min-h-8 items-center gap-1 num text-[13px] text-[var(--accent-text)] hover:underline break-all"
                  >
                    {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                )}
              </div>
            </div>
            {org.description && (
              <p className="mt-4 text-[15px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap">
                {org.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
              <FollowOrgButton
                orgId={org.id}
                orgSlug={org.slug}
                initiallyFollowing={orgFollow.isFollowing}
                isAuthenticated={Boolean(user)}
              />
              <ShareButton
                url={`/o/${org.slug}`}
                title={org.name}
                text={org.description ?? `${org.member_count} founders on Loop work at ${org.name}.`}
                variant="ghost"
              />
              {canManage && (
                <ImageUploadControl
                  label="logo"
                  hasImage={Boolean(org.logo_url)}
                  requestUpload={getOrgImageUploadUrl.bind(null, org.id, "logo")}
                  commit={setOrgImage.bind(null, org.id, "logo")}
                  remove={removeOrgImage.bind(null, org.id, "logo")}
                  removeConfirm="Remove the company logo?"
                />
              )}
            </div>
          </div>
        </header>

        <section>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden />
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
              className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] h-11 px-4 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
            >
              <Briefcase className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{user ? "I work here" : "Sign in to add"}</span>
              <span className="sm:hidden">{user ? "Add role" : "Sign in"}</span>
            </Link>
          </div>

          {connectionCount > 0 && (
            <div className="mb-3 rounded-xl bg-[var(--job-bg)] px-3 py-2 inline-flex items-center gap-2">
              <Network className="h-3.5 w-3.5 text-[var(--job-fg)]" />
              <p className="text-xs text-[var(--fg)]">
                <span className="num font-semibold">{connectionCount}</span>{" "}
                of your connection{connectionCount === 1 ? "" : "s"} work{connectionCount === 1 ? "s" : ""} here.
              </p>
            </div>
          )}

          {canPostJob && (
            <div className="mb-3">
              <Link
                href={`/jobs/new?org_id=${org.id}`}
                className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] h-11 px-4 text-sm font-semibold text-[var(--accent-text)] hover:brightness-95"
              >
                <Briefcase className="h-4 w-4" aria-hidden />
                Post a job at this company
              </Link>
            </div>
          )}

          {(orgJobs?.length ?? 0) > 0 && (
            <div className="mb-4 surface-card p-4">
              <h3 className="eyebrow mb-2">Open roles</h3>
              <ul className="space-y-1.5">
                {orgJobs!.map((j) => (
                  <li key={j.id}>
                    <Link
                      href={`/jobs/${j.id}`}
                      className="press-shrink flex min-h-11 items-center justify-between gap-3 rounded-lg px-2.5 py-2 hover:bg-[var(--surface-2)]"
                    >
                      <span className="text-sm text-[var(--fg)] truncate">{j.title}</span>
                      <span className="chip chip-job shrink-0">
                        {j.remote_policy === "remote" ? "Remote" : j.location ?? j.remote_policy}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!user ? (
            <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-6 text-center">
              <Users className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
              <p className="text-sm text-[var(--fg-muted)]">
                {org.member_count > 0 ? (
                  <>
                    <Link
                      href={`/login?next=/o/${slug}`}
                      className="font-semibold text-[var(--accent-text)] hover:underline"
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
                      className="font-semibold text-[var(--accent-text)] hover:underline"
                    >
                      Sign in
                    </Link>{" "}
                    to be the first.
                  </>
                )}
              </p>
            </div>
          ) : org.current_members.length === 0 ? (
            <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-6 text-center">
              <p className="text-sm text-[var(--fg-muted)]">
                Be the first to list your role here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {org.current_members.map((m) => (
                <li
                  key={m.user_id}
                  className="surface-card p-3 sm:p-4 flex items-center gap-3"
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
