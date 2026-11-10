import { NextResponse } from "next/server";
import { mailConfig } from "@/lib/email/mailgun";
import { runOwnerAlerts } from "@/lib/email/senders";
import { siteUrlFrom } from "@/lib/email/templates";
import { cronAuthorized, mailerFor, ownerAlertDb } from "@/lib/email/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron every 5 minutes. Emails OWNER_ALERT_EMAIL once per new
// member. Without MAILGUN_API_KEY it claims nothing.
export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const mail = mailConfig();
  try {
    const summary = await runOwnerAlerts({
      mail,
      ownerEmail: process.env.OWNER_ALERT_EMAIL?.trim() || "nicodemmebaptiste@convelabs.com",
      siteUrl: siteUrlFrom(),
      db: mail ? ownerAlertDb() : { claim: async () => [], finish: async () => {} },
      send: mail ? mailerFor(mail) : async () => ({ ok: false, error: "no mail config", retryable: true }),
      log: (m) => console.log(`[owner-alerts] ${m}`),
    });
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[owner-alerts]", e);
    return NextResponse.json({ error: "sender failed" }, { status: 500 });
  }
}
