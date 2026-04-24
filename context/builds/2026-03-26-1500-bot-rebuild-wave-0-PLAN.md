---
topic: bot-rebuild
date: 2026-03-26
time: 15:00
wave: 0
wave_name: Foundation
depends_on: []
master_plan: 2026-03-26-1500-bot-rebuild-PLAN.md
status: in-progress
---

## What This Wave Builds

Project scaffold, core utilities, and SQLite database layer. Every other wave depends on these files existing.

## Tasks

### Task 1: Project scaffold
**Files:** bot/package.json, bot/tsconfig.json, bot/.gitignore, bot/.env.example
**Dependencies:** none
**Acceptance Criteria:**
- Given a fresh clone / When `npm install` runs / Then all deps install without error
- Given tsconfig / When `tsc --noEmit` runs / Then no config errors

### Task 2: Core utilities
**Files:** bot/src/env.ts, bot/src/logger.ts, bot/src/config.ts
**Dependencies:** Task 1
**Acceptance Criteria:**
- Given .env with quoted values / When readEnvFile() runs / Then parsed correctly, process.env untouched
- Given missing .env / When readEnvFile() runs / Then returns {}, no throw

### Task 3: SQLite database layer
**Files:** bot/src/db.ts
**Dependencies:** Task 2
**Acceptance Criteria:**
- Given first run / When initDatabase() runs / Then all tables created, WAL mode enabled
- Given session CRUD / When set, get, clear / Then data persists and clears

## Boundaries (DO NOT CHANGE)

- Do NOT modify anything outside bot/
- Do NOT delete existing bot/bot.js
- Do NOT hardcode secrets

## Files Touched in This Wave

- bot/package.json (rewrite)
- bot/tsconfig.json (create)
- bot/.gitignore (create)
- bot/.env.example (create)
- bot/src/env.ts (create)
- bot/src/logger.ts (create)
- bot/src/config.ts (create)
- bot/src/db.ts (create)
