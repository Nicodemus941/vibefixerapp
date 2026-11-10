import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchFeed, fetchTrendingTags } from "./actions";
import { hydrateFeed } from "./data";
import type { FeedView } from "@/lib/feed-types";
import { Composer } from "./_components/Composer";
import { FeedItem } from "./_components/PostCard";
import { FeedHeader } from "./_components/FeedHeader";
import { ReciprocityBanner } from "./_components/ReciprocityBanner";
import { LiveFeedBanner } from "./_components/LiveFeedBanner";
import { SponsoredCard } from "./_components/SponsoredCard";
import { LeftRail, RightRail, loadRailData } from "./_components/FeedRails";

type SearchParams = Promise<{ tag?: string | string[]; view?: string | string[]; dm_error?: string | string[] }>;

// Only known sentences are echoed back from the URL.
const DM_ERRORS = new Set([
  "That need is no longer available.",
  "This is your own need.",
  "You can not message this member.",
  "Sign in to offer help.",
]);

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tag =
    typeof sp.tag === "string" ? sp.tag.toLowerCase().replace(/^#/, "") : null;
  const viewParam = typeof sp.view === "string" ? sp.view : null;
  const dmError =
    typeof sp.dm_error === "string"
      ? DM_ERRORS.has(sp.dm_error)
        ? sp.dm_error
        : "That conversation could not be started. Try again."
      : null;
  // "everyone" is the old name for Recent; keep old links working.
  const view: FeedView =
    viewParam === "everyone" || viewParam === "recent"
      ? "recent"
      : viewParam === "following"
      ? "following"
      : "personalized";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/feed");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_complete, role, reciprocity_status, last_need_posted_at")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name ?? "founder";
  const onboardingDone = profile?.onboarding_complete === true;
  const role = profile?.role ?? "user";
  const reciprocityStatus = profile?.reciprocity_status ?? "active";
  const isSuspended = reciprocityStatus === "suspended";

  // Cold-start signal — a brand-new user with no offers OR needs gets
  // an empty matcher and an empty "for you" feed. Detect that and
  // surface the right next-step nudge above the feed.
  const [{ count: offerCount }, { count: needCount }] = await Promise.all([
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("needs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  const hasOffers = (offerCount ?? 0) > 0;
  const hasNeeds = (needCount ?? 0) > 0;
  const isColdStart = !hasOffers || !hasNeeds;

  const [{ posts, error: feedError }, trending] = await Promise.all([
    fetchFeed({ tag, limit: 30, view }),
    fetchTrendingTags(),
  ]);

  const [bundle, rails] = await Promise.all([
    hydrateFeed(supabase, user.id, posts),
    loadRailData(supabase, user.id),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader displayName={displayName} role={role} wide />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-6 lg:grid lg:grid-cols-[232px_minmax(0,1fr)_288px] lg:gap-6 lg:items-start">
      <aside className="hidden lg:block lg:sticky lg:top-20" aria-label="Your profile and sections">
        <LeftRail data={rails} />
      </aside>
      <main className="mx-auto w-full max-w-2xl lg:max-w-none space-y-5 min-w-0">
        {/* Personalization header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {tag ? (
                <>
                  <span className="text-[var(--fg-subtle)] font-normal">Tag:</span>{" "}
                  <span className="text-[var(--accent)]">#{tag}</span>
                </>
              ) : (
                <>Loop&apos;s pulse.</>
              )}
            </h1>
            <p className="text-sm text-[var(--fg-subtle)] mt-1">
              {tag
                ? "Needs, offers and shipped work tagged this."
                : view === "recent"
                ? "Everything founders are asking for, offering and shipping. Newest first."
                : view === "following"
                ? "Posts and reposts from founders you follow. Newest first."
                : onboardingDone
                ? "Needs you can help with first, then offers that fit what you need, then people you follow."
                : "Needs, offers and shipped work from across Loop."}
            </p>
          </div>
          {tag && (
            <Link
              href="/feed"
              className="press-shrink shrink-0 inline-flex h-11 items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-xs font-semibold text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
            >
              Clear
            </Link>
          )}
        </div>

        {/* For you / Following / Recent */}
        {!tag && (
          <nav
            aria-label="Feed view"
            className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] p-1"
          >
            <FeedViewTab href="/feed" active={view === "personalized"} label="For you" />
            <FeedViewTab href="/feed?view=following" active={view === "following"} label="Following" />
            <FeedViewTab href="/feed?view=recent" active={view === "recent"} label="Recent" />
          </nav>
        )}

        {dmError && (
          <p role="alert" className="rounded-[var(--r-md)] border border-[var(--danger)]/40 bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">
            {dmError}
          </p>
        )}

        {/* Reciprocity status — warned/suspended */}
        <ReciprocityBanner
          status={reciprocityStatus}
          lastNeedAt={profile?.last_need_posted_at ?? null}
        />

        {/* Cold-start nudge — shown when the user has no offers OR no
            needs. Headline + CTA change based on which side is missing,
            so a partial-onboarded user gets the right next step instead
            of a generic "finish profile" call. */}
        {isColdStart && !tag && (
          <div className="rounded-[var(--r-lg)] border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 text-[var(--accent)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg)]">
                  {!hasOffers && !hasNeeds
                    ? "Welcome to Loop. Set up what you do and what you need."
                    : !hasOffers
                    ? "Add what you can offer to other founders."
                    : "Tell Loop what you need so it can match you."}
                </p>
                <p className="text-sm text-[var(--fg-muted)] mt-1">
                  {!hasOffers && !hasNeeds
                    ? "1 to 3 things you can deliver, 1 to 3 things you need. Loop matches you against every other founder in under 24 hours."
                    : !hasOffers
                    ? "Reciprocity required. Every founder on Loop has to give as well as get. List 1 to 3 offers to unlock matches."
                    : "Without a need, the matcher has nothing to rank against. List 1 to 3 things you need to start seeing matches."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/onboarding"
                    className="press-shrink inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
                  >
                    Finish setup
                  </Link>
                  <Link
                    href="/discover"
                    className="press-shrink inline-flex h-11 items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-sm font-semibold text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
                  >
                    Browse founders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live new-posts pill */}
        <LiveFeedBanner
          viewerId={user.id}
          initialTimestamp={new Date().toISOString()}
        />

        {/* Composer — hidden when suspended */}
        {!isSuspended && <Composer displayName={displayName} userId={user.id} />}

        {/* Trending hashtags */}
        {trending.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-[var(--fg-subtle)]">Trending this week</p>
            <div className="flex flex-wrap gap-1.5">
              {trending.map((t) => (
                <Link
                  key={t.tag}
                  href={`/feed?tag=${encodeURIComponent(t.tag)}`}
                  className={[
                    "press-shrink num text-xs px-2.5 py-1 rounded-full border transition-colors",
                    tag === t.tag
                      ? "border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent-text)]"
                      : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:text-[var(--fg)]",
                  ].join(" ")}
                >
                  #{t.tag}{" "}
                  <span className="text-[var(--fg-subtle)] tabular-nums">
                    {t.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feed */}
        <section aria-label="Feed posts" className="space-y-4">
          {feedError && (
            <p className="rounded-[var(--r-md)] border border-[var(--danger)]/40 bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger)]">
              Couldn&apos;t load the feed: {feedError}
            </p>
          )}
          {!feedError && posts.length === 0 && <EmptyState tag={tag} view={view} />}
          <div className="space-y-4">
            {posts.map((p, idx) => (
              <div key={p.id}>
                <FeedItem post={p} bundle={bundle} viewerId={user.id} viewerRole={role} />
                {/* Inject one sponsored slot ~5 posts in, when feed is dense
                    enough to make ads feel native. SponsoredCard renders
                    null if there's no eligible ad. */}
                {idx === 4 && <div className="mt-4"><SponsoredCard /></div>}
              </div>
            ))}
          </div>
        </section>
      </main>
      <aside className="hidden lg:block lg:sticky lg:top-20" aria-label="Matches, people and groups">
        <RightRail data={rails} />
      </aside>
      </div>
    </div>
  );
}

function FeedViewTab({
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
      aria-current={active ? "page" : undefined}
      className={[
        "press-shrink inline-flex items-center justify-center h-9 px-3 xs:px-4 rounded-full text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        active
          ? "bg-[var(--surface-1)] text-[var(--fg)] shadow-[var(--shadow-1)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-1)]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function EmptyState({ tag, view }: { tag: string | null; view: FeedView }) {
  return (
    <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-1)] p-8 text-center">
      <p className="text-[var(--fg-muted)]">
        {tag
          ? `Nothing tagged #${tag} yet.`
          : view === "following"
          ? "Nothing from people you follow yet. Follow founders from their profile or Browse."
          : "Quiet right now. Post a need, an offer or something you shipped to get things moving."}
      </p>
      {view === "following" && !tag && (
        <Link
          href="/discover"
          className="press-shrink mt-3 inline-flex items-center rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
        >
          Browse founders
        </Link>
      )}
    </div>
  );
}
