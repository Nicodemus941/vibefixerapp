import Link from "next/link";
import type { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { Building2, MessageSquare, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { FeedItem } from "@/app/feed/_components/PostCard";
import { POST_COLUMNS, hydrateFeed, toFeedPost } from "@/app/feed/data";
import { startDmAndRedirect } from "@/app/inbox/actions";
import { fetchReviewsForUser } from "@/app/reviews/actions";
import { ReviewList, Stars } from "@/app/reviews/_components/ReviewList";
import { Avatar } from "@/components/Avatar";
import { CoverBand } from "@/components/CoverBand";
import { ShareButton } from "@/components/ShareButton";
import { fetchCoverUrl } from "@/lib/covers";
import { fetchUserPositions } from "@/app/organizations/actions";
import { fetchCertifications, fetchEducation } from "@/app/resume/actions";
import { fetchFollowState, fetchSocialCounts } from "@/app/follows/actions";
import { FollowButton } from "./_components/FollowButton";
import { readShowcase } from "@/lib/profile-showcase-data";
import {
  AchievementsList,
  CredentialsList,
  FeaturedCards,
  GoalsList,
  LinkifiedText,
} from "@/components/ProfileShowcase";
import { ProfileModerationMenu } from "./_components/ProfileModerationMenu";

export const dynamic = "force-dynamic";

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "?";
  if (n >= 1000) {
    const k = n / 1000;
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `$${n}`;
}

function range(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  if (min !== null && max !== null && max !== min) return `${money(min)} to ${money(max)}`;
  if (min !== null) return max === null ? `From ${money(min)}` : money(min);
  return `Up to ${money(max)}`;
}

const PRICING_LABEL: Record<string, string> = {
  fixed: "Fixed scope",
  hourly: "Hourly",
  retainer: "Retainer",
  equity: "Equity",
  revshare: "Revenue share",
};

const URGENCY_LABEL: Record<string, string> = {
  now: "Now",
  this_week: "This week",
  this_month: "This month",
  exploratory: "Exploratory",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  if (!UUID_RX.test(userId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/u/${userId}`);

  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, company_name, company_url, bio, industry, revenue_band, role, reputation_score, avatar_url, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (!profile) notFound();

  const isOwn = profile.id === user.id;

  const [
    { data: posts },
    { data: offers },
    { data: needs },
    { count: dealCount },
    coverUrl,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("user_id", profile.id)
      .is("group_id", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("offers")
      .select("id, title, description, category, price_min, price_max, pricing_model")
      .eq("user_id", profile.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("needs")
      .select("id, title, description, category, budget_min, budget_max, urgency, status")
      .eq("user_id", profile.id)
      .neq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("engagements")
      .select("id", { count: "exact", head: true })
      .or(`seeker_id.eq.${profile.id},provider_id.eq.${profile.id}`)
      .eq("escrow_status", "released"),
    fetchCoverUrl(supabase, "profiles", profile.id),
  ]);

  const feedPosts = (posts ?? []).map((p) => toFeedPost(p, profile));
  const [
    feedBundle,
    reviews,
    positions,
    education,
    certifications,
    socialCounts,
    followState,
    showcase,
  ] = await Promise.all([
    hydrateFeed(supabase, user.id, feedPosts),
    fetchReviewsForUser(profile.id, 20),
    fetchUserPositions(profile.id),
    fetchEducation(profile.id),
    fetchCertifications(profile.id),
    fetchSocialCounts(profile.id),
    fetchFollowState(profile.id),
    // RLS hides these across a block in either direction.
    readShowcase(supabase, profile.id),
  ]);

  const { data: blockRow } = !isOwn
    ? await supabase
        .from("blocks")
        .select("blocker_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", profile.id)
        .maybeSingle()
    : { data: null };
  const isBlocked = Boolean(blockRow);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const reputation = Math.max(0, Math.min(100, Number(profile.reputation_score ?? 0)));
  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleString("en-US", { month: "long", year: "numeric" })
    : null;
  const deals = dealCount ?? 0;
  const publicCardPath = `/c/${profile.id}`;
  const currentPosition = positions.find((p) => p.is_current);

  const headline = [
    currentPosition ? `${currentPosition.title}, ${currentPosition.resolved_name}` : profile.company_name,
    profile.industry,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={viewerProfile?.display_name ?? "founder"}
        role={viewerProfile?.role ?? "user"}
      />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5">
        {/* Hero */}
        <header className="surface-card overflow-hidden">
          <CoverBand
            url={coverUrl}
            alt={`${profile.display_name} cover image`}
            className="h-28 sm:h-48"
          >
            {isOwn && (
              <Link
                href="/account#cover"
                className="press-shrink absolute right-3 top-3 inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-1)]/95 px-4 text-sm font-semibold text-[var(--fg)] shadow-[var(--shadow-2)] hover:bg-[var(--surface-1)]"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                {coverUrl ? "Change cover" : "Add cover"}
              </Link>
            )}
          </CoverBand>

          <div className="px-4 sm:px-8 pb-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="-mt-12 sm:-mt-16 shrink-0">
                <Avatar
                  name={profile.display_name}
                  url={profile.avatar_url}
                  size="3xl"
                  className="!h-24 !w-24 sm:!h-32 sm:!w-32 ring-4 ring-[var(--surface-1)]"
                />
              </div>
              <div className="min-w-0 flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[26px] sm:text-[30px] font-bold leading-tight tracking-[-0.025em] break-words">
                    {profile.display_name}
                  </h1>
                  {offers && offers.length > 0 && (
                    <span className="chip chip-offer">Open to deals</span>
                  )}
                  {profile.role === "owner" && (
                    <span className="chip chip-neutral">Loop team</span>
                  )}
                  {profile.role === "admin" && (
                    <span className="chip chip-need">Admin</span>
                  )}
                </div>
                {headline && (
                  <p className="mt-1 text-[15px] text-[var(--fg)] break-words">{headline}</p>
                )}
                <p className="mt-1 text-[13px] text-[var(--fg-subtle)] break-words">
                  {joined && <>On Loop since {joined}</>}
                  {profile.company_url && (
                    <>
                      {joined && " · "}
                      <a
                        href={profile.company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="num text-[var(--accent-text)] hover:underline break-all"
                      >
                        {profile.company_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isOwn ? (
                  <Link
                    href="/account"
                    className="press-shrink inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-sm font-semibold hover:bg-[var(--surface-2)]"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit profile
                  </Link>
                ) : (
                  <>
                    {!isBlocked && (
                      <form action={startDmAndRedirect.bind(null, profile.id, "profile")}>
                        <button
                          type="submit"
                          className="press-shrink inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          Message
                        </button>
                      </form>
                    )}
                    {!isBlocked && (
                      <FollowButton
                        targetUserId={profile.id}
                        initiallyFollowing={followState.isFollowing}
                        followsYou={followState.followsYou}
                      />
                    )}
                    <ProfileModerationMenu
                      targetId={profile.id}
                      initiallyBlocked={isBlocked}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stat row */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)] border-t border-[var(--border)]">
            <Stat label="Deals closed" value={String(deals)} />
            <Stat
              label="Rating"
              value={reviews.length > 0 ? avgRating.toFixed(1) : "None yet"}
              suffix={
                reviews.length > 0
                  ? `from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <Stat label="Followers" value={String(socialCounts.followers)} />
            <Stat label="Following" value={String(socialCounts.following)} />
          </dl>
        </header>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
          {/* Main column */}
          <div className="space-y-4 sm:space-y-5 min-w-0">
            {profile.bio && (
              <Card title="About">
                <LinkifiedText
                  text={profile.bio}
                  className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
                />
              </Card>
            )}

            {showcase.featured.length > 0 ? (
              <Card
                title="Featured"
                meta={isOwn ? undefined : `${showcase.featured.length} link${showcase.featured.length === 1 ? "" : "s"}`}
                action={isOwn ? { href: "/account#featured", label: "Edit" } : undefined}
              >
                <FeaturedCards items={showcase.featured} />
              </Card>
            ) : (
              isOwn && (
                <EmptyCard title="Featured">
                  Link articles you wrote, press about you, podcasts, talks and things you built so
                  people can see your work.{" "}
                  <Link href="/account#featured" className="font-semibold text-[var(--accent-text)] hover:underline">
                    Add a featured link
                  </Link>
                </EmptyCard>
              )
            )}

            {showcase.goals.length > 0 ? (
              <Card
                title="Working toward"
                action={isOwn ? { href: "/account#goals", label: "Edit" } : undefined}
              >
                <GoalsList items={showcase.goals} />
              </Card>
            ) : (
              isOwn && (
                <EmptyCard title="Working toward">
                  Share what you are building toward and how people could help.{" "}
                  <Link href="/account#goals" className="font-semibold text-[var(--accent-text)] hover:underline">
                    Add a goal
                  </Link>
                </EmptyCard>
              )
            )}

            {offers && offers.length > 0 ? (
              <Card title="What I offer" meta={`${offers.length} active`}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {offers.map((o) => {
                    const price = range(o.price_min, o.price_max);
                    return (
                      <li
                        key={o.id}
                        className="rounded-[var(--r-md)] border border-[var(--border)] p-4"
                      >
                        {o.category && <span className="chip chip-offer">{o.category}</span>}
                        <p className="mt-2.5 font-semibold text-[15px] break-words">{o.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--fg-muted)] line-clamp-3">
                          {o.description}
                        </p>
                        {(price || o.pricing_model) && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {price && <span className="chip chip-neutral num">{price}</span>}
                            {o.pricing_model && (
                              <span className="chip chip-neutral">
                                {PRICING_LABEL[o.pricing_model] ?? o.pricing_model}
                              </span>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : (
              isOwn && (
                <EmptyCard title="What I offer">
                  List what you deliver so the right people find you.{" "}
                  <Link href="/onboarding" className="font-semibold text-[var(--accent-text)] hover:underline">
                    Add an offer
                  </Link>
                </EmptyCard>
              )
            )}

            {needs && needs.length > 0 ? (
              <Card title="What I need" meta={`${needs.length} open`}>
                <ul className="space-y-3">
                  {needs.map((n) => {
                    const budget = range(n.budget_min, n.budget_max);
                    return (
                      <li
                        key={n.id}
                        className="rounded-[var(--r-md)] border border-[var(--border)] p-4"
                      >
                        {n.category && <span className="chip chip-need">{n.category}</span>}
                        <p className="mt-2.5 font-semibold text-[15px] break-words">{n.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-[var(--fg-muted)] line-clamp-3">
                          {n.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {budget && <span className="chip chip-neutral num">{budget}</span>}
                          {n.urgency && (
                            <span className="chip chip-neutral">
                              {URGENCY_LABEL[n.urgency] ?? n.urgency.replace("_", " ")}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : null}

            <Card
              title="Deals closed and reviews"
              meta={`${deals} deal${deals === 1 ? "" : "s"} · ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
            >
              {reviews.length > 0 ? (
                <ReviewList reviews={reviews} />
              ) : (
                <p className="text-sm text-[var(--fg-muted)]">
                  {isOwn
                    ? "Reviews from people you work with on Loop show up here."
                    : "No reviews yet."}
                </p>
              )}
            </Card>

            {showcase.achievements.length > 0 && (
              <Card
                title="Achievements"
                action={isOwn ? { href: "/account#achievements", label: "Edit" } : undefined}
              >
                <AchievementsList items={showcase.achievements} />
              </Card>
            )}

            {positions.length > 0 && (
              <Card
                title="Experience"
                action={isOwn ? { href: "/account#experience", label: "Edit" } : undefined}
              >
                <ul>
                  {positions.map((p, i) => (
                    <li
                      key={p.id}
                      className={`flex items-start gap-3.5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : "pt-0"}`}
                    >
                      <div className="h-11 w-11 shrink-0 rounded-[10px] bg-[var(--ink-2)] text-[var(--fg-on-ink)] flex items-center justify-center overflow-hidden text-sm font-bold">
                        {p.organization_logo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.organization_logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Building2 className="h-5 w-5" aria-hidden />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] break-words">{p.title}</p>
                        <p className="text-[13px] text-[var(--fg)] break-words">
                          {p.organization_slug ? (
                            <Link
                              href={`/o/${p.organization_slug}`}
                              className="hover:underline underline-offset-2"
                            >
                              {p.resolved_name}
                            </Link>
                          ) : (
                            p.resolved_name
                          )}
                        </p>
                        <p className="mt-0.5 text-[13px] text-[var(--fg-subtle)]">
                          {formatPositionRange(p.start_date, p.end_date, p.is_current)}
                        </p>
                        {p.description && (
                          <p className="mt-2 text-[13px] text-[var(--fg-muted)] whitespace-pre-wrap">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {(education.length > 0 || certifications.length > 0) && (
              <Card
                title="Education and certifications"
                action={isOwn ? { href: "/account#education", label: "Edit" } : undefined}
              >
                <CredentialsList education={education} certifications={certifications} />
              </Card>
            )}

            <section aria-labelledby="activity-title" className="space-y-3">
              <h2 id="activity-title" className="text-[17px] font-semibold tracking-[-0.01em] px-1">
                Activity
              </h2>
              {posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {feedPosts.map((p) => (
                    <FeedItem
                      key={p.id}
                      post={p}
                      bundle={feedBundle}
                      viewerId={user.id}
                      viewerRole={viewerProfile?.role ?? "user"}
                    />
                  ))}
                </div>
              ) : (
                <div className="surface-card p-6 text-center text-sm text-[var(--fg-muted)]">
                  {isOwn ? (
                    <>
                      You haven&apos;t posted yet.{" "}
                      <Link href="/feed" className="font-semibold text-[var(--accent-text)] hover:underline">
                        Write your first post.
                      </Link>
                    </>
                  ) : (
                    "No posts yet."
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Rail */}
          <aside className="space-y-4 sm:space-y-5 lg:sticky lg:top-20" aria-label="Profile details">
            <div className="surface-card p-5">
              <p className="eyebrow">Reputation</p>
              <div className="mt-3 flex items-center gap-4">
                <ReputationRing value={reputation} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {reviews.length === 0
                      ? "No reviews yet"
                      : reputation >= 80
                      ? "Strong track record"
                      : "Building a track record"}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
                    Based on {deals} closed deal{deals === 1 ? "" : "s"} and{" "}
                    {reviews.length} review{reviews.length === 1 ? "" : "s"}.
                  </p>
                  {reviews.length > 0 && <Stars value={Math.round(avgRating)} className="mt-1.5" />}
                </div>
              </div>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Public card</p>
                <ShareButton
                  url={`https://loopfounders.com${publicCardPath}`}
                  title={`${profile.display_name} on Loop`}
                  label="Share"
                />
              </div>
              <Link
                href={publicCardPath}
                className="mt-2 block num text-[13px] text-[var(--accent-text)] hover:underline break-all"
              >
                loopfounders.com{publicCardPath}
              </Link>
              <p className="mt-1 text-xs text-[var(--fg-muted)]">
                Anyone can view it, even without a Loop account.
              </p>
            </div>

            {currentPosition?.organization_slug && (
              <div className="surface-card p-5">
                <p className="eyebrow">Company</p>
                <Link
                  href={`/o/${currentPosition.organization_slug}`}
                  className="mt-3 flex items-center gap-3 rounded-lg hover:underline underline-offset-2"
                >
                  <span className="h-10 w-10 shrink-0 rounded-[10px] bg-[var(--ink-2)] text-[var(--fg-on-ink)] flex items-center justify-center overflow-hidden">
                    {currentPosition.organization_logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={currentPosition.organization_logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-5 w-5" aria-hidden />
                    )}
                  </span>
                  <span className="text-sm font-semibold">{currentPosition.resolved_name}</span>
                </Link>
              </div>
            )}

            <div className="surface-card p-5">
              <p className="eyebrow">Network</p>
              <p className="mt-2 text-sm">
                <span className="num font-semibold">{socialCounts.connections}</span>{" "}
                <span className="text-[var(--fg-muted)]">
                  connection{socialCounts.connections === 1 ? "" : "s"}
                </span>
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="bg-[var(--surface-1)] px-4 sm:px-6 py-4">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="num text-xl font-semibold">{value}</span>
        {suffix && <span className="text-xs text-[var(--fg-muted)]">{suffix}</span>}
      </dd>
    </div>
  );
}

function Card({
  title,
  meta,
  action,
  children,
}: {
  title: string;
  meta?: string;
  action?: { href: string; label: string };
  children: ReactNode;
}) {
  const id = `sec-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="surface-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="text-[17px] font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {meta && <span className="text-xs text-[var(--fg-subtle)]">{meta}</span>}
        {action && (
          <Link
            href={action.href}
            className="inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-[var(--accent-text)] hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-5 sm:p-6">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">{children}</p>
    </section>
  );
}

function ReputationRing({ value }: { value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14 shrink-0" role="img" aria-label={`Reputation ${Math.round(value)} out of 100`}>
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center num text-sm font-bold" aria-hidden>
        {Math.round(value)}
      </span>
    </div>
  );
}

function monthYear(s: string): string {
  return new Date(s).toLocaleString("en-US", { month: "short", year: "numeric" });
}

function formatPositionRange(start: string, end: string | null, isCurrent: boolean): string {
  if (isCurrent) return `${monthYear(start)} to now`;
  if (end) return `${monthYear(start)} to ${monthYear(end)}`;
  return monthYear(start);
}
