/**
 * Purpose:
 * This file holds small reusable helpers for RSS and Atom style feeds.
 * The goal is to keep feed-specific parsing details out of each adapter so new
 * source files stay focused on mapping feed data into our app's shared shape.
 *
 * Good next TODOs for you:
 * - add stronger runtime validation for parsed feed shapes
 * - support RSS item/channel structures alongside Atom feed/entry structures
 * - move common "fetch then parse" logic into a higher-level helper
 */

import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  processEntities: false,
});
const DEFAULT_FEED_TIMEOUT_MS = 8000;

export function parseFeedXml(xml: string): any {
  return parser.parse(xml);
}

export async function fetchFeedText(
  feedUrl: string,
  timeoutMs = DEFAULT_FEED_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "user-agent": "daily-digest-framework/0.1",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed ${feedUrl}: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Feed request timed out for ${feedUrl} after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function textValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "#text" in value) {
    const text = (value as Record<string, unknown>)["#text"];
    return typeof text === "string" ? text : fallback;
  }

  return fallback;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, value) => String.fromCharCode(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCharCode(parseInt(value, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function cleanText(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/\u00ad/g, "")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

export function pickAlternateLink(linkValue: unknown): string {
  const links = Array.isArray(linkValue) ? linkValue : linkValue ? [linkValue] : [];

  const alternateLink = links.find((link) => {
    if (!link || typeof link !== "object") {
      return false;
    }

    return (link as Record<string, unknown>)["@_rel"] === "alternate";
  });

  if (alternateLink && typeof alternateLink === "object") {
    const href = (alternateLink as Record<string, unknown>)["@_href"];
    if (typeof href === "string") {
      return href;
    }
  }

  const firstLink = links[0];
  if (firstLink && typeof firstLink === "object") {
    const href = (firstLink as Record<string, unknown>)["@_href"];
    if (typeof href === "string") {
      return href;
    }
  }

  return "";
}

export function stripHtml(input: string): string {
  return cleanText(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/&#xd;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanSummary(input: string): string {
  return stripHtml(stripHtml(decodeHtmlEntities(input)))
    .replace(/\bcontinue reading\b\.?/gi, " ")
    .replace(/\bcomments\b$/i, " ")
    .replace(/\(\s*[A-Z][a-z]{2},\s+[A-Z][a-z]{2}\s+\d{1,2}(?:th|st|nd|rd)?\s*\)/g, " ")
    .replace(/\bintroduction\b\s*$/i, " ")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s*\.\.\s*$/g, "")
    .replace(/\s*\.\.\.$/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}
