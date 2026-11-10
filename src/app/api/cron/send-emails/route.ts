import { NextResponse } from "next/server";
import { mailConfig } from "@/lib/email/mailgun";
import { runNotificationEmails, type EmailMode } from "@/lib/email/senders";
import { siteUrlFrom } from "@/lib/email/templates";
import { unsubscribeSecret } from "@/lib/email/unsubscribe-token";
import { cronAuthorized, mailerFor, notificationDb } from "@/lib/email/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron: every 5 minutes (immediate) and daily at 13:00 UTC
// (?mode=digest). Protected by CRON_SECRET. Without MAILGUN_API_KEY it
// claims nothing and returns { skipped: "no_mail_key" }.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const mode: EmailMode = new URL(request.url).searchParams.get("mode") === "digest" ? "digest" : "immediate";
  const mail = mailConfig();
  try {
    const summary = await runNotificationEmails({
      mode,
      mail,
      unsubscribeSecret: unsubscribeSecret(),
      siteUrl: siteUrlFrom(),
      db: mail ? notificationDb() : { claim: async () => [], release: async () => {}, finish: async () => {} },
      send: mail ? mailerFor(mail) : async () => ({ ok: false, error: "no mail config", retryable: true }),
      log: (m) => console.log(`[send-emails:${mode}] ${m}`),
    });
    return NextResponse.json({ mode, ...summary });
  } catch (e) {
    console.error(`[send-emails:${mode}]`, e);
    return NextResponse.json({ mode, error: "sender failed" }, { status: 500 });
  }
}
