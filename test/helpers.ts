import type { DigestItem, DigestTopic, RawSourceItem, UserPreferences } from "../src/types";

export function createDigestItem(overrides: Partial<DigestItem> = {}): DigestItem {
  return {
    id: "source:https://example.com/item-1",
    title: "Example title",
    url: "https://example.com/item-1",
    source: "Example Source",
    topic: "tech",
    publishedAt: new Date().toISOString(),
    summary: "Example summary with enough text to pass validation.",
    score: 0,
    tags: ["example"],
    ...overrides,
  };
}

export function createRawSourceItem(
  topic: DigestTopic,
  overrides: Partial<RawSourceItem> = {},
): RawSourceItem {
  return {
    title: "Example raw title",
    url: "https://example.com/raw-item",
    source: "Example Source",
    topic,
    publishedAt: new Date().toISOString(),
    summary: "Example raw summary with enough text to pass validation.",
    tags: ["example"],
    ...overrides,
  };
}

export function createPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    timezone: "America/New_York",
    deliveryHourLocal: 7,
    maxItemsPerDigest: 15,
    topicItemLimits: {
      security: 5,
      tech: 5,
      ai: 2,
      albums: 3,
    },
    topicWeights: {
      security: 1,
      tech: 0.9,
      ai: 0.95,
      world: 0.6,
      albums: 0.7,
      personal: 0.8,
    },
    sourceWeights: {
      "Example Source": 0.6,
    },
    preferredSources: [],
    boostedKeywords: [],
    mutedKeywords: [],
    ...overrides,
  };
}
