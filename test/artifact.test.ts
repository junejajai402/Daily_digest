import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDigestArtifact } from "../src/artifact/create";
import { writeDigestArtifact } from "../src/artifact/write";
import type { BuiltDigest } from "../src/digest/build";
import { createDigestItem, createRawSourceItem } from "./helpers";

function createBuiltDigest(overrides: Partial<BuiltDigest> = {}): BuiltDigest {
  return {
    builtAt: "2026-08-24T11:00:00.000Z",
    lastAttemptedAt: "2026-08-24T10:59:30.000Z",
    sourceFailures: [],
    rawItems: [
      createRawSourceItem("security", { url: "https://example.com/raw-security" }),
      createRawSourceItem("music", { url: "https://example.com/raw-music" }),
      createRawSourceItem("tech", { url: "https://example.com/raw-tech" }),
    ],
    dedupedItems: [
      createDigestItem({ id: "security-1", topic: "security" }),
      createDigestItem({ id: "music-1", topic: "music" }),
    ],
    digestItems: [
      createDigestItem({
        id: "security-1",
        topic: "security",
        whyItMatched: "Internal ranking hint that should stay out of the artifact.",
      }),
      createDigestItem({
        id: "music-1",
        topic: "music",
        tags: ["music", "albums"],
      }),
    ],
    ...overrides,
  };
}

test("createDigestArtifact maps a built digest into the locked public artifact shape", () => {
  const artifact = createDigestArtifact(createBuiltDigest(), {
    now: new Date("2026-08-24T18:00:00.000Z"),
    timezone: "America/New_York",
  });

  assert.equal(artifact.schemaVersion, 1);
  assert.equal(artifact.digestId, "2026-08-24");
  assert.equal(artifact.builtAt, "2026-08-24T11:00:00.000Z");
  assert.equal(artifact.lastAttemptedAt, "2026-08-24T10:59:30.000Z");
  assert.equal(artifact.isStale, false);
  assert.deepEqual(artifact.counts, {
    rawItems: 3,
    dedupedItems: 2,
    digestItems: 2,
  });
  assert.deepEqual(artifact.topicCounts, {
    security: 1,
    music: 1,
  });
  assert.equal("whyItMatched" in artifact.items[0], false);
  assert.deepEqual(artifact.items[1]?.tags, ["music", "albums"]);
});

test("createDigestArtifact marks old digests stale and uses the user timezone for digestId", () => {
  const artifact = createDigestArtifact(
    createBuiltDigest({
      builtAt: "2026-08-25T01:30:00.000Z",
    }),
    {
      now: new Date("2026-08-25T15:00:00.000Z"),
      timezone: "America/New_York",
    },
  );

  assert.equal(artifact.digestId, "2026-08-24");
  assert.equal(artifact.isStale, true);
});

test("createDigestArtifact preserves sanitized source failure summaries", () => {
  const artifact = createDigestArtifact(
    createBuiltDigest({
      sourceFailures: [
        {
          source: "BBC World",
          message: "Timed out after retries.",
        },
      ],
    }),
  );

  assert.deepEqual(artifact.sourceFailures, [
    {
      source: "BBC World",
      message: "Timed out after retries.",
    },
  ]);
});

test("writeDigestArtifact writes the latest artifact and an archive copy", async () => {
  const artifact = createDigestArtifact(createBuiltDigest());
  const outputDir = await mkdtemp(join(tmpdir(), "digest-artifact-test-"));

  try {
    const writtenPaths = await writeDigestArtifact(artifact, { outputDir });
    const latestArtifact = JSON.parse(await readFile(writtenPaths.latestPath, "utf8"));
    const archiveArtifact = JSON.parse(await readFile(writtenPaths.archivePath!, "utf8"));

    assert.equal(writtenPaths.latestPath.endsWith("latest-digest.json"), true);
    assert.equal(writtenPaths.archivePath?.endsWith(`${artifact.digestId}.json`), true);
    assert.deepEqual(latestArtifact, artifact);
    assert.deepEqual(archiveArtifact, artifact);
  } finally {
    await rm(outputDir, { force: true, recursive: true });
  }
});
