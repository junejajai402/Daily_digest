/**
 * Purpose:
 * This file centralizes where generated digest artifacts live on disk.
 * Keeping paths in one place makes it easier to swap local files for another
 * transport later without scattering string paths across the codebase.
 */

import { resolve } from "node:path";

// The latest artifact is a small, public data contract that the homepage pulls
// from this repository. Keep it outside tmp so GitHub Actions can publish it.
const DEFAULT_DIGEST_OUTPUT_DIR = "digests";

export function resolveDigestOutputDir(outputDir = process.env.DIGEST_OUTPUT_DIR?.trim()): string {
  return resolve(process.cwd(), outputDir || DEFAULT_DIGEST_OUTPUT_DIR);
}

export function resolveLatestDigestArtifactPath(outputDir?: string): string {
  return resolve(resolveDigestOutputDir(outputDir), "latest-digest.json");
}

export function resolveArchiveDigestArtifactPath(digestId: string, outputDir?: string): string {
  return resolve(resolveDigestOutputDir(outputDir), "archive", `${digestId}.json`);
}
