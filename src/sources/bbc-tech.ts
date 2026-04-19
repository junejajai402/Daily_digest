/**
 * Purpose:
 * This file is a real RSS-backed adapter for BBC Technology.
 * It fetches the BBC Technology RSS feed, parses it, and maps the external feed
 * structure into the shared RawSourceItem format used by the rest of the app.
 */

import type { SourceAdapter } from "./base";
import { fetchFeedText, parseFeedXml, stripHtml, textValue } from "./feed-utils";

const SOURCE_NAME = "BBC Technology";
const FEED_URL = "https://feeds.bbci.co.uk/news/technology/rss.xml";
const MAX_ITEMS = 8;

export const bbcTechSource: SourceAdapter = {
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
      summary: stripHtml(textValue(item.description, "No summary available")),
      tags: ["tech", "rss"],
    }));
  },
};
