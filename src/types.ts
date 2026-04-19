/**
 * Purpose:
 * This file holds the core data shapes for the whole project.
 * Keeping the shared types in one place makes it easier to connect multiple
 * technologies later because every layer can agree on the same contract.
 */

export type DigestTopic = "security" | "albums" | "tech" | "world" | "personal";
export type DigestSource =
  | "BBC Technology"
  | "BBC World"
  | "Schneier on Security"
  | "Hacker News"
  | "The Guardian World"
  | "The Guardian Tech"
  | "SANS ISC"
  | "Pitchfork Best New Albums"
  | "Pitchfork Album Reviews"
  | "NPR Music News"
  | "NME Music News";


export interface RawSourceItem {
  title: string;
  url: string;
  source: string;
  topic: DigestTopic;
  publishedAt: string;
  summary?: string;
  tags?: string[];
}

export interface DigestItem {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: DigestTopic;
  publishedAt: string;
  summary: string;
  score: number;
  tags: string[];
  whyItMatched?: string;
}

export interface UserPreferences {
  timezone: string;
  deliveryHourLocal: number;
  maxItemsPerDigest: number;
  topicItemLimits?: Partial<Record<DigestTopic, number>>;
  topicWeights: Record<DigestTopic, number>;
  sourceWeights: Partial<Record<DigestSource, number>> & Record<string, number>;
  preferredSources: string[];
  boostedKeywords: string[];
  mutedKeywords: string[];
}
