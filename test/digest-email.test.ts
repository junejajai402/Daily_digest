import test from "node:test";
import assert from "node:assert/strict";

import {
  createDigestEmailIdempotencyKey,
  createDigestEmailSubject,
} from "../src/delivery/digest-email";

test("createDigestEmailSubject formats the digest day deterministically", () => {
  assert.equal(createDigestEmailSubject("2026-08-27"), "Daily Digest - Aug 27, 2026");
});

test("createDigestEmailIdempotencyKey is stable for the same recipient and digest day", () => {
  const left = createDigestEmailIdempotencyKey("2026-08-27", "Jai@Example.com");
  const right = createDigestEmailIdempotencyKey("2026-08-27", " jai@example.com ");

  assert.equal(left, right);
  assert.match(left, /^daily_digest_2026_08_27_[a-f0-9]{12}$/);
});

test("createDigestEmailIdempotencyKey changes when the digest day changes", () => {
  assert.notEqual(
    createDigestEmailIdempotencyKey("2026-08-27", "jai@example.com"),
    createDigestEmailIdempotencyKey("2026-08-28", "jai@example.com"),
  );
});
