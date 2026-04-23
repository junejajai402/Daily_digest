import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanSummary,
  cleanText,
  fetchFeedText,
  pickAlternateLink,
  textValue,
} from "../src/sources/feed-utils";

test("textValue reads #text objects and falls back safely", () => {
  assert.equal(textValue({ "#text": "hello" }), "hello");
  assert.equal(textValue({ something: "else" }, "fallback"), "fallback");
});

test("cleanText decodes common entities and normalizes punctuation", () => {
  const cleaned = cleanText("Hello&nbsp;&amp;&nbsp;goodbye\u2014friend");

  assert.equal(cleaned, "Hello & goodbye-friend");
});

test("pickAlternateLink prefers alternate links before falling back", () => {
  const link = pickAlternateLink([
    { "@_rel": "self", "@_href": "https://example.com/self" },
    { "@_rel": "alternate", "@_href": "https://example.com/article" },
  ]);

  assert.equal(link, "https://example.com/article");
});

test("cleanSummary strips html, comments suffixes, and boilerplate", () => {
  const cleaned = cleanSummary("<p>Hello &amp; <b>world</b></p> Continue reading. comments");

  assert.equal(cleaned, "Hello & world");
});

test("fetchFeedText includes the source URL in HTTP failures", async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () =>
      ({
        ok: false,
        status: 503,
      } as Response);

    await assert.rejects(
      () => fetchFeedText("https://example.com/feed.xml", 25),
      /Failed to fetch feed https:\/\/example\.com\/feed\.xml: 503/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchFeedText includes the source URL in timeout failures", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const abortError = new Error("The operation was aborted.");
          abortError.name = "AbortError";
          reject(abortError);
        });
      });

    await assert.rejects(
      () => fetchFeedText("https://example.com/slow-feed.xml", 5),
      /Feed request timed out for https:\/\/example\.com\/slow-feed\.xml after 5ms/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
