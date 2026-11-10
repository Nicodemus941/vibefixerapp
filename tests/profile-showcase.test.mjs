import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bioTokens,
  cleanText,
  isFeaturedKind,
  isIsoDate,
  moveById,
  nextPosition,
  normalizeHttpUrl,
  optionalUrl,
  positionUpdates,
  sortByPosition,
} from "../src/lib/profile-showcase.ts";

test("normalizeHttpUrl accepts http and https", () => {
  assert.equal(normalizeHttpUrl("https://example.com/a?b=1"), "https://example.com/a?b=1");
  assert.equal(normalizeHttpUrl("  http://news.example.org/story  "), "http://news.example.org/story");
  assert.equal(normalizeHttpUrl("HTTPS://Example.com"), "https://example.com/");
});

test("normalizeHttpUrl adds https to bare domains", () => {
  assert.equal(normalizeHttpUrl("example.com/post"), "https://example.com/post");
  assert.equal(normalizeHttpUrl("www.example.com"), "https://www.example.com/");
  assert.equal(normalizeHttpUrl("//cdn.example.com/x"), "https://cdn.example.com/x");
});

test("normalizeHttpUrl rejects other schemes and junk", () => {
  for (const bad of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<b>x</b>",
    "vbscript:msgbox",
    "ftp://example.com",
    "mailto:a@example.com",
    "file:///etc/passwd",
    "https:example.com",
    "https://user:pw@example.com",
    "http://localhost:3000",
    "intranet",
    "https://exa mple.com",
    "",
    "   ",
    null,
    undefined,
    `https://example.com/${"a".repeat(2100)}`,
  ]) {
    assert.equal(normalizeHttpUrl(bad), null, String(bad));
  }
});

test("optionalUrl separates empty from invalid", () => {
  assert.deepEqual(optionalUrl(""), { ok: true, value: null });
  assert.deepEqual(optionalUrl(null), { ok: true, value: null });
  assert.deepEqual(optionalUrl("example.com"), { ok: true, value: "https://example.com/" });
  assert.deepEqual(optionalUrl("javascript:void(0)"), { ok: false });
});

test("isIsoDate and isFeaturedKind", () => {
  assert.equal(isIsoDate("2026-11-10"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("11/10/2026"), false);
  assert.equal(isIsoDate(null), false);
  assert.equal(isFeaturedKind("press"), true);
  assert.equal(isFeaturedKind("vanity"), false);
});

test("cleanText trims, caps and nulls empties", () => {
  assert.equal(cleanText("  hi  ", 10), "hi");
  assert.equal(cleanText("   ", 10), null);
  assert.equal(cleanText("abcdefghij", 4), "abcd");
  assert.equal(cleanText("a\n\n\n\nb", 10), "a\n\nb");
});

test("moveById moves one step and respects edges", () => {
  const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
  assert.deepEqual(moveById(list, "b", -1).map((x) => x.id), ["b", "a", "c"]);
  assert.deepEqual(moveById(list, "b", 1).map((x) => x.id), ["a", "c", "b"]);
  assert.deepEqual(moveById(list, "a", -1).map((x) => x.id), ["a", "b", "c"]);
  assert.deepEqual(moveById(list, "c", 1).map((x) => x.id), ["a", "b", "c"]);
  assert.deepEqual(moveById(list, "zz", 1).map((x) => x.id), ["a", "b", "c"]);
  // Input is not mutated.
  assert.deepEqual(list.map((x) => x.id), ["a", "b", "c"]);
});

test("positionUpdates only writes changed rows", () => {
  const rows = [
    { id: "b", position: 1 },
    { id: "a", position: 0 },
    { id: "c", position: 2 },
  ];
  assert.deepEqual(positionUpdates(rows), [
    { id: "b", position: 0 },
    { id: "a", position: 1 },
  ]);
  assert.deepEqual(positionUpdates([{ id: "x", position: 0 }]), []);
});

test("nextPosition and sortByPosition", () => {
  assert.equal(nextPosition([]), 0);
  assert.equal(nextPosition([0, 4, 2]), 5);
  const sorted = sortByPosition([
    { id: "b", position: 1, created_at: "2026-01-01" },
    { id: "a", position: 0, created_at: "2026-01-02" },
    { id: "c", position: 1, created_at: "2025-12-31" },
  ]);
  assert.deepEqual(sorted.map((x) => x.id), ["a", "c", "b"]);
});

test("bioTokens links http, https and www only", () => {
  const t = bioTokens("Wrote https://example.com/essay. Also www.acme.io, and javascript:alert(1)");
  assert.deepEqual(t, [
    { type: "text", value: "Wrote " },
    { type: "link", href: "https://example.com/essay", label: "example.com/essay" },
    { type: "text", value: ". Also " },
    { type: "link", href: "https://www.acme.io/", label: "www.acme.io" },
    { type: "text", value: ", and javascript:alert(1)" },
  ]);
});

test("bioTokens keeps markup as text", () => {
  const t = bioTokens('<a href="javascript:x">hi</a>');
  assert.equal(t.length, 1);
  assert.equal(t[0].type, "text");
});

test("bioTokens keeps balanced parentheses", () => {
  const t = bioTokens("(see https://en.wikipedia.org/wiki/Loop_(music))");
  const link = t.find((x) => x.type === "link");
  assert.equal(link.href, "https://en.wikipedia.org/wiki/Loop_(music)");
});
