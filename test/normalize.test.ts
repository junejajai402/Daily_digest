import test from "node:test";
import assert from "node:assert/strict";

import { normalizeItems } from "../src/pipeline/normalize";
import { createRawSourceItem } from "./helpers";

test("normalizeItems uses a topic-aware fallback summary when content is too short", () => {
  const [normalizedItem] = normalizeItems([
    createRawSourceItem("ai", {
      summary: "tiny",
    }),
  ]);

  assert.equal(
    normalizedItem?.summary,
    "AI update worth opening for the full launch details or analysis.",
  );
});

test("normalizeItems cleans text and truncates long summaries at a word boundary", () => {
  const longSummary = `${"Signal ".repeat(80)}&amp; more`;

  const [normalizedItem] = normalizeItems([
    createRawSourceItem("tech", {
      title: "Smart &amp; Useful",
      summary: longSummary,
    }),
  ]);

  assert.equal(normalizedItem?.title, 'Smart & Useful');
  assert.ok(normalizedItem?.summary.endsWith("..."));
  assert.ok(normalizedItem?.summary.length <= 363);
});
