import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { FeedItem } from "@/app/feed/_components/PostCard";
import { ImpressionTracker } from "@/app/feed/_components/ImpressionTracker";
import { hydrateFeed, loadPostsByIds } from "@/app/feed/data";

export const dynamic = "force-dynamic";

export const metadata = { title: "Saved posts · Loop" };

export default async function SavedPostsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/saved");

  const { data: viewer } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: saves } = await supabase
    .from("post_saves")
    .select("post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const order = (saves ?? []).map((s) => s.post_id);
  const loaded = await loadPostsByIds(supabase, order);
  const byId = new Map(loaded.map((p) => [p.id, p]));
  // Keep save order. Posts deleted or hidden by a block drop out.
  const posts = order.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const bundle = await hydrateFeed(supabase, user.id, posts);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader displayName={viewer?.display_name ?? "founder"} role={viewer?.role ?? "user"} />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bookmark className="h-5 w-5" aria-hidden />
            Saved posts
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Only you can see what you save.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <p className="text-[var(--fg-muted)]">
              Nothing saved yet. Use the menu on any post and choose Save.
            </p>
            <Link
              href="/feed"
              className="press-shrink mt-3 inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
            >
              Back to feed
            </Link>
          </div>
        ) : (
          <ImpressionTracker className="space-y-4">
            {posts.map((p) => (
              <FeedItem key={p.id} post={p} bundle={bundle} viewerId={user.id} viewerRole={viewer?.role ?? "user"} />
            ))}
          </ImpressionTracker>
        )}
      </main>
    </div>
  );
}
