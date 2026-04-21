/**
 * Purpose:
 * This file adds OpenAI's official newsroom feed as a dedicated AI source.
 * It gives the digest a high-signal stream for model launches, safety updates,
 * product releases, and engineering posts.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "OpenAI News";
const FEED_URL = "https://openai.com/news/rss.xml";
const MAX_ITEMS = 8;

export const openAiNewsSource: SourceAdapter = {
  name: SOURCE_NAME,
  async fetchItems() {
    const xml = await fetchFeedText(FEED_URL);
    const parsed = parseFeedXml(xml);
    const rawItems = parsed.rss?.channel?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return items.slice(0, MAX_ITEMS).map((item: any) => ({
      title: textValue(item.title, "Untitled"),
      url: textValue(item.link, ""),
      source: SOURCE_NAME,
      topic: "ai" as const,
      publishedAt: textValue(item.pubDate, new Date().toISOString()),
      summary: cleanSummary(textValue(item.description, "No summary available")),
      tags: ["ai", "official", "openai", "rss"],
    }));
  },
};
