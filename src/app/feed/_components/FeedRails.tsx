import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BarChart3,
  Bookmark,
  Briefcase,
  Home,
  Inbox,
  Sparkles,
  Users,
} from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/app/u/[userId]/_components/FollowButton";
import { FOCUS } from "./styles";

type Client = SupabaseClient<Database>;

const RAIL_CARD =
  "rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow-1)]";

export type RailData = {
  me: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    headline: string | null;
    deals_delivered: number;
    avg_rating: number | null;
    review_count: number;
  };
  matches: Array<{
    id: string;
    counterparty_id: string;
    counterparty_name: string;
    line: string;
    score: number;
  }>;
  people: Array<{
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    offer_title: string;
  }>;
  groups: Array<{ id: string; slug: string; name: string; description: string | null }>;
};

// Everything the left and right rails need. Each piece fails soft: a
// missing function or table just leaves its card empty.
export async function loadRailData(supabase: Client, userId: string): Promise<RailData> {
  const [profileRes, trackRes, matchesRes, peopleRes, myGroupsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, company_name, industry")
      .eq("id", userId)
      .maybeSingle(),
    supabase.rpc("member_track_records", { user_ids: [userId] }),
    supabase.rpc("pending_matches_for", { viewer_id: userId }),
    supabase.rpc("people_to_follow", { limit_count: 3 }),
    supabase.from("group_members").select("group_id").eq("user_id", userId),
  ]);

  const joined = (myGroupsRes.data ?? []).map((g) => g.group_id);
  let groupsQ = supabase
    .from("groups")
    .select("id, slug, name, description")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(3);
  if (joined.length > 0) groupsQ = groupsQ.not("id", "in", `(${joined.join(",")})`);
  const { data: groups } = await groupsQ;

  const p = profileRes.data;
  const t = trackRes.data?.[0];
  return {
    me: {
      id: userId,
      display_name: p?.display_name ?? "You",
      avatar_url: p?.avatar_url ?? null,
      headline: [p?.company_name, p?.industry].filter(Boolean).join(" · ") || null,
      deals_delivered: Number(t?.deals_delivered ?? 0),
      avg_rating: t?.avg_rating === null || t?.avg_rating === undefined ? null : Number(t.avg_rating),
      review_count: Number(t?.review_count ?? 0),
    },
    matches: (matchesRes.data ?? []).slice(0, 3).map((m) => ({
      id: m.id,
      counterparty_id: m.counterparty_id,
      counterparty_name: m.counterparty_name,
      line: m.role === "seeker" ? `Offers ${m.offer_title}` : `Needs ${m.need_title}`,
      score: Math.round(Number(m.match_score)),
    })),
    people: (peopleRes.data ?? []).map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name,
      avatar_url: r.avatar_url,
      offer_title: r.offer_title,
    })),
    groups: groups ?? [],
  };
}

const NAV = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/matches", label: "Matches", icon: Sparkles },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/leaderboard", label: "Most helpful", icon: BarChart3 },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

export function LeftRail({ data }: { data: RailData }) {
  const { me } = data;
  return (
    <div className="space-y-4">
      <section className={`${RAIL_CARD} overflow-hidden`} aria-label="Your profile">
        <div className="h-14" style={{ background: "var(--cover-gradient)" }} aria-hidden />
        <div className="px-4 pb-4">
          <Link href={`/u/${me.id}`} className={`-mt-7 inline-block rounded-full ${FOCUS}`}>
            <Avatar name={me.display_name} url={me.avatar_url} size="lg" className="ring-4 ring-[var(--surface-1)]" />
          </Link>
          <Link href={`/u/${me.id}`} className="mt-1 block font-semibold text-[var(--fg)] hover:underline underline-offset-2">
            {me.display_name}
          </Link>
          {me.headline && <p className="text-[13px] text-[var(--fg-muted)]">{me.headline}</p>}
        </div>
        <dl className="grid grid-cols-2 border-t border-[var(--border)]">
          <div className="px-4 py-3 border-r border-[var(--border)]">
            <dt className="text-[11px] font-semibold text-[var(--fg-subtle)]">Deals delivered</dt>
            <dd className="num text-lg font-semibold">{me.deals_delivered}</dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-[11px] font-semibold text-[var(--fg-subtle)]">Rating</dt>
            <dd className="text-lg font-semibold">
              {me.avg_rating !== null ? (
                <>
                  <span className="num">{me.avg_rating.toFixed(1)}</span>{" "}
                  <span className="text-xs font-normal text-[var(--fg-subtle)]">({me.review_count})</span>
                </>
              ) : (
                <span className="text-sm font-normal text-[var(--fg-subtle)]">None yet</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <nav aria-label="Sections" className={`${RAIL_CARD} p-1.5`}>
        <ul>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={n.href === "/feed" ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-[var(--r-md)] px-3 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)] aria-[current=page]:bg-[var(--surface-2)] aria-[current=page]:text-[var(--fg)] ${FOCUS}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section className={`${RAIL_CARD} p-4`} aria-label="Your public card">
        <p className="text-[11px] font-semibold text-[var(--fg-subtle)]">Your public card</p>
        <Link href={`/c/${me.id}`} className="mt-1 block num text-[13px] text-[var(--accent-text)] hover:underline break-all">
          loopfounders.com/c/{me.id.slice(0, 8)}…
        </Link>
      </section>
    </div>
  );
}

export function RightRail({ data }: { data: RailData }) {
  return (
    <div className="space-y-4">
      <section className={`${RAIL_CARD} p-4`} aria-labelledby="rail-matches">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="rail-matches" className="text-sm font-semibold">Today&apos;s matches</h2>
          <Link href="/matches" className="text-xs font-semibold text-[var(--accent-text)] hover:underline">
            All
          </Link>
        </div>
        {data.matches.length === 0 ? (
          <p className="mt-2 text-[13px] text-[var(--fg-muted)]">
            No new matches today. List what you offer and need to get matched.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-[var(--border)]">
            {data.matches.map((m) => (
              <li key={m.id}>
                <Link href="/matches" className={`flex items-center gap-3 rounded-[var(--r-sm)] py-2.5 ${FOCUS}`}>
                  <Avatar name={m.counterparty_name} url={null} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--fg)]">{m.counterparty_name}</span>
                    <span className="block truncate text-xs text-[var(--fg-muted)]">{m.line}</span>
                  </span>
                  <span className="num shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-text)]" aria-label={`Match score ${m.score}`}>
                    {m.score}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.people.length > 0 && (
        <section className={`${RAIL_CARD} p-4`} aria-labelledby="rail-people">
          <h2 id="rail-people" className="text-sm font-semibold">People who can help you</h2>
          <ul className="mt-2 space-y-3">
            {data.people.map((p) => (
              <li key={p.user_id} className="flex items-center gap-3">
                <Link href={`/u/${p.user_id}`} className={`flex min-w-0 flex-1 items-center gap-3 rounded-[var(--r-sm)] ${FOCUS}`}>
                  <Avatar name={p.display_name} url={p.avatar_url} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[var(--fg)]">{p.display_name}</span>
                    <span className="block truncate text-xs text-[var(--fg-muted)]">{p.offer_title}</span>
                  </span>
                </Link>
                <FollowButton targetUserId={p.user_id} initiallyFollowing={false} followsYou={false} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.groups.length > 0 && (
        <section className={`${RAIL_CARD} p-4`} aria-labelledby="rail-groups">
          <h2 id="rail-groups" className="text-sm font-semibold">Groups for you</h2>
          <ul className="mt-2 divide-y divide-[var(--border)]">
            {data.groups.map((g) => (
              <li key={g.id}>
                <Link href={`/g/${g.slug}`} className={`flex items-center gap-3 rounded-[var(--r-sm)] py-2.5 ${FOCUS}`}>
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] bg-[var(--job-bg)] text-xs font-bold text-[var(--job-fg)]"
                    aria-hidden
                  >
                    {g.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? "")
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--fg)]">{g.name}</span>
                    {g.description && (
                      <span className="block truncate text-xs text-[var(--fg-muted)]">{g.description}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Footer" className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-[var(--fg-subtle)]">
        <Link href="/about" className="hover:underline">About</Link>
        <Link href="/jobs" className="hover:underline">Jobs</Link>
        <Link href="/leaderboard" className="hover:underline">Most helpful</Link>
        <Link href="/privacy" className="hover:underline">Privacy</Link>
        <Link href="/terms" className="hover:underline">Terms</Link>
      </nav>
    </div>
  );
}
