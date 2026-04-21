/**
 * Purpose:
 * This file renders the digest as simple HTML for email delivery.
 * The first version is intentionally straightforward so it is easy to inspect,
 * tweak, and later swap for a richer template system if you want.
 */

import type { DigestItem } from "../types";

const SECTION_ORDER: DigestItem["topic"][] = [
  "security",
  "tech",
  "ai",
  "world",
  "albums",
  "personal",
];

function sectionLabel(topic: DigestItem["topic"]): string {
  switch (topic) {
    case "security":
      return "Security";
    case "tech":
      return "Tech";
    case "ai":
      return "AI Watch";
    case "world":
      return "World";
    case "albums":
      return "Music";
    case "personal":
      return "Personal";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderHtmlDigest(items: DigestItem[]): string {
  const itemsByTopic = new Map<DigestItem["topic"], DigestItem[]>();

  for (const item of items) {
    const currentItems = itemsByTopic.get(item.topic) ?? [];
    currentItems.push(item);
    itemsByTopic.set(item.topic, currentItems);
  }

  const sections = SECTION_ORDER.map((topic) => {
    const topicItems = itemsByTopic.get(topic);
    if (!topicItems || topicItems.length === 0) {
      return "";
    }

    const renderedItems = topicItems
      .map(
        (item) => `
          <article style="margin:0 0 20px;">
            <h3 style="margin:0 0 6px;font-size:18px;line-height:1.35;">
              <a href="${escapeHtml(item.url)}" style="color:#0f172a;text-decoration:none;">
                ${escapeHtml(item.title)}
              </a>
            </h3>
            <p style="margin:0 0 8px;color:#475569;font-size:13px;">
              ${escapeHtml(item.source)}
            </p>
            <p style="margin:0;color:#1e293b;font-size:15px;line-height:1.6;">
              ${escapeHtml(item.summary)}
            </p>
          </article>
        `,
      )
      .join("");

    return `
      <section style="margin:0 0 28px;">
        <h2 style="margin:0 0 14px;font-size:20px;color:#111827;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">
          ${escapeHtml(sectionLabel(topic))}
        </h2>
        ${renderedItems}
      </section>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Daily Digest</title>
      </head>
      <body style="margin:0;padding:24px;background:#f8fafc;font-family:Georgia, serif;color:#111827;">
        <main style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;padding:32px;">
          <header style="margin:0 0 28px;">
            <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">
              Daily Digest
            </p>
            <h1 style="margin:0;font-size:32px;line-height:1.1;color:#0f172a;">
              Your Morning Briefing
            </h1>
          </header>
          ${sections}
        </main>
      </body>
    </html>
  `;
}
