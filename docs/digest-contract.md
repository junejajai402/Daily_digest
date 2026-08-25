# Daily Digest Contract

This document defines the shared contract for the current digest project.
Ingestion, ranking, email rendering, artifact export, and homepage rendering
should all build against this shape.

## 1. Goal

Deliver one concise morning digest for a single user that combines:

- security news
- tech news
- AI updates
- world events
- music coverage
- a personalized section based on user taste

The digest should be fast to scan on a phone, cheap to run, and stable enough
to power more than one surface.

## 2. Product Rules

- One user only.
- One digest per day.
- Delivery target is morning in `America/New_York`.
- Primary delivery is email.
- Secondary delivery is a homepage view over the same digest data.
- The digest should favor signal over volume.

## 3. Topic Contract

Version 1 topics:

- `security`
- `tech`
- `ai`
- `world`
- `music`
- `personal`

`music` is the locked top-level topic name across the project.
Some sources may still specifically cover album reviews or album releases, but
those roll up under the `music` topic.

## 4. Item Contract

Every normalized item in the system should match this shape:

```ts
export type DigestTopic =
  | "security"
  | "tech"
  | "ai"
  | "world"
  | "music"
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

- `id`: stable identifier used for dedupe and future saved-state keys
- `publishedAt`: ISO timestamp
- `summary`: short phone-friendly summary
- `score`: ranking output used to sort items
- `whyItMatched`: optional explanation for personalized ranking, useful inside the pipeline but not required in public artifacts

## 5. Canonical Artifact Contract

The canonical digest artifact is the locked cross-surface shape for email,
homepage rendering, and future storage.

```ts
export interface DigestArtifactItem {
  id: string;
  title: string;
  url: string;
  source: string;
  topic: DigestTopic;
  publishedAt: string;
  summary: string;
  score: number;
  tags: string[];
}

export interface DigestArtifactCounts {
  rawItems: number;
  dedupedItems: number;
  digestItems: number;
}

export interface DigestArtifactSourceFailure {
  source: string;
  message: string;
}

export interface DigestArtifact {
  schemaVersion: 1;
  digestId: string;
  builtAt: string;
  lastAttemptedAt: string;
  isStale: boolean;
  counts: DigestArtifactCounts;
  topicCounts: Partial<Record<DigestTopic, number>>;
  sourceFailures: DigestArtifactSourceFailure[];
  items: DigestArtifactItem[];
}
```

Artifact rules:

- `schemaVersion` starts at `1`
- the artifact must be JSON-safe
- the artifact should be sanitized for downstream consumers
- do not include secrets, email addresses, or raw internal error objects
- do not include `whyItMatched` in the shared artifact by default

## 6. Personalization Contract

Version 1 personalization should be rules-based, not ML-based.

Inputs:

- preferred topics
- preferred sources
- keyword boosts
- keyword suppressions
- recency preference

```ts
export interface UserPreferences {
  timezone: string;
  deliveryHourLocal: number;
  maxItemsPerDigest: number;
  topicItemLimits?: Partial<Record<DigestTopic, number>>;
  topicWeights: Record<DigestTopic, number>;
  sourceWeights: Record<string, number>;
  preferredSources: string[];
  boostedKeywords: string[];
  mutedKeywords: string[];
}
```

Default assumptions for v1:

- timezone: `America/New_York`
- delivery hour: `7`
- max items: `8` to `15` depending on configuration
- stronger weighting for security, tech, and AI

## 7. Delivery Contract

Version 1 outputs:

- HTML email digest
- plain text digest
- canonical digest artifact for future homepage rendering

The email and homepage should both come from the same digest build, not from
separate ranking or shaping code paths.

## 8. Source Contract

Each source adapter should return raw items that can be mapped into the shared
digest shapes.

Adapter responsibilities:

- fetch source data
- extract title, link, date, and source name
- assign one locked top-level topic
- pass content to the normalizer

Version 1 source priorities:

- RSS and Atom feeds first
- public APIs only when they are free and reliable
- no paid news APIs required for MVP

## 9. MVP Scope Freeze

The MVP will not include:

- multi-user support
- mobile app
- SMS delivery
- full preference UI
- machine learning ranking
- long-term analytics dashboards
- saved-item sync across devices

## 10. Immediate Next Step

The next implementation step is to emit the canonical digest artifact from the
existing build pipeline and keep email rendering wired to the same shared data.
