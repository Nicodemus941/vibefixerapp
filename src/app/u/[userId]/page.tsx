import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Award, Briefcase, Building2, GraduationCap, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PostCard } from "@/app/feed/_components/PostCard";
import { fetchReactionState, fetchCommentSummaries } from "@/app/feed/actions";
import { startDmAndRedirect } from "@/app/inbox/actions";
import { fetchReviewsForUser } from "@/app/reviews/actions";
import { ReviewList, Stars } from "@/app/reviews/_components/ReviewList";
import { Avatar } from "@/components/Avatar";
import { fetchUserPositions } from "@/app/organizations/actions";
import { fetchCertifications, fetchEducation } from "@/app/resume/actions";
import { ProfileModerationMenu } from "./_components/ProfileModerationMenu";

export const dynamic = "force-dynamic";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 365) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const [{ data: posts }, { data: offers }, { data: needs }, { count: dealCount }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, user_id, body, hashtags, kind, created_at")
      .eq("user_id", profile.id)
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
  ]);

  const postIds = (posts ?? []).map((p) => p.id);
  const [reactionState, commentSummaries, reviews, positions, education, certifications] =
    await Promise.all([
      fetchReactionState(postIds),
      fetchCommentSummaries(postIds),
      fetchReviewsForUser(profile.id, 20),
      fetchUserPositions(profile.id),
      fetchEducation(profile.id),
      fetchCertifications(profile.id),
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

  const stats = [
    { label: "Posts", value: posts?.length ?? 0 },
    { label: "Reviews", value: reviews.length },
    { label: "Offers", value: offers?.length ?? 0 },
    { label: "Deals shipped", value: dealCount ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={viewerProfile?.display_name ?? "founder"}
        role={viewerProfile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 sm:p-6">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <Avatar
              name={profile.display_name}
              url={profile.avatar_url}
              size="xl"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                  {profile.display_name}
                </h1>
                {profile.role === "owner" && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40">
                    Owner
                  </span>
                )}
                {profile.role === "admin" && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/40">
                    Admin
                  </span>
                )}
              </div>
              {(profile.company_name || profile.industry) && (
                <p className="mt-1 text-sm text-[var(--fg-muted)] break-words">
                  {profile.company_name}
                  {profile.company_name && profile.industry && " · "}
                  {profile.industry}
                </p>
              )}
              {reviews.length > 0 && (
                <div className="mt-1.5 flex items-center gap-2">
                  <Stars value={Math.round(avgRating)} />
                  <span className="font-mono text-xs text-[var(--fg-muted)] tabular-nums">
                    {avgRating.toFixed(1)} · {reviews.length} review
                    {reviews.length === 1 ? "" : "s"}
                  </span>
                </div>
              )}
              {profile.company_url && (
                <a
                  href={profile.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-mono text-[var(--accent)] hover:underline break-all"
                >
                  {profile.company_url.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
            {!isOwn && (
              <div className="flex items-center gap-2">
                {!isBlocked && (
                  <form action={startDmAndRedirect.bind(null, profile.id, "profile")}>
                    <button
                      type="submit"
                      className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs sm:text-sm font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Message
                    </button>
                  </form>
                )}
                <ProfileModerationMenu
                  targetId={profile.id}
                  initiallyBlocked={isBlocked}
                />
              </div>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-[var(--fg)] leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Stats strip */}
          <dl className="mt-5 grid grid-cols-4 gap-2 sm:gap-3 border-t border-[var(--border)] pt-4">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                  {s.label}
                </dt>
                <dd className="mt-0.5 text-base sm:text-lg font-semibold tabular-nums">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-3 font-mono text-[10px] text-[var(--fg-subtle)]">
            Joined {timeAgo(profile.created_at)} ago
          </p>
        </header>

        {/* Experience */}
        {positions.length > 0 && (
          <section aria-label="Experience" className="space-y-3">
            <p className="eyebrow">Experience</p>
            <ul className="space-y-2">
              {positions.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 flex items-start gap-3"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--surface-3)] flex items-center justify-center text-[var(--fg-muted)] overflow-hidden">
                    {p.organization_logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.organization_logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] break-words">{p.title}</p>
                    <p className="text-sm text-[var(--fg-muted)] break-words">
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
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums">
                      {formatPositionRange(p.start_date, p.end_date, p.is_current)}
                    </p>
                    {p.description && (
                      <p className="mt-2 text-xs text-[var(--fg-muted)] whitespace-pre-wrap">
                        {p.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {isOwn && (
              <Link
                href="/account"
                className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
              >
                <Briefcase className="h-3 w-3" />
                Manage experience
              </Link>
            )}
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section aria-label="Education" className="space-y-3">
            <p className="eyebrow">Education</p>
            <ul className="space-y-2">
              {education.map((e) => (
                <li
                  key={e.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 flex items-start gap-3"
                >
                  <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] break-words">{e.school_name}</p>
                    {(e.degree || e.field_of_study) && (
                      <p className="text-sm text-[var(--fg-muted)] break-words">
                        {[e.degree, e.field_of_study].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums">
                      {e.start_year && e.end_year
                        ? `${e.start_year} — ${e.end_year}`
                        : e.start_year
                        ? `${e.start_year} — Present`
                        : e.end_year ?? ""}
                    </p>
                    {e.description && (
                      <p className="mt-2 text-xs text-[var(--fg-muted)] whitespace-pre-wrap">
                        {e.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Certifications / Accreditations */}
        {certifications.length > 0 && (
          <section aria-label="Certifications" className="space-y-3">
            <p className="eyebrow">Certifications & accreditations</p>
            <ul className="space-y-2">
              {certifications.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 flex items-start gap-3"
                >
                  <Award className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)] break-words">{c.name}</p>
                    {c.issuer && (
                      <p className="text-sm text-[var(--fg-muted)] break-words">{c.issuer}</p>
                    )}
                    <p className="mt-0.5 font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums">
                      {c.issued_date && c.expires_date
                        ? `Issued ${new Date(c.issued_date).toLocaleString(undefined, { month: "short", year: "numeric" })} · expires ${new Date(c.expires_date).toLocaleString(undefined, { month: "short", year: "numeric" })}`
                        : c.issued_date
                        ? `Issued ${new Date(c.issued_date).toLocaleString(undefined, { month: "short", year: "numeric" })}`
                        : ""}
                    </p>
                    {c.credential_url && (
                      <a
                        href={c.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block font-mono text-[10px] text-[var(--accent)] hover:underline break-all"
                      >
                        View credential
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Offers */}
        {offers && offers.length > 0 && (
          <section aria-label="Offers" className="space-y-3">
            <p className="eyebrow">Offers</p>
            <ul className="space-y-2.5">
              {offers.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 hover:border-[var(--border-strong)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[var(--fg)]">{o.title}</p>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                      {o.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--fg-muted)] leading-relaxed line-clamp-2">
                    {o.description}
                  </p>
                  {(o.price_min !== null || o.price_max !== null) && (
                    <p className="mt-2 font-mono text-xs text-[var(--accent)] tabular-nums">
                      ${o.price_min ?? "?"}
                      {o.price_max && o.price_max !== o.price_min && `–$${o.price_max}`}
                      {o.pricing_model && ` ${o.pricing_model}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Needs */}
        {needs && needs.length > 0 && (
          <section aria-label="Needs" className="space-y-3">
            <p className="eyebrow">Open needs</p>
            <ul className="space-y-2.5">
              {needs.map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 hover:border-[var(--border-strong)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-[var(--fg)]">{n.title}</p>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border border-amber-400/40 text-amber-400 bg-amber-400/10">
                      {(n.urgency ?? "?").replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--fg-muted)] leading-relaxed line-clamp-2">
                    {n.description}
                  </p>
                  {(n.budget_min !== null || n.budget_max !== null) && (
                    <p className="mt-2 font-mono text-xs text-[var(--fg-subtle)] tabular-nums">
                      budget ${n.budget_min ?? "?"}
                      {n.budget_max && n.budget_max !== n.budget_min && `–$${n.budget_max}`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section aria-label="Reviews" className="space-y-3">
            <p className="eyebrow">Reviews</p>
            <ReviewList reviews={reviews} />
          </section>
        )}

        {/* Posts */}
        <section aria-label="Posts" className="space-y-3">
          <p className="eyebrow">Posts</p>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  viewerId={user.id}
                  viewerRole={viewerProfile?.role ?? "user"}
                  reactionState={reactionState[p.id]}
                  commentSummary={commentSummaries[p.id]}
                  post={{
                    id: p.id,
                    user_id: p.user_id,
                    body: p.body,
                    hashtags: p.hashtags,
                    kind: p.kind,
                    created_at: p.created_at as string,
                    similarity: null,
                    author_display_name: profile.display_name,
                    author_company_name: profile.company_name,
                    author_industry: profile.industry,
                    author_avatar_url: profile.avatar_url,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-6 text-center text-sm text-[var(--fg-muted)]">
              {isOwn ? (
                <>
                  You haven&apos;t posted yet.{" "}
                  <Link href="/feed" className="text-[var(--accent)] hover:underline">
                    Write your first post.
                  </Link>
                </>
              ) : (
                "No posts yet."
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function formatPositionRange(start: string, end: string | null, isCurrent: boolean): string {
  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleString(undefined, { month: "short", year: "numeric" });
  };
  if (isCurrent) return `${fmt(start)} — Present`;
  if (end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt(start);
}
