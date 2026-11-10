// Branded Loop emails in the Fable "paper and ink" style. Table layout and
// inline styles so they hold up in Gmail, Outlook and Apple Mail. Copy is
// plain English with no dash characters.

import { describeNotification, type NoteLike } from "../notification-kinds.ts";

export const BRAND = {
  paper: "#F6F5F0",
  ink: "#141F1B",
  muted: "#4F5C56",
  border: "#E2DFD6",
  green: "#0E6B4F",
  card: "#FFFFFF",
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteUrlFrom(env: Record<string, string | undefined> = process.env): string {
  return (env.NEXT_PUBLIC_SITE_URL?.trim() || "https://loopfounders.com").replace(/\/+$/, "");
}

type Layout = {
  siteUrl: string;
  preheader: string;
  bodyHtml: string;
  footerHtml: string;
};

export function layout({ siteUrl, preheader, bodyHtml, footerHtml }: Layout): string {
  const b = BRAND;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Loop</title>
</head>
<body style="margin:0;padding:0;background:${b.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${b.paper};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td style="padding:0 4px 20px 4px;">
<a href="${siteUrl}" style="text-decoration:none;color:${b.ink};font:700 20px/1.2 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<img src="${siteUrl}/email/loop-mark.png" width="28" height="28" alt="" style="vertical-align:middle;border:0;margin-right:8px;">Loop</a>
</td></tr>
<tr><td style="background:${b.card};border:1px solid ${b.border};border-radius:16px;padding:28px 24px;color:${b.ink};font:400 16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 4px 0 4px;color:${b.muted};font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
${footerHtml}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px 0;"><tr><td style="background:${BRAND.green};border-radius:999px;">
<a href="${href}" style="display:inline-block;padding:12px 22px;color:#FFFFFF;text-decoration:none;font:600 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(label)}</a>
</td></tr></table>`;
}

export type EmailItem = NoteLike & { id: string; created_at: string };

export type RenderedEmail = { subject: string; html: string; text: string };

export function greeting(firstName: string | null): string {
  return firstName ? `Hi ${firstName},` : "Hi,";
}

function previewOf(n: EmailItem): string | null {
  const p = n.payload?.preview;
  if (typeof p !== "string" || !p.trim()) return null;
  const clean = p.replace(/\s+/g, " ").trim();
  return clean.length > 140 ? `${clean.slice(0, 139)}…` : clean;
}

function subjectFor(items: EmailItem[], digest: boolean): string {
  if (digest) {
    return items.length === 1 ? "Your Loop summary: 1 update" : `Your Loop summary: ${items.length} updates`;
  }
  if (items.length === 1) {
    // "Ana sent you a message." becomes the subject without the period.
    return describeNotification(items[0]).replace(/\.$/, "");
  }
  const people = new Set(items.map((i) => i.actor_name?.trim()).filter(Boolean) as string[]);
  const names = Array.from(people);
  if (names.length === 1) return `${items.length} new updates from ${names[0]} on Loop`;
  return `${items.length} new updates on Loop`;
}

/** One email for one user: a single update, a batch, or a daily summary. */
export function renderNotificationEmail(input: {
  siteUrl: string;
  firstName: string | null;
  items: EmailItem[];
  digest: boolean;
  unsubscribeUrl: string;
}): RenderedEmail {
  const { siteUrl, firstName, items, digest, unsubscribeUrl } = input;
  const settingsUrl = `${siteUrl}/account#notifications`;
  const shown = items.slice(0, 20);
  const extra = items.length - shown.length;
  // /notifications/open/<id> marks the item read, then redirects to the
  // place notificationHref() points at, worked out on the server.
  const link = (n: EmailItem) => `${siteUrl}/notifications/open/${n.id}`;

  const intro = digest
    ? "Here is what happened on Loop since your last summary."
    : items.length === 1
    ? "You have something new on Loop."
    : "A few things happened on Loop.";

  const rows = shown
    .map((n) => {
      const preview = previewOf(n);
      return `<tr><td style="padding:14px 0;border-top:1px solid ${BRAND.border};">
<a href="${link(n)}" style="color:${BRAND.ink};text-decoration:none;font-weight:600;">${escapeHtml(describeNotification(n))}</a>
${preview ? `<div style="margin-top:4px;color:${BRAND.muted};font-size:14px;">&ldquo;${escapeHtml(preview)}&rdquo;</div>` : ""}
</td></tr>`;
    })
    .join("\n");

  const primaryHref = items.length === 1 ? link(items[0]) : `${siteUrl}/notifications`;
  const primaryLabel = items.length === 1 ? "Open in Loop" : "See all on Loop";

  const bodyHtml = `<p style="margin:0 0 8px 0;">${escapeHtml(greeting(firstName))}</p>
<p style="margin:0 0 16px 0;color:${BRAND.muted};">${escapeHtml(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
${extra > 0 ? `<p style="margin:12px 0 0 0;color:${BRAND.muted};font-size:14px;">And ${extra} more.</p>` : ""}
${button(primaryHref, primaryLabel)}`;

  const footerHtml = `You get these emails because of your Loop notification settings.
<a href="${settingsUrl}" style="color:${BRAND.green};">Choose what we email you</a> or
<a href="${unsubscribeUrl}" style="color:${BRAND.green};">unsubscribe from all Loop emails</a>.<br>
Loop, the free professional network for founders.`;

  const textLines = [
    greeting(firstName),
    "",
    intro,
    "",
    ...shown.map((n) => {
      const preview = previewOf(n);
      return `* ${describeNotification(n)}${preview ? `\n  "${preview}"` : ""}\n  ${link(n)}`;
    }),
    ...(extra > 0 ? [`And ${extra} more: ${siteUrl}/notifications`] : []),
    "",
    `Choose what we email you: ${settingsUrl}`,
    `Unsubscribe from all Loop emails: ${unsubscribeUrl}`,
  ];

  return {
    subject: subjectFor(items, digest),
    html: layout({ siteUrl, preheader: intro, bodyHtml, footerHtml }),
    text: textLines.join("\n"),
  };
}

export function formatEastern(iso: string): string {
  const d = new Date(iso);
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return `${s} ET`;
}

export function renderOwnerSignupAlert(input: {
  siteUrl: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  signedUpAt: string;
  verified: boolean;
}): RenderedEmail {
  const who = input.displayName?.trim() || input.email || "a new member";
  const when = formatEastern(input.signedUpAt);
  const verified = input.verified ? "yes" : "no";
  const profileUrl = `${input.siteUrl}/u/${input.userId}`;
  const subject = `New Loop sign up: ${who}, ${when}, verified ${verified}`;
  const bodyHtml = `<p style="margin:0 0 12px 0;font-weight:600;">New Loop sign up</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px;">
<tr><td style="padding:4px 16px 4px 0;color:${BRAND.muted};">Name</td><td style="padding:4px 0;">${escapeHtml(input.displayName?.trim() || "not set yet")}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:${BRAND.muted};">Email</td><td style="padding:4px 0;">${escapeHtml(input.email ?? "unknown")}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:${BRAND.muted};">Signed up</td><td style="padding:4px 0;">${escapeHtml(when)}</td></tr>
<tr><td style="padding:4px 16px 4px 0;color:${BRAND.muted};">Verified</td><td style="padding:4px 0;">${verified}</td></tr>
</table>
${button(profileUrl, "View their profile")}`;
  const text = [
    "New Loop sign up",
    `Name: ${input.displayName?.trim() || "not set yet"}`,
    `Email: ${input.email ?? "unknown"}`,
    `Signed up: ${when}`,
    `Verified: ${verified}`,
    `Profile: ${profileUrl}`,
  ].join("\n");
  return {
    subject,
    html: layout({
      siteUrl: input.siteUrl,
      preheader: subject,
      bodyHtml,
      footerHtml: "Owner alert from Loop. Sent once per new member.",
    }),
    text,
  };
}
