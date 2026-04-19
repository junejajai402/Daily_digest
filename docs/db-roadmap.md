## Database Roadmap

This project is still small enough to stay file-based, but the next durable step is a lightweight database for preferences, source history, and sent-item tracking.

### Why add a database

- keep ranking inputs editable without code changes
- remember which items have already been sent
- support future feedback like likes, dislikes, and saves
- make scheduled runs safer by avoiding duplicates

### Phase 1: sent-item tracking

Start with the smallest useful table.

`sent_items`
- `id`
- `item_id`
- `source`
- `title`
- `url`
- `published_at`
- `digest_sent_at`
- `digest_run_id`

Recommended dedupe key:
- normalized `url`
- fallback `title + source + published_day`
- optional content hash later

This lets the app answer:
- have we already emailed this article?
- did we send something similar yesterday?
- which run sent it?

### Phase 2: source and preference storage

Add tables for tunable settings.

`sources`
- `id`
- `name`
- `feed_url`
- `topic`
- `base_weight`
- `active`

`topic_preferences`
- `topic`
- `weight`

`source_preferences`
- `source_id`
- `weight_override`

`keyword_preferences`
- `keyword`
- `weight`

### Phase 3: user feedback

Add explicit feedback once the digest is stable.

`item_feedback`
- `item_id`
- `vote` (`like`, `dislike`, `save`)
- `created_at`

Use feedback to tune:
- source weight
- topic weight
- keyword boosts and mutes
- future section ordering

### Suggested implementation order

1. add a small SQLite database
2. create `sent_items`
3. write a lookup before email send
4. write a record after a successful send
5. move preferences into tables when tuning becomes annoying in JSON
6. add feedback tables after the digest feels reliable

### Good rule

Only send items that are not already in `sent_items` unless you intentionally allow a repeat.
