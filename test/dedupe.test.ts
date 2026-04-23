import test from "node:test";
import assert from "node:assert/strict";

import { dedupeItems } from "../src/pipeline/dedupe";
import { createDigestItem } from "./helpers";

test("dedupeItems removes duplicates when URLs differ only by tracking params", () => {
  const items = [
    createDigestItem({
      id: "1",
      title: "Story One",
      url: "https://example.com/story?utm_source=rss&at_campaign=digest",
    }),
    createDigestItem({
      id: "2",
      title: "Story One follow-up",
      url: "https://example.com/story",
    }),
  ];

  const dedupedItems = dedupeItems(items);

  assert.equal(dedupedItems.length, 1);
  assert.equal(dedupedItems[0]?.id, "1");
});

test("dedupeItems removes duplicates when titles normalize to the same value", () => {
  const items = [
    createDigestItem({
      id: "1",
      title: "Claude launches new model!",
      url: "https://example.com/claude-launch",
    }),
    createDigestItem({
      id: "2",
      title: "Claude launches new model",
      url: "https://another.example.com/claude-launch",
    }),
  ];

  const dedupedItems = dedupeItems(items);

  assert.equal(dedupedItems.length, 1);
  assert.equal(dedupedItems[0]?.id, "1");
});
