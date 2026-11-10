// Reply rate: of the conversations someone else started with a member in
// the last 90 days, the share the member answered within 7 days, plus the
// median time to that first answer. The database computes the real number
// (member_reply_stats); this mirrors its rules so they can be unit tested
// and so the UI wording lives in one place.

export const REPLY_WINDOW_DAYS = 90;
export const REPLY_DEADLINE_DAYS = 7;
export const REPLY_MIN_CONVERSATIONS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;

export type InboundConversation = {
  /** When the other person sent the first message. */
  firstAt: Date;
  /** When the member first answered, or null if they never did. */
  replyAt: Date | null;
};

export type ReplyStats = {
  /** Conversations that count: in the window, and either answered in time or past the deadline. */
  eligible: number;
  replied: number;
  /** 0 to 1, or null when there are fewer than REPLY_MIN_CONVERSATIONS eligible. */
  rate: number | null;
  /** Median seconds to the first answer among answered ones, or null. */
  medianSeconds: number | null;
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function computeReplyStats(items: InboundConversation[], now: Date = new Date()): ReplyStats {
  const windowStart = now.getTime() - REPLY_WINDOW_DAYS * DAY_MS;
  const deadlineMs = REPLY_DEADLINE_DAYS * DAY_MS;
  let eligible = 0;
  const replyTimes: number[] = [];

  for (const c of items) {
    const first = c.firstAt.getTime();
    if (first <= windowStart || first > now.getTime()) continue;
    const reply = c.replyAt ? c.replyAt.getTime() : null;
    const answeredInTime = reply !== null && reply > first && reply - first <= deadlineMs;
    const deadlinePassed = now.getTime() - first >= deadlineMs;
    // Still inside the 7 day window and not answered yet: too early to judge.
    if (!answeredInTime && !deadlinePassed) continue;
    eligible += 1;
    if (answeredInTime) replyTimes.push((reply! - first) / 1000);
  }

  if (eligible < REPLY_MIN_CONVERSATIONS) {
    return { eligible, replied: replyTimes.length, rate: null, medianSeconds: null };
  }
  return {
    eligible,
    replied: replyTimes.length,
    rate: replyTimes.length / eligible,
    medianSeconds: median(replyTimes),
  };
}

export function describeReplyTime(seconds: number): string {
  const hours = seconds / 3600;
  if (hours <= 1) return "within an hour";
  if (hours <= 6) return "within a few hours";
  if (hours <= 24) return "within a day";
  if (hours <= 72) return "within a few days";
  return "within a week";
}

/**
 * "Replies to 92% of messages, usually within a day", or null when there
 * is not enough history to say anything fair.
 */
export function formatReplyRate(stats: {
  eligible: number;
  rate: number | null;
  medianSeconds: number | null;
} | null): string | null {
  if (!stats || stats.rate === null || stats.eligible < REPLY_MIN_CONVERSATIONS) return null;
  const pct = Math.round(stats.rate * 100);
  const base = `Replies to ${pct}% of messages`;
  if (pct === 0 || stats.medianSeconds === null) return base;
  return `${base}, usually ${describeReplyTime(stats.medianSeconds)}`;
}
