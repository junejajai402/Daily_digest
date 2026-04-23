import test from "node:test";
import assert from "node:assert/strict";

import { parseRecipientList, validateSender } from "../src/delivery/email";

test.afterEach(() => {
  delete process.env.ALLOWED_SENDER_DOMAINS;
});

test("parseRecipientList splits, trims, de-duplicates, and normalizes recipients", () => {
  const recipients = parseRecipientList(
    "Jai@BuiltByJai.me, junejajai@gmail.com , jai@builtbyjai.me",
  );

  assert.deepEqual(recipients, ["jai@builtbyjai.me", "junejajai@gmail.com"]);
});

test("parseRecipientList rejects invalid recipient entries", () => {
  assert.throws(
    () => parseRecipientList("valid@example.com, not-an-email"),
    /Invalid email address format/,
  );
});

test("validateSender rejects consumer domains like gmail.com", () => {
  assert.throws(
    () => validateSender("Daily Digest <junejajai@gmail.com>"),
    /do not allow as an unverified sender/,
  );
});

test("validateSender accepts verified-looking custom domains", () => {
  const sender = validateSender("Daily Digest <digest@updates.builtbyjai.me>");

  assert.equal(sender, "digest@updates.builtbyjai.me");
});

test("validateSender uses ALLOWED_SENDER_DOMAINS to fail fast on wrong custom domains", () => {
  process.env.ALLOWED_SENDER_DOMAINS = "updates.builtbyjai.me";

  assert.throws(
    () => validateSender("Daily Digest <digest@typo.builtbyjai.me>"),
    /not in ALLOWED_SENDER_DOMAINS/,
  );

  const sender = validateSender("Daily Digest <digest@updates.builtbyjai.me>");
  assert.equal(sender, "digest@updates.builtbyjai.me");
});
