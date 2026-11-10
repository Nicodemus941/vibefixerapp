import { test } from "node:test";
import assert from "node:assert/strict";
import { compareFeedRank, rankReasonFor, rankReasonLabel, rankTier } from "../src/lib/feed-rank.ts";

const NOW = new Date("2026-11-10T12:00:00Z");
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
const base = { helpSimilarity: null, fitSimilarity: null, followed: false, now: NOW };

test("a fresh need close to your offers is one you can help with", () => {
  assert.equal(rankReasonFor({ ...base, kind: "need", helpSimilarity: 0.7, createdAt: daysAgo(1) }), "can_help");
});

test("a fresh offer close to your needs fits", () => {
  assert.equal(rankReasonFor({ ...base, kind: "offer", fitSimilarity: 0.5, createdAt: daysAgo(3) }), "fits_needs");
});

test("weak or stale matches fall back to follow or nothing", () => {
  assert.equal(rankReasonFor({ ...base, kind: "need", helpSimilarity: 0.49, createdAt: daysAgo(1) }), null);
  assert.equal(rankReasonFor({ ...base, kind: "need", helpSimilarity: 0.9, createdAt: daysAgo(20) }), null);
  assert.equal(
    rankReasonFor({ ...base, kind: "need", helpSimilarity: 0.9, createdAt: daysAgo(20), followed: true }),
    "following",
  );
  // Help similarity only counts on needs, fit only on offers.
  assert.equal(rankReasonFor({ ...base, kind: "offer", helpSimilarity: 0.9, createdAt: daysAgo(1) }), null);
  assert.equal(rankReasonFor({ ...base, kind: "win", fitSimilarity: 0.9, createdAt: daysAgo(1) }), null);
});

test("tiers: help, fit, following, rest", () => {
  assert.deepEqual(
    ["can_help", "fits_needs", "following", null, "anything"].map(rankTier),
    [0, 1, 2, 3, 3],
  );
});

test("order is tier first, newest first inside a tier, reactions ignored", () => {
  const posts = [
    { id: "old-follow", rank_reason: "following", created_at: daysAgo(5), reactions: 999 },
    { id: "new-rest", rank_reason: null, created_at: daysAgo(0), reactions: 500 },
    { id: "fit", rank_reason: "fits_needs", created_at: daysAgo(2), reactions: 0 },
    { id: "help-old", rank_reason: "can_help", created_at: daysAgo(3), reactions: 0 },
    { id: "help-new", rank_reason: "can_help", created_at: daysAgo(1), reactions: 0 },
    { id: "new-follow", rank_reason: "following", created_at: daysAgo(1), reactions: 0 },
  ];
  assert.deepEqual(
    [...posts].sort(compareFeedRank).map((p) => p.id),
    ["help-new", "help-old", "fit", "new-follow", "old-follow", "new-rest"],
  );
});

test("labels only for the help reasons", () => {
  assert.equal(rankReasonLabel("can_help"), "You can help");
  assert.equal(rankReasonLabel("fits_needs"), "Fits what you need");
  assert.equal(rankReasonLabel("following"), null);
  assert.equal(rankReasonLabel(null), null);
});
