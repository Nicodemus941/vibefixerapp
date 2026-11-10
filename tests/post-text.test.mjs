import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeMentionQuery,
  extractFirstUrl,
  extractHashtagsFromBody,
  extractMentionIds,
  toDisplayText,
  toEditable,
  toStoredText,
  tokenize,
} from "../src/lib/post-text.ts";

const ANA = "11111111-2222-4333-8444-555555555555";
const BO = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

test("tokenize finds mentions, hashtags and urls", () => {
  const body = `Thanks @[Ana Lopez](${ANA}) for the #design help. See https://example.com/a.`;
  const t = tokenize(body);
  assert.deepEqual(
    t.filter((x) => x.type !== "text"),
    [
      { type: "mention", name: "Ana Lopez", id: ANA },
      { type: "hashtag", tag: "design" },
      { type: "url", href: "https://example.com/a", label: "example.com/a" },
    ],
  );
  // Trailing period stays as text.
  assert.equal(t[t.length - 1].type, "text");
  assert.equal(t[t.length - 1].value, ".");
});

test("a URL fragment is not a hashtag", () => {
  assert.deepEqual(extractHashtagsFromBody("read https://x.com/page#section and #growth"), ["growth"]);
});

test("toStoredText converts picked names and round trips through toEditable", () => {
  const text = "Shoutout @Ana Lopez and @Bo, plus @Nobody";
  const stored = toStoredText(text, [
    { id: ANA, name: "Ana Lopez" },
    { id: BO, name: "Bo" },
  ]);
  assert.equal(stored, `Shoutout @[Ana Lopez](${ANA}) and @[Bo](${BO}), plus @Nobody`);
  assert.deepEqual(extractMentionIds(stored), [ANA, BO]);
  assert.equal(toDisplayText(stored), text);
  const back = toEditable(stored);
  assert.equal(back.text, text);
  assert.deepEqual(back.picks, [
    { id: ANA, name: "Ana Lopez" },
    { id: BO, name: "Bo" },
  ]);
});

test("toStoredText does not match a longer word", () => {
  assert.equal(toStoredText("@Bobby hi", [{ id: BO, name: "Bo" }]), "@Bobby hi");
});

test("toStoredText is idempotent on already stored text", () => {
  const once = toStoredText("hi @Bo", [{ id: BO, name: "Bo" }]);
  assert.equal(toStoredText(once, [{ id: BO, name: "Bo" }]), once);
});

test("activeMentionQuery reads the @query before the caret", () => {
  assert.deepEqual(activeMentionQuery("hello @an", 9), { query: "an", start: 6 });
  assert.equal(activeMentionQuery("email me@an", 11), null);
  assert.equal(activeMentionQuery("hello", 5), null);
});

test("extractFirstUrl", () => {
  assert.equal(extractFirstUrl("no links here"), null);
  assert.equal(extractFirstUrl("(see https://a.com/x) and http://b.com"), "https://a.com/x");
});
