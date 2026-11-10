// Give first rules for messaging someone new. The database enforces these
// (guard_message_insert and dm_pair_is_cold); this module mirrors them so
// the composer can explain the rule before the member hits it, and so the
// rules are unit tested.

export const HELP_LINE_MIN = 20;
export const COLD_DM_DAILY_LIMIT = 10;
export const COPY_PASTE_MIN_LENGTH = 40;
export const COPY_PASTE_MAX_RECIPIENTS = 3;

export type PairSignals = {
  /** Any message already exchanged between the two, either way. */
  hasPriorMessages: boolean;
  hasMatch: boolean;
  hasDeal: boolean;
  senderFollowsRecipient: boolean;
  recipientFollowsSender: boolean;
};

/** A DM is cold when nothing connects the two members yet. */
export function isColdDm(s: PairSignals): boolean {
  const mutualFollow = s.senderFollowsRecipient && s.recipientFollowsSender;
  return !(s.hasPriorMessages || s.hasMatch || s.hasDeal || mutualFollow);
}

/** Returns an error sentence, or null when the help line is fine. */
export function validateHelpLine(line: string): string | null {
  const t = line.replace(/\s+/g, " ").trim();
  if (t.length === 0) return "Tell them how you can help first.";
  if (t.length < HELP_LINE_MIN) {
    const left = HELP_LINE_MIN - t.length;
    return `Add a little more about how you can help (${left} more character${left === 1 ? "" : "s"}).`;
  }
  return null;
}

/**
 * The stored body of a cold DM: the help line on its own first line, then
 * the rest. The database checks the first line, so newlines inside the
 * help line are flattened.
 */
export function composeColdMessage(helpLine: string, rest: string): string {
  const first = helpLine.replace(/\s+/g, " ").trim();
  const body = rest.trim();
  return body ? `${first}\n\n${body}` : first;
}

/** Same normalization as message_fingerprint() in SQL, before hashing. */
export function normalizeForFingerprint(body: string): string {
  return body.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Whether the anti copy paste rule looks at this text at all. */
export function isFingerprinted(body: string): boolean {
  return body.trim().replace(/\s+/g, " ").length >= COPY_PASTE_MIN_LENGTH;
}

/**
 * Would sending this text to `recipient` break the copy paste rule, given
 * who already got the same text in the last 24 hours?
 */
export function wouldBeCopyPaste(previousRecipients: string[], recipient: string): boolean {
  const others = new Set(previousRecipients.filter((r) => r !== recipient));
  return others.size >= COPY_PASTE_MAX_RECIPIENTS;
}

export function coldDmsLeft(usedToday: number): number {
  return Math.max(0, COLD_DM_DAILY_LIMIT - Math.max(0, usedToday));
}

/** Database errors raised by the message guard are already plain English. */
export const MESSAGE_GUARD_ERRORS = [
  "Add at least one offer before you message someone new.",
  "Start with how you can help them",
  "You have started 10 new conversations today.",
  "You already sent this exact message to 3 people today.",
  "You can not message this member.",
  "You are not part of this conversation.",
  "That conversation no longer exists.",
  "Confirm your email",
  "Please confirm you are a person",
  "You have reached 20 posts in 24 hours.",
  "You have reached 100 comments in 24 hours.",
];

export function friendlyMessageError(message: string | undefined | null): string {
  if (!message) return "Your message did not send. Try again.";
  if (MESSAGE_GUARD_ERRORS.some((m) => message.includes(m))) return message;
  if (message.includes("row-level security")) return "You can not send messages right now.";
  if (message.includes("messages_body_length_check")) return "Keep messages under 4000 characters.";
  return "Your message did not send. Try again.";
}
