import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchInbox } from "./actions";
import { FeedHeader } from "../feed/_components/FeedHeader";

export const dynamic = "force-dynamic";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default async function InboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/inbox");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const rows = await fetchInbox();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Conversations with founders you&apos;ve reached out to.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <MessageSquare className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
            <p className="text-[var(--fg-muted)]">
              No conversations yet. Find a post that fits on{" "}
              <Link href="/feed" className="text-[var(--accent)] hover:underline">
                the feed
              </Link>{" "}
              and message the author.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/inbox/${r.id}`}
                  className="flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
                    {(r.counterparty_name[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium text-[var(--fg)] truncate">
                        {r.counterparty_name}
                        {r.counterparty_company && (
                          <span className="text-[var(--fg-subtle)] font-normal">
                            {" · "}
                            {r.counterparty_company}
                          </span>
                        )}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-[var(--fg-subtle)]">
                        {timeAgo(r.last_message_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--fg-muted)] line-clamp-1">
                      {r.preview_sender_is_me && "You: "}
                      {r.preview ?? <span className="italic">No messages yet — say hi.</span>}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
