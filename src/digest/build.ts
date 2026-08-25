/**
 * Purpose:
 * This file centralizes the end-to-end digest build flow.
 * It gives us one reusable place to load feeds, normalize, dedupe, rank, and
 * select the final digest items whether we are printing locally or sending email.
 */

import { defaultPreferences } from "../config/preferences";
import { dedupeItems } from "../pipeline/dedupe";
import { normalizeItems } from "../pipeline/normalize";
import { rankItems, selectDiverseItems, selectItemsByTopicLimits } from "../pipeline/rank";
import { sourceAdapters } from "../sources";
import type { DigestArtifactSourceFailure, DigestItem, RawSourceItem } from "../types";

const RETRY_DELAYS_MS = [1000, 2000, 4000];

export interface BuiltDigest {
  builtAt: string;
  lastAttemptedAt: string;
  sourceFailures: DigestArtifactSourceFailure[];
  rawItems: RawSourceItem[];
  dedupedItems: DigestItem[];
  digestItems: DigestItem[];
}

interface LoadedSourceItems {
  rawItems: RawSourceItem[];
  sourceFailures: DigestArtifactSourceFailure[];
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchItemsWithRetry(
  adapterName: string,
  fetchItems: () => Promise<RawSourceItem[]>,
): Promise<RawSourceItem[]> {
  // TODO(reliability): add an AbortController timeout per attempt so a hung feed
  // cannot stall the entire digest job.
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await fetchItems();
    } catch (error) {
      lastError = error;

      if (attempt === RETRY_DELAYS_MS.length) {
        break;
      }

      const delayMs = RETRY_DELAYS_MS[attempt];
      console.error(
        `Source "${adapterName}" failed on attempt ${attempt + 1}. Retrying in ${delayMs}ms...`,
      );
      await wait(delayMs);
    }
  }

  throw lastError;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function loadSourceItems(): Promise<LoadedSourceItems> {
  const settledResults = await Promise.all(
    sourceAdapters.map(async (adapter) => {
      try {
        const items = await fetchItemsWithRetry(adapter.name, () => adapter.fetchItems());
        return { adapterName: adapter.name, items };
      } catch (error) {
        return { adapterName: adapter.name, items: [] as RawSourceItem[], error };
      }
    }),
  );

  const rawItems: RawSourceItem[] = [];
  const sourceFailures: DigestArtifactSourceFailure[] = [];

  for (const result of settledResults) {
    rawItems.push(...result.items);

    if (result.error) {
      const message = toErrorMessage(result.error);
      sourceFailures.push({
        source: result.adapterName,
        message,
      });
      console.error(`Source "${result.adapterName}" failed to load: ${message}`);
    }
  }

  return {
    rawItems,
    sourceFailures,
  };
}

export async function buildDigest(): Promise<BuiltDigest> {
  const lastAttemptedAt = new Date().toISOString();
  const { rawItems, sourceFailures } = await loadSourceItems();
  const normalizedItems = normalizeItems(rawItems);
  const dedupedItems = dedupeItems(normalizedItems);
  const rankedItems = rankItems(dedupedItems, defaultPreferences);
  // TODO(balance): topic limits are applied after ranking/diversity selection.
  // If a topic runs out of items, the digest can end up shorter than expected.
  const diverseItems = selectDiverseItems(rankedItems, Math.max(defaultPreferences.maxItemsPerDigest * 3, 20));
  const digestItems = defaultPreferences.topicItemLimits
    ? selectItemsByTopicLimits(diverseItems, defaultPreferences.topicItemLimits).slice(
        0,
        defaultPreferences.maxItemsPerDigest,
      )
    : diverseItems.slice(0, defaultPreferences.maxItemsPerDigest);
  const builtAt = new Date().toISOString();

  return {
    builtAt,
    lastAttemptedAt,
    sourceFailures,
    rawItems,
    dedupedItems,
    digestItems,
  };
}
