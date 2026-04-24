# context/sessions/

Brainstorm session handoff files. Written by `/wrap`, loaded by `/pull`.

## How It Works

1. Finish a brainstorm session → run `/wrap [topic]`
2. A structured handoff file lands here with `status: ready`
3. In the build session → run `/pull` to load it
4. The team reads it, briefs you, and routes to `/plan`
5. File status updates to `imported` with a timestamp

Also generated automatically by `/inbox` when documents contain build implications.

## File Naming

`YYYY-MM-DD-HHMM-[topic-slug].md`

Examples:
```
2026-03-23-1430-paul-workflow.md
2026-03-24-0915-inbox-new-requirements.md
2026-04-01-1600-verbal-stakeholder-feedback.md
```

## File Status

| Status | Meaning |
|--------|---------|
| `ready` | Available to load with /pull |
| `imported` | Already loaded into a build session |

## Example Handoff File

```markdown
---
topic: user-notifications-scope
date: 2026-03-24
time: 10:30
status: ready
imported_at: null
---

## What This Session Was About
Scoped the user notification system — what triggers notifications, delivery channels,
and the data model needed to support it in Phase 1.

## What Was Decided
- Use email as the primary delivery channel for Phase 1 (push notifications later)
- Notifications are triggered by: new match, status change, weekly digest
- Store notifications in a `notifications` table with `read_at` timestamp
- Use existing user preferences table for opt-in/opt-out settings

## Build Brief
1. Create the notifications table with migration
2. Build the notification trigger service (fires on entity status changes)
3. Add the email delivery integration using the configured email provider
4. Write integration test: confirm notifications are created and marked read correctly

## Constraints and Boundaries
- DO NOT build push notifications in Phase 1 — email only
- DO NOT modify the users table schema — use existing fields
- DO NOT send notifications to users who have opted out

## Open Questions
- None — all decisions made.

## Context Referenced
- context/requirements/product-spec-v1.md
- context/decisions/notification-strategy.md
```

## Rules

- Never edit these files manually after they're written — they're a decision record
- If decisions changed, run /wrap again with a new topic name
- Files are kept permanently as a log
