# Action Items

**Last updated:** 2026-03-26
**Updated by:** Engineering team

> This file is the persistent action item tracker. It answers: WHAT are all the things we still need to do, where did each one come from, and what's the priority?
>
> Every action item mentioned in any session — from formal planning to casual "we should also fix X" — gets captured here and tracked from first mention to completion.

---

## Format

Each action item uses this structure for AI parseability:

```
### [AI-NNN] Title
- **Status:** open | in-progress | blocked | done
- **Priority:** critical | high | medium | low
- **Category:** feature | bug | debt | ops | research | docs
- **Source:** [Where this came from — session date, inbox file, verbal, plan file, etc.]
- **Created:** YYYY-MM-DD
- **Updated:** YYYY-MM-DD
- **Blocked by:** [If blocked, what's blocking it]
- **Completed:** YYYY-MM-DD [Only when done]
- **Notes:** [Any additional context]
```

---

## Open

<!-- Active action items, ordered by priority (critical → high → medium → low) -->
<!-- Items move here from any source: /inbox, /plan, /update, verbal context, casual mentions -->

### [AI-001] Build bot.ts — Telegram bot core (Wave 2)
- **Status:** done
- **Priority:** high
- **Category:** feature
- **Source:** Master plan (2026-03-26-1500-bot-rebuild-PLAN.md), Task 8
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Completed:** 2026-03-26
- **Notes:** 762 lines. Grammy bot with formatForTelegram, splitMessage, auth middleware, concurrency queue (MAX_CONCURRENT=2), research inbox (URL detection, source classification, Notion prompt), reminder interception (3 patterns), voice toggle, all media handlers (voice/photo/doc/video), 12 commands.

### [AI-002] Build scheduler.ts + schedule-cli.ts — Cron scheduler (Wave 2)
- **Status:** done
- **Priority:** high
- **Category:** feature
- **Source:** Master plan, Task 9
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Completed:** 2026-03-26
- **Notes:** scheduler.ts (117 lines): cron-parser v5 API, 60s task polling, 30s reminder polling, graceful stop. schedule-cli.ts (129 lines): create/list/delete/pause/resume commands.

### [AI-003] Build whatsapp.ts — WhatsApp bridge (Wave 3)
- **Status:** open
- **Priority:** medium
- **Category:** feature
- **Source:** Master plan, Task 10
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Puppeteer-based WhatsApp bridge. Depends on Wave 2 completion. Stability risk flagged in plan.

### [AI-004] Build index.ts — Entry point + lifecycle (Wave 3)
- **Status:** open
- **Priority:** medium
- **Category:** feature
- **Source:** Master plan, Task 11
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Main entry point, process lifecycle, graceful shutdown. Depends on Wave 2.

### [AI-005] Setup wizard (Wave 4)
- **Status:** open
- **Priority:** low
- **Category:** feature
- **Source:** Master plan, Task 12
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Interactive setup for first-run configuration. Wave 4 tooling.

### [AI-006] Status script (Wave 4)
- **Status:** open
- **Priority:** low
- **Category:** feature
- **Source:** Master plan, Task 13
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Health check and status reporting script. Wave 4 tooling.

### [AI-007] Notify module (Wave 4)
- **Status:** open
- **Priority:** low
- **Category:** feature
- **Source:** Master plan, Task 14
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Notification dispatch module. Wave 4 tooling.

### [AI-008] CLAUDE.md bot template (Wave 4)
- **Status:** open
- **Priority:** low
- **Category:** docs
- **Source:** Master plan, Task 15
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Template CLAUDE.md for bot personality and behavior. Wave 4 tooling.

### [AI-009] User onboarding — personal/me.md is empty
- **Status:** open
- **Priority:** high
- **Category:** ops
- **Source:** First session detection (CLAUDE.md)
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** User has not completed onboarding. personal/me.md is empty. Onboard skill should trigger on next interactive session.

### [AI-010] Verify Claude Agent SDK + MCP server compatibility
- **Status:** open
- **Priority:** medium
- **Category:** research
- **Source:** Master plan — Risks section
- **Created:** 2026-03-26
- **Updated:** 2026-03-26
- **Notes:** Flagged risk in build plan. Should be validated before Wave 2 bot.ts integrates agent.ts with MCP tools.

---

## In Progress

<!-- Items actively being worked on this session -->

---

## Blocked

<!-- Items that can't proceed — each must say what's blocking it -->

---

## Done (Recent)

<!-- Completed items from the last 3 sessions. Older items move to the archive section below. -->
<!-- Keep this section trimmed to prevent file bloat. -->

### Wave 0 — Foundation (Tasks 1-3)
- **Status:** done
- **Completed:** 2026-03-26
- **Notes:** package.json, tsconfig, .gitignore, .env.example, env.ts, logger.ts, config.ts, db.ts

### Wave 1 — Engine (Tasks 4-7)
- **Status:** done
- **Completed:** 2026-03-26
- **Notes:** agent.ts (Claude Agent SDK), memory.ts (dual-sector FTS5), voice.ts (STT+TTS), media.ts

---

## Archive

<!-- Completed items older than 3 sessions. Collapsed by default. -->
<!-- Periodically prune items older than 90 days unless they have historical significance. -->

---

## Stale Review Queue

<!-- Items untouched for 30+ days get flagged here automatically during /update. -->
<!-- Each item needs a decision: still relevant → move back to Open, or obsolete → move to Archive. -->

---

## Counter

<!-- Machine-readable. Do not edit manually. -->
`next_id: 11`
