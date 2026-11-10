import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COLD_DM_DAILY_LIMIT,
  coldDmsLeft,
  composeColdMessage,
  friendlyMessageError,
  isColdDm,
  isFingerprinted,
  normalizeForFingerprint,
  validateHelpLine,
  wouldBeCopyPaste,
} from "../src/lib/cold-dm.ts";

const none = {
  hasPriorMessages: false,
  hasMatch: false,
  hasDeal: false,
  senderFollowsRecipient: false,
  recipientFollowsSender: false,
};

test("strangers are cold", () => {
  assert.equal(isColdDm(none), true);
});

test("any prior message, match or deal warms the pair", () => {
  assert.equal(isColdDm({ ...none, hasPriorMessages: true }), false);
  assert.equal(isColdDm({ ...none, hasMatch: true }), false);
  assert.equal(isColdDm({ ...none, hasDeal: true }), false);
});

test("only a mutual follow warms the pair", () => {
  assert.equal(isColdDm({ ...none, senderFollowsRecipient: true }), true);
  assert.equal(isColdDm({ ...none, recipientFollowsSender: true }), true);
  assert.equal(isColdDm({ ...none, senderFollowsRecipient: true, recipientFollowsSender: true }), false);
});

test("help line needs 20 characters after trimming", () => {
  assert.match(validateHelpLine(""), /how you can help/);
  assert.match(validateHelpLine("I can help you     "), /more characters?\)/);
  assert.equal(validateHelpLine("I can set up your cold email."), null);
  assert.equal(validateHelpLine("x".repeat(20)), null);
  assert.match(validateHelpLine("x".repeat(19)), /1 more character\)/);
});

test("help line becomes the first line of the stored body", () => {
  assert.equal(composeColdMessage("  I can help\n with   design ", ""), "I can help with design");
  assert.equal(
    composeColdMessage("I can set up your cold email.", " More here. "),
    "I can set up your cold email.\n\nMore here.",
  );
  const body = composeColdMessage("I can set up your cold email.", "x");
  assert.equal(body.split("\n")[0], "I can set up your cold email.");
});

test("fingerprints ignore case and whitespace", () => {
  assert.equal(
    normalizeForFingerprint("  Hello   THERE\n friend "),
    normalizeForFingerprint("hello there friend"),
  );
  assert.equal(isFingerprinted("thanks, talk soon"), false);
  assert.equal(isFingerprinted("x".repeat(40)), true);
});

test("copy paste allows 3 people and blocks the 4th", () => {
  assert.equal(wouldBeCopyPaste([], "d"), false);
  assert.equal(wouldBeCopyPaste(["a", "b"], "d"), false);
  assert.equal(wouldBeCopyPaste(["a", "b", "c"], "d"), true);
  // Sending the same text again to someone who already got it is not new.
  assert.equal(wouldBeCopyPaste(["a", "b", "a"], "c"), false);
  assert.equal(wouldBeCopyPaste(["a", "b", "c"], "c"), false);
});

test("daily cold DM allowance", () => {
  assert.equal(COLD_DM_DAILY_LIMIT, 10);
  assert.equal(coldDmsLeft(0), 10);
  assert.equal(coldDmsLeft(9), 1);
  assert.equal(coldDmsLeft(12), 0);
});

test("database guard errors pass through, others are generic", () => {
  const db = "You have started 10 new conversations today. You can start more tomorrow.";
  assert.equal(friendlyMessageError(db), db);
  assert.equal(friendlyMessageError("some internal failure"), "Your message did not send. Try again.");
  assert.ok(!/[–—]/.test(db));
});
