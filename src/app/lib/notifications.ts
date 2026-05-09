import "server-only";
import { BUSINESS } from "../config";

export type Lead = {
  name: string;
  phone: string;
  vehicle: string;
  service: string;
  damage?: string;
  insurance?: string;
  zip?: string;
  receivedAt: string;
  ip?: string;
  userAgent?: string;
  referredBy?: string;        // code from a friend's share link
  ownReferralCode?: string;   // this customer's share code
};

const SERVICE_LABELS: Record<string, string> = {
  "chip-repair": "Rock chip / small crack",
  "windshield-replace": "Windshield replacement",
  "side-back": "Side, vent, or rear glass",
  "not-sure": "Not sure — please advise",
};

function fmtPhoneDisplay(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length === 11 && d[0] === "1")
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`;
  return p;
}

function toE164(p: string) {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d[0] === "1") return `+${d}`;
  if (p.startsWith("+")) return p;
  return null;
}

function fmtTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function leadHtml(lead: Lead) {
  const service = SERVICE_LABELS[lead.service] ?? lead.service;
  const phone = fmtPhoneDisplay(lead.phone);
  const dial = toE164(lead.phone) ?? lead.phone;
  return `
<!doctype html>
<html><body style="margin:0;background:#0c4040;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1f3a;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.18);">
      <div style="background:linear-gradient(135deg,#1f8c8c,#0c4040);color:#fff;padding:20px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#f59e0b;">New lead · F.A.S.T.</div>
        <div style="font-size:22px;font-weight:800;margin-top:4px;">${escapeHtml(lead.name)}</div>
        <div style="font-size:14px;opacity:.85;margin-top:2px;">${escapeHtml(service)}</div>
      </div>

      <div style="padding:8px 24px 24px;">
        <a href="tel:${dial}" style="display:block;margin-top:16px;background:#f59e0b;color:#0b1f3a;text-align:center;padding:16px;border-radius:12px;font-size:18px;font-weight:800;text-decoration:none;">📞 Call ${phone}</a>
        <a href="sms:${dial}?body=${encodeURIComponent(`Hi ${lead.name.split(" ")[0]}, this is Eric from F.A.S.T. Family Autoglass. Got your quote request — `)}" style="display:block;margin-top:8px;background:#0c4040;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;">💬 Text ${phone}</a>

        <table style="width:100%;margin-top:24px;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#475569;width:120px;">Vehicle</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(lead.vehicle)}</td></tr>
          <tr><td style="padding:8px 0;color:#475569;">Service</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(service)}</td></tr>
          ${lead.insurance ? `<tr><td style="padding:8px 0;color:#475569;">Insurance</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(lead.insurance)}</td></tr>` : ""}
          ${lead.zip ? `<tr><td style="padding:8px 0;color:#475569;">ZIP</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(lead.zip)}</td></tr>` : ""}
          ${lead.damage ? `<tr><td style="padding:8px 0;color:#475569;vertical-align:top;">Damage</td><td style="padding:8px 0;">${escapeHtml(lead.damage)}</td></tr>` : ""}
          ${lead.referredBy ? `<tr><td style="padding:8px 0;color:#475569;">Referred by</td><td style="padding:8px 0;font-weight:700;color:#d97706;">${escapeHtml(lead.referredBy)}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#475569;">Received</td><td style="padding:8px 0;">${escapeHtml(fmtTimestamp(lead.receivedAt))}</td></tr>
        </table>

        <p style="margin-top:24px;font-size:12px;color:#94a3b8;line-height:1.5;">
          Reply within minutes during business hours for the highest close rate. Most quote leads convert when they're contacted in under 5 minutes.${lead.referredBy ? " This customer came from a referral — credit both sides if they book." : ""}
        </p>
      </div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:11px;color:#cbd5e1;">${BUSINESS.name} · ${BUSINESS.city}</div>
  </div>
</body></html>`.trim();
}

function leadText(lead: Lead) {
  const service = SERVICE_LABELS[lead.service] ?? lead.service;
  const lines = [
    `NEW LEAD — F.A.S.T. Family Autoglass`,
    ``,
    `Name: ${lead.name}`,
    `Phone: ${fmtPhoneDisplay(lead.phone)}`,
    `Vehicle: ${lead.vehicle}`,
    `Service: ${service}`,
    lead.insurance ? `Insurance: ${lead.insurance}` : null,
    lead.zip ? `ZIP: ${lead.zip}` : null,
    lead.damage ? `Damage: ${lead.damage}` : null,
    `Received: ${fmtTimestamp(lead.receivedAt)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type SendResult = { ok: boolean; skipped?: boolean; reason?: string; status?: number };

async function sendEricEmail(lead: Lead): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO ?? BUSINESS.email;
  const from = process.env.LEAD_EMAIL_FROM ?? "F.A.S.T. Quotes <onboarding@resend.dev>";
  if (!apiKey) return { ok: false, skipped: true, reason: "RESEND_API_KEY not set" };

  const service = SERVICE_LABELS[lead.service] ?? lead.service;
  const subject = `🚗 ${lead.name} · ${lead.vehicle} · ${service}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: leadHtml(lead),
      text: leadText(lead),
    }),
  });
  return { ok: res.ok, status: res.status };
}

async function twilioSend(to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return { ok: false, skipped: true, reason: "Twilio not configured" };
  const e164 = toE164(to);
  if (!e164) return { ok: false, skipped: true, reason: `invalid phone: ${to}` };

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: e164, Body: body }).toString(),
  });
  return { ok: res.ok, status: res.status };
}

// Twilio scheduled SMS — fires at sendAt without us holding state.
// Requires a Messaging Service SID (not a plain From number); SendAt must
// be 15 min – 35 days in the future per Twilio's API rules.
async function twilioSchedule(
  to: string,
  body: string,
  sendAt: Date,
): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const msgService = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!sid || !token || !msgService) {
    return {
      ok: false,
      skipped: true,
      reason: "TWILIO_MESSAGING_SERVICE_SID not set (required for scheduled SMS)",
    };
  }
  const e164 = toE164(to);
  if (!e164) return { ok: false, skipped: true, reason: `invalid phone: ${to}` };

  const now = Date.now();
  const minSendAt = now + 16 * 60 * 1000; // 16 min — 1 min cushion past Twilio's 15
  const maxSendAt = now + 35 * 24 * 60 * 60 * 1000;
  if (sendAt.getTime() < minSendAt) {
    return { ok: false, skipped: true, reason: "send-at < 15 min in future" };
  }
  if (sendAt.getTime() > maxSendAt) {
    return { ok: false, skipped: true, reason: "send-at > 35 days in future" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      MessagingServiceSid: msgService,
      To: e164,
      Body: body,
      SendAt: sendAt.toISOString(),
      ScheduleType: "fixed",
    }).toString(),
  });
  return { ok: res.ok, status: res.status };
}

// DST-aware: returns the UTC Date corresponding to a wall-clock time in
// America/New_York on the given date.
function nyWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  // Compute NY's UTC offset on that date by formatting a sample noon-UTC.
  const sample = new Date(Date.UTC(year, month - 1, day, 12, 0));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  });
  const parts = fmt.formatToParts(sample);
  const offsetStr = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-05:00";
  const m = offsetStr.match(/GMT([+-])(\d{2}):(\d{2})/);
  let offsetMin = -300;
  if (m) {
    const sign = m[1] === "+" ? 1 : -1;
    offsetMin = sign * (Number(m[2]) * 60 + Number(m[3]));
  }
  // wall-clock NY = UTC + offset → UTC = wall-clock - offset
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - offsetMin * 60 * 1000);
}

async function sendEricSms(lead: Lead): Promise<SendResult> {
  const to = process.env.LEAD_SMS_TO;
  if (!to) return { ok: false, skipped: true, reason: "LEAD_SMS_TO not set" };
  const service = SERVICE_LABELS[lead.service] ?? lead.service;
  const body =
    `📍 F.A.S.T. lead: ${lead.name} · ${lead.vehicle} · ${service} · ${fmtPhoneDisplay(lead.phone)}` +
    (lead.insurance ? ` · ${lead.insurance}` : "") +
    (lead.zip ? ` · ${lead.zip}` : "") +
    (lead.referredBy ? ` · ref:${lead.referredBy}` : "");
  return twilioSend(to, body.slice(0, 320));
}

async function sendCustomerSms(lead: Lead): Promise<SendResult> {
  const firstName = lead.name.split(/\s+/)[0] ?? lead.name;
  const body =
    `Hi ${firstName} — Eric from F.A.S.T. Family Autoglass here. ` +
    `Got your quote request for the ${lead.vehicle}. We'll text or call you back shortly. ` +
    `Need us faster? Call ${BUSINESS.phoneDisplay}.`;
  return twilioSend(lead.phone, body);
}

export async function notifyLead(lead: Lead) {
  const results = await Promise.allSettled([
    sendEricEmail(lead),
    sendEricSms(lead),
    sendCustomerSms(lead),
  ]);
  const summary = {
    email: results[0].status === "fulfilled" ? results[0].value : { ok: false, reason: String(results[0].reason) },
    ericSms: results[1].status === "fulfilled" ? results[1].value : { ok: false, reason: String(results[1].reason) },
    customerSms: results[2].status === "fulfilled" ? results[2].value : { ok: false, reason: String(results[2].reason) },
  };
  console.log("[F.A.S.T. notify]", JSON.stringify({ lead, summary }, null, 2));
  return summary;
}

// ---------- Booking notifications ----------

export type Booking = Lead & {
  slotStart: string;       // wall-clock NY ISO of slot start, "YYYY-MM-DDTHH:MM"
  slotEnd: string;         // wall-clock NY ISO of slot end,   "YYYY-MM-DDTHH:MM"
  slotRangeLabel: string;  // "10:30 AM – 12:00 PM"
  slotDayLabel: string;    // "Tomorrow · Tue, May 12"
};

// Parse a "YYYY-MM-DDTHH:MM" wall-clock string in America/New_York into a UTC Date.
function nyWallClockStringToUtc(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return null;
  return nyWallClockToUtc(+m[1], +m[2], +m[3], +m[4], +m[5]);
}

function bookingHtml(b: Booking) {
  const service = SERVICE_LABELS[b.service] ?? b.service;
  const phone = fmtPhoneDisplay(b.phone);
  const dial = toE164(b.phone) ?? b.phone;
  return `
<!doctype html>
<html><body style="margin:0;background:#0c4040;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b1f3a;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.18);">
      <div style="background:linear-gradient(135deg,#1f8c8c,#0c4040);color:#fff;padding:20px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#f59e0b;">🗓️ New booking · F.A.S.T.</div>
        <div style="font-size:22px;font-weight:800;margin-top:4px;">${escapeHtml(b.name)}</div>
        <div style="font-size:14px;opacity:.85;margin-top:2px;">${escapeHtml(service)} · ${escapeHtml(b.vehicle)}</div>
      </div>

      <div style="background:#f59e0b;padding:18px 24px;color:#0b1f3a;">
        <div style="font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.8;">Locked-in slot</div>
        <div style="font-size:18px;font-weight:800;margin-top:2px;">${escapeHtml(b.slotDayLabel)}</div>
        <div style="font-size:24px;font-weight:800;">${escapeHtml(b.slotRangeLabel)}</div>
      </div>

      <div style="padding:8px 24px 24px;">
        <a href="tel:${dial}" style="display:block;margin-top:16px;background:#0c4040;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;">📞 Call ${phone}</a>
        <a href="sms:${dial}?body=${encodeURIComponent(`Hi ${b.name.split(" ")[0]}, this is Eric from F.A.S.T. — confirming your install. We're set for ${b.slotDayLabel}, ${b.slotRangeLabel}. `)}" style="display:block;margin-top:8px;background:#1f8c8c;color:#fff;text-align:center;padding:14px;border-radius:12px;font-weight:700;text-decoration:none;">💬 Text ${phone}</a>

        <table style="width:100%;margin-top:24px;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#475569;width:120px;">Vehicle</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(b.vehicle)}</td></tr>
          <tr><td style="padding:8px 0;color:#475569;">Service</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(service)}</td></tr>
          ${b.insurance ? `<tr><td style="padding:8px 0;color:#475569;">Insurance</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(b.insurance)}</td></tr>` : ""}
          ${b.zip ? `<tr><td style="padding:8px 0;color:#475569;">ZIP</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(b.zip)}</td></tr>` : ""}
          ${b.damage ? `<tr><td style="padding:8px 0;color:#475569;vertical-align:top;">Damage</td><td style="padding:8px 0;">${escapeHtml(b.damage)}</td></tr>` : ""}
          ${b.referredBy ? `<tr><td style="padding:8px 0;color:#475569;">Referred by</td><td style="padding:8px 0;font-weight:700;color:#d97706;">${escapeHtml(b.referredBy)}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#475569;">Booked</td><td style="padding:8px 0;">${escapeHtml(fmtTimestamp(b.receivedAt))}</td></tr>
        </table>
      </div>
    </div>
    <div style="text-align:center;margin-top:16px;font-size:11px;color:#cbd5e1;">${BUSINESS.name} · ${BUSINESS.city}</div>
  </div>
</body></html>`.trim();
}

function bookingText(b: Booking) {
  const service = SERVICE_LABELS[b.service] ?? b.service;
  const lines = [
    `NEW BOOKING — F.A.S.T. Family Autoglass`,
    ``,
    `When: ${b.slotDayLabel}, ${b.slotRangeLabel}`,
    ``,
    `Name: ${b.name}`,
    `Phone: ${fmtPhoneDisplay(b.phone)}`,
    `Vehicle: ${b.vehicle}`,
    `Service: ${service}`,
    b.insurance ? `Insurance: ${b.insurance}` : null,
    b.zip ? `ZIP: ${b.zip}` : null,
    b.damage ? `Damage: ${b.damage}` : null,
    `Booked at: ${fmtTimestamp(b.receivedAt)}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function sendEricBookingEmail(b: Booking): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO ?? BUSINESS.email;
  const from = process.env.LEAD_EMAIL_FROM ?? "F.A.S.T. Bookings <onboarding@resend.dev>";
  if (!apiKey) return { ok: false, skipped: true, reason: "RESEND_API_KEY not set" };

  const subject = `🗓️ ${b.name} booked: ${b.slotDayLabel} ${b.slotRangeLabel} · ${b.vehicle}`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: bookingHtml(b),
      text: bookingText(b),
    }),
  });
  return { ok: res.ok, status: res.status };
}

async function sendEricBookingSms(b: Booking): Promise<SendResult> {
  const to = process.env.LEAD_SMS_TO;
  if (!to) return { ok: false, skipped: true, reason: "LEAD_SMS_TO not set" };
  const service = SERVICE_LABELS[b.service] ?? b.service;
  const body =
    `🗓️ F.A.S.T. booking: ${b.slotDayLabel} ${b.slotRangeLabel} · ${b.name} · ${b.vehicle} · ${service} · ${fmtPhoneDisplay(b.phone)}` +
    (b.insurance ? ` · ${b.insurance}` : "") +
    (b.referredBy ? ` · ref:${b.referredBy}` : "");
  return twilioSend(to, body.slice(0, 320));
}

async function sendCustomerBookingSms(b: Booking): Promise<SendResult> {
  const firstName = b.name.split(/\s+/)[0] ?? b.name;
  const body =
    `Hi ${firstName} — you're booked with F.A.S.T. Family Autoglass for ${b.slotDayLabel}, ${b.slotRangeLabel} (${b.vehicle}). ` +
    `Eric will text 30 min before arrival. Need to reschedule? Reply to this text or call ${BUSINESS.phoneDisplay}.`;
  return twilioSend(b.phone, body);
}

// Schedule a review-ask SMS for ~2 hours after the install slot ends.
// Twilio holds the queue — no DB needed on our side. Customer gets a
// friendly, low-pressure ask with a 1-tap Google review link.
async function scheduleCustomerReviewAsk(b: Booking): Promise<SendResult> {
  const end = nyWallClockStringToUtc(b.slotEnd);
  if (!end) return { ok: false, skipped: true, reason: "invalid slotEnd" };

  const delayHours = Number(process.env.REVIEW_ASK_HOURS_AFTER ?? 2);
  const sendAt = new Date(end.getTime() + delayHours * 60 * 60 * 1000);
  const reviewUrl =
    process.env.GOOGLE_REVIEW_URL ??
    `https://www.google.com/search?q=${encodeURIComponent(
      `${BUSINESS.name} ${BUSINESS.city}`,
    )}#lrd=`;

  const firstName = b.name.split(/\s+/)[0] ?? b.name;
  const body =
    `Hi ${firstName} — Eric here from F.A.S.T. Family Autoglass. Hope your install went great! ` +
    `If we earned it, would you mind dropping a quick Google review? Means the world to a small family business. ` +
    `${reviewUrl}`;

  return twilioSchedule(b.phone, body, sendAt);
}

export async function notifyBooking(booking: Booking) {
  const results = await Promise.allSettled([
    sendEricBookingEmail(booking),
    sendEricBookingSms(booking),
    sendCustomerBookingSms(booking),
    scheduleCustomerReviewAsk(booking),
  ]);
  const summary = {
    email: results[0].status === "fulfilled" ? results[0].value : { ok: false, reason: String(results[0].reason) },
    ericSms: results[1].status === "fulfilled" ? results[1].value : { ok: false, reason: String(results[1].reason) },
    customerSms: results[2].status === "fulfilled" ? results[2].value : { ok: false, reason: String(results[2].reason) },
    reviewAskScheduled:
      results[3].status === "fulfilled" ? results[3].value : { ok: false, reason: String(results[3].reason) },
  };
  console.log("[F.A.S.T. booking]", JSON.stringify({ booking, summary }, null, 2));
  return summary;
}
