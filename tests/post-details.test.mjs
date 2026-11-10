import { test } from "node:test";
import assert from "node:assert/strict";
import { detailWells, sanitizeDetails } from "../src/lib/post-details.ts";

test("keeps only the keys for the kind", () => {
  assert.deepEqual(sanitizeDetails("need", { budget: " $4k ", price: "$9", timeline: "" }), { budget: "$4k" });
  assert.deepEqual(sanitizeDetails("offer", { price: "From $8k", model: "Fixed scope", budget: "x" }), {
    price: "From $8k",
    model: "Fixed scope",
  });
});

test("other kinds and empty input give null", () => {
  assert.equal(sanitizeDetails("win", { budget: "$4k" }), null);
  assert.equal(sanitizeDetails("need", null), null);
  assert.equal(sanitizeDetails("need", { budget: "   " }), null);
});

test("too long or wrong types are invalid", () => {
  assert.equal(sanitizeDetails("need", { budget: "x".repeat(41) }), "invalid");
  assert.equal(sanitizeDetails("need", { budget: 5 }), "invalid");
  assert.equal(sanitizeDetails("need", ["$4k"]), "invalid");
});

test("wells come out labelled and in order", () => {
  assert.deepEqual(detailWells("need", { category: "Finance", budget: "$4k" }), [
    { label: "Budget", value: "$4k" },
    { label: "Category", value: "Finance" },
  ]);
  assert.deepEqual(detailWells("need", { budget: "x".repeat(99) }), []);
});
