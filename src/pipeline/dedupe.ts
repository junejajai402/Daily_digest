/**
 * Purpose:
 * This file is the first deduping layer for the digest pipeline.
 * It sits after normalization and before ranking so duplicate stories do not
 * crowd the final digest.
 *
 * Learning TODOs for you:
 * - strengthen URL normalization by removing tracking params
 * - decide how aggressive title normalization should be
 * - add debugging counters so you can see how many items were dropped
 * - later, add fuzzy title matching for near-duplicates across sources
 */

import type { DigestItem } from "../types";

function normalizeUrl(url: string): string {
  const trimmedUrl = url.trim();
  if (trimmedUrl.length === 0) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

    const paramsToRemove = [...parsedUrl.searchParams.keys()].filter(
      (key) =>
        key.startsWith("utm_") ||
        key.startsWith("at_") ||
        key === "fbclid" ||
        key === "gclid" ||
        key === "ref",
    );

    for (const key of paramsToRemove) {
      parsedUrl.searchParams.delete(key);
    }

    if (parsedUrl.pathname !== "/" && parsedUrl.pathname.endsWith("/")) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }

    return parsedUrl.toString();
  } catch {
    return trimmedUrl;
  }
}

function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeItems(items: DigestItem[]): DigestItem[] {
  const dedupedItems: DigestItem[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  let duplicateUrlCount = 0;
  let duplicateTitleCount = 0;

  for (const item of items) {
    const normalizedUrl = normalizeUrl(item.url);
    const normalizedTitle = normalizeTitle(item.title);

    const hasSeenUrl = normalizedUrl.length > 0 && seenUrls.has(normalizedUrl);
    const hasSeenTitle = normalizedTitle.length > 0 && seenTitles.has(normalizedTitle);

    if (hasSeenUrl) {
      duplicateUrlCount += 1;
    }

    if (hasSeenTitle) {
      duplicateTitleCount += 1;
    }

    if (hasSeenUrl || hasSeenTitle) {
      continue;
    }

    dedupedItems.push(item);

    if (normalizedUrl.length > 0) {
      seenUrls.add(normalizedUrl);
    }

    if (normalizedTitle.length > 0) {
      seenTitles.add(normalizedTitle);
    }
  }

  console.log(
    `Dedupe kept ${dedupedItems.length}/${items.length} items ` +
      `(skipped ${duplicateUrlCount} URL duplicates and ${duplicateTitleCount} title duplicates).`,
  );

  return dedupedItems;
}
