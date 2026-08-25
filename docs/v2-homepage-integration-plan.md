# Daily Digest V2 Homepage Integration Plan

## Goal

For the concrete file-by-file checklist, see:

- `/Users/jaideepjuneja/Documents/daily-digest-framework/docs/v2-workstreams-checklist.md`

Keep the daily email digest as the primary delivery path while adding the Safari homepage as a second surface over the same digest.

The key design rule for V2 is:

- one digest build
- one canonical digest artifact
- two renderers:
  - email
  - homepage

The homepage should consume digest data. It should not build its own digest.

## Current state

### Producer: `daily-digest-framework`

The digest producer already has a clean shared seam in `buildDigest()`:

- `src/digest/build.ts`
- `src/send-digest.ts`
- `src/render/email.ts`
- `src/render/email-html.ts`

Today it:

- fetches and ranks content
- renders plain text and HTML
- sends email

Today it does **not** persist a canonical digest artifact or interaction state.

### Consumer: `Timer Safari Plugin`

The homepage app already has a tabbed UI and backend API pattern that fits a digest view well:

- `apps/web/src/App.tsx`
- `apps/web/src/calendar.ts`
- `api/calendar/events.ts`

Current state patterns:

- lightweight UI preferences live in `localStorage`
- auth/session lives in signed cookies
- secure backend state for Google Calendar tokens lives in Redis

This is a good base for a read-only digest tab first, then persistent saved-item state later.

## Design principles

1. Email remains active and reliable.
2. Homepage is a companion surface, not a replacement.
3. The digest UI should feel native to the homepage and must not take away from the calm, focused character of the existing experience.
4. Digest content and user interaction state are separate concerns.
5. Shared state should be introduced only after the digest artifact contract is stable.
6. Homepage freshness should be explicit, never implied.

## UI consistency guardrails

The homepage already has a strong visual identity and should stay centered on calm, intentional focus rather than turning into a noisy news app.

Guardrails:

- keep the digest inside its own tab instead of pushing into the hero or milestone panel by default
- reuse the existing rail, card, spacing, and typography patterns from the homepage
- prefer compact section summaries and a few high-signal cards over long scrolling article walls
- make freshness, stale state, and source health visible without becoming visually loud
- treat the digest as supporting context for the day, not the new primary visual anchor
- keep save/review actions lightweight so the page still feels like a homepage, not an inbox

## Architecture split

### Thread A: Canonical digest content

Owned by `daily-digest-framework`.

Responsibilities:

- fetch sources
- normalize, dedupe, rank, and section items
- build a canonical digest artifact
- render email from that artifact

Recommended artifact shape:

```json
{
  "schemaVersion": 1,
  "digestId": "2026-08-24",
  "builtAt": "2026-08-24T11:00:00.000Z",
  "lastAttemptedAt": "2026-08-24T11:00:00.000Z",
  "isStale": false,
  "counts": {
    "rawItems": 91,
    "dedupedItems": 71,
    "digestItems": 15
  },
  "topicCounts": {
    "security": 5,
    "tech": 5,
    "ai": 2,
    "music": 3
  },
  "sourceFailures": [
    {
      "source": "Example Feed",
      "message": "Timed out after retries."
    }
  ],
  "items": [
    {
      "id": "Schneier on Security:https://...",
      "title": "...",
      "url": "https://...",
      "source": "Schneier on Security",
      "topic": "security",
      "summary": "...",
      "publishedAt": "2026-08-24T09:30:00.000Z",
      "score": 1.42
    }
  ]
}
```

Recommended initial outputs:

- `latest-digest.json`
- optional dated archive file such as `archive/2026-08-24.json`

### Thread B: Homepage rendering

Owned by `Timer Safari Plugin`.

Responsibilities:

- fetch latest digest artifact
- display digest in a new `digest` tab
- show freshness and source health
- later allow saved/review interactions

Recommended new pieces:

- `apps/web/src/digest.ts`
- `/api/digest/latest`
- optional `/api/digest/archive`

The homepage should render:

- Today’s Digest
- last updated timestamp
- stale badge if needed
- per-section cards
- source failure summary when applicable

The homepage should not:

- replace the existing hero area
- overwhelm the milestone and focus UI
- introduce a denser visual language than the rest of the page

### Thread C: User interaction state

Add only after A and B are stable.

Examples:

- saved items
- dismissed items
- read later
- later: like/dislike

This state should be keyed by the existing stable digest item ID, not by array position.

## Redis decision

Redis is **not required** for the first homepage integration.

### Start without Redis for digest UI when:

- the homepage is read-only
- the goal is to validate the digest artifact contract
- temporary UI-only preferences are enough

### Introduce Redis when:

- saved items should sync across devices
- interaction state should survive browser resets
- archive/run metadata should be queryable by the homepage

If Redis is used, keep digest state separate from calendar state.

Suggested key namespaces:

- `digest:latest`
- `digest:archive:YYYY-MM-DD`
- `digest:runs:last_success`
- `digest:user:<sub>:saved`
- `digest:user:<sub>:dismissed`

Do not mix digest data into Google Calendar token storage keys.

## Phase plan

### Phase 1: Stabilize producer

Repo: `daily-digest-framework`

Work:

- keep current email send path unchanged
- add canonical digest artifact generation after `buildDigest()`
- include freshness metadata and source failure metadata

Success criteria:

- email continues to send normally
- one structured artifact exists for homepage consumption

### Phase 2: Read-only homepage digest tab

Repo: `Timer Safari Plugin`

Work:

- add `digest` to the rail tab union in `apps/web/src/App.tsx`
- add a digest client helper similar to `calendar.ts`
- add a homepage panel that renders the shared digest artifact
- keep the first UI pass visually aligned with the current card and rail system rather than introducing a new dashboard style

Success criteria:

- homepage shows the same digest that email is based on
- no save/dismiss interactions yet
- stale state is visible to the user
- the digest feels additive to the homepage rather than visually taking it over

### Phase 3: Persist digest artifacts and run metadata

Primary repo: `daily-digest-framework`
Optional backend surface in `Timer Safari Plugin` if that becomes the fetch host

Work:

- persist latest digest artifact
- optionally persist archive snapshots
- persist last successful and last attempted run metadata

Success criteria:

- homepage can still show the last successful digest even after a failed run

### Phase 4: Saved items

Repo: `Timer Safari Plugin` plus shared state backend

Work:

- add `save` / `unsave`
- optionally add `dismiss`
- require authenticated APIs if this is personal/private state

Success criteria:

- saved items persist beyond the browser session
- saved items do not alter the canonical digest content

### Phase 5: Saved-items review mode

Repo: `Timer Safari Plugin`

Work:

- add a separate review view for saved items
- optionally later add a separate review email mode

Success criteria:

- review mode is clearly separate from the daily digest

### Phase 6: Feedback-driven ranking

Repo: `daily-digest-framework`

Work:

- collect opens, likes, dislikes, saves
- use those signals to tune ranking

Success criteria:

- ranking changes are driven by real usage, not assumptions

## Reliability notes

The GitHub Actions scheduler was previously auto-disabled because the public repo went inactive long enough for GitHub to disable scheduled workflows.

Recommendations:

- occasionally push to `main`
- consider a keepalive strategy if GitHub Actions remains the scheduler
- always surface digest freshness in the homepage UI

The homepage should never silently imply freshness when the data is stale.

## Recommended next step

Build Phase 1 and Phase 2 only:

1. emit a canonical digest artifact from `daily-digest-framework`
2. add a read-only `digest` tab to the Safari homepage

That gives the most value with the least architecture risk, while keeping email active the whole time.
