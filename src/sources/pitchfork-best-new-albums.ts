/**
 * Purpose:
 * This file adds Pitchfork's Best New Albums feed.
 * It gives the digest a cleaner music-discovery source than a generic community
 * feed and helps the music section feel more intentional.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "Pitchfork Best New Albums";
const FEED_URL = "https://pitchfork.com/feed/reviews/best/albums/rss";
const MAX_ITEMS = 8;

export const pitchforkBestNewAlbumsSource: SourceAdapter = {
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
      topic: "albums" as const,
      publishedAt: textValue(item.pubDate, new Date().toISOString()),
      summary: cleanSummary(textValue(item.description, "No summary available")),
      tags: ["albums", "music", "rss", "pitchfork"],
    }));
  },
};
