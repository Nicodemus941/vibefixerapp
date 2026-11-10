import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkPassword,
  friendlyAuthError,
  parseOtpType,
  resolveAuthRedirect,
  safeNext,
} from "../src/lib/auth-flow.ts";
import {
  signUnsubscribeToken,
  unsubscribeSecret,
  verifyUnsubscribeToken,
} from "../src/lib/email/unsubscribe-token.ts";

test("recovery links always land on /reset-password", () => {
  assert.equal(resolveAuthRedirect({ type: "recovery", next: "/feed" }), "/reset-password");
  assert.equal(resolveAuthRedirect({ type: "recovery", next: null }), "/reset-password");
  assert.equal(resolveAuthRedirect({ type: "recovery", next: "https://evil.com" }), "/reset-password");
});

test("other links follow a same site next, or /feed", () => {
  assert.equal(resolveAuthRedirect({ type: "signup", next: "/onboarding" }), "/onboarding");
  assert.equal(resolveAuthRedirect({ type: null, next: null }), "/feed");
  assert.equal(resolveAuthRedirect({ next: "//evil.com" }), "/feed");
  assert.equal(resolveAuthRedirect({ next: "/\\evil.com" }), "/feed");
  assert.equal(resolveAuthRedirect({ next: "https://evil.com" }), "/feed");
  assert.equal(safeNext("/inbox/123"), "/inbox/123");
});

test("only known OTP types are accepted", () => {
  assert.equal(parseOtpType("recovery"), "recovery");
  assert.equal(parseOtpType("email"), "email");
  assert.equal(parseOtpType("sms"), null);
  assert.equal(parseOtpType(null), null);
});

test("friendly errors: unverified, rate limits, bad password", () => {
  const v = friendlyAuthError({ code: "email_not_confirmed", message: "Email not confirmed" });
  assert.equal(v.needsVerification, true);
  assert.equal(friendlyAuthError({ status: 429, message: "x" }).rateLimited, true);
  assert.equal(friendlyAuthError({ code: "over_email_send_rate_limit" }).rateLimited, true);
  assert.equal(friendlyAuthError({ message: "For security purposes, you can only request this after 45 seconds." }).rateLimited, true);
  assert.match(friendlyAuthError({ code: "invalid_credentials" }).message, /do not match/);
  assert.equal(friendlyAuthError(null), null);
  for (const e of [{ code: "weak_password" }, { code: "otp_expired" }, { message: "??" }]) {
    assert.ok(!/[-–—]/.test(friendlyAuthError(e).message));
  }
});

test("password rules: at least 10 characters, strength grows with length and variety", () => {
  assert.equal(checkPassword("short").ok, false);
  assert.equal(checkPassword("abcdefghi").ok, false);
  assert.equal(checkPassword("abcdefghij").ok, true);
  assert.equal(checkPassword("abcdefghij").label, "Weak");
  assert.equal(checkPassword("aaaaaaaaaaaaaaaa").label, "Weak");
  assert.equal(checkPassword("Blue Harbor 2026!").label, "Strong");
});

test("unsubscribe tokens: sign and verify round trip", () => {
  const uid = "11111111-1111-4111-8111-111111111111";
  const t = signUnsubscribeToken(uid, "s1");
  assert.equal(verifyUnsubscribeToken(t, "s1"), uid);
});

test("unsubscribe tokens: tampering, wrong secret and junk are rejected", () => {
  const uid = "11111111-1111-4111-8111-111111111111";
  const other = "22222222-2222-4222-8222-222222222222";
  const t = signUnsubscribeToken(uid, "s1");
  assert.equal(verifyUnsubscribeToken(t, "s2"), null);
  assert.equal(verifyUnsubscribeToken(`${other}.${t.split(".")[1]}`, "s1"), null);
  assert.equal(verifyUnsubscribeToken(`${t}x`, "s1"), null);
  assert.equal(verifyUnsubscribeToken("", "s1"), null);
  assert.equal(verifyUnsubscribeToken("nope", "s1"), null);
  assert.equal(verifyUnsubscribeToken(t, null), null);
  assert.throws(() => signUnsubscribeToken("not-a-uuid", "s1"));
});

test("unsubscribe secret: explicit secret wins, else derived from CRON_SECRET, else none", () => {
  assert.equal(unsubscribeSecret({ UNSUBSCRIBE_SECRET: "a", CRON_SECRET: "b" }), "a");
  assert.equal(unsubscribeSecret({ CRON_SECRET: "b" }), "derived:b");
  assert.equal(unsubscribeSecret({}), null);
});
