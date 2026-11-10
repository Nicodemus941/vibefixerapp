import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeReplyStats,
  describeReplyTime,
  formatReplyRate,
  median,
} from "../src/lib/reply-rate.ts";

const NOW = new Date("2026-11-10T12:00:00Z");
const H = 3600 * 1000;
const D = 24 * H;
const ago = (ms) => new Date(NOW.getTime() - ms);
const conv = (firstAgo, replyAfter) => ({
  firstAt: ago(firstAgo),
  replyAt: replyAfter === null ? null : new Date(NOW.getTime() - firstAgo + replyAfter),
});

test("median of odd and even lists", () => {
  assert.equal(median([]), null);
  assert.equal(median([5]), 5);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

test("fewer than 5 counted conversations gives no rate", () => {
  const s = computeReplyStats([conv(10 * D, H), conv(10 * D, H), conv(10 * D, null), conv(10 * D, H)], NOW);
  assert.equal(s.eligible, 4);
  assert.equal(s.rate, null);
  assert.equal(formatReplyRate(s), null);
});

test("rate and median over answered conversations", () => {
  const s = computeReplyStats(
    [conv(10 * D, 2 * H), conv(20 * D, 4 * H), conv(30 * D, 30 * H), conv(40 * D, null), conv(50 * D, 1 * H)],
    NOW,
  );
  assert.equal(s.eligible, 5);
  assert.equal(s.replied, 4);
  assert.equal(s.rate, 0.8);
  assert.equal(s.medianSeconds, 3 * 3600);
  assert.equal(formatReplyRate(s), "Replies to 80% of messages, usually within a few hours");
});

test("a reply after 7 days counts as not replied", () => {
  const s = computeReplyStats(
    [conv(30 * D, 8 * D), conv(30 * D, H), conv(30 * D, H), conv(30 * D, H), conv(30 * D, H)],
    NOW,
  );
  assert.equal(s.eligible, 5);
  assert.equal(s.replied, 4);
});

test("conversations older than 90 days are ignored", () => {
  const s = computeReplyStats([conv(91 * D, H), conv(10 * D, H)], NOW);
  assert.equal(s.eligible, 1);
});

test("unanswered messages still inside the 7 day window are left out", () => {
  const items = [conv(2 * D, null), conv(10 * D, H), conv(10 * D, H), conv(10 * D, H), conv(10 * D, H), conv(10 * D, H)];
  const s = computeReplyStats(items, NOW);
  assert.equal(s.eligible, 5);
  assert.equal(s.rate, 1);
  // ...but an early answer inside the window does count.
  const s2 = computeReplyStats([...items, conv(1 * D, H)], NOW);
  assert.equal(s2.eligible, 6);
});

test("wording for reply times", () => {
  assert.equal(describeReplyTime(30 * 60), "within an hour");
  assert.equal(describeReplyTime(5 * 3600), "within a few hours");
  assert.equal(describeReplyTime(20 * 3600), "within a day");
  assert.equal(describeReplyTime(50 * 3600), "within a few days");
  assert.equal(describeReplyTime(6 * 24 * 3600), "within a week");
});

test("formatReplyRate matches the example and handles zero", () => {
  assert.equal(
    formatReplyRate({ eligible: 25, rate: 0.92, medianSeconds: 20 * 3600 }),
    "Replies to 92% of messages, usually within a day",
  );
  assert.equal(formatReplyRate({ eligible: 6, rate: 0, medianSeconds: null }), "Replies to 0% of messages");
  assert.equal(formatReplyRate(null), null);
  assert.ok(!/[–—-]/.test(formatReplyRate({ eligible: 9, rate: 0.5, medianSeconds: 100 })));
});
