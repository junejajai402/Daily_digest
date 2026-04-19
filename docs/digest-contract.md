# Daily Digest Contract

This document defines the first version of the personal daily digest product.
It is the contract that ingestion, ranking, rendering, and delivery will build
against.

## 1. Goal

Deliver one concise morning digest for a single user that combines:

- security news
- album releases
- tech news
- world events
- a personalized section based on user taste

The digest should be optimized for fast reading on a phone and should be cheap
to run.

## 2. Product Rules

- One user only.
- One digest per day.
- Delivery target is morning in `America/New_York`.
- Primary delivery is email.
- Secondary delivery will later be phone push notifications.
- The digest should favor signal over volume.

## 3. Digest Shape

Version 1 digest sections:

1. Top picks
2. Security
3. New music
4. Tech
5. World
6. Worth a look

Target length:

- 5 to 10 total items
- 1 sentence summary per item
- 5 minute read or less

## 4. Content Contract

Every item in the system should normalize to this shape:

```ts
export type DigestTopic =
  | "security"
  | "albums"
  | "tech"
  | "world"
  | "personal";

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
```

Field notes:

- `id`: stable hash for deduping
- `publishedAt`: ISO timestamp
- `summary`: short phone-friendly summary
- `score`: ranking output used to sort items
- `whyItMatched`: optional explanation for personalized picks

## 5. Personalization Contract

Version 1 personalization should be rules-based, not ML-based.

Inputs:

- preferred topics
- preferred sources
- keyword boosts
- keyword suppressions
- recency preference

Example preference shape:

```ts
export interface UserPreferences {
  timezone: string;
  deliveryHourLocal: number;
  maxItemsPerDigest: number;
  topicWeights: Record<DigestTopic, number>;
  preferredSources: string[];
  boostedKeywords: string[];
  mutedKeywords: string[];
}
```

Default assumptions for v1:

- timezone: `America/New_York`
- delivery hour: `7`
- max items: `8`
- stronger weighting for security and tech

## 6. Delivery Contract

Version 1 outputs:

- full HTML email digest
- short text summary for future push notifications

Email should include:

- date
- section headers
- title, source, and summary for each item
- link to the original article

Push should include:

- 2 to 3 highest-ranked items
- a short call to open the full digest later

## 7. Source Contract

Each source adapter should return raw items that can be mapped into the shared
`DigestItem` structure.

Version 1 source priorities:

- RSS and Atom feeds first
- public APIs only when they are free and reliable
- no paid news APIs required for MVP

Adapter responsibilities:

- fetch source data
- extract title, link, date, and source name
- assign topic
- pass content to normalizer

## 8. Success Criteria For Step 1

Step 1 is complete when we have:

- a clear definition of what the digest contains
- a shared data model for all downstream code
- a first-pass personalization model
- defined delivery outputs
- a fixed scope for MVP

## 9. MVP Scope Freeze

The MVP will not include:

- multi-user support
- mobile app
- SMS delivery
- full preference UI
- machine learning ranking
- long-term analytics dashboards

## 10. Immediate Next Step

Step 2 should implement source selection and adapter scaffolding for:

- 2 security sources
- 2 tech sources
- 2 world sources
- 1 to 2 music release sources

That is enough to validate the framework without overbuilding.
