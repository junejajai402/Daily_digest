import test from "node:test";
import assert from "node:assert/strict";

import { rankItems, selectDiverseItems, selectItemsByTopicLimits } from "../src/pipeline/rank";
import { createDigestItem, createPreferences } from "./helpers";

test("rankItems boosts fresher preferred-source items with matching keywords", () => {
  const freshItem = createDigestItem({
    id: "fresh",
    source: "Preferred Source",
    title: "New AI model launch",
    summary: "A fresh launch update with useful details.",
    publishedAt: new Date().toISOString(),
    tags: ["ai"],
  });

  const staleItem = createDigestItem({
    id: "stale",
    source: "Other Source",
    title: "Old market roundup",
    summary: "Older article with less signal.",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["market"],
  });

  const rankedItems = rankItems(
    [staleItem, freshItem],
    createPreferences({
      sourceWeights: {
        "Preferred Source": 0.7,
        "Other Source": 0.7,
      },
      preferredSources: ["Preferred Source"],
      boostedKeywords: ["launch", "ai"],
    }),
  );

  assert.equal(rankedItems[0]?.id, "fresh");
  assert.ok((rankedItems[0]?.score ?? 0) > (rankedItems[1]?.score ?? 0));
  assert.equal(
    rankedItems[0]?.whyItMatched,
    "Matched your preferred topics, keywords, sources, or recency.",
  );
});

test("selectDiverseItems spreads close-scoring items across sources", () => {
  const items = [
    createDigestItem({ id: "a1", source: "Source A", score: 2.0 }),
    createDigestItem({ id: "a2", source: "Source A", score: 1.95 }),
    createDigestItem({ id: "b1", source: "Source B", score: 1.9 }),
  ];

  const selectedItems = selectDiverseItems(items, 2);

  assert.deepEqual(
    selectedItems.map((item) => item.id),
    ["a1", "b1"],
  );
});

test("selectItemsByTopicLimits keeps top items for each configured topic before backfilling", () => {
  const items = [
    createDigestItem({ id: "sec-1", topic: "security", score: 3 }),
    createDigestItem({ id: "sec-2", topic: "security", score: 2.8 }),
    createDigestItem({ id: "tech-1", topic: "tech", score: 2.7 }),
    createDigestItem({ id: "ai-1", topic: "ai", score: 2.6 }),
    createDigestItem({ id: "music-1", topic: "albums", score: 2.5 }),
    createDigestItem({ id: "world-1", topic: "world", score: 2.4 }),
  ];

  const selectedItems = selectItemsByTopicLimits(items, {
    security: 1,
    tech: 1,
    ai: 1,
  });

  assert.deepEqual(
    selectedItems.map((item) => item.id),
    ["sec-1", "tech-1", "ai-1", "sec-2", "music-1", "world-1"],
  );
});
