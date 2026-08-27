/**
 * Purpose:
 * This file is the manual send entrypoint for email delivery.
 * Run it locally once you have environment variables configured to test sending
 * the daily digest before we automate scheduling.
 */

import { createDigestArtifact } from "./artifact/create";
import { writeDigestArtifact } from "./artifact/write";
import { buildDigest } from "./digest/build";
import { createDigestEmailIdempotencyKey, createDigestEmailSubject } from "./delivery/digest-email";
import { sendDigestEmail } from "./delivery/email";
import { renderHtmlDigest } from "./render/email-html";
import { renderPlainTextDigest } from "./render/email";

function parseBooleanEnv(name: string): boolean {
  const value = process.env[name];
  return value === "true" || value === "1";
}

function parseNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const builtDigest = await buildDigest();
  const { digestItems } = builtDigest;
  const minimumDigestItems = parseNumberEnv("MIN_DIGEST_ITEMS", 8);
  const isDryRun = parseBooleanEnv("DRY_RUN");

  if (digestItems.length === 0) {
    throw new Error("Digest is empty after feed loading and ranking. Email send aborted.");
  }

  if (digestItems.length < minimumDigestItems) {
    throw new Error(
      `Digest only has ${digestItems.length} items, which is below the minimum of ${minimumDigestItems}. Email send aborted.`,
    );
  }

  const artifact = createDigestArtifact(builtDigest);
  const writtenPaths = await writeDigestArtifact(artifact);
  const subject = createDigestEmailSubject(artifact.digestId);
  const recipient = requiredEnv("DIGEST_TO_EMAIL");
  const idempotencyKey = createDigestEmailIdempotencyKey(artifact.digestId, recipient);
  const html = renderHtmlDigest(digestItems);
  const text = renderPlainTextDigest(digestItems);

  if (isDryRun) {
    console.log(
      `Dry run: digest built successfully with ${digestItems.length} items. Email send skipped.`,
    );
    console.log(`Subject: ${subject}`);
    console.log(`Idempotency key: ${idempotencyKey}`);
    console.log(`Latest artifact: ${writtenPaths.latestPath}`);
    if (writtenPaths.archivePath) {
      console.log(`Archive artifact: ${writtenPaths.archivePath}`);
    }
    return;
  }

  await sendDigestEmail({
    subject,
    html,
    idempotencyKey,
    text,
  });

  console.log(`Sent digest email with ${digestItems.length} items.`);
  console.log(`Latest artifact: ${writtenPaths.latestPath}`);
  if (writtenPaths.archivePath) {
    console.log(`Archive artifact: ${writtenPaths.archivePath}`);
  }
}

main().catch((error) => {
  console.error("Failed to send digest email:", error);
  process.exit(1);
});
