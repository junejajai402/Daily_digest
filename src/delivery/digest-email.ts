/**
 * Purpose:
 * This file holds the small bits of deterministic email metadata that should
 * stay stable across retries, reruns, and scheduled sends.
 *
 * Stability matters here because Resend idempotency keys only work well when
 * we intentionally send the exact same logical email for the same digest.
 */

import { createHash } from "node:crypto";

function formatDateForSubject(digestId: string): string {
  const [year, month, day] = digestId.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function hashRecipient(recipient: string): string {
  return createHash("sha256").update(recipient.trim().toLowerCase()).digest("hex").slice(0, 12);
}

export function createDigestEmailSubject(digestId: string): string {
  return `Daily Digest - ${formatDateForSubject(digestId)}`;
}

export function createDigestEmailIdempotencyKey(digestId: string, recipient: string): string {
  return `daily_digest_${digestId.replace(/-/g, "_")}_${hashRecipient(recipient)}`;
}
