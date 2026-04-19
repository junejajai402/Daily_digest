/**
 * Purpose:
 * This file adds The Guardian's technology RSS feed as a real tech source.
 * It replaces the old hard-coded tech example with a feed that is easy to
 * parse and broad enough to complement BBC Technology and Hacker News.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "The Guardian Tech";
const FEED_URL = "https://www.theguardian.com/technology/rss";
const MAX_ITEMS = 8;

export const guardianTechSource: SourceAdapter = {
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
      topic: "tech" as const,
      publishedAt: textValue(item.pubDate, new Date().toISOString()),
      summary: cleanSummary(textValue(item.description, "No summary available")),
      tags: ["tech", "rss", "guardian"],
    }));
  },
};
