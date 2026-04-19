/**
 * Purpose:
 * This is a fill-in template for your next real tech source adapter.
 * Copy this file, rename it to match the source, and replace the placeholder
 * values below with a real feed and real mapping logic.
 *
 * Good learning steps:
 * - choose a real tech feed URL
 * - decide whether it is RSS or Atom
 * - map the correct title/link/date/summary fields
 * - add source-specific tags that help ranking later
 */

import type { SourceAdapter } from "./base";
import {
  fetchFeedText,
  parseFeedXml,
  pickAlternateLink,
  stripHtml,
  textValue,
} from "./feed-utils";

const SOURCE_NAME = "Replace With Real Tech Source";
const FEED_URL = "https://replace-with-real-tech-feed";
const MAX_ITEMS = 8;

export const techTemplateSource: SourceAdapter = {
  name: SOURCE_NAME,
  async fetchItems() {
    const xml = await fetchFeedText(FEED_URL);
    const parsed = parseFeedXml(xml);

    // TODO:
    // Replace this with the correct path for your source.
    // RSS example: parsed.rss?.channel?.item
    // Atom example: parsed.feed?.entry
    const rawEntries = parsed.rss?.channel?.item;
    const entries = Array.isArray(rawEntries) ? rawEntries : rawEntries ? [rawEntries] : [];

    return entries.slice(0, MAX_ITEMS).map((entry: any) => ({
      // TODO: Adjust these field lookups for your real source.
      title: textValue(entry.title, "Untitled"),
      url: textValue(entry.link, pickAlternateLink(entry.link)),
      source: SOURCE_NAME,
      topic: "tech" as const,
      publishedAt: textValue(entry.pubDate, textValue(entry.updated, new Date().toISOString())),
      summary: stripHtml(
        textValue(entry.description, textValue(entry.summary, "No summary available")),
      ),
      tags: ["tech", "rss"],
    }));
  },
};
