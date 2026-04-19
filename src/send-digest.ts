/**
 * Purpose:
 * This file is the manual send entrypoint for email delivery.
 * Run it locally once you have environment variables configured to test sending
 * the daily digest before we automate scheduling.
 */

import { buildDigest } from "./digest/build";
import { sendDigestEmail } from "./delivery/email";
import { renderHtmlDigest } from "./render/email-html";
import { renderPlainTextDigest } from "./render/email";

function createSubject(): string {
  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return `Daily Digest - ${date}`;
}

async function main() {
  const { digestItems } = await buildDigest();

  if (digestItems.length === 0) {
    throw new Error("Digest is empty after feed loading and ranking. Email send aborted.");
  }

  const html = renderHtmlDigest(digestItems);
  const text = renderPlainTextDigest(digestItems);

  await sendDigestEmail({
    subject: createSubject(),
    html,
    text,
  });

  console.log(`Sent digest email with ${digestItems.length} items.`);
}

main().catch((error) => {
  console.error("Failed to send digest email:", error);
  process.exit(1);
});
