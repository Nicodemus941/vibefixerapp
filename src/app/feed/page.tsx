import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchFeed, fetchTrendingTags } from "./actions";
import { Composer } from "./_components/Composer";
import { PostCard } from "./_components/PostCard";
import { FeedHeader } from "./_components/FeedHeader";
import { ReciprocityBanner } from "./_components/ReciprocityBanner";

type SearchParams = Promise<{ tag?: string | string[] }>;

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const tag =
    typeof sp.tag === "string" ? sp.tag.toLowerCase().replace(/^#/, "") : null;

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

  const [{ posts, error: feedError }, trending] = await Promise.all([
    fetchFeed({ tag, limit: 30 }),
    fetchTrendingTags(),
  ]);

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
              ) : onboardingDone ? (
                <>Matched to your needs.</>
              ) : (
                <>Your feed.</>
              )}
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              {tag
                ? "Showing posts tagged this only."
                : onboardingDone
                ? "Ranked by similarity to what you said you need."
                : "Most recent posts."}
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

        {/* Reciprocity status — warned/suspended */}
        <ReciprocityBanner
          status={reciprocityStatus}
          lastNeedAt={profile?.last_need_posted_at ?? null}
        />

        {/* Onboarding nudge */}
        {!onboardingDone && !tag && (
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.05] p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 text-[var(--accent)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--fg)]">
                  Add what you need to get personalized matches.
                </p>
                <p className="text-sm text-[var(--fg-muted)] mt-1">
                  Right now you&apos;re seeing the latest posts. Once you list 1–3 needs and offers, the feed re-ranks to surface what fits you.
                </p>
                <Link
                  href="/onboarding"
                  className="press-shrink mt-3 inline-flex items-center rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
                >
                  Finish profile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Composer — hidden when suspended */}
        {!isSuspended && <Composer displayName={displayName} />}

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
          {!feedError && posts.length === 0 && <EmptyState tag={tag} />}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} viewerId={user.id} />
          ))}
        </section>
      </main>
    </div>
  );
}

function EmptyState({ tag }: { tag: string | null }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
      <p className="text-[var(--fg-muted)]">
        {tag
          ? `No posts tagged #${tag} yet.`
          : "No posts yet. Be the first — share what you need or what you can deliver today."}
      </p>
    </div>
  );
}
