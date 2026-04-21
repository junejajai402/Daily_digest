/**
 * Purpose:
 * This file adds Google's official AI news feed as a dedicated AI source.
 * It helps the digest track Gemini, research, and developer AI updates from
 * Google's main AI news channel.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "Google AI";
// This feed URL follows the official Google Blog AI feed path exposed from the AI page.
const FEED_URL = "https://blog.google/technology/ai/rss/";
const MAX_ITEMS = 8;
const AI_SIGNAL_KEYWORDS = [
  "ai",
  "gemini",
  "model",
  "models",
  "agent",
  "agents",
  "research",
  "developer",
  "developers",
  "notebooklm",
  "studio",
];

function looksLikeAiStory(item: any): boolean {
  const combinedText = `${textValue(item.title, "")} ${textValue(item.description, "")}`.toLowerCase();
  return AI_SIGNAL_KEYWORDS.some((keyword) => combinedText.includes(keyword));
}

export const googleAiSource: SourceAdapter = {
  name: SOURCE_NAME,
  async fetchItems() {
    const xml = await fetchFeedText(FEED_URL);
    const parsed = parseFeedXml(xml);
    const rawItems = parsed.rss?.channel?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return items
      .filter(looksLikeAiStory)
      .slice(0, MAX_ITEMS)
      .map((item: any) => ({
        title: textValue(item.title, "Untitled"),
        url: textValue(item.link, ""),
        source: SOURCE_NAME,
        topic: "ai" as const,
        publishedAt: textValue(item.pubDate, new Date().toISOString()),
        summary: cleanSummary(textValue(item.description, "No summary available")),
        tags: ["ai", "official", "google", "rss"],
      }));
  },
};
