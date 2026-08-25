# Daily Digest V2 Workstreams Checklist

## Purpose

This companion doc turns the V2 homepage plan into a practical build order.

Use it when we want to answer:

- what should we change first
- which files should we touch
- how do we keep email stable while adding the homepage view
- what should we verify before we ship each phase

## Contract decision

The shared contract is now locked around:

- `music` as the stable top-level topic name
- `DigestArtifact` in `/Users/jaideepjuneja/Documents/daily-digest-framework/src/types.ts` as the canonical cross-surface shape

Any new work should build against that contract instead of introducing a second shape.

## Track 1: Implementation

### Phase 1: Stabilize the digest producer

Repo: `daily-digest-framework`

Goal:
Create one canonical digest artifact without disrupting the existing email flow.

Steps:

1. Add shared artifact types in `/Users/jaideepjuneja/Documents/daily-digest-framework/src/types.ts`.
Why:
We need one JSON-safe contract that both the email side and homepage side can understand.

2. Expand the build result in `/Users/jaideepjuneja/Documents/daily-digest-framework/src/digest/build.ts`.
Why:
The build step should carry enough metadata for artifact generation, freshness, counts, and source health.

Recommended additions:

- `builtAt`
- `lastAttemptedAt`
- source success and failure metadata
- raw, deduped, and final item counts

3. Add `/Users/jaideepjuneja/Documents/daily-digest-framework/src/artifact/create.ts`.
Why:
This should be the only place that shapes homepage-facing digest JSON.

4. Add `/Users/jaideepjuneja/Documents/daily-digest-framework/src/artifact/write.ts`.
Why:
Artifact writing should stay separate from build logic so we can later swap local files for another transport.

Recommended outputs:

- `latest-digest.json`
- optional `archive/YYYY-MM-DD.json`

5. Add `/Users/jaideepjuneja/Documents/daily-digest-framework/src/artifact/paths.ts`.
Why:
Centralized paths reduce drift between local preview, Actions, and future publishing.

6. Update `/Users/jaideepjuneja/Documents/daily-digest-framework/src/send-digest.ts`.
Why:
The send flow should become:

- build digest
- create artifact
- write artifact
- render email
- send email

Email behavior should stay the same from the user perspective.

7. Update `/Users/jaideepjuneja/Documents/daily-digest-framework/src/index.ts`.
Why:
Local preview should log artifact metadata so we can debug freshness and source failures quickly.

Suggested preview output:

- digest id
- built time
- raw versus deduped versus final counts
- source failures

8. Update `/Users/jaideepjuneja/Documents/daily-digest-framework/package.json`.
Why:
Artifact export should have a clear command that is distinct from email send.

Suggested scripts:

- `export:digest`
- optional `dev:artifact`

9. Add artifact-focused tests in `/Users/jaideepjuneja/Documents/daily-digest-framework/test/artifact.test.ts`.
Why:
The artifact contract is the seam between repos, so we should test it directly.

10. Update `/Users/jaideepjuneja/Documents/daily-digest-framework/.gitignore` if local artifact files should stay uncommitted.

### Phase 2A: Build the homepage digest shell with fixture data

Repo: `Timer Safari Plugin`

Goal:
Add the UI without blocking on real transport.

Steps:

1. Update `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/App.tsx`.
Why:
We need to add `digest` to the tab model and render a new panel without disturbing the rest of the homepage.

Likely touchpoints:

- `RailTab`
- `VALID_TABS`
- tab labels or tab buttons
- panel rendering

2. Add `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/digest.ts`.
Why:
This should mirror the calendar client helper pattern and give the UI one typed entry point for digest data.

3. Add `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/components/DigestRailPanel.tsx`.
Why:
Keeping the digest panel isolated makes the homepage easier to maintain and keeps the rail UI calm.

4. Add `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/digest-fixture.ts`.
Why:
Fixture data lets us build the UI contract before we decide final artifact transport.

5. Update `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/app.css`.
Why:
This is where we enforce the rule that the digest supports the homepage instead of taking it over.

UI rules to preserve:

- compact cards
- existing spacing and rail rhythm
- visible freshness without loud dashboard styling
- no takeover of the hero or focus area

### Phase 2B: Replace the fixture with real digest data

Repo: `Timer Safari Plugin`

Goal:
Render the same digest artifact that the email is based on.

Steps:

1. Add `/Users/jaideepjuneja/Documents/Timer Safari Plugin/api/_lib/digest-source.ts`.
Why:
The homepage backend should fetch one canonical artifact source and validate it in one place.

2. Update `/Users/jaideepjuneja/Documents/Timer Safari Plugin/api/_lib/env.ts`.
Why:
We need a dedicated env reader for the artifact source URL or equivalent transport config.

Suggested env:

- `DIGEST_ARTIFACT_URL`

3. Add `/Users/jaideepjuneja/Documents/Timer Safari Plugin/api/digest/latest.ts`.
Why:
The frontend should call a local app API instead of pulling remote data directly from the browser.

4. Update `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/digest.ts`.
Why:
Once transport exists, the client helper should switch from fixture data to `/api/digest/latest`.

5. Update `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/App.tsx` or `/Users/jaideepjuneja/Documents/Timer Safari Plugin/apps/web/src/components/DigestRailPanel.tsx`.
Why:
The live path needs proper loading, empty, error, stale, and source-failure states.

## Track 2: Verification

### Phase 1 verification

Repo: `daily-digest-framework`

Minimum checks:

1. Run `npm run typecheck`.
2. Run `npm test`.
3. Run `npm run export:digest`.
4. Run `DRY_RUN=true node --env-file=.env --import tsx src/send-digest.ts`.
5. Open the generated artifact manually and confirm:

- ids are stable
- topic counts make sense
- source failures are included when a source breaks
- freshness metadata is present

Regression risks:

- artifact generation accidentally changes email item selection
- source failure handling silently drops too much content
- stale metadata is wrong or missing
- topic naming drifts away from the locked `music` contract

Phase 1 ship gate:

- email still sends unchanged
- artifact schema is stable and tested
- degraded-source behavior is tested
- dry run proves build plus artifact generation work together

### Phase 2 verification

Repo: `Timer Safari Plugin`

Minimum checks:

1. Build the web app with the new digest tab enabled.
2. Verify the digest fixture renders without layout regressions.
3. Confirm the new tab does not alter the existing default homepage flow.
4. Verify the live API route returns the expected contract once real transport is wired.
5. Confirm stale and error states are visible but visually quiet.
6. Confirm the homepage never fetches or parses RSS feeds client-side.

Regression risks:

- the digest tab overwhelms the homepage visual balance
- frontend and backend drift from the artifact contract
- empty or failed fetch states feel broken instead of intentional

Phase 2 ship gate:

- fixture UI feels native to the homepage
- live API returns canonical digest data
- homepage clearly indicates freshness
- email and homepage content can be spot-checked for parity

### Scheduler and reliability checks

Because GitHub previously auto-disabled the workflow for inactivity, keep this short checklist:

1. Confirm the scheduled workflow is `active`.
2. Confirm the workflow stays on the default branch.
3. Add clear logs for artifact generation so dry runs and scheduled runs are easy to inspect.
4. Treat homepage freshness as a user-facing safety valve if a scheduled run fails.

## Track 3: Security And State

### Safe first release posture

For the first homepage release:

- keep the digest read-only
- do not add save, dismiss, or like state yet
- do not store personal digest interaction data in Redis yet
- do not let the homepage fetch raw feeds directly

### Artifact exposure decision

We should decide whether the digest artifact is:

1. public but low-sensitivity
2. app-proxied and still read-only
3. authenticated and private

Recommended first posture:

- keep the homepage consuming the artifact through its own backend route
- keep secrets and transport details server-side
- keep the artifact sanitized if it is ever made public

Do not expose:

- `whyItMatched`
- user preferences
- saved or dismissed state
- email addresses
- internal error details

### Redis separation guidance

If we add persistent state later, keep digest keys separate from calendar keys.

Suggested namespaces:

- `digest:latest`
- `digest:archive:YYYY-MM-DD`
- `digest:runs:last_success`
- `digest:user:<sub>:saved`
- `digest:user:<sub>:dismissed`

Do not reuse `/Users/jaideepjuneja/Documents/Timer Safari Plugin/api/_lib/calendar-store.ts` key patterns for unrelated digest state without a new namespace.

### Early security rules

1. Do not put secrets, API tokens, or internal error traces into the digest artifact.
2. Keep artifact fetch configuration in server env, not client code.
3. Validate the artifact source URL before using it in deployed environments.
4. If saved items are added later, require authenticated APIs and a user-scoped storage model.
5. Add origin or CSRF protection before introducing write routes.
6. Keep calendar auth state and future digest interaction state separate at the data layer.

## Best build order

1. Finish Phase 1 in `daily-digest-framework`.
2. Build Phase 2A in `Timer Safari Plugin` using fixture data.
3. Decide artifact transport.
4. Build Phase 2B with the real API route.
5. Only then plan saved items, review mode, and ranking feedback loops.

## First safe slice

If we want the highest-value next slice with the lowest risk:

1. add the canonical artifact to `daily-digest-framework`
2. add a read-only digest tab in `Timer Safari Plugin` backed by fixture data

That keeps the email active, keeps the UI consistent, and avoids locking us into state or Redis decisions too early.
