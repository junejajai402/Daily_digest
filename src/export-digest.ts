/**
 * Purpose:
 * This file exports the current digest artifact without sending email.
 * It is useful for local inspection, future homepage integration, and CI
 * flows where we want the canonical JSON output only.
 */

import { createDigestArtifact } from "./artifact/create";
import { writeDigestArtifact } from "./artifact/write";
import { buildDigest } from "./digest/build";

async function main() {
  const builtDigest = await buildDigest();
  const artifact = createDigestArtifact(builtDigest);
  const writtenPaths = await writeDigestArtifact(artifact);

  console.log(`Exported digest artifact ${artifact.digestId}.`);
  console.log(
    `Counts: ${artifact.counts.rawItems} raw, ${artifact.counts.dedupedItems} deduped, ${artifact.counts.digestItems} final.`,
  );
  console.log(`Latest artifact: ${writtenPaths.latestPath}`);

  if (writtenPaths.archivePath) {
    console.log(`Archive artifact: ${writtenPaths.archivePath}`);
  }

  if (artifact.sourceFailures.length > 0) {
    console.log(`Source failures: ${artifact.sourceFailures.length}`);
  }
}

main().catch((error) => {
  console.error("Failed to export digest artifact:", error);
  process.exit(1);
});
