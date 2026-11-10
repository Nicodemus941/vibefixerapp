import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { FeedItem } from "@/app/feed/_components/PostCard";
import { ImpressionTracker } from "@/app/feed/_components/ImpressionTracker";
import { POST_COLUMNS, hydrateFeed, toFeedPost } from "@/app/feed/data";
import { PublicHeader } from "@/components/PublicHeader";
import { Avatar } from "@/components/Avatar";
import { publicMediaUrl, type PostMedia } from "@/lib/post-media";
import { toDisplayText } from "@/lib/post-text";

export const dynamic = "force-dynamic";

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public preview used for link unfurls (OG tags) and the signed out
// teaser. Never for group posts. Reads with the service role because the
// visitor may be signed out; only the author name, a short snippet and
// the first image leave the server.
async function loadPublicPreview(postId: string): Promise<{
  author: string;
  authorAvatar: string | null;
  snippet: string;
  image: string | null;
} | null> {
  if (!UUID_RX.test(postId)) return null;
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return null;
  }
  const { data: row } = await admin
    .from("posts")
    .select("id, user_id, body, media, group_id, repost_of_id")
    .eq("id", postId)
    .maybeSingle();
  if (!row || row.group_id) return null;

  let post = row;
  if (row.repost_of_id) {
    const { data: original } = await admin
      .from("posts")
      .select("id, user_id, body, media, group_id, repost_of_id")
      .eq("id", row.repost_of_id)
      .maybeSingle();
    if (!original || original.group_id) return null;
    post = original;
  }

  const { data: author } = await admin
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", post.user_id)
    .maybeSingle();
  if (!author) return null;

  const text = toDisplayText(post.body).replace(/\s+/g, " ").trim();
  const snippet = text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text;
  const media = Array.isArray(post.media) ? (post.media as unknown as PostMedia[]) : [];
  return {
    author: author.display_name,
    authorAvatar: author.avatar_url,
    snippet,
    image: media[0]?.path ? publicMediaUrl(media[0].path) : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const preview = await loadPublicPreview(postId);
  if (!preview) return { title: "Post · Loop", robots: { index: false, follow: false } };
  const title = `${preview.author} on Loop`;
  const description = preview.snippet || `A post by ${preview.author} on Loop, the free founder network.`;
  const url = `https://loopfounders.com/p/${postId}`;
  return {
    title,
    description,
    alternates: { canonical: `/p/${postId}` },
    // Member content: allow link unfurls, keep it out of search indexes.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: "Loop",
      images: preview.image ? [{ url: preview.image }] : undefined,
    },
    twitter: {
      card: preview.image ? "summary_large_image" : "summary",
      title,
      description,
      images: preview.image ? [preview.image] : undefined,
    },
  };
}

export default async function PostPermalinkPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const preview = await loadPublicPreview(postId);
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <PublicHeader nextPath={`/p/${postId}`} />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-6 text-center">
            {preview ? (
              <div className="flex flex-col items-center gap-3">
                <Avatar name={preview.author} url={preview.authorAvatar} size="lg" />
                <p className="text-lg font-medium">{preview.author} posted on Loop</p>
              </div>
            ) : (
              <p className="text-lg font-medium">This post is on Loop</p>
            )}
            <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-[var(--fg-muted)]">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Posts are for members. Loop is free. Sign in to read it and join the conversation.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/p/${postId}`)}`}
              className="press-shrink mt-5 inline-flex items-center rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              Sign in to Loop
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { data: viewer } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Under the viewer's RLS: deleted posts and posts across a block come
  // back empty.
  const { data: row } = UUID_RX.test(postId)
    ? await supabase.from("posts").select(POST_COLUMNS).eq("id", postId).maybeSingle()
    : { data: null };

  let visible = Boolean(row);
  if (row?.group_id) {
    const [{ data: group }, { data: membership }] = await Promise.all([
      supabase.from("groups").select("visibility").eq("id", row.group_id).maybeSingle(),
      supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", row.group_id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    visible = Boolean(group && (group.visibility === "public" || membership));
  }

  let content: React.ReactNode;
  if (!row || !visible) {
    content = (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center text-[var(--fg-muted)]">
        This post is unavailable.
      </div>
    );
  } else {
    const { data: author } = await supabase
      .from("profiles")
      .select("display_name, company_name, industry, avatar_url")
      .eq("id", row.user_id)
      .maybeSingle();
    const post = toFeedPost(row, author);
    const bundle = await hydrateFeed(supabase, user.id, [post], { commentMode: "full" });
    content = (
      <ImpressionTracker>
        <FeedItem
          post={post}
          bundle={bundle}
          viewerId={user.id}
          viewerRole={viewer?.role ?? "user"}
          commentMode="full"
          allowRepost={!row.group_id}
        />
      </ImpressionTracker>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader displayName={viewer?.display_name ?? "founder"} role={viewer?.role ?? "user"} />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <Link
          href="/feed"
          className="press-shrink inline-flex items-center gap-1.5 rounded text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to feed
        </Link>
        {content}
      </main>
    </div>
  );
}
