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

type SearchParams = Promise<{ tag?: string | string[]; view?: string | string[] }>;

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

  const bundle = await hydrateFeed(supabase, user.id, posts);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader displayName={displayName} role={role} />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
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
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              {tag
                ? "Needs, offers, and wins tagged this."
                : view === "recent"
                ? "Everything founders are asking for, offering, and shipping. Newest first."
                : view === "following"
                ? "Posts and reposts from founders you follow. Newest first."
                : onboardingDone
                ? "Needs, offers, and wins matched to what you said you need."
                : "Needs, offers, and wins from across Loop."}
            </p>
          </div>
          {tag && (
            <Link
              href="/feed"
              className="press-shrink shrink-0 inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs font-mono text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
            >
              Clear
            </Link>
          )}
        </div>

        {/* For you / Following / Recent */}
        {!tag && (
          <nav
            aria-label="Feed view"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-1)] p-1"
          >
            <FeedViewTab href="/feed" active={view === "personalized"} label="For you" />
            <FeedViewTab href="/feed?view=following" active={view === "following"} label="Following" />
            <FeedViewTab href="/feed?view=recent" active={view === "recent"} label="Recent" />
          </nav>
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
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.05] p-4 sm:p-5">
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
                    className="press-shrink inline-flex items-center rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110"
                  >
                    Finish setup
                  </Link>
                  <Link
                    href="/discover"
                    className="press-shrink inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
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
            <p className="eyebrow mb-2">Trending this week</p>
            <div className="flex flex-wrap gap-1.5">
              {trending.map((t) => (
                <Link
                  key={t.tag}
                  href={`/feed?tag=${encodeURIComponent(t.tag)}`}
                  className={[
                    "press-shrink font-mono text-xs px-2.5 py-1 rounded-full border transition-colors",
                    tag === t.tag
                      ? "border-[var(--accent)]/50 bg-[var(--accent)]/15 text-[var(--accent)]"
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
            <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-3 text-sm text-[var(--danger)]">
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
        "press-shrink inline-flex items-center justify-center h-8 px-3 xs:px-4 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
        active
          ? "bg-[var(--accent)] text-[var(--bg)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-white/[0.04]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function EmptyState({ tag, view }: { tag: string | null; view: FeedView }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
      <p className="text-[var(--fg-muted)]">
        {tag
          ? `No needs, offers, or wins tagged #${tag} yet.`
          : view === "following"
          ? "Nothing from people you follow yet. Follow founders from their profile or Browse."
          : "Quiet right now. Post a need, an offer, or a win to get things moving."}
      </p>
      {view === "following" && !tag && (
        <Link
          href="/discover"
          className="press-shrink mt-3 inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
        >
          Browse founders
        </Link>
      )}
    </div>
  );
}
