import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import { runSearch, type SearchPerson, type SearchPost } from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { posts, people } = q.length >= 2 ? await runSearch(q) : { posts: [], people: [] };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <form className="relative" action="/search" method="get">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-subtle)]" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Search founders, companies, hashtags, ideas…"
            className="w-full h-12 rounded-full border border-[var(--border-strong)] bg-[var(--surface-2)] pl-10 pr-4 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </form>

        {q.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <Search className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
            <p className="text-[var(--fg-muted)] text-sm">
              Search posts, founders, companies, industries, hashtags.
            </p>
          </div>
        )}

        {q.length >= 1 && q.length < 2 && (
          <p className="text-[var(--fg-subtle)] text-sm text-center">
            Type at least 2 characters.
          </p>
        )}

        {q.length >= 2 && (
          <>
            {people.length > 0 && (
              <section aria-label="People" className="space-y-3">
                <p className="eyebrow">People</p>
                <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
                  {people.map((p) => (
                    <PersonRow key={p.id} person={p} />
                  ))}
                </ul>
              </section>
            )}

            {posts.length > 0 && (
              <section aria-label="Posts" className="space-y-3">
                <p className="eyebrow">Posts</p>
                <ul className="space-y-3">
                  {posts.map((p) => (
                    <PostRow key={p.id} post={p} />
                  ))}
                </ul>
              </section>
            )}

            {posts.length === 0 && people.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
                <p className="text-[var(--fg-muted)]">
                  No matches for{" "}
                  <span className="font-mono text-[var(--fg)]">&ldquo;{q}&rdquo;</span>.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function PersonRow({ person }: { person: SearchPerson }) {
  return (
    <li>
      <Link
        href={`/u/${person.id}`}
        className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
          {(person.display_name[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-[var(--fg)] truncate">
              {person.display_name}
            </span>
            {person.role === "owner" && (
              <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40">
                Owner
              </span>
            )}
          </div>
          {(person.company_name || person.industry) && (
            <p className="text-xs text-[var(--fg-muted)] truncate">
              {person.company_name}
              {person.company_name && person.industry && " · "}
              {person.industry}
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function PostRow({ post }: { post: SearchPost }) {
  return (
    <li>
      <Link
        href={`/u/${post.user_id}`}
        className="block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 hover:border-[var(--border-strong)] transition-colors"
      >
        <p className="text-sm text-[var(--fg)] leading-relaxed line-clamp-3 whitespace-pre-wrap">
          {post.body}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--fg-subtle)] font-mono">
          <span>{timeAgo(post.created_at)}</span>
          {post.hashtags.length > 0 && (
            <>
              <span>·</span>
              <span className="text-[var(--accent)] truncate">
                {post.hashtags
                  .slice(0, 4)
                  .map((t) => `#${t}`)
                  .join(" ")}
              </span>
            </>
          )}
        </div>
      </Link>
    </li>
  );
}
