import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { fetchInbox, type InboxRow } from "./actions";
import { FeedHeader } from "../feed/_components/FeedHeader";

export const dynamic = "force-dynamic";

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const days = Math.round(h / 24);
  if (days < 2) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isRecent(iso: string | null): boolean {
  return Boolean(iso) && Date.now() - new Date(iso as string).getTime() < 36 * 3600_000;
}

const STATUS: Record<string, { label: string; cls: string }> = {
  held: { label: "Held", cls: "st-held" },
  released: { label: "Released", cls: "st-released" },
  disputed: { label: "Disputed", cls: "st-disputed" },
  refunded: { label: "Refunded", cls: "st-open" },
};

type Filter = "all" | "deals";

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const filter: Filter = sp.filter === "deals" ? "deals" : "all";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const all = await fetchInbox();
  const dealCount = all.filter((r) => r.deal).length;
  const needle = q.toLowerCase();
  const rows = all.filter((r) => {
    if (filter === "deals" && !r.deal) return false;
    if (!needle) return true;
    return [r.counterparty_name, r.counterparty_company, r.preview]
      .filter(Boolean)
      .some((s) => (s as string).toLowerCase().includes(needle));
  });

  const tabHref = (f: Filter) => {
    const p = new URLSearchParams();
    if (f !== "all") p.set("filter", f);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/inbox?${qs}` : "/inbox";
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-5 sm:py-8">
        <h1 className="text-[32px] sm:text-[36px] font-bold leading-tight tracking-[-0.03em]">
          Inbox
        </h1>

        <form action="/inbox" method="get" role="search" className="mt-4">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <label htmlFor="inbox-search" className="sr-only">
            Search conversations
          </label>
          <div className="flex h-12 items-center gap-2.5 rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 focus-within:border-[var(--accent)] focus-within:ring-[3px] focus-within:ring-[var(--ring)]/25">
            <Search className="h-5 w-5 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
            <input
              id="inbox-search"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search conversations"
              className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none"
            />
          </div>
        </form>

        <nav aria-label="Inbox filters" className="mt-4 flex flex-wrap gap-2">
          <FilterChip href={tabHref("all")} on={filter === "all"}>
            All
          </FilterChip>
          <FilterChip href={tabHref("deals")} on={filter === "deals"}>
            Deals <span className="num">{dealCount}</span>
          </FilterChip>
        </nav>

        {rows.length === 0 ? (
          <div className="mt-5 surface-card p-8 text-center">
            <MessageSquare className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" aria-hidden />
            <p className="text-[var(--fg-muted)]">
              {all.length === 0 ? (
                <>
                  No conversations yet. Find a post that fits on{" "}
                  <Link href="/feed" className="font-semibold text-[var(--accent-text)] hover:underline">
                    the feed
                  </Link>{" "}
                  and message the author.
                </>
              ) : filter === "deals" && !q ? (
                "No deals yet. Open one from a conversation when you agree on terms."
              ) : (
                "Nothing matches that search."
              )}
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {rows.map((r) => (
              <InboxItem key={r.id} r={r} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  href,
  on,
  children,
}: {
  href: string;
  on: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-colors ${
        on
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
          : "border-[var(--border-strong)] text-[var(--fg-muted)] hover:bg-[var(--surface-1)]"
      }`}
    >
      {children}
    </Link>
  );
}

function InboxItem({ r }: { r: InboxRow }) {
  const recent = isRecent(r.last_message_at);
  const status = r.deal ? STATUS[r.deal.status] ?? STATUS.held : null;
  return (
    <li>
      <Link
        href={`/inbox/${r.id}`}
        className={`flex items-start gap-3.5 rounded-[var(--r-lg)] p-4 transition-colors ${
          recent
            ? "surface-card hover:border-[var(--border-strong)]"
            : "border border-transparent hover:bg-[var(--surface-1)]"
        }`}
      >
        <Avatar name={r.counterparty_name} url={r.counterparty_avatar_url} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-[17px] font-semibold tracking-[-0.01em]">
              {r.counterparty_name}
              {r.counterparty_company && (
                <span className="font-normal text-[var(--fg-subtle)]">, {r.counterparty_company}</span>
              )}
            </p>
            <span
              className={`shrink-0 text-[13px] ${
                recent ? "font-semibold text-[var(--accent-text)]" : "text-[var(--fg-subtle)]"
              }`}
            >
              {when(r.last_message_at)}
            </span>
          </div>
          <p
            className={`mt-0.5 text-[15px] leading-snug line-clamp-2 ${
              recent ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"
            }`}
          >
            {r.preview_sender_is_me && "You: "}
            {r.preview ?? <span className="italic">No messages yet. Say hi.</span>}
          </p>
          {r.deal && status && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-[var(--fg-muted)]">
              <span className={`pill-status ${status.cls}`}>{status.label}</span>
              <span className="num text-[var(--fg)]">${r.deal.amount.toLocaleString("en-US")}</span>
              <span>· deal</span>
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}
