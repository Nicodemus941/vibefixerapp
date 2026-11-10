// Mailgun HTTP API sender. No SDK: one form POST per message.
//   POST {MAILGUN_API_BASE}/v3/{MAILGUN_DOMAIN}/messages
//   basic auth "api:{MAILGUN_API_KEY}"
// When MAILGUN_API_KEY is not set, mailConfig() returns null and callers
// must leave their rows queued, so deploying before the key exists sends
// nothing.

export type MailConfig = {
  apiKey: string;
  domain: string;
  apiBase: string;
  from: string;
};

const ALLOWED_BASES = ["https://api.mailgun.net", "https://api.eu.mailgun.net"];

export function mailConfig(env: Record<string, string | undefined> = process.env): MailConfig | null {
  const apiKey = env.MAILGUN_API_KEY?.trim();
  if (!apiKey) return null;
  const base = (env.MAILGUN_API_BASE?.trim() || "https://api.mailgun.net").replace(/\/+$/, "");
  return {
    apiKey,
    domain: env.MAILGUN_DOMAIN?.trim() || "mg.loopfounders.com",
    apiBase: ALLOWED_BASES.includes(base) ? base : "https://api.mailgun.net",
    from: env.EMAIL_FROM?.trim() || "Loop <hello@loopfounders.com>",
  };
}

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** One click unsubscribe URL (RFC 8058). Adds List-Unsubscribe headers. */
  unsubscribeUrl?: string;
  /** Mailgun o:tag, for example the notification kind. Up to 3. */
  tags?: string[];
};

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string; retryable: boolean };

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

export function buildMailgunForm(cfg: MailConfig, msg: OutgoingEmail): URLSearchParams {
  const form = new URLSearchParams();
  form.set("from", cfg.from);
  form.set("to", msg.to);
  form.set("subject", msg.subject);
  form.set("html", msg.html);
  form.set("text", msg.text);
  if (msg.unsubscribeUrl) {
    form.set("h:List-Unsubscribe", `<${msg.unsubscribeUrl}>`);
    form.set("h:List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
  }
  for (const tag of (msg.tags ?? []).slice(0, 3)) form.append("o:tag", tag);
  return form;
}

export async function sendMail(
  cfg: MailConfig,
  msg: OutgoingEmail,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<SendResult> {
  const url = `${cfg.apiBase}/v3/${encodeURIComponent(cfg.domain)}/messages`;
  const auth = Buffer.from(`api:${cfg.apiKey}`).toString("base64");
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildMailgunForm(cfg, msg).toString(),
    });
    const body = await res.text().catch(() => "");
    if (!res.ok) {
      return {
        ok: false,
        error: `mailgun ${res.status}: ${body.slice(0, 300)}`,
        retryable: res.status === 429 || res.status >= 500,
      };
    }
    let id: string | null = null;
    try {
      id = (JSON.parse(body) as { id?: string }).id ?? null;
    } catch {
      id = null;
    }
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: `mailgun request failed: ${(e as Error).message}`.slice(0, 300), retryable: true };
  }
}
