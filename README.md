# Daily Digest Framework

This project is a learning-friendly starter for a personal daily briefing system.
It is intentionally small so you can understand how data moves through the app:

1. source adapters fetch raw items
2. pipeline code normalizes and ranks them
3. render code formats the digest
4. delivery sends email and exports a reusable digest artifact

## Project layout

- `src/types.ts`: shared domain types used across the project
- `src/config/preferences.ts`: thin loader for scoring preferences
- `src/config/preferences.json`: tunable ranking and personalization data
- `src/sources/base.ts`: adapter contract for any source you add
- `src/sources/index.ts`: the registry that decides which adapters run
- `src/sources/schneier-security.ts`: real Schneier Atom feed adapter
- `src/sources/bbc-tech.ts`: real BBC Technology RSS adapter
- `src/sources/bbc-world.ts`: real BBC World RSS adapter
- `src/sources/guardian-tech.ts`: real Guardian technology RSS adapter
- `src/sources/guardian-world.ts`: real Guardian world RSS adapter
- `src/sources/hacker-news.ts`: Hacker News RSS adapter
- `src/sources/sans-isc.ts`: SANS ISC RSS adapter
- `src/sources/openai-news.ts`: OpenAI official newsroom feed
- `src/sources/google-ai.ts`: Google AI official feed
- `src/sources/pitchfork-best-new-albums.ts`: Pitchfork music discovery feed
- `src/sources/pitchfork-album-reviews.ts`: Pitchfork album review feed
- `src/sources/npr-music-news.ts`: NPR music news feed
- `src/sources/nme-music-news.ts`: NME music news feed
- `src/sources/tech-template.ts`: fill-in template for your next real tech feed
- `src/sources/music-template.ts`: fill-in template for your next real music feed
- `src/sources/feed-utils.ts`: shared helpers for RSS/Atom parsing and cleanup
- `src/pipeline/normalize.ts`: turns raw source items into common digest items
- `src/pipeline/dedupe.ts`: removes duplicate or near-duplicate items before ranking
- `src/pipeline/rank.ts`: scoring and diversity selection logic
- `src/render/email.ts`: renders the digest into sectioned plain text
- `src/render/email-html.ts`: renders the digest into HTML for email delivery
- `src/artifact/create.ts`: shapes the canonical digest artifact
- `src/artifact/write.ts`: writes the latest and archived digest artifact files
- `src/artifact/paths.ts`: centralizes artifact output paths
- `src/export-digest.ts`: artifact-only export entrypoint
- `src/delivery/email.ts`: Resend-backed email delivery helper
- `src/index.ts`: entrypoint that wires the system together

## Run locally

1. `npm install`
2. `npm run dev`

Useful commands:

- `npm run export:digest`: build the digest and write the canonical artifact without sending email
- `npm run send:digest:dry-run`: build the digest, write the artifact, and skip the actual email send
- `npm run send:digest`: build, write, and send the digest

## Email testing

1. Copy `.env.example` into your local environment setup.
2. Replace `re_xxxxxxxxx` with your real Resend API key and add the email addresses you want to use.
3. For test sends, keep `DIGEST_FROM_EMAIL` on `onboarding@resend.dev`. Do not use `gmail.com` as the sender unless you later verify your own domain in Resend.
4. Run `npm run send:digest` to send the current digest to yourself. The script now loads `.env` automatically.
5. Run `npm run send:digest:dry-run` if you want to build the digest without actually sending the email.

Artifact output:

- the homepage-ready latest export is written to `digests/latest-digest.json` and committed by the cloud workflow
- local archive snapshots are written to `digests/archive/<digestId>.json` and remain ignored by Git
- you can override the output directory later with `DIGEST_OUTPUT_DIR`

Optional safety flags:

- `DRY_RUN=true`: builds the digest and logs success, but skips the Resend API call.
- `MIN_DIGEST_ITEMS=8`: aborts sending if the digest is too thin to be useful.

Duplicate-send protection:

- the workflow now uses GitHub Actions `concurrency` so overlapping manual and scheduled runs do not execute at the same time
- the email send now includes a deterministic Resend idempotency key based on the digest day and recipient
- as committed on Thursday, August 27, 2026, the workflow file still has `DRY_RUN: "false"`, so manual dispatches from GitHub will attempt a real send if the secrets are present

## Current digest mix

The digest currently aims for this section balance on each run:

- `5` security items
- `5` tech items
- `2` AI items
- `3` music items

If one section does not have enough viable stories, the pipeline backfills with the next best ranked items from the remaining pool.

## Scheduling later

When the manual send flow feels stable, the next step is to schedule it.

- Local cron example: run `npm run send:digest` every morning on your own machine.
- Server or NAS later: run the same command from `cron`, `systemd`, or a container scheduler.
- Add a safety check so the scheduled job does not send an empty digest if feeds fail.
- Keep feed requests bounded with timeouts so one slow source does not block the whole morning job.

## GitHub Actions

If you want the digest to run even while your laptop is asleep, the easiest free-ish learning path is GitHub Actions.

- The workflow lives at [`./.github/workflows/daily-digest.yml`](./.github/workflows/daily-digest.yml).
- It supports both manual runs with `workflow_dispatch` and scheduled runs.
- GitHub Actions now supports timezone-aware schedules, so the workflow runs at `7:17 AM` in `America/New_York` every day. The off-the-hour minute avoids a busy scheduler boundary and stays correct through daylight saving time.
- Add these repository secrets before the first real run:
  - `RESEND_API_KEY`
  - `DIGEST_TO_EMAIL`
  - `DIGEST_FROM_EMAIL`
- Add this extra repository secret if you want the homepage repo to refresh automatically after a successful send:
  - `HOMEPAGE_REPO_DISPATCH_TOKEN`
- The workflow also includes:
  - `MIN_DIGEST_ITEMS=8` so low-quality runs abort instead of sending a weak digest
  - `npm test` and `npm run typecheck` before the send step
  - Node.js `24`, which is LTS as of August 26, 2026
  - workflow-level `concurrency` so overlapping runs queue instead of sending in parallel
- Change `DRY_RUN` in the workflow env block if you want cloud runs to skip real email temporarily.

### Homepage Sync Automation

The digest workflow can now trigger the homepage repo after a successful non-dry-run send.

- the digest workflow sends a `repository_dispatch` event to the homepage repo
- after a successful email send, the digest workflow commits the newly generated `digests/latest-digest.json`; the homepage repo then clones that fresh artifact, rebuilds the static site, and pushes the updated digest files
- the dispatch only runs from the digest repo's default branch, so a feature-branch experiment does not accidentally update the live homepage
- if `HOMEPAGE_REPO_DISPATCH_TOKEN` is missing, the digest still emails normally and simply skips the homepage sync step
- if you want to override the target repo later, add an Actions variable named `HOMEPAGE_REPO_FULL_NAME`

Recommended token setup:

- create a fine-grained personal access token for `junejajai402/time-snapshot`
- give it `Contents: Read and write`
- store it in the digest repo as `HOMEPAGE_REPO_DISPATCH_TOKEN`

The learning sequence I recommend is:

1. Push the repo to GitHub.
2. Add the three Actions secrets.
3. Run it manually once from the Actions tab.
4. Confirm the dry run or real send looks right in the logs.
5. Keep an eye on the artifact paths and source-failure summary in the output.
6. Adjust `DRY_RUN` only when you want to change cloud behavior.
7. Keep the cron schedule enabled once the manual run is stable.

## Suggested learning path

- Tune `src/config/preferences.json` and rerun the app to see how source and topic weights affect the digest.
- Improve `src/pipeline/dedupe.ts` so it catches more real duplicates by URL and title.
- Clean up source-specific summaries, especially Guardian and SANS, so the digest reads more naturally.
- Add one more real source using `src/sources/tech-template.ts` or `src/sources/music-template.ts`.
- Use the canonical artifact as the contract for the homepage before adding another rendering surface.
- Move preferences into a database only after the JSON-based tuning flow feels right.

## Future Project Ideas

- Add a MITRE ATT&CK learning section that teaches one tactic or technique at a time.
- Tie that MITRE learning block to current security stories when there is a clear connection.
- Keep it separate from the core digest so the morning briefing stays concise.
- Add a lightweight SQLite layer for preferences, sent-item tracking, and feedback once the file-based setup stops being enough.
- Track already-sent articles by normalized URL first, then fall back to a title/source/day fingerprint if needed.

## Database Roadmap

See [`./docs/db-roadmap.md`](./docs/db-roadmap.md) for the planned storage phases, including the first `sent_items` table and the path toward saved preferences and feedback.

## Good first file to edit yourself

If you want the easiest hands-on task right now, edit
`src/config/preferences.json` and change the source or topic weights.
That will let you feel the ranking system change without touching the app logic.
