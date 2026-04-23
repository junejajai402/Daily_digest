import fs from "node:fs";
import path from "node:path";

type IssueLabel = { name?: string };
type AuthorAssociation =
  | "COLLABORATOR"
  | "CONTRIBUTOR"
  | "FIRST_TIMER"
  | "FIRST_TIME_CONTRIBUTOR"
  | "MANNEQUIN"
  | "MEMBER"
  | "NONE"
  | "OWNER";

const TRUSTED_AUTHOR_ASSOCIATIONS = new Set<AuthorAssociation>(["OWNER", "MEMBER", "COLLABORATOR"]);

export interface IssuePayload {
  action?: string;
  issue?: {
    number: number;
    title: string;
    body?: string | null;
    html_url?: string;
    labels?: IssueLabel[];
    user?: {
      login?: string;
    };
  };
  comment?: {
    body?: string | null;
    author_association?: AuthorAssociation;
    user?: {
      login?: string;
    };
  };
  repository?: {
    full_name?: string;
    default_branch?: string;
  };
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function writeGithubOutput(values: Record<string, string>): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    console.log(values);
    return;
  }

  const lines = Object.entries(values).map(([key, value]) => `${key}=${value}`);
  fs.appendFileSync(outputPath, `${lines.join("\n")}\n`);
}

function writeFileIfRequested(name: string, contents: string): void {
  const filePath = process.env[name];
  if (!filePath) {
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

export function buildPrBody(payload: IssuePayload, branchName: string): string {
  const issue = payload.issue!;
  return `## Summary

Automation scaffold prepared a draft branch for this issue.

## Issue link

- Closes #${issue.number}
- Source: ${issue.html_url ?? ""}

## What changed

- Created automation branch \`${branchName}\`
- Prepared draft PR metadata and issue acknowledgement
- Waiting for implementation work or model-backed follow-up

## Validation

- [ ] npm test
- [ ] npm run typecheck

## Risks / rollout

- This branch starts as a draft and should not merge without review.

## Follow-ups

- Add implementation commits for the requested issue scope.
`;
}

export function buildAcknowledgement(payload: IssuePayload, branchName: string): string {
  const issue = payload.issue!;
  return `Automation is preparing a draft PR branch for issue #${issue.number}.\n\n- Branch: \`${branchName}\`\n- Next step: run tests, add implementation commits, and keep the PR in draft until validation passes.`;
}

export function isTrustedCommenter(payload: IssuePayload): boolean {
  const association = payload.comment?.author_association;
  if (!association) {
    return false;
  }

  return TRUSTED_AUTHOR_ASSOCIATIONS.has(association);
}

export function shouldAct(payload: IssuePayload, automationLabel: string, automationCommand: string): boolean {
  const labels = payload.issue?.labels?.map((label) => label.name ?? "") ?? [];
  if (labels.includes(automationLabel)) {
    return true;
  }

  const commentBody = payload.comment?.body ?? "";
  if (!commentBody.includes(automationCommand)) {
    return false;
  }

  return isTrustedCommenter(payload);
}

export function main(): void {
  const eventPath = getRequiredEnv("GITHUB_EVENT_PATH");
  const automationLabel = process.env.AUTOMATION_LABEL ?? "automation:ready";
  const automationCommand = process.env.AUTOMATION_COMMAND ?? "/prepare-pr";
  const branchPrefix = process.env.AUTOMATION_BRANCH_PREFIX ?? "codex/issue-";
  const payload = JSON.parse(fs.readFileSync(eventPath, "utf8")) as IssuePayload;

  if (!payload.issue) {
    throw new Error("Issue payload missing from GitHub event.");
  }

  const actionable = shouldAct(payload, automationLabel, automationCommand);
  const branchName = `${branchPrefix}${payload.issue.number}-${slugify(payload.issue.title)}`;
  const prTitle = `chore: prepare issue #${payload.issue.number} - ${payload.issue.title}`;
  const prBody = buildPrBody(payload, branchName);
  const acknowledgement = buildAcknowledgement(payload, branchName);

  writeGithubOutput({
    should_act: actionable ? "true" : "false",
    branch_name: branchName,
    pr_title: prTitle,
    issue_number: String(payload.issue.number),
    default_branch: payload.repository?.default_branch ?? "main",
  });

  writeFileIfRequested("AUTOMATION_PR_BODY_PATH", prBody);

  if (!actionable) {
    console.log(
      `Issue #${payload.issue.number} is not actionable yet. Add the ${automationLabel} label or comment ${automationCommand}.`,
    );
    return;
  }

  writeFileIfRequested("AUTOMATION_ACK_PATH", acknowledgement);
  console.log(`Prepared automation metadata for issue #${payload.issue.number} on ${branchName}.`);
}

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(process.cwd(), "scripts/automation/issue-listener.ts");

if (isMainModule) {
  main();
}
