/**
 * Purpose:
 * This file is the smallest possible end-to-end runner for the framework.
 * It now loads all registered adapters, combines their results, and runs the
 * shared pipeline so you can see how multiple sources become one digest.
 */

import { createDigestArtifact } from "./artifact/create";
import { writeDigestArtifact } from "./artifact/write";
import { buildDigest } from "./digest/build";
import { renderPlainTextDigest } from "./render/email";
import { sourceAdapters } from "./sources";

async function main() {
  const builtDigest = await buildDigest();
  const { rawItems, dedupedItems, digestItems } = builtDigest;
  const artifact = createDigestArtifact(builtDigest);
  const writtenPaths = await writeDigestArtifact(artifact);
  const digest = renderPlainTextDigest(digestItems);

  console.log(
    `Loaded ${sourceAdapters.length} source adapters, ${rawItems.length} raw items, and ${dedupedItems.length} deduped items.\n`,
  );
  console.log(`Digest ID: ${artifact.digestId}`);
  console.log(`Built at: ${artifact.builtAt}`);
  console.log(`Latest artifact: ${writtenPaths.latestPath}`);
  if (writtenPaths.archivePath) {
    console.log(`Archive artifact: ${writtenPaths.archivePath}`);
  }
  if (artifact.sourceFailures.length > 0) {
    console.log(`Source failures: ${artifact.sourceFailures.length}\n`);
  } else {
    console.log("");
  }
  console.log(digest);
}

main().catch((error) => {
  console.error("Failed to build digest:", error);
  process.exit(1);
});
