import test from "node:test";
import assert from "node:assert/strict";

import { renderHtmlDigest } from "../src/render/email-html";
import { renderPlainTextDigest } from "../src/render/email";
import { createDigestItem } from "./helpers";

test("renderPlainTextDigest groups items into ordered sections", () => {
  const output = renderPlainTextDigest([
    createDigestItem({
      id: "tech-1",
      topic: "tech",
      title: "Tech story",
      source: "Tech Source",
    }),
    createDigestItem({
      id: "security-1",
      topic: "security",
      title: "Security story",
      source: "Security Source",
    }),
  ]);

  assert.match(output, /Security[\s\S]*Security story \(Security Source\)[\s\S]*Tech[\s\S]*Tech story \(Tech Source\)/);
});

test("renderHtmlDigest escapes content before inserting it into markup", () => {
  const output = renderHtmlDigest([
    createDigestItem({
      id: "ai-1",
      topic: "ai",
      title: 'Launch <script>alert("x")</script>',
      summary: "Summary with <b>markup</b> & details",
      url: "https://example.com/?a=1&b=2",
      source: "AI Source",
    }),
  ]);

  assert.match(output, /AI Watch/);
  assert.doesNotMatch(output, /<script>alert\("x"\)<\/script>/);
  assert.match(output, /Launch &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(output, /Summary with &lt;b&gt;markup&lt;\/b&gt; &amp; details/);
  assert.match(output, /https:\/\/example\.com\/\?a=1&amp;b=2/);
});
