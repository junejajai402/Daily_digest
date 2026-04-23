import test from "node:test";
import assert from "node:assert/strict";

import type { IssuePayload } from "../scripts/automation/issue-listener";
import { buildPrBody, shouldAct, slugify } from "../scripts/automation/issue-listener";

function makePayload(overrides: Partial<IssuePayload> = {}): IssuePayload {
  return {
    issue: {
      number: 12,
      title: "Prepare digest automation",
      html_url: "https://github.com/example/repo/issues/12",
      labels: [],
    },
    repository: {
      default_branch: "main",
      full_name: "example/repo",
    },
    ...overrides,
  };
}

test("shouldAct returns true when the automation label is present", () => {
  const payload = makePayload({
    issue: {
      ...makePayload().issue!,
      labels: [{ name: "automation:ready" }],
    },
  });

  assert.equal(shouldAct(payload, "automation:ready", "/prepare-pr"), true);
});

test("shouldAct only accepts command triggers from trusted commenters", () => {
  const trustedPayload = makePayload({
    comment: {
      body: "/prepare-pr",
      author_association: "MEMBER",
    },
  });

  const untrustedPayload = makePayload({
    comment: {
      body: "/prepare-pr",
      author_association: "CONTRIBUTOR",
    },
  });

  assert.equal(shouldAct(trustedPayload, "automation:ready", "/prepare-pr"), true);
  assert.equal(shouldAct(untrustedPayload, "automation:ready", "/prepare-pr"), false);
});

test("slugify keeps branch names compact and lowercase", () => {
  assert.equal(slugify("Prepare digest automation!"), "prepare-digest-automation");
});

test("buildPrBody links the issue and branch context", () => {
  const payload = makePayload();
  const body = buildPrBody(payload, "codex/issue-12-prepare-digest-automation");

  assert.match(body, /Closes #12/);
  assert.match(body, /codex\/issue-12-prepare-digest-automation/);
});
