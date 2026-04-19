/**
 * Purpose:
 * This file adds NME's music news feed.
 * It broadens the music section with a more news-oriented source alongside
 * Pitchfork and NPR.
 */

import type { SourceAdapter } from "./base";
import { cleanSummary, fetchFeedText, parseFeedXml, textValue } from "./feed-utils";

const SOURCE_NAME = "NME Music News";
const FEED_URL = "https://www.nme.com/news/music/feed";
const MAX_ITEMS = 8;

export const nmeMusicNewsSource: SourceAdapter = {
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
      tags: ["albums", "music", "rss", "nme"],
    }));
  },
};
