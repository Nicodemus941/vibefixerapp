import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PostCard } from "@/app/feed/_components/PostCard";
import {
  fetchCommentSummaries,
  fetchReactionState,
} from "@/app/feed/actions";
import { Avatar } from "@/components/Avatar";
import { fetchGroupBySlug } from "../../groups/actions";
import { GroupComposer } from "../../groups/_components/GroupComposer";
import { JoinLeaveButton } from "../../groups/_components/JoinLeaveButton";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/g/${slug}`);

  const { data: viewer } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { group, members, posts, error } = await fetchGroupBySlug(slug);

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <FeedHeader
          displayName={viewer?.display_name ?? "founder"}
          role={viewer?.role ?? "user"}
        />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
          <p className="text-[var(--fg-muted)]">{error ?? "Group not found."}</p>
          <Link
            href="/groups"
            className="press-shrink mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to groups
          </Link>
        </main>
      </div>
    );
  }

  const postIds = posts.map((p) => p.id);
  const [reactionState, commentSummaries] = await Promise.all([
    fetchReactionState(postIds),
    fetchCommentSummaries(postIds),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={viewer?.display_name ?? "founder"}
        role={viewer?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <Link
          href="/groups"
          className="press-shrink inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All groups
        </Link>

        {/* Header */}
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                {group.name}
              </h1>
              {group.description && (
                <p className="mt-2 text-sm text-[var(--fg-muted)]">{group.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--fg-subtle)] font-mono">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="tabular-nums">{group.member_count}</span>{" "}
                  members
                </span>
                <span className="inline-flex items-center gap-1">
                  {group.visibility === "private" && <Lock className="h-3 w-3" />}
                  {group.visibility}
                </span>
                {group.role && (
                  <span className="text-[var(--accent)] uppercase tracking-wider">
                    {group.role}
                  </span>
                )}
              </div>
            </div>
            <JoinLeaveButton
              slug={group.slug}
              isMember={group.is_member}
              role={group.role}
            />
          </div>
        </header>

        {/* Members strip (compact) */}
        <section aria-label="Members">
          <p className="eyebrow mb-2">Members</p>
          <div className="flex flex-wrap gap-2">
            {members.slice(0, 14).map((m) => (
              <Link
                key={m.user_id}
                href={`/u/${m.user_id}`}
                title={m.display_name}
                className="press-shrink"
              >
                <Avatar
                  name={m.display_name}
                  url={m.avatar_url}
                  size="sm"
                  className={m.role === "owner" ? "ring-2 ring-[var(--accent)]" : undefined}
                />
              </Link>
            ))}
            {group.member_count > 14 && (
              <span className="font-mono text-xs text-[var(--fg-subtle)] self-center">
                + {group.member_count - 14}
              </span>
            )}
          </div>
        </section>

        {/* Composer (members only) */}
        {group.is_member && <GroupComposer slug={group.slug} />}

        {/* Posts */}
        <section aria-label="Group posts" className="space-y-4">
          <p className="eyebrow">Posts</p>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-6 text-center">
              <p className="text-sm text-[var(--fg-muted)]">No posts yet.</p>
            </div>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                viewerId={user.id}
                viewerRole={viewer?.role ?? "user"}
                reactionState={reactionState[p.id]}
                commentSummary={commentSummaries[p.id]}
                post={{
                  id: p.id,
                  user_id: p.user_id,
                  body: p.body,
                  hashtags: p.hashtags,
                  kind: p.kind,
                  created_at: p.created_at,
                  similarity: null,
                  author_display_name: p.author_display_name,
                  author_company_name: p.author_company_name,
                  author_industry: p.author_industry,
                  author_avatar_url: p.author_avatar_url,
                }}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}
