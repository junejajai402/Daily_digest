# Daily Digest Framework

This project is a learning-friendly starter for a personal daily briefing system.
It is intentionally small so you can understand how data moves through the app:

1. source adapters fetch raw items
2. pipeline code normalizes and ranks them
3. render code formats the digest
4. delivery will be added later

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
- `src/index.ts`: entrypoint that wires the system together

## Run locally

1. `npm install`
2. `npm run dev`

## Email testing

1. Copy `.env.example` into your local environment setup.
2. Replace `re_xxxxxxxxx` with your real Resend API key and add the email addresses you want to use.
3. For test sends, keep `DIGEST_FROM_EMAIL` on `onboarding@resend.dev`. Do not use `gmail.com` as the sender unless you later verify your own domain in Resend.
4. Run `npm run send:digest` to send the current digest to yourself. The script now loads `.env` automatically.
5. Run `npm run send:digest:dry-run` if you want to build the digest without actually sending the email.

Optional safety flags:

- `DRY_RUN=true`: builds the digest and logs success, but skips the Resend API call.
- `MIN_DIGEST_ITEMS=8`: aborts sending if the digest is too thin to be useful.

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

## GitHub Actions template

If you want the digest to run even while your laptop is asleep, the easiest free-ish learning path is GitHub Actions.

- Start from [daily-digest-template.yml](/Users/jaideepjuneja/Documents/daily-digest-framework/.github/workflows/daily-digest-template.yml).
- The template is manual-first with `workflow_dispatch` so you can test safely.
- GitHub cron runs in `UTC`, so convert your morning send time before you uncomment the schedule.
- Add these repository secrets before the first real run:
  - `RESEND_API_KEY`
  - `DIGEST_TO_EMAIL`
  - `DIGEST_FROM_EMAIL`
- The template also includes:
  - `DRY_RUN="true"` so your first cloud test does not send a real email
  - `MIN_DIGEST_ITEMS=8` so low-quality runs abort instead of sending a weak digest
- When you are ready to activate it, rename the file from `daily-digest-template.yml` to `daily-digest.yml`.

The learning sequence I recommend is:

1. Push the repo to GitHub.
2. Add the three Actions secrets.
3. Rename the template file so GitHub picks it up.
4. Run it manually once from the Actions tab.
5. Confirm the dry run looks right in the logs.
6. Change `DRY_RUN` to `"false"`.
7. Uncomment the cron schedule only after the manual run succeeds.

## Issue listener automation

This repo also includes a scaffold for issue-driven automation.

- `.github/workflows/issue-listener.yml` listens for new issues, issue edits, labels, and issue comments.
- It only acts when the issue has the `automation:ready` label or a maintainer comments `/prepare-pr`.
- The first version prepares a draft PR branch with an empty kickoff commit after `npm test` and `npm run typecheck` pass.
- `.github/workflows/pr-hygiene.yml` enforces basic branch naming, PR body hygiene, tests, and typecheck on PR updates.
- `scripts/automation/issue-listener.ts` generates branch/PR metadata from the GitHub issue payload.
- `scripts/automation/pr-hygiene.ts` validates that the PR body and branch name follow the repo conventions.

Required configuration notes:

- Built-in `GITHUB_TOKEN` is enough for the scaffolded version.
- If you later want model-backed code generation, add `OPENAI_API_KEY` as an Actions secret and extend `scripts/automation/issue-listener.ts`.
- Keep the automation opening draft PRs only until you are confident in the workflow.

## Suggested learning path

- Tune `src/config/preferences.json` and rerun the app to see how source and topic weights affect the digest.
- Improve `src/pipeline/dedupe.ts` so it catches more real duplicates by URL and title.
- Clean up source-specific summaries, especially Guardian and SANS, so the digest reads more naturally.
- Add one more real source using `src/sources/tech-template.ts` or `src/sources/music-template.ts`.
- Add email delivery after the content quality and ranking feel solid.
- Move preferences into a database only after the JSON-based tuning flow feels right.

## Future Project Ideas

- Add a MITRE ATT&CK learning section that teaches one tactic or technique at a time.
- Tie that MITRE learning block to current security stories when there is a clear connection.
- Keep it separate from the core digest so the morning briefing stays concise.
- Add a lightweight SQLite layer for preferences, sent-item tracking, and feedback once the file-based setup stops being enough.
- Track already-sent articles by normalized URL first, then fall back to a title/source/day fingerprint if needed.

## Database Roadmap

See [docs/db-roadmap.md](/Users/jaideepjuneja/Documents/daily-digest-framework/docs/db-roadmap.md) for the planned storage phases, including the first `sent_items` table and the path toward saved preferences and feedback.

## Good first file to edit yourself

If you want the easiest hands-on task right now, edit
`src/config/preferences.json` and change the source or topic weights.
That will let you feel the ranking system change without touching the app logic.
