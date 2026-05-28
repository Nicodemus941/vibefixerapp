import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import { fetchGroups, type GroupRow } from "./actions";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/groups");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { yours, discover } = await fetchGroups();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5" />
              Groups
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              Niche communities of founders. Public to join, private by invite.
            </p>
          </div>
          <Link
            href="/groups/new"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs sm:text-sm font-medium text-[var(--bg)] hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" />
            New group
          </Link>
        </div>

        {yours.length > 0 && (
          <Section title="Your groups" groups={yours} />
        )}
        <Section title="Discover" groups={discover} />
      </main>
    </div>
  );
}

function Section({ title, groups }: { title: string; groups: GroupRow[] }) {
  if (groups.length === 0) {
    return (
      <section className="space-y-3">
        <p className="eyebrow">{title}</p>
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-6 text-center">
          <p className="text-[var(--fg-muted)] text-sm">Nothing here yet.</p>
        </div>
      </section>
    );
  }
  return (
    <section className="space-y-3">
      <p className="eyebrow">{title}</p>
      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.id}>
            <Link
              href={`/g/${g.slug}`}
              className="press-shrink block rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--fg)] truncate">{g.name}</p>
                  {g.description && (
                    <p className="mt-0.5 text-sm text-[var(--fg-muted)] line-clamp-2">
                      {g.description}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                    {g.role ? g.role : g.visibility}
                  </p>
                  <p className="font-mono text-xs text-[var(--fg-muted)] tabular-nums mt-0.5">
                    {g.member_count} member{g.member_count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
