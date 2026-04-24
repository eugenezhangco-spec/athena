---
topic: bot-rebuild
date: 2026-03-26
time: 15:00
phase: Full rebuild
status: in-progress
type: master
total_waves: 5
---

## What We're Building

Full rewrite of the Athena Telegram bot in TypeScript. Merges ClaudeClaw architecture (Claude Agent SDK, SQLite, dual-sector memory, TTS, cron scheduler, WhatsApp bridge, video analysis, setup wizard, background service) with Athena's unique features (research inbox, concurrency queue, Telegram context personality). All code lives in `bot/`.

## Wave Map

| Wave | Name | Tasks | Depends On | Status |
|------|------|-------|------------|--------|
| 0 | Foundation | 1, 2, 3 | — | complete |
| 1 | Engine | 4, 5, 6, 7 | Wave 0 | complete |
| 2 | Bot Core | 8, 9 | Wave 0, Wave 1 | not-started |
| 3 | Extensions | 10, 11 | Wave 2 | not-started |
| 4 | Tooling | 12, 13, 14, 15 | All above | not-started |

## Boundaries (DO NOT CHANGE)

- Do NOT modify Athena's brain (.claude/rules/, .claude/skills/, personal/, root CLAUDE.md)
- Do NOT delete existing bot/bot.js — keep as fallback until verified
- Do NOT hardcode secrets — all keys via .env
- All bot code stays inside bot/
- Research inbox logic preserved 1:1 from existing bot.js

## Risks

- Claude Agent SDK + MCP server compatibility
- WhatsApp bridge stability (Puppeteer-based)
- Memory FTS5 trigger sync
- Existing .env migration
