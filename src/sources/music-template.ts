/**
 * Purpose:
 * This is a fill-in template for your next real music or albums source adapter.
 * Use it to replace the remaining hard-coded album example with a proper feed.
 *
 * Good learning steps:
 * - decide whether you want album reviews, best new albums, or release news
 * - confirm the feed shape before mapping
 * - tune the tags so music items rank the way you want
 */

import type { SourceAdapter } from "./base";
import {
  fetchFeedText,
  parseFeedXml,
  pickAlternateLink,
  stripHtml,
  textValue,
} from "./feed-utils";

const SOURCE_NAME = "Replace With Real Music Source";
const FEED_URL = "https://replace-with-real-music-feed";
const MAX_ITEMS = 8;

export const musicTemplateSource: SourceAdapter = {
  name: SOURCE_NAME,
  async fetchItems() {
    const xml = await fetchFeedText(FEED_URL);
    const parsed = parseFeedXml(xml);

    // TODO:
    // Replace this with the correct path for your source.
    const rawEntries = parsed.rss?.channel?.item;
    const entries = Array.isArray(rawEntries) ? rawEntries : rawEntries ? [rawEntries] : [];

    return entries.slice(0, MAX_ITEMS).map((entry: any) => ({
      // TODO: Adjust these field lookups for the real feed.
      title: textValue(entry.title, "Untitled"),
      url: textValue(entry.link, pickAlternateLink(entry.link)),
      source: SOURCE_NAME,
      topic: "albums" as const,
      publishedAt: textValue(entry.pubDate, textValue(entry.updated, new Date().toISOString())),
      summary: stripHtml(
        textValue(entry.description, textValue(entry.summary, "No summary available")),
      ),
      tags: ["albums", "music", "rss"],
    }));
  },
};
