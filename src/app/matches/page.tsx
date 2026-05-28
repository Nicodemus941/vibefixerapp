import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles, Wand2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import {
  fetchMyMatches,
  acceptMatch,
  passMatch,
  runMatcherNowForm,
  rerankPendingMatchesForm,
} from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.round(diff / 3600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/matches");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "owner" || profile?.role === "admin";

  const matches = await fetchMyMatches();
  const asSeeker = matches.filter((m) => m.role === "seeker");
  const asProvider = matches.filter((m) => m.role === "provider");

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
              <Sparkles className="h-5 w-5 text-[var(--accent)]" />
              Matches
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              AI matches against your needs and offers. Runs daily at 06:00 UTC.
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <form action={runMatcherNowForm}>
                <button
                  type="submit"
                  className="press-shrink inline-flex items-center rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-mono text-[var(--accent)] hover:bg-[var(--accent)]/15"
                >
                  Run now
                </button>
              </form>
              <form action={rerankPendingMatchesForm}>
                <button
                  type="submit"
                  className="press-shrink inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-400/10 px-3 py-1.5 text-xs font-mono text-violet-300 hover:bg-violet-400/15"
                  title="Run Claude over unranked matches to score + draft intros"
                >
                  <Wand2 className="h-3 w-3" />
                  Claude rerank
                </button>
              </form>
            </div>
          )}
        </div>

        <Section
          title="Someone might fulfill your need"
          subtitle="You posted the need. Loop found these founders who can deliver."
          matches={asSeeker}
          viewerRole="seeker"
        />

        <Section
          title="Someone needs what you offer"
          subtitle="They posted a need. Your offer fits."
          matches={asProvider}
          viewerRole="provider"
        />

        {matches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <p className="text-[var(--fg-muted)]">
              No matches yet. The matcher runs daily at 06:00 UTC. Add more
              needs or offers via{" "}
              <Link href="/onboarding" className="text-[var(--accent)] hover:underline">
                onboarding
              </Link>{" "}
              to improve your chances.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  matches,
  viewerRole,
}: {
  title: string;
  subtitle: string;
  matches: Awaited<ReturnType<typeof fetchMyMatches>>;
  viewerRole: "seeker" | "provider";
}) {
  if (matches.length === 0) return null;
  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <p className="eyebrow">{title}</p>
        <p className="text-xs text-[var(--fg-subtle)] mt-1">{subtitle}</p>
      </div>
      <ul className="space-y-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} viewerRole={viewerRole} />
        ))}
      </ul>
    </section>
  );
}

function MatchCard({
  match,
  viewerRole,
}: {
  match: Awaited<ReturnType<typeof fetchMyMatches>>[number];
  viewerRole: "seeker" | "provider";
}) {
  const headlineTitle = viewerRole === "seeker" ? match.offer_title : match.need_title;
  const subTitle = viewerRole === "seeker" ? match.need_title : match.offer_title;
  const subLabel = viewerRole === "seeker" ? "your need:" : "your offer:";
  const otherLabel = viewerRole === "seeker" ? "their offer:" : "their need:";

  return (
    <li className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
          {(match.counterparty_name[0] ?? "?").toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={`/u/${match.counterparty_id}`}
              className="font-medium text-[var(--fg)] truncate hover:underline underline-offset-2"
            >
              {match.counterparty_name}
            </Link>
            {match.counterparty_company && (
              <span className="text-[var(--fg-subtle)] text-sm truncate">
                · {match.counterparty_company}
              </span>
            )}
          </div>
          {match.counterparty_industry && (
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
              {match.counterparty_industry}
            </p>
          )}
        </div>
        <span
          className="shrink-0 font-mono text-xs px-2 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 tabular-nums"
          title="Cosine similarity to the need's embedding"
        >
          {Math.round(match.match_score)}%
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
            {otherLabel}
          </p>
          <p className="text-[var(--fg)]">{headlineTitle}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
            {subLabel}
          </p>
          <p className="text-[var(--fg-muted)]">{subTitle}</p>
        </div>
      </div>

      {match.ai_rationale && (
        <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-400/[0.05] p-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-violet-300 flex items-center gap-1">
            <Wand2 className="h-3 w-3" />
            Why Loop matched you
          </p>
          <p className="mt-1 text-xs text-[var(--fg)] leading-relaxed">
            {match.ai_rationale}
          </p>
          {viewerRole === "seeker" && match.ai_intro_draft && (
            <details className="mt-2">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-violet-300 hover:text-violet-200">
                Draft intro message
              </summary>
              <p className="mt-1.5 text-xs text-[var(--fg-muted)] italic whitespace-pre-wrap">
                {match.ai_intro_draft}
              </p>
            </details>
          )}
        </div>
      )}

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
          matched {timeAgo(match.created_at)} ago
        </span>
        <div className="flex items-center gap-2">
          <form action={passMatch.bind(null, match.id)}>
            <button
              type="submit"
              className="press-shrink inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
            >
              Pass
            </button>
          </form>
          <form action={acceptMatch.bind(null, match.id)}>
            <button
              type="submit"
              className="press-shrink inline-flex items-center rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
            >
              Accept & DM
            </button>
          </form>
        </div>
      </footer>
    </li>
  );
}
