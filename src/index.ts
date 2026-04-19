/**
 * Purpose:
 * This file is the smallest possible end-to-end runner for the framework.
 * It now loads all registered adapters, combines their results, and runs the
 * shared pipeline so you can see how multiple sources become one digest.
 */

import { buildDigest } from "./digest/build";
import { renderPlainTextDigest } from "./render/email";
import { sourceAdapters } from "./sources";

async function main() {
  const { rawItems, dedupedItems, digestItems } = await buildDigest();
  const digest = renderPlainTextDigest(digestItems);

  console.log(
    `Loaded ${sourceAdapters.length} source adapters, ${rawItems.length} raw items, and ${dedupedItems.length} deduped items.\n`,
  );
  console.log(digest);
}

main().catch((error) => {
  console.error("Failed to build digest:", error);
  process.exit(1);
});
