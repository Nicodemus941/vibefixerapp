import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchThread } from "../actions";
import { FeedHeader } from "../../feed/_components/FeedHeader";
import { MessageComposer } from "../_components/MessageComposer";
import { MessageBubble } from "../_components/MessageBubble";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/inbox/${conversationId}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const { header, messages, error } = await fetchThread(conversationId);

  if (error || !header) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
        <FeedHeader
          displayName={profile?.display_name ?? "founder"}
          role={profile?.role ?? "user"}
        />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 py-12 text-center">
          <p className="text-[var(--fg-muted)]">{error ?? "Conversation not found."}</p>
          <Link
            href="/inbox"
            className="press-shrink mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to inbox
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex flex-col">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />

      {/* Thread header */}
      <div className="sticky top-14 z-30 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/inbox"
            aria-label="Back to inbox"
            className="press-shrink h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-white/[0.05]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/u/${header.counterparty_id}`}
            className="flex items-center gap-3 min-w-0 flex-1 group press-shrink"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-sm font-mono text-[var(--fg-muted)]">
              {(header.counterparty_name[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-[var(--fg)] truncate group-hover:underline underline-offset-2">
                {header.counterparty_name}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] truncate">
                {[header.counterparty_company, header.counterparty_industry]
                  .filter(Boolean)
                  .join(" · ") || header.origin.toUpperCase()}
              </p>
            </div>
          </Link>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <p className="text-[var(--fg-muted)]">
              New conversation. Say something concrete — what you need, what you can deliver.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              body={m.body}
              createdAt={m.created_at}
              isMine={m.sender_id === user.id}
            />
          ))
        )}
      </main>

      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg)]/85 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-3">
          <MessageComposer conversationId={conversationId} />
        </div>
      </div>
    </div>
  );
}
