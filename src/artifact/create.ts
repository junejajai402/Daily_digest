/**
 * Purpose:
 * This file converts the in-memory digest build result into the canonical
 * artifact shape that other surfaces can consume.
 *
 * Keeping this logic separate gives us one place to lock the JSON contract
 * before we later add file output, APIs, or homepage rendering.
 */

import { defaultPreferences } from "../config/preferences";
import type { BuiltDigest } from "../digest/build";
import type { DigestArtifact, DigestArtifactItem, DigestTopic } from "../types";

interface CreateDigestArtifactOptions {
  now?: Date;
  timezone?: string;
}

function formatDigestDayKey(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format digest day key.");
  }

  return `${year}-${month}-${day}`;
}

function countTopics(items: BuiltDigest["digestItems"]): Partial<Record<DigestTopic, number>> {
  const topicCounts: Partial<Record<DigestTopic, number>> = {};

  for (const item of items) {
    topicCounts[item.topic] = (topicCounts[item.topic] ?? 0) + 1;
  }

  return topicCounts;
}

function toArtifactItems(items: BuiltDigest["digestItems"]): DigestArtifactItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    source: item.source,
    topic: item.topic,
    publishedAt: item.publishedAt,
    summary: item.summary,
    score: item.score,
    tags: [...item.tags],
  }));
}

export function createDigestArtifact(
  builtDigest: BuiltDigest,
  options: CreateDigestArtifactOptions = {},
): DigestArtifact {
  const timezone = options.timezone ?? defaultPreferences.timezone;
  const now = options.now ?? new Date();
  const builtAtDate = new Date(builtDigest.builtAt);
  const digestId = formatDigestDayKey(builtAtDate, timezone);

  return {
    schemaVersion: 1,
    digestId,
    builtAt: builtDigest.builtAt,
    lastAttemptedAt: builtDigest.lastAttemptedAt,
    isStale: digestId !== formatDigestDayKey(now, timezone),
    counts: {
      rawItems: builtDigest.rawItems.length,
      dedupedItems: builtDigest.dedupedItems.length,
      digestItems: builtDigest.digestItems.length,
    },
    topicCounts: countTopics(builtDigest.digestItems),
    sourceFailures: builtDigest.sourceFailures.map((failure) => ({
      source: failure.source,
      message: failure.message,
    })),
    items: toArtifactItems(builtDigest.digestItems),
  };
}
