import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  KIND_INFO,
  NOTIFICATION_KINDS,
  describeNotification,
  emailDelivery,
  firstNameFor,
  notificationHref,
  resolvePreferences,
} from "../src/lib/notification-kinds.ts";

const settings = (o = {}) => ({ digest: false, paused: false, unsubscribed: false, ...o });

test("defaults: email on for conversations, mentions, replies, matches and deals; off for reactions, followers, reposts", () => {
  const r = resolvePreferences([]);
  for (const k of ["new_message", "mention", "comment_reply", "new_match", "new_document", "document_signed", "new_dispute", "dispute_resolved", "new_review"]) {
    assert.equal(r[k].email, true, k);
  }
  for (const k of ["new_reaction", "new_follower", "new_repost"]) {
    assert.equal(r[k].email, false, k);
  }
  for (const k of NOTIFICATION_KINDS) assert.equal(r[k].inApp, true, k);
});

test("stored rows override defaults and unknown kinds are ignored", () => {
  const r = resolvePreferences([
    { kind: "new_message", in_app: false, email: false },
    { kind: "new_reaction", in_app: true, email: true },
    { kind: "bogus", in_app: false, email: true },
  ]);
  assert.deepEqual(r.new_message, { kind: "new_message", inApp: false, email: false });
  assert.equal(r.new_reaction.email, true);
  assert.equal(Object.keys(r).length, NOTIFICATION_KINDS.length);
});

test("emailDelivery: urgent kinds go right away even with the daily summary", () => {
  assert.equal(emailDelivery("new_message", undefined, settings({ digest: true })), "immediate");
  assert.equal(emailDelivery("mention", undefined, settings()), "immediate");
});

test("emailDelivery: other kinds go to the summary only when chosen", () => {
  assert.equal(emailDelivery("new_comment", undefined, settings({ digest: true })), "digest");
  assert.equal(emailDelivery("new_comment", undefined, settings()), "immediate");
  assert.equal(emailDelivery("new_reaction", undefined, settings({ digest: true })), "none");
  assert.equal(emailDelivery("new_reaction", { email: true }, settings({ digest: true })), "digest");
});

test("emailDelivery: pause, unsubscribe and opt out stop everything", () => {
  assert.equal(emailDelivery("new_message", undefined, settings({ paused: true })), "none");
  assert.equal(emailDelivery("new_message", undefined, settings({ unsubscribed: true })), "none");
  assert.equal(emailDelivery("new_message", { email: false }, settings()), "none");
  assert.equal(emailDelivery("nope", undefined, settings()), "none");
});

test("SQL defaults match KIND_INFO", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261110400200_notification_preferences.sql", import.meta.url), "utf8");
  const listIn = (fn) => {
    const body = sql.slice(sql.indexOf(`FUNCTION public.${fn}`));
    const inner = body.slice(body.indexOf("IN (") + 4, body.indexOf(");"));
    return [...inner.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
  };
  const emailOn = NOTIFICATION_KINDS.filter((k) => KIND_INFO[k].email).sort();
  const urgent = NOTIFICATION_KINDS.filter((k) => KIND_INFO[k].urgent).sort();
  assert.deepEqual(listIn("notification_default_email"), emailOn);
  assert.deepEqual(listIn("notification_kind_urgent"), urgent);
});

test("every kind has copy with no dash characters and a link", () => {
  for (const k of NOTIFICATION_KINDS) {
    const n = { kind: k, actor_id: "a", actor_name: "Ana Rivera", related_post_id: "p", related_conversation_id: "c", payload: {} };
    const text = describeNotification(n) + KIND_INFO[k].label + KIND_INFO[k].hint;
    assert.ok(!/[-–—]/.test(text), `${k}: ${text}`);
    assert.ok(notificationHref(n, "me").startsWith("/"), k);
  }
});

test("links point at the right place", () => {
  const base = { actor_id: "a1", actor_name: null, related_post_id: "p1", related_conversation_id: "c1", payload: null };
  assert.equal(notificationHref({ ...base, kind: "new_message" }), "/inbox/c1");
  assert.equal(notificationHref({ ...base, kind: "mention" }), "/p/p1");
  assert.equal(notificationHref({ ...base, kind: "comment_reply" }), "/p/p1");
  assert.equal(notificationHref({ ...base, kind: "new_repost" }), "/p/p1");
  assert.equal(notificationHref({ ...base, kind: "new_follower" }), "/u/a1");
  assert.equal(notificationHref({ ...base, kind: "new_match" }), "/matches");
  assert.equal(notificationHref({ ...base, kind: "new_review" }, "me"), "/u/me");
});

test("first name falls back when we only know the email", () => {
  assert.equal(firstNameFor("Ana Rivera", "ana@x.com"), "Ana");
  assert.equal(firstNameFor("ana", "ana@x.com"), null);
  assert.equal(firstNameFor("", "ana@x.com"), null);
  assert.equal(firstNameFor(null), null);
});
