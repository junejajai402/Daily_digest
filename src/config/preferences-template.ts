/**
 * Purpose:
 * This file is a template for the next step after hard-coded preferences.
 * You are not using it yet. It exists to show what a cleaner, more explicit
 * config store could look like before you move preferences into JSON, SQLite,
 * or another persistent store.
 *
 * Good learning steps:
 * - compare this shape to defaultPreferences in preferences.ts
 * - decide what should stay in code vs move to data
 * - later, load this shape from a file or database instead of hardcoding it
 */

import type { UserPreferences } from "../types";

export const preferencesTemplate: UserPreferences = {
  timezone: "America/New_York",
  deliveryHourLocal: 7,
  maxItemsPerDigest: 10,
  topicWeights: {
    security: 1,
    albums: 0.8,
    tech: 0.9,
    world: 0.7,
    personal: 0.8,
  },
  sourceWeights: {
    "Replace With Real Source": 0.8,
  },
  preferredSources: [
    // TODO: Add sources you especially trust or enjoy.
  ],
  boostedKeywords: [
    // TODO: Add terms you want the digest to favor.
  ],
  mutedKeywords: [
    // TODO: Add terms you want the digest to suppress.
  ],
};
