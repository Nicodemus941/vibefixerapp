import { test } from "node:test";
import assert from "node:assert/strict";
import { planEmailBatches, runNotificationEmails, runOwnerAlerts, THROTTLE_MS } from "../src/lib/email/senders.ts";
import { buildMailgunForm, mailConfig, sendMail } from "../src/lib/email/mailgun.ts";
import { renderNotificationEmail, renderOwnerSignupAlert } from "../src/lib/email/templates.ts";
import { verifyUnsubscribeToken } from "../src/lib/email/unsubscribe-token.ts";

const NOW = new Date("2026-11-10T15:00:00Z");
const U1 = "11111111-1111-4111-8111-111111111111";
const U2 = "22222222-2222-4222-8222-222222222222";
const SECRET = "test-secret";
const CFG = { apiKey: "key-test", domain: "mg.example.com", apiBase: "https://api.mailgun.net", from: "Loop <hello@example.com>" };

let seq = 0;
function row(user, o = {}) {
  seq++;
  return {
    outbox_id: `o${seq}`,
    notification_id: `n${seq}`,
    user_id: user,
    email: user === U1 ? "ana@example.com" : "ben@example.com",
    display_name: user === U1 ? "Ana Rivera" : "ben",
    kind: "new_message",
    actor_id: "a",
    actor_name: "Cole",
    related_post_id: null,
    related_conversation_id: "c1",
    payload: { preview: "hello there" },
    notification_created_at: new Date(NOW.getTime() - seq * 1000).toISOString(),
    last_sent_at: null,
    ...o,
  };
}

test("one email per user, newest first", () => {
  const rows = [row(U1), row(U1), row(U2)];
  const plan = planEmailBatches(rows, { mode: "immediate", now: NOW });
  assert.equal(plan.batches.length, 2);
  const b1 = plan.batches.find((b) => b.userId === U1);
  assert.deepEqual(b1.outboxIds, [rows[0].outbox_id, rows[1].outbox_id]);
  assert.equal(b1.items[0].id, rows[0].notification_id); // newest first
  assert.deepEqual(plan.deferred, []);
});

test("throttle: a user emailed under 10 minutes ago waits and batches", () => {
  const recent = new Date(NOW.getTime() - THROTTLE_MS + 60_000).toISOString();
  const old = new Date(NOW.getTime() - THROTTLE_MS - 1).toISOString();
  const rows = [row(U1, { last_sent_at: recent }), row(U1, { last_sent_at: recent }), row(U2, { last_sent_at: old })];
  const plan = planEmailBatches(rows, { mode: "immediate", now: NOW });
  assert.deepEqual(plan.deferred.sort(), [rows[0].outbox_id, rows[1].outbox_id].sort());
  assert.equal(plan.batches.length, 1);
  assert.equal(plan.batches[0].userId, U2);
});

test("digest mode ignores the 10 minute throttle but not a same day digest", () => {
  const tenMinAgo = new Date(NOW.getTime() - 11 * 60_000).toISOString();
  const twoHoursAgo = new Date(NOW.getTime() - 2 * 3600_000).toISOString();
  const plan = planEmailBatches([row(U1, { last_sent_at: tenMinAgo })], { mode: "digest", now: NOW });
  assert.equal(plan.batches.length, 0); // 11 minutes is inside the 20 hour digest gap
  const plan2 = planEmailBatches([row(U1, { last_sent_at: null }), row(U2, { last_sent_at: twoHoursAgo })], { mode: "digest", now: NOW });
  assert.equal(plan2.batches.length, 1);
});

test("rows without an email address are dropped, not sent", () => {
  const plan = planEmailBatches([row(U1, { email: null })], { mode: "immediate", now: NOW });
  assert.equal(plan.batches.length, 0);
  assert.equal(plan.dropped.length, 1);
});

function mockDb(rows) {
  const calls = { claim: 0, release: [], finish: [] };
  return {
    calls,
    db: {
      claim: async () => {
        calls.claim++;
        return rows;
      },
      release: async (ids) => calls.release.push(ids),
      finish: async (ids, r) => calls.finish.push({ ids, ...r }),
    },
  };
}

test("no MAILGUN_API_KEY: nothing is claimed or sent", async () => {
  const { db, calls } = mockDb([row(U1)]);
  let sends = 0;
  const r = await runNotificationEmails({
    mode: "immediate",
    mail: mailConfig({}),
    unsubscribeSecret: SECRET,
    siteUrl: "https://loop.test",
    db,
    send: async () => {
      sends++;
      return { ok: true, id: "x" };
    },
  });
  assert.equal(r.skipped, "no_mail_key");
  assert.equal(calls.claim, 0);
  assert.equal(sends, 0);
});

test("sends one email per user with unsubscribe headers, marks sent, releases throttled", async () => {
  const recent = new Date(NOW.getTime() - 60_000).toISOString();
  const rows = [row(U1), row(U1), row(U2, { last_sent_at: recent })];
  const { db, calls } = mockDb(rows);
  const sent = [];
  const r = await runNotificationEmails({
    mode: "immediate",
    mail: CFG,
    unsubscribeSecret: SECRET,
    siteUrl: "https://loop.test",
    db,
    now: NOW,
    send: async (m) => {
      sent.push(m);
      return { ok: true, id: "x" };
    },
  });
  assert.equal(r.sent, 1);
  assert.equal(r.deferred, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "ana@example.com");
  assert.match(sent[0].text, /^Hi Ana,/);
  assert.match(sent[0].unsubscribeUrl, /^https:\/\/loop\.test\/api\/unsubscribe\?t=/);
  const token = decodeURIComponent(sent[0].unsubscribeUrl.split("t=")[1]);
  assert.equal(verifyUnsubscribeToken(token, SECRET), U1);
  assert.deepEqual(calls.release, [[rows[2].outbox_id]]);
  assert.deepEqual(calls.finish, [{ ids: [rows[0].outbox_id, rows[1].outbox_id], ok: true, mode: "immediate" }]);
});

test("a failed send goes back for retry unless permanent", async () => {
  const { db, calls } = mockDb([row(U1), row(U2)]);
  await runNotificationEmails({
    mode: "immediate",
    mail: CFG,
    unsubscribeSecret: SECRET,
    siteUrl: "https://loop.test",
    db,
    now: NOW,
    send: async (m) =>
      m.to.startsWith("ana") ? { ok: false, error: "mailgun 500", retryable: true } : { ok: false, error: "mailgun 400", retryable: false },
  });
  const byUserFinal = calls.finish.map((f) => f.final).sort();
  assert.deepEqual(byUserFinal, [false, true]);
  assert.ok(calls.finish.every((f) => f.ok === false && f.error));
});

test("owner alerts: no key means no claim; with a key one email per alert", async () => {
  let claims = 0;
  const finishes = [];
  const db = {
    claim: async () => {
      claims++;
      return [{ id: "x1", user_id: U1, email: "ana@example.com", display_name: "Ana Rivera", signed_up_at: "2026-11-10T15:00:00Z", verified: true }];
    },
    finish: async (id, r) => finishes.push({ id, ...r }),
  };
  const skipped = await runOwnerAlerts({ mail: null, ownerEmail: "owner@example.com", siteUrl: "https://loop.test", db, send: async () => ({ ok: true, id: null }) });
  assert.equal(skipped.skipped, "no_mail_key");
  assert.equal(claims, 0);

  const sent = [];
  const r = await runOwnerAlerts({
    mail: CFG,
    ownerEmail: "owner@example.com",
    siteUrl: "https://loop.test",
    db,
    send: async (m) => {
      sent.push(m);
      return { ok: true, id: "m1" };
    },
  });
  assert.equal(r.sent, 1);
  assert.equal(sent[0].to, "owner@example.com");
  assert.equal(sent[0].subject, "New Loop sign up: Ana Rivera, Nov 10, 2026, 10:00 AM ET, verified yes");
  assert.match(sent[0].html, /https:\/\/loop\.test\/u\/11111111/);
  assert.deepEqual(finishes, [{ id: "x1", ok: true }]);
});

test("mailgun: config defaults, form fields and basic auth, all mocked", async () => {
  assert.equal(mailConfig({}), null);
  const cfg = mailConfig({ MAILGUN_API_KEY: "k", MAILGUN_API_BASE: "https://evil.example" });
  assert.equal(cfg.apiBase, "https://api.mailgun.net");
  assert.equal(cfg.domain, "mg.loopfounders.com");
  assert.equal(cfg.from, "Loop <hello@loopfounders.com>");
  assert.equal(mailConfig({ MAILGUN_API_KEY: "k", MAILGUN_API_BASE: "https://api.eu.mailgun.net/" }).apiBase, "https://api.eu.mailgun.net");

  const form = buildMailgunForm(CFG, { to: "a@b.c", subject: "s", html: "<p>h</p>", text: "t", unsubscribeUrl: "https://loop.test/u", tags: ["a", "b", "c", "d"] });
  assert.equal(form.get("h:List-Unsubscribe"), "<https://loop.test/u>");
  assert.equal(form.get("h:List-Unsubscribe-Post"), "List-Unsubscribe=One-Click");
  assert.deepEqual(form.getAll("o:tag"), ["a", "b", "c"]);

  let seen;
  const res = await sendMail(CFG, { to: "a@b.c", subject: "s", html: "h", text: "t" }, async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, text: async () => '{"id":"<1@mg>"}' };
  });
  assert.deepEqual(res, { ok: true, id: "<1@mg>" });
  assert.equal(seen.url, "https://api.mailgun.net/v3/mg.example.com/messages");
  assert.equal(seen.init.headers.Authorization, `Basic ${Buffer.from("api:key-test").toString("base64")}`);

  const fail = await sendMail(CFG, { to: "a@b.c", subject: "s", html: "h", text: "t" }, async () => ({ ok: false, status: 400, text: async () => "bad" }));
  assert.equal(fail.ok, false);
  assert.equal(fail.retryable, false);
});

test("emails: greeting fallback, escaping, settings and unsubscribe links, no dashes in copy", () => {
  const items = [
    { id: "n1", kind: "mention", actor_id: "a", actor_name: "<script>", related_post_id: "p", related_conversation_id: null, payload: { in_comment: true }, created_at: NOW.toISOString() },
  ];
  const e = renderNotificationEmail({ siteUrl: "https://loop.test", firstName: null, items, digest: false, unsubscribeUrl: "https://loop.test/unsubscribe?t=x" });
  assert.match(e.text, /^Hi,/);
  assert.ok(!e.html.includes("<script>"));
  assert.match(e.html, /account#notifications/);
  assert.match(e.html, /unsubscribe\?t=x/);
  assert.match(e.html, /notifications\/open\/n1/);
  const digest = renderNotificationEmail({ siteUrl: "https://loop.test", firstName: "Ana", items: [...items, { ...items[0], id: "n2" }], digest: true, unsubscribeUrl: "u" });
  assert.equal(digest.subject, "Your Loop summary: 2 updates");
  const owner = renderOwnerSignupAlert({ siteUrl: "https://loop.test", userId: U1, displayName: null, email: "x@y.z", signedUpAt: NOW.toISOString(), verified: false });
  for (const s of [e.subject, e.text, digest.text, owner.subject, owner.text]) {
    const copy = s.replace(/https?:\/\/\S+/g, "");
    assert.ok(!/[–—]| - /.test(copy), copy);
  }
  assert.match(owner.subject, /verified no$/);
});
