/**
 * Purpose:
 * This file contains the first useful ranking model for the digest.
 * The scoring is still intentionally transparent so you can tune it by hand and
 * understand why one item outranks another.
 */

import type { DigestItem, UserPreferences } from "../types";

function countKeywordMatches(text: string, keywords: string[]): number {
  const lowerText = text.toLowerCase();
  return keywords.filter((keyword) => lowerText.includes(keyword.toLowerCase())).length;
}

function getFreshnessBonus(publishedAt: string): number {
  const publishedTime = Date.parse(publishedAt);
  if (Number.isNaN(publishedTime)) {
    return 0;
  }

  const ageInHours = (Date.now() - publishedTime) / (1000 * 60 * 60);

  if (ageInHours <= 12) {
    return 0.35;
  }

  if (ageInHours <= 24) {
    return 0.25;
  }

  if (ageInHours <= 72) {
    return 0.1;
  }

  return 0;
}

export function rankItems(items: DigestItem[], preferences: UserPreferences): DigestItem[] {
  return items
    .map((item) => {
      const combinedText = `${item.title} ${item.summary} ${item.tags.join(" ")}`;
      const topicWeight = preferences.topicWeights[item.topic] ?? 0.5;
      const sourceWeight = preferences.sourceWeights[item.source] ?? 0.6;
      const preferredSourceBoost = preferences.preferredSources.includes(item.source) ? 0.15 : 0;
      const boostedKeywordHits = countKeywordMatches(combinedText, preferences.boostedKeywords);
      const mutedKeywordHits = countKeywordMatches(combinedText, preferences.mutedKeywords);
      const freshnessBonus = getFreshnessBonus(item.publishedAt);
      const keywordScore = boostedKeywordHits * 0.2 - mutedKeywordHits * 0.3;
      const score =
        topicWeight + sourceWeight + preferredSourceBoost + freshnessBonus + keywordScore;

      return {
        ...item,
        score,
        whyItMatched:
          boostedKeywordHits > 0 || preferredSourceBoost > 0 || freshnessBonus > 0
            ? "Matched your preferred topics, keywords, sources, or recency."
            : undefined,
      };
    })
    .sort((left, right) => right.score - left.score);
}


export function selectDiverseItems(items: DigestItem[], maxItems: number): DigestItem[] {
  // TODO(balance): this only spreads items across sources.
  // Add stronger topic-aware selection if you want hard guarantees for 5/5/3 section splits.
  const selectedItems: DigestItem[] = [];
  const remainingItems = [...items];
  const sourceCounts: Record<string, number> = {};
  const SOURCE_REPEAT_PENALTY = 0.25;

  while (selectedItems.length < maxItems && remainingItems.length > 0) {
    let bestIndex = 0;
    let bestAdjustedScore = -Infinity;

    for (let index = 0; index < remainingItems.length; index += 1) {
      const item = remainingItems[index];
      const repeatedSourceCount = sourceCounts[item.source] ?? 0;
      const adjustedScore = item.score - repeatedSourceCount * SOURCE_REPEAT_PENALTY;

      if (adjustedScore > bestAdjustedScore) {
        bestAdjustedScore = adjustedScore;
        bestIndex = index;
      }
    }

    const [selectedItem] = remainingItems.splice(bestIndex, 1);
    selectedItems.push(selectedItem);
    sourceCounts[selectedItem.source] = (sourceCounts[selectedItem.source] ?? 0) + 1;
  }

  return selectedItems;
}

export function selectItemsByTopicLimits(
  items: DigestItem[],
  topicItemLimits: Partial<Record<DigestItem["topic"], number>>,
): DigestItem[] {
  const selectedItems: DigestItem[] = [];
  const selectedIds = new Set<string>();
  const topicEntries = Object.entries(topicItemLimits) as Array<[DigestItem["topic"], number]>;

  for (const [topic, limit] of topicEntries) {
    const topicItems = items.filter((item) => item.topic === topic).slice(0, limit);

    for (const item of topicItems) {
      selectedItems.push(item);
      selectedIds.add(item.id);
    }
  }

  for (const item of items) {
    if (selectedIds.has(item.id)) {
      continue;
    }

    selectedItems.push(item);
  }

  return selectedItems;
}
