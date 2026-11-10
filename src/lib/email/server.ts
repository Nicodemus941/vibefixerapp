import "server-only";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail, type MailConfig } from "./mailgun";
import type { ClaimedEmailRow, ClaimedOwnerAlert, Mailer, NotificationDb, OwnerAlertDb } from "./senders";

/**
 * Vercel Cron sends "Authorization: Bearer <CRON_SECRET>". Without a
 * CRON_SECRET nothing is authorized, so the senders cannot be triggered
 * by anyone before the secret is set.
 */
export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function mailerFor(cfg: MailConfig): Mailer {
  return (msg) => sendMail(cfg, msg);
}

export function notificationDb(): NotificationDb {
  const admin = createAdminClient();
  return {
    async claim(mode, limit) {
      const { data, error } = await admin.rpc("claim_notification_emails", { p_mode: mode, p_limit: limit });
      if (error) throw new Error(`claim_notification_emails: ${error.message}`);
      return (data ?? []) as ClaimedEmailRow[];
    },
    async release(ids) {
      const { error } = await admin.rpc("release_notification_emails", { p_ids: ids });
      if (error) throw new Error(`release_notification_emails: ${error.message}`);
    },
    async finish(ids, r) {
      const { error } = await admin.rpc("finish_notification_emails", {
        p_ids: ids,
        p_ok: r.ok,
        p_mode: r.mode,
        p_error: r.error ?? null,
        p_final: r.final ?? false,
      });
      if (error) throw new Error(`finish_notification_emails: ${error.message}`);
    },
  };
}

export function ownerAlertDb(): OwnerAlertDb {
  const admin = createAdminClient();
  return {
    async claim(limit) {
      const { data, error } = await admin.rpc("claim_owner_alerts", { p_limit: limit });
      if (error) throw new Error(`claim_owner_alerts: ${error.message}`);
      return (data ?? []) as ClaimedOwnerAlert[];
    },
    async finish(id, r) {
      const { error } = await admin.rpc("finish_owner_alert", {
        p_id: id,
        p_ok: r.ok,
        p_error: r.error ?? null,
        p_final: r.final ?? false,
      });
      if (error) throw new Error(`finish_owner_alert: ${error.message}`);
    },
  };
}
