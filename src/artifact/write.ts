/**
 * Purpose:
 * This file persists the canonical digest artifact to local JSON files.
 * It gives the project one reusable write path before we later move artifacts
 * to object storage, another backend, or a homepage API host.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { resolveArchiveDigestArtifactPath, resolveLatestDigestArtifactPath } from "./paths";
import type { DigestArtifact } from "../types";

export interface WriteDigestArtifactOptions {
  outputDir?: string;
  writeArchive?: boolean;
}

export interface WrittenDigestArtifactPaths {
  archivePath?: string;
  latestPath: string;
}

function toArtifactJson(artifact: DigestArtifact): string {
  return `${JSON.stringify(artifact, null, 2)}\n`;
}

export async function writeDigestArtifact(
  artifact: DigestArtifact,
  options: WriteDigestArtifactOptions = {},
): Promise<WrittenDigestArtifactPaths> {
  const latestPath = resolveLatestDigestArtifactPath(options.outputDir);
  const artifactJson = toArtifactJson(artifact);

  await mkdir(dirname(latestPath), { recursive: true });
  await writeFile(latestPath, artifactJson, "utf8");

  if (options.writeArchive === false) {
    return { latestPath };
  }

  const archivePath = resolveArchiveDigestArtifactPath(artifact.digestId, options.outputDir);
  await mkdir(dirname(archivePath), { recursive: true });
  await writeFile(archivePath, artifactJson, "utf8");

  return {
    archivePath,
    latestPath,
  };
}
