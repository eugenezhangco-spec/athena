# Athena Bot Rebuild — Project Status

**Last updated:** 2026-03-26
**Updated by:** Max (Build) — Wave 2 complete

---

## What Is This

Full rewrite of the Athena Telegram bot from vanilla JS to TypeScript. Merging ClaudeClaw architecture (Claude Agent SDK, SQLite, dual-sector memory, TTS, cron scheduler, WhatsApp bridge, video analysis, setup wizard, background service) with Athena's unique features (research inbox, concurrency queue, Telegram context personality).

---

## Current Status

**Phase:** Bot rebuild — Wave 3 next

**Master plan:** `context/builds/2026-03-26-1500-bot-rebuild-PLAN.md`

**Completed:**
- Wave 0 (Foundation): package.json, tsconfig, .gitignore, .env.example, env.ts, logger.ts, config.ts, db.ts
- Wave 1 (Engine): agent.ts (Claude Agent SDK), memory.ts (dual-sector FTS5), voice.ts (STT+TTS), media.ts
- Wave 2 (Bot Core): bot.ts (762 lines — grammy, formatting, commands, research inbox, concurrency queue, reminder interception, voice toggle, media handlers), scheduler.ts (117 lines — cron tasks + reminder polling), schedule-cli.ts (129 lines — CLI for task management)

**Next up:** Wave 3 — Extensions
- Task 10: WhatsApp bridge (whatsapp.ts)
- Task 11: Entry point + lifecycle (index.ts) — PID lock, startup, graceful shutdown

**After Wave 3:** Wave 4 (setup wizard, status script, notify, CLAUDE.md template), then tests

---

## What Exists (bot/ directory)

| File | Status | Purpose |
|------|--------|---------|
| `bot/bot.js` | Legacy (kept as fallback) | Original vanilla JS bot — `npm run legacy` |
| `bot/src/env.ts` | Done | Safe .env parser, no process.env pollution |
| `bot/src/logger.ts` | Done | Pino structured logging |
| `bot/src/config.ts` | Done | All config as typed exports + feature flags |
| `bot/src/db.ts` | Done | SQLite WAL, 7 tables, FTS5, full CRUD |
| `bot/src/agent.ts` | Done | Claude Agent SDK wrapper, session resumption |
| `bot/src/memory.ts` | Done | Dual-sector memory, FTS5 search, salience decay |
| `bot/src/voice.ts` | Done | Groq/OpenAI STT + ElevenLabs TTS |
| `bot/src/media.ts` | Done | Telegram media download, context builders, cleanup |
| `bot/src/bot.ts` | Done (762 lines) | Wave 2 — Telegram bot core |
| `bot/src/scheduler.ts` | Done (117 lines) | Wave 2 — Cron scheduler + reminder polling |
| `bot/src/schedule-cli.ts` | Done (129 lines) | Wave 2 — Scheduler CLI |
| `bot/src/whatsapp.ts` | Not started | Wave 3 — WhatsApp bridge |
| `bot/src/index.ts` | Not started | Wave 3 — Entry point + lifecycle |

---

## Key Decisions

- Using grammy (not node-telegram-bot-api) for the new bot
- Claude Agent SDK replaces child_process spawn — real session resumption
- SQLite replaces JSON file persistence for sessions, memories, reminders
- Research inbox logic from bot.js must be preserved 1:1
- Concurrency queue from bot.js must be preserved
- Old bot.js kept as `npm run legacy` fallback until new bot verified

---

## Build Verification

- `npm install`: clean (131 packages)
- `tsc --noEmit`: zero type errors across all Wave 0 + Wave 1 + Wave 2 files (2,099 lines total)

---

## How to Resume

1. Run `/status` — reads this file
2. Say "continue the bot rebuild" or "start Wave 2"
3. The team reads the master plan and picks up at Wave 2, Task 8
