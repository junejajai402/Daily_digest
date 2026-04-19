/**
 * Purpose:
 * This file converts source-specific raw items into the common digest shape.
 * Normalization is where we make the rest of the app independent from where the
 * content came from.
 */

import type { DigestItem, RawSourceItem } from "../types";
import { cleanSummary, cleanText } from "../sources/feed-utils";

const MAX_SUMMARY_LENGTH = 360;
const MIN_SUMMARY_LENGTH = 24;

function createStableId(item: RawSourceItem): string {
  return `${item.source}:${item.url}`.toLowerCase();
}

function truncateSummary(summary: string): string {
  if (summary.length <= MAX_SUMMARY_LENGTH) {
    return summary;
  }

  const truncated = summary.slice(0, MAX_SUMMARY_LENGTH).trim();
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return `${truncated.slice(0, lastSpace).trim()}...`;
  }

  return `${truncated}...`;
}

function fallbackSummary(item: RawSourceItem): string {
  switch (item.topic) {
    case "security":
      return "Security write-up worth reviewing in the full digest.";
    case "tech":
      return "Tech story worth opening for more context.";
    case "world":
      return "World news item worth opening for the full details.";
    case "albums":
      return "Music item worth opening for the full review or release details.";
    case "personal":
      return "Picked for your interests - open for more context.";
  }
}

function createSummary(item: RawSourceItem): string {
  const cleanedSummary = cleanSummary(item.summary ?? "");

  if (cleanedSummary.length < MIN_SUMMARY_LENGTH) {
    return fallbackSummary(item);
  }

  return truncateSummary(cleanedSummary);
}

export function normalizeItems(items: RawSourceItem[]): DigestItem[] {
  return items.map((item) => ({
    id: createStableId(item),
    title: cleanText(item.title),
    url: cleanText(item.url),
    source: cleanText(item.source),
    topic: item.topic,
    publishedAt: item.publishedAt,
    summary: createSummary(item),
    score: 0,
    tags: item.tags ?? [],
  }));
}
