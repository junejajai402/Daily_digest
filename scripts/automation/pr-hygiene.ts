import fs from "node:fs";

interface PullRequestPayload {
  pull_request?: {
    title?: string;
    body?: string | null;
    head?: {
      ref?: string;
    };
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function assertIncludes(body: string, snippet: string, label: string): void {
  if (!body.includes(snippet)) {
    throw new Error(`PR body is missing required section: ${label}`);
  }
}

function main(): void {
  const eventPath = getRequiredEnv("GITHUB_EVENT_PATH");
  const payload = JSON.parse(fs.readFileSync(eventPath, "utf8")) as PullRequestPayload;
  const pullRequest = payload.pull_request;

  if (!pullRequest) {
    throw new Error("Pull request payload missing from GitHub event.");
  }

  const branchName = pullRequest.head?.ref ?? "";
  const body = pullRequest.body ?? "";

  if (!branchName.startsWith("codex/issue-")) {
    throw new Error("PR branch name must start with codex/issue-");
  }

  assertIncludes(body, "## Summary", "Summary");
  assertIncludes(body, "## Issue link", "Issue link");
  assertIncludes(body, "## What changed", "What changed");
  assertIncludes(body, "## Validation", "Validation");
  assertIncludes(body, "## Risks / rollout", "Risks / rollout");
  assertIncludes(body, "## Follow-ups", "Follow-ups");

  console.log(`PR hygiene checks passed for ${branchName}.`);
}

main();
