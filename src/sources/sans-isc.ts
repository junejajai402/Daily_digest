/**
 * Purpose:
 * This file adds the SANS Internet Storm Center full-text RSS feed.
 * It gives the digest another strong security-focused source with practical
 * threat analysis and diary entries from SANS handlers.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "SANS ISC";
const FEED_URL = "https://isc.sans.edu/rssfeed_full.xml";
const MAX_ITEMS = 8;

export const sansIscSource: SourceAdapter = {
  name: SOURCE_NAME,
  async fetchItems() {
    const xml = await fetchFeedText(FEED_URL);
    const parsed = parseFeedXml(xml);
    const rawItems = parsed.rss?.channel?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return items
      .filter((item: any) => {
        const title = textValue(item.title, "").toLowerCase();
        return !title.includes("stormcast") && !title.includes("podcast");
      })
      .slice(0, MAX_ITEMS)
      .map((item: any) => ({
        title: textValue(item.title, "Untitled"),
        url: textValue(item.link, ""),
        source: SOURCE_NAME,
        topic: "security" as const,
        publishedAt: textValue(item.pubDate, new Date().toISOString()),
        summary: cleanSummary(textValue(item.description, "No summary available")),
        tags: ["security", "rss", "sans"],
      }));
  },
};
