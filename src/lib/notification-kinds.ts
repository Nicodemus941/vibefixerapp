// Every notification kind Loop writes, in plain English, with the default
// in app and email preference. The SQL function notification_default()
// in 20261110400200_notification_preferences.sql mirrors these defaults;
// keep both in sync (tests/notification-prefs.test.mjs checks the list).
//
// Pure module: no imports, safe for server, client and node tests.

export const NOTIFICATION_KINDS = [
  "new_message",
  "mention",
  "comment_reply",
  "new_comment",
  "new_match",
  "match_accepted",
  "new_document",
  "document_signed",
  "new_review",
  "new_dispute",
  "dispute_resolved",
  "new_reaction",
  "new_follower",
  "new_repost",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type KindGroup = "conversations" | "posts" | "deals";

export type KindInfo = {
  kind: NotificationKind;
  group: KindGroup;
  label: string;
  hint: string;
  /** Default for in app. Every kind is on by default. */
  inApp: boolean;
  /** Default for email. */
  email: boolean;
  /** Sent right away (throttled) instead of waiting for a daily summary. */
  urgent: boolean;
};

export const KIND_INFO: Record<NotificationKind, KindInfo> = {
  new_message: { kind: "new_message", group: "conversations", label: "Direct messages", hint: "Someone sends you a message", inApp: true, email: true, urgent: true },
  mention: { kind: "mention", group: "posts", label: "Mentions", hint: "Someone mentions you in a post or comment", inApp: true, email: true, urgent: true },
  comment_reply: { kind: "comment_reply", group: "posts", label: "Replies to your comments", hint: "Someone replies to a comment you wrote", inApp: true, email: true, urgent: true },
  new_comment: { kind: "new_comment", group: "posts", label: "Comments on your posts", hint: "Someone comments on a post you wrote", inApp: true, email: true, urgent: false },
  new_match: { kind: "new_match", group: "conversations", label: "New matches", hint: "Loop matches you with a founder who fits", inApp: true, email: true, urgent: true },
  match_accepted: { kind: "match_accepted", group: "conversations", label: "Match accepted", hint: "Someone accepts your match", inApp: true, email: true, urgent: true },
  new_document: { kind: "new_document", group: "deals", label: "Documents sent to you", hint: "An NDA or contract is waiting for you", inApp: true, email: true, urgent: true },
  document_signed: { kind: "document_signed", group: "deals", label: "Documents signed", hint: "A document you are part of is fully signed", inApp: true, email: true, urgent: true },
  new_review: { kind: "new_review", group: "deals", label: "Reviews", hint: "Someone leaves you a review", inApp: true, email: true, urgent: true },
  new_dispute: { kind: "new_dispute", group: "deals", label: "Disputes opened", hint: "Someone opens a dispute on a deal with you", inApp: true, email: true, urgent: true },
  dispute_resolved: { kind: "dispute_resolved", group: "deals", label: "Disputes resolved", hint: "A dispute on one of your deals is settled", inApp: true, email: true, urgent: true },
  new_reaction: { kind: "new_reaction", group: "posts", label: "Reactions", hint: "Someone reacts to your post", inApp: true, email: false, urgent: false },
  new_follower: { kind: "new_follower", group: "posts", label: "New followers", hint: "Someone starts following you", inApp: true, email: false, urgent: false },
  new_repost: { kind: "new_repost", group: "posts", label: "Reposts", hint: "Someone reposts or quotes your post", inApp: true, email: false, urgent: false },
};

export const KIND_GROUPS: Array<{ group: KindGroup; title: string }> = [
  { group: "conversations", title: "Messages and matches" },
  { group: "posts", title: "Posts and people" },
  { group: "deals", title: "Deals, documents and reviews" },
];

export function isNotificationKind(k: unknown): k is NotificationKind {
  return typeof k === "string" && (NOTIFICATION_KINDS as readonly string[]).includes(k);
}

export type PrefRow = { kind: string; in_app: boolean; email: boolean };
export type ResolvedPref = { kind: NotificationKind; inApp: boolean; email: boolean };

/** Stored rows win; anything missing falls back to the kind default. */
export function resolvePreferences(rows: PrefRow[] | null | undefined): Record<NotificationKind, ResolvedPref> {
  const byKind = new Map((rows ?? []).filter((r) => isNotificationKind(r.kind)).map((r) => [r.kind, r]));
  const out = {} as Record<NotificationKind, ResolvedPref>;
  for (const kind of NOTIFICATION_KINDS) {
    const row = byKind.get(kind);
    out[kind] = {
      kind,
      inApp: row ? Boolean(row.in_app) : KIND_INFO[kind].inApp,
      email: row ? Boolean(row.email) : KIND_INFO[kind].email,
    };
  }
  return out;
}

export type EmailSettings = { digest: boolean; paused: boolean; unsubscribed: boolean };

/**
 * How a single notification should reach email, given the recipient's
 * preference and settings. "none" means do not email it at all.
 */
export function emailDelivery(
  kind: string,
  pref: { email: boolean } | undefined,
  settings: EmailSettings,
): "immediate" | "digest" | "none" {
  if (!isNotificationKind(kind)) return "none";
  if (settings.paused || settings.unsubscribed) return "none";
  const email = pref ? pref.email : KIND_INFO[kind].email;
  if (!email) return "none";
  if (KIND_INFO[kind].urgent) return "immediate";
  return settings.digest ? "digest" : "immediate";
}

// ---------- copy and links shared by the bell page and emails ----------

export type NoteLike = {
  kind: string;
  actor_id: string | null;
  actor_name: string | null;
  related_post_id: string | null;
  related_conversation_id: string | null;
  payload: Record<string, unknown> | null;
};

const REACTION_WORDS: Record<string, string> = {
  like: "liked",
  celebrate: "celebrated",
  support: "supported",
  love: "loved",
  insightful: "found insight in",
  funny: "laughed at",
  fire: "liked",
  handshake: "supported",
  in: "celebrated",
};

export function describeNotification(n: NoteLike): string {
  const who = n.actor_name?.trim() || "Someone";
  const p = n.payload ?? {};
  switch (n.kind) {
    case "new_match":
      return `New match with ${who}. Open Matches to accept or pass.`;
    case "match_accepted":
      return `${who} accepted your match. The conversation is open.`;
    case "new_message":
      return `${who} sent you a message.`;
    case "new_reaction": {
      const r = typeof p.reaction_kind === "string" ? REACTION_WORDS[p.reaction_kind] : undefined;
      return `${who} ${r ?? "reacted to"} your post.`;
    }
    case "new_comment":
      return `${who} commented on your post.`;
    case "comment_reply":
      return `${who} replied to your comment.`;
    case "mention":
      return p.in_comment ? `${who} mentioned you in a comment.` : `${who} mentioned you in a post.`;
    case "new_repost":
      return p.quote ? `${who} quoted your post.` : `${who} reposted your post.`;
    case "new_follower":
      return `${who} started following you.`;
    case "new_document": {
      const title = typeof p.title === "string" && p.title.trim() ? ` "${p.title.trim()}"` : "";
      return `${who} sent you a document${title} to review.`;
    }
    case "document_signed": {
      const title = typeof p.title === "string" && p.title.trim() ? ` "${p.title.trim()}"` : "";
      return `The document${title} is fully signed.`;
    }
    case "new_review":
      return `${who} left you a review.`;
    case "new_dispute":
      return `${who} opened a dispute on a deal.`;
    case "dispute_resolved":
      return "A dispute on one of your deals was resolved.";
    default:
      return "Something new happened on Loop.";
  }
}

/** Site relative link for a notification. recipientId links reviews to your own profile. */
export function notificationHref(n: NoteLike, recipientId?: string): string {
  switch (n.kind) {
    case "new_message":
    case "new_document":
    case "document_signed":
      return n.related_conversation_id ? `/inbox/${n.related_conversation_id}` : "/inbox";
    case "new_match":
    case "match_accepted":
      return "/matches";
    case "new_reaction":
    case "new_comment":
    case "comment_reply":
    case "mention":
    case "new_repost":
      return n.related_post_id ? `/p/${n.related_post_id}` : "/feed";
    case "new_follower":
      return n.actor_id ? `/u/${n.actor_id}` : "/follows";
    case "new_review":
      return recipientId ? `/u/${recipientId}` : "/feed";
    case "new_dispute":
    case "dispute_resolved":
      return "/inbox";
    default:
      return "/notifications";
  }
}

/** "Hi Ana," friendly first name, or null when we only know the email local part. */
export function firstNameFor(displayName: string | null | undefined, email?: string | null): string | null {
  const name = (displayName ?? "").trim();
  if (!name) return null;
  const local = (email ?? "").split("@")[0]?.trim().toLowerCase();
  if (local && name.toLowerCase() === local) return null;
  if (name.includes("@")) return null;
  const first = name.split(/\s+/)[0];
  return first ? first.slice(0, 40) : null;
}
