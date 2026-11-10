import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyReactionCounts, isReactionKind, topReactions } from "../src/lib/reactions.ts";

test("isReactionKind accepts the six kinds and rejects legacy ones", () => {
  for (const k of ["like", "celebrate", "support", "insightful", "love", "funny"]) assert.equal(isReactionKind(k), true);
  for (const k of ["fire", "handshake", "in", "", null, 3]) assert.equal(isReactionKind(k), false);
});

test("topReactions orders by count, ties by display order", () => {
  const c = emptyReactionCounts();
  c.love = 3;
  c.like = 3;
  c.funny = 1;
  c.support = 2;
  assert.deepEqual(topReactions(c), ["like", "love", "support"]);
  assert.deepEqual(topReactions(emptyReactionCounts()), []);
});
