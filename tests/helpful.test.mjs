import { test } from "node:test";
import assert from "node:assert/strict";
import { compareHelpful, describeHelp, helpfulScore } from "../src/lib/helpful.ts";

const row = (name, d, h, r, avg = null) => ({
  name,
  dealsDelivered: d,
  needsHelped: h,
  reviewsReceived: r,
  avgRating: avg,
});

test("score weights deals 3, helps 2, reviews 1", () => {
  assert.equal(helpfulScore(row("a", 1, 1, 1)), 6);
  assert.equal(helpfulScore(row("a", 0, 0, 0)), 0);
  assert.equal(helpfulScore(row("a", 2, 0, 3)), 9);
});

test("ordering: score, then rating, then name", () => {
  const rows = [row("Cara", 0, 1, 0), row("Ana", 1, 0, 0, 4), row("Bo", 1, 0, 0, 5), row("Al", 0, 0, 2)];
  const names = rows.sort(compareHelpful).map((r) => r.name);
  assert.deepEqual(names, ["Bo", "Ana", "Al", "Cara"]);
});

test("describeHelp reads naturally and skips zeros", () => {
  assert.equal(describeHelp(row("a", 1, 3, 0)), "1 deal delivered, 3 needs helped");
  assert.equal(describeHelp(row("a", 0, 0, 1)), "1 review");
  assert.equal(describeHelp(row("a", 0, 0, 0)), "");
});
