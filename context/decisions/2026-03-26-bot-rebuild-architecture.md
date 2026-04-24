# Bot Rebuild — Architecture Decisions

**Date:** 2026-03-26
**Participants:** Engineering team
**Impact:** Full bot rewrite

---

## Decision 1: Grammy over node-telegram-bot-api

**Choice:** Use grammy as the Telegram bot framework.
**Why:** Grammy has better TypeScript support, middleware architecture, and active maintenance. node-telegram-bot-api was the previous default but grammy is the modern standard.

## Decision 2: Claude Agent SDK replaces child_process spawn

**Choice:** Use the official Claude Agent SDK instead of spawning Claude as a subprocess.
**Why:** Real session resumption, proper tool use, structured responses. The subprocess approach was fragile and couldn't maintain conversation state reliably.

## Decision 3: SQLite replaces JSON file persistence

**Choice:** SQLite with WAL mode and FTS5 for all persistence (sessions, memories, reminders).
**Why:** JSON files don't scale, can't be queried, and risk corruption on concurrent writes. SQLite gives ACID transactions, full-text search, and zero-config deployment.

## Decision 4: Preserve research inbox and concurrency queue 1:1

**Choice:** Port the existing research inbox and concurrency queue logic exactly from bot.js.
**Why:** These are battle-tested features the user relies on. No functional changes — just a TypeScript rewrite with the same behavior.

## Decision 5: Keep bot.js as legacy fallback

**Choice:** Keep the original bot.js accessible via `npm run legacy` until the new bot is verified.
**Why:** Risk mitigation. If the rebuild has issues, the user can fall back to the working bot immediately.
