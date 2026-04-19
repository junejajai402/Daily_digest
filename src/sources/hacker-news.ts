/**
 * Purpose:
 * This file adds Hacker News as a community-signal feed.
 * It uses the built-in Hacker News RSS feed so we can surface stories that are
 * interesting to the startup and engineering community.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "Hacker News";
const FEED_URL = "https://news.ycombinator.com/rss";
const MAX_ITEMS = 10;

export const hackerNewsSource: SourceAdapter = {
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
      summary: cleanSummary(
        textValue(item.description, textValue(item.comments, "Popular Hacker News story.")),
      ),
      tags: ["tech", "community", "rss", "hacker-news"],
    }));
  },
};
