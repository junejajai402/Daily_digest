/**
 * Purpose:
 * This file is our first real feed-backed adapter.
 * It fetches Bruce Schneier's Atom feed, parses it, and maps the external feed
 * structure into the shared RawSourceItem format used by the rest of the app.
 */

import type { SourceAdapter } from "./base";
import {
  fetchFeedText,
  parseFeedXml,
  pickAlternateLink,
  stripHtml,
  textValue,
} from "./feed-utils";

const SOURCE_NAME = "Schneier on Security";
const FEED_URL = "https://www.schneier.com/feed/atom/";
const MAX_ITEMS = 8;

export const schneierSecuritySource: SourceAdapter = {
  name: SOURCE_NAME,
  async fetchItems() {
    const xml = await fetchFeedText(FEED_URL);
    const parsed = parseFeedXml(xml);
    const rawEntries = parsed.feed?.entry;
    const entries = Array.isArray(rawEntries) ? rawEntries : rawEntries ? [rawEntries] : [];

    return entries.slice(0, MAX_ITEMS).map((entry: any) => {
      const title = textValue(entry.title, "Untitled");
      const summary = stripHtml(
        textValue(entry.summary, textValue(entry.content, "No summary available")),
      );
      const articleLink = pickAlternateLink(entry.link);

      return {
        title,
        url: articleLink,
        source: SOURCE_NAME,
        topic: "security" as const,
        publishedAt: entry.updated ?? entry.published ?? new Date().toISOString(),
        summary,
        tags: ["security", "feed"],
      };
    });
  },
};
