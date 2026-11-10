// Outbox senders for notification emails and owner sign up alerts.
// Database access and the mail transport are injected so tests run with
// mocks and never touch Supabase or Mailgun.
//
// Flow for one run:
//   1. No MAILGUN_API_KEY: return early, nothing is claimed, rows stay queued.
//   2. claim(): an RPC that locks rows with FOR UPDATE SKIP LOCKED, sets
//      status 'sending' and bumps attempts, so two overlapping runs never
//      pick the same row.
//   3. planEmailBatches(): one email per user; users emailed in the last
//      10 minutes are deferred (rows released back to 'queued') so newer
//      items batch into their next email.
//   4. send, then finish(): 'sent', or back to 'queued' for a retry, or
//      'failed' after 3 attempts or a permanent error.

import type { MailConfig, OutgoingEmail, SendResult } from "./mailgun.ts";
import { renderNotificationEmail, renderOwnerSignupAlert, type EmailItem } from "./templates.ts";
import { signUnsubscribeToken } from "./unsubscribe-token.ts";
import { firstNameFor } from "../notification-kinds.ts";

export const THROTTLE_MS = 10 * 60 * 1000;
/** Guards against a second digest if the daily cron fires twice. */
export const DIGEST_GAP_MS = 20 * 60 * 60 * 1000;
export const MAX_ATTEMPTS = 3;

export type EmailMode = "immediate" | "digest";

export type ClaimedEmailRow = {
  outbox_id: string;
  notification_id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  kind: string;
  actor_id: string | null;
  actor_name: string | null;
  related_post_id: string | null;
  related_conversation_id: string | null;
  payload: Record<string, unknown> | null;
  notification_created_at: string;
  last_sent_at: string | null;
};

export type EmailBatch = {
  userId: string;
  email: string;
  displayName: string | null;
  outboxIds: string[];
  items: EmailItem[];
};

export type BatchPlan = { batches: EmailBatch[]; deferred: string[]; dropped: string[] };

export function planEmailBatches(
  rows: ClaimedEmailRow[],
  opts: { mode: EmailMode; now: Date; throttleMs?: number },
): BatchPlan {
  const gap = opts.mode === "digest" ? DIGEST_GAP_MS : opts.throttleMs ?? THROTTLE_MS;
  const byUser = new Map<string, ClaimedEmailRow[]>();
  for (const r of rows) {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r);
    byUser.set(r.user_id, list);
  }
  const plan: BatchPlan = { batches: [], deferred: [], dropped: [] };
  for (const [userId, list] of byUser) {
    const ids = list.map((r) => r.outbox_id);
    const email = list.find((r) => r.email)?.email ?? null;
    if (!email) {
      plan.dropped.push(...ids);
      continue;
    }
    const lastSent = list
      .map((r) => (r.last_sent_at ? new Date(r.last_sent_at).getTime() : 0))
      .reduce((a, b) => Math.max(a, b), 0);
    if (lastSent && opts.now.getTime() - lastSent < gap) {
      plan.deferred.push(...ids);
      continue;
    }
    // Same notification claimed twice cannot happen (unique key), but keep
    // the email clean if it ever did.
    const seen = new Set<string>();
    const items: EmailItem[] = [];
    for (const r of [...list].sort((a, b) => a.notification_created_at.localeCompare(b.notification_created_at)).reverse()) {
      if (seen.has(r.notification_id)) continue;
      seen.add(r.notification_id);
      items.push({
        id: r.notification_id,
        kind: r.kind,
        actor_id: r.actor_id,
        actor_name: r.actor_name,
        related_post_id: r.related_post_id,
        related_conversation_id: r.related_conversation_id,
        payload: r.payload,
        created_at: r.notification_created_at,
      });
    }
    plan.batches.push({ userId, email, displayName: list[0].display_name, outboxIds: ids, items });
  }
  return plan;
}

export type NotificationDb = {
  claim: (mode: EmailMode, limit: number) => Promise<ClaimedEmailRow[]>;
  release: (ids: string[]) => Promise<void>;
  finish: (ids: string[], result: { ok: boolean; error?: string; final?: boolean; mode: EmailMode }) => Promise<void>;
};

export type Mailer = (msg: OutgoingEmail) => Promise<SendResult>;

export type RunSummary = {
  skipped?: string;
  claimed: number;
  sent: number;
  failed: number;
  deferred: number;
};

export async function runNotificationEmails(input: {
  mode: EmailMode;
  mail: MailConfig | null;
  unsubscribeSecret: string | null;
  siteUrl: string;
  db: NotificationDb;
  send: Mailer;
  now?: Date;
  limit?: number;
  log?: (msg: string) => void;
}): Promise<RunSummary> {
  const log = input.log ?? (() => {});
  const summary: RunSummary = { claimed: 0, sent: 0, failed: 0, deferred: 0 };
  if (!input.mail) {
    log("MAILGUN_API_KEY not set, leaving notification emails queued");
    return { ...summary, skipped: "no_mail_key" };
  }
  if (!input.unsubscribeSecret) {
    log("CRON_SECRET or UNSUBSCRIBE_SECRET not set, cannot sign unsubscribe links");
    return { ...summary, skipped: "no_unsubscribe_secret" };
  }
  const rows = await input.db.claim(input.mode, input.limit ?? 200);
  summary.claimed = rows.length;
  if (rows.length === 0) return summary;

  const plan = planEmailBatches(rows, { mode: input.mode, now: input.now ?? new Date() });
  if (plan.deferred.length) {
    await input.db.release(plan.deferred);
    summary.deferred = plan.deferred.length;
  }
  if (plan.dropped.length) {
    await input.db.finish(plan.dropped, { ok: false, error: "no email address", final: true, mode: input.mode });
    summary.failed += plan.dropped.length;
  }

  for (const batch of plan.batches) {
    const token = signUnsubscribeToken(batch.userId, input.unsubscribeSecret);
    const unsubscribeUrl = `${input.siteUrl}/unsubscribe?t=${encodeURIComponent(token)}`;
    const rendered = renderNotificationEmail({
      siteUrl: input.siteUrl,
      firstName: firstNameFor(batch.displayName, batch.email),
      items: batch.items,
      digest: input.mode === "digest",
      unsubscribeUrl,
    });
    const kinds = Array.from(new Set(batch.items.map((i) => i.kind)));
    const result = await input.send({
      to: batch.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      unsubscribeUrl: `${input.siteUrl}/api/unsubscribe?t=${encodeURIComponent(token)}`,
      tags: [input.mode === "digest" ? "digest" : "notification", ...kinds].slice(0, 3),
    });
    if (result.ok) {
      await input.db.finish(batch.outboxIds, { ok: true, mode: input.mode });
      summary.sent += 1;
    } else {
      log(`notification email to user ${batch.userId} failed: ${result.error}`);
      await input.db.finish(batch.outboxIds, {
        ok: false,
        error: result.error,
        final: !result.retryable,
        mode: input.mode,
      });
      summary.failed += 1;
    }
  }
  return summary;
}

// ---------- owner sign up alerts ----------

export type ClaimedOwnerAlert = {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  signed_up_at: string;
  verified: boolean;
};

export type OwnerAlertDb = {
  claim: (limit: number) => Promise<ClaimedOwnerAlert[]>;
  finish: (id: string, result: { ok: boolean; error?: string; final?: boolean }) => Promise<void>;
};

export async function runOwnerAlerts(input: {
  mail: MailConfig | null;
  ownerEmail: string;
  siteUrl: string;
  db: OwnerAlertDb;
  send: Mailer;
  limit?: number;
  log?: (msg: string) => void;
}): Promise<RunSummary> {
  const log = input.log ?? (() => {});
  const summary: RunSummary = { claimed: 0, sent: 0, failed: 0, deferred: 0 };
  if (!input.mail) {
    log("MAILGUN_API_KEY not set, leaving owner alerts queued");
    return { ...summary, skipped: "no_mail_key" };
  }
  const rows = await input.db.claim(input.limit ?? 50);
  summary.claimed = rows.length;
  for (const row of rows) {
    const rendered = renderOwnerSignupAlert({
      siteUrl: input.siteUrl,
      userId: row.user_id,
      displayName: row.display_name,
      email: row.email,
      signedUpAt: row.signed_up_at,
      verified: row.verified,
    });
    const result = await input.send({
      to: input.ownerEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: ["owner_signup_alert"],
    });
    if (result.ok) {
      await input.db.finish(row.id, { ok: true });
      summary.sent += 1;
    } else {
      log(`owner alert ${row.id} failed: ${result.error}`);
      await input.db.finish(row.id, { ok: false, error: result.error, final: !result.retryable });
      summary.failed += 1;
    }
  }
  return summary;
}
