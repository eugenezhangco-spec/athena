# System Manifest

This is your personal AI assistant. It operates as an executive assistant, life coach, and business mentor rolled into one. It lives in this folder, learns about you over time, and gets more useful the more you use it.

The assistant reads your files, remembers your context, and helps you think, plan, decide, and execute. It does not guess. It asks when it does not know.

---

## Tech Stack

| Component | What | Details |
|-----------|------|---------|
| Brain | Claude (via Agent SDK) | Session resumption, not per-message spawning |
| Interface | Claude Code CLI | Primary desktop interface |
| Telegram Bot | Node.js + grammy | Local process, runs on your machine or any server |
| Database | SQLite (better-sqlite3) | WAL mode, FTS5 full-text search, 7 tables |
| Voice STT | Groq Whisper / OpenAI | Free Groq tier, sub-second transcription |
| Voice TTS | ElevenLabs | Optional audio replies |
| Video | Google Gemini | Optional video analysis |
| Scheduler | cron-parser + polling | 60s task check, 30s reminder check |
| Background | launchd (Mac) / systemd (Linux) | Auto-start on boot, auto-restart on crash |

## Channels

| Channel | Status | Notes |
|---------|--------|-------|
| VS Code | Live | Primary interface. Full capability. |
| Telegram | Setup required | Run `cd bot && npm run setup`. Text, voice, photos, documents, video. |
| WhatsApp | Optional | Bridge via Telegram. Enable WHATSAPP_ENABLED=true. |

## MCP Integrations

| Integration | Status | Purpose |
|-------------|--------|---------|
| Google Calendar | Not connected | Read/write calendar events |
| Notion | Not connected | Read/write Notion pages and databases |

## Skills

| Skill | Purpose |
|-------|---------|
| /onboard | First-time setup. Learns who you are, connects all tools. |
| /day-planner | Morning planning. Reviews calendar, sets priorities, writes the day plan. |
| /debrief | End-of-day review. What happened, what moved, what to carry forward. |
| /inbox | Process brain dumps and passing thoughts into the right place. |
| /week-review | Weekly reflection. Patterns, wins, misses, adjustments. |
| /self-upgrade | Upgrade Athena's own capabilities with full engineering safety. |
| /migrate | Migrate from any prior AI setup (Claude Code, ChatGPT, Gemini, documents). |

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Onboarding | Ready | Guided setup conversation with tool integration |
| Day planning | Ready | Morning priorities and schedule review |
| Debrief | Ready | End-of-day reflection |
| Decision logging | Ready | Structured decision capture |
| Inbox processing | Ready | Brain dump triage |
| Telegram bot | Setup required | Text, voice, photos, documents, video from your phone |
| Voice (STT) | Setup required | Send voice memos, get instant transcription (Groq/OpenAI) |
| Voice (TTS) | Optional | Bot replies with audio (ElevenLabs) |
| Video analysis | Optional | Send video clips, get analysis (Google Gemini) |
| Memory system | Ready | Dual-sector (semantic/episodic), FTS5 search, salience decay |
| Reminders | Ready | Natural language: "remind me to X in Y" |
| Scheduled tasks | Ready | Cron-based recurring prompts via /schedule |
| WhatsApp bridge | Optional | Read/reply to WhatsApp via Telegram |
| Concurrency limiter | Ready | FIFO queue, max 2 simultaneous Claude calls |
| Google Calendar | Setup required | Calendar read/write via MCP |
| Notion sync | Setup required | Notes and database access via MCP |
| Pattern detection | Passive | Builds over time from usage |
| Engineering pipeline | Ready | Autonomous build with 14-agent team |
| Self-upgrade | Ready | Safe self-modification with full engineering rigor |
| Engineering guardian | Always-on | Invisible security, testing, and quality enforcement |

## System Health

| Check | Status |
|-------|--------|
| Claude Code CLI | Not configured |
| Telegram bot | Not configured |
| Bot background service | Not configured |
| Google Calendar MCP | Not configured |
| Notion MCP | Not configured |
| Git repo | Not configured |

---

## How to Update This File

This file is updated automatically by the assistant after setup steps complete. You can also edit it manually. The assistant reads it at the start of every session to understand what is connected and what is not.
