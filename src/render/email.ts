/**
 * Purpose:
 * This file turns ranked digest items into a more readable email-friendly
 * format. It groups items into sections so the digest feels like a briefing
 * instead of one long flat list.
 */

import type { DigestItem } from "../types";

const SECTION_ORDER: DigestItem["topic"][] = [
  "security",
  "tech",
  "ai",
  "world",
  "albums",
  "personal",
];

function sectionLabel(topic: DigestItem["topic"]): string {
  switch (topic) {
    case "security":
      return "Security";
    case "tech":
      return "Tech";
    case "ai":
      return "AI Watch";
    case "world":
      return "World";
    case "albums":
      return "Music";
    case "personal":
      return "Personal";
  }
}

export function renderPlainTextDigest(items: DigestItem[]): string {
  const lines = ["Daily Digest", ""];
  const itemsByTopic = new Map<DigestItem["topic"], DigestItem[]>();

  for (const item of items) {
    const currentItems = itemsByTopic.get(item.topic) ?? [];
    currentItems.push(item);
    itemsByTopic.set(item.topic, currentItems);
  }

  for (const topic of SECTION_ORDER) {
    const topicItems = itemsByTopic.get(topic);
    if (!topicItems || topicItems.length === 0) {
      continue;
    }

    lines.push(`${sectionLabel(topic)}`);
    lines.push("");

    for (const item of topicItems) {
      lines.push(`${item.title} (${item.source})`);
      lines.push(item.summary);
      lines.push(item.url);
      lines.push(`Score: ${item.score.toFixed(2)}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
