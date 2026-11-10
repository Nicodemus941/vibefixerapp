import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AtSign,
  Bell,
  MessageCircle,
  MessageSquare,
  Repeat2,
  Sparkles,
  Check,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { REACTION_ICONS } from "../feed/_components/reaction-icons";
import { REACTION_VERBS, isReactionKind } from "@/lib/reactions";
import { toDisplayText } from "@/lib/post-text";
import { FeedHeader } from "../feed/_components/FeedHeader";
import {
  fetchNotifications,
  markAllRead,
  type NotificationRow,
} from "./actions";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
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

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/notifications");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const notes = await fetchNotifications(100);
  const unread = notes.filter((n) => !n.read_at).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h1>
            <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
              What happened while you were building.
            </p>
          </div>
          {unread > 0 && (
            <form action={markAllRead}>
              <button
                type="submit"
                className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--fg)]"
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </form>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <Bell className="h-6 w-6 mx-auto text-[var(--fg-subtle)] mb-2" />
            <p className="text-[var(--fg-muted)]">
              You&apos;re caught up. New matches, messages, and reactions land here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] overflow-hidden">
            {notes.map((n) => (
              <NotificationItem key={n.id} note={n} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function NotificationItem({ note }: { note: NotificationRow }) {
  const Icon =
    note.kind === "new_match" || note.kind === "match_accepted"
      ? Sparkles
      : note.kind === "new_message"
      ? MessageSquare
      : note.kind === "new_reaction"
      ? reactionIcon(note.payload?.reaction_kind)
      : note.kind === "new_comment" || note.kind === "comment_reply"
      ? MessageCircle
      : note.kind === "mention"
      ? AtSign
      : note.kind === "new_repost"
      ? Repeat2
      : note.kind === "new_follower"
      ? UserPlus
      : Bell;

  const href =
    note.kind === "new_message" && note.related_conversation_id
      ? `/inbox/${note.related_conversation_id}`
      : note.kind === "new_match" || note.kind === "match_accepted"
      ? "/matches"
      : note.related_post_id &&
        (note.kind === "new_reaction" ||
          note.kind === "new_comment" ||
          note.kind === "comment_reply" ||
          note.kind === "mention" ||
          note.kind === "new_repost")
      ? `/p/${note.related_post_id}`
      : note.kind === "new_follower" && note.actor_id
      ? `/u/${note.actor_id}`
      : note.kind === "new_reaction" && note.actor_id
      ? `/u/${note.actor_id}`
      : "/feed";

  const body = describe(note);
  const unread = !note.read_at;

  return (
    <li>
      <Link
        href={href}
        className={[
          "flex items-start gap-3 p-4 transition-colors",
          unread
            ? "bg-[var(--accent)]/[0.04] hover:bg-[var(--accent)]/[0.08]"
            : "hover:bg-[var(--surface-1)]",
        ].join(" ")}
      >
        <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--fg-muted)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--fg)] leading-relaxed">{body}</p>
          {note.payload?.preview ? (
            <p className="mt-1 text-sm text-[var(--fg-muted)] line-clamp-1">
              &ldquo;{toDisplayText(String(note.payload.preview))}&rdquo;
            </p>
          ) : null}
          <p className="mt-1 font-mono text-[10px] text-[var(--fg-subtle)]">
            {timeAgo(note.created_at)}
          </p>
        </div>
        {unread && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
        )}
      </Link>
    </li>
  );
}

function describe(n: NotificationRow): string {
  const who = n.actor_name ?? "Someone";
  switch (n.kind) {
    case "new_match":
      return `New match with ${who}. Open Matches to accept or pass.`;
    case "match_accepted":
      return `${who} accepted your match. Conversation is open.`;
    case "new_message":
      return `${who} sent you a message.`;
    case "new_reaction": {
      const r = n.payload?.reaction_kind;
      // Rows written before the reaction migration used fire/handshake/in.
      const legacy: Record<string, string> = { fire: "liked", handshake: "supported", in: "celebrated" };
      const label = isReactionKind(r)
        ? REACTION_VERBS[r]
        : typeof r === "string" && legacy[r]
        ? legacy[r]
        : "reacted to";
      return `${who} ${label} your post.`;
    }
    case "new_comment":
      return `${who} commented on your post.`;
    case "comment_reply":
      return `${who} replied to your comment.`;
    case "mention":
      return n.payload?.in_comment
        ? `${who} mentioned you in a comment.`
        : `${who} mentioned you in a post.`;
    case "new_repost":
      return n.payload?.quote ? `${who} quoted your post.` : `${who} reposted your post.`;
    case "new_follower":
      return `${who} started following you.`;
    default:
      return "Something happened.";
  }
}

function reactionIcon(kind: unknown) {
  if (isReactionKind(kind)) return REACTION_ICONS[kind];
  const legacy: Record<string, keyof typeof REACTION_ICONS> = {
    fire: "like",
    handshake: "support",
    in: "celebrate",
  };
  return REACTION_ICONS[typeof kind === "string" ? legacy[kind] ?? "like" : "like"];
}
