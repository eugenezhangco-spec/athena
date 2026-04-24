# Athena — Technical Overview

You don't need another app. You need a chief of staff who never forgets, never sleeps, and gets smarter every week. One that knows your priorities, your patterns, your blind spots, and isn't afraid to call you on them.

Athena is open source and runs natively inside Claude Code. There are no separate API keys for the AI itself — it uses the models that come with your Claude Pro or Max subscription. The only API keys you add are for external services you choose to connect (Notion, Gmail, Calendar, voice), and those are your own accounts.

This document is the deep tour. For the short pitch, see `README.md`.

---

## How It All Connects

### The User Experience

```
 YOU
  |
  |-- "Plan my day" (Claude Code or Terminal)
  |       |
  |       v
  |   Athena reads your calendar, tasks, goals, and patterns
  |   Runs a 13-step evening planning procedure
  |   You approve, adjust, or push back
  |       |
  |       v
  |   Plan committed to day-ledger.md
  |
  |
  |-- "Remind me at 3pm to call Sarah" (Telegram, from your phone)
  |       |
  |       v
  |   Bot receives message -> routed to the right Claude model
  |   Writes a reminder row to SQLite
  |   At 3pm: scheduler polls, bot delivers "Reminder: call Sarah"
  |
  |
  |-- "Screenshot [url] and send to Telegram" (from your phone)
  |       |
  |       v
  |   Playwright MCP navigates and screenshots
  |   Filesystem MCP saves the image under the allowlist
  |   Claude emits <send_photo path="..."/> in the reply
  |   Bot extracts the tag, sends the real image file to your chat
  |
  |
  |-- "Debrief" (end of day, Claude Code or Telegram)
          |
          v
      Fixed 5-step sequence:
      1. Today's todos   2. Today's emails (8am-6pm, grouped, draft replies)
      3. Tomorrow's calendar   4. Reflection + coaching   5. Commit
      -> Writes ledger, snapshot, patterns, diary, MemPalace
```

### The Backend

```
YOUR MACHINE
|
|  Claude Code (CLI or VS Code extension)
|    Full desktop capability. Reads CLAUDE.md + 26 rules + 53 skills.
|    Writes files, calls MCP tools, runs bash.
|
|  Telegram Bot (bot/ — optional)
|    TypeScript + Claude Agent SDK with session resumption.
|    SQLite holds sessions, memories, reminders, scheduled tasks.
|    Scheduler polls every 60s for tasks, 30s for reminders.
|    Media tags (<send_photo>, <send_document>) convert Claude output
|      into real Telegram attachments.
|
|  MCP Servers (shared by both interfaces)
|    mempalace, google-calendar, gmail, notion, playwright, filesystem
|
|  [Optional: private GitHub repo for backup]
|
v
YOUR PHONE (Telegram)
|
|  Text, voice (Groq Whisper, sub-second), photos, documents, video
|  Reminders arrive on time. Morning briefings arrive automatically.
```

### The Architecture

```
                YOUR MACHINE
                     |
         Claude Code     Telegram Bot
         (claude CLI)    (Agent SDK)
              |               |
              |               |-- SQLite (sessions, memories, reminders, tasks)
              |               |-- Scheduler (cron tasks, reminder polling)
              |               |-- Voice pipeline (Groq STT, ElevenLabs TTS)
              |               |-- Media handler (<send_photo>, <send_document>)
              |               |-- WhatsApp bridge (optional)
              |
              |  (both interfaces talk to the same MCP servers)
              |               |
              v               v
            mempalace   google-calendar   gmail   notion
                        playwright     filesystem (allowlist)
```

Everything runs on one machine. Both interfaces share the same project folder and the same MCP servers. The bot uses the Claude Agent SDK with `resume: sessionId`, so each message continues the existing conversation instead of spawning a new process.

### Daily Loop

```
07:00  [AUTOMATIC] Morning briefing fires on Telegram
       1. Calendar today
       2. Email triage since 6pm yesterday (urgent / important / noise
          with 2-sentence draft replies for urgent)
       3. Yesterday's unfinished todos carried forward
              |
              v
07:15  [YOU] Open Claude Code. "Plan my day" if you want the full
       evening-style procedure (13 steps, theme, signal/noise check,
       4-4-4 gap check, quarterly goal pulse, morning scan + analysis).
              |
              v
       [THROUGHOUT THE DAY] Athena on Telegram for quick tasks.
       Voice memos transcribed, brain dumps routed to Notion,
       bookmarks captured, reminders fire from SQLite.
              |
              v
21:00  [YOU] "Debrief"
       5-step close: today's todos, today's emails, tomorrow's calendar,
       reflection + coaching, commit.
              |
              v
       [AUTOMATIC] Stop hook saves session metadata.
       Patterns updated. MemPalace mined. Tomorrow seeded.
```

### How Athena Evolves

```
WEEK 1:  Onboarding fills personal/me.md, voice-dna.md, goals.md.
         Day planner and debrief active.
WEEK 2:  Ten plans + debriefs in the ledger. Patterns start surfacing.
WEEK 3:  First custom skill proposed on a recurring workflow.
MONTH 2: 3-5 custom skills, 10+ tracked patterns, sharper coaching.
MONTH 6: Hundreds of decisions logged, dozens of patterns, compiled
         domain summaries (career, health, relationships, goals,
         finances, identity) rebuilt on every weekly review.
```

---

## What This Is

Athena is a personal AI operating system. Not a chatbot. Not a SaaS wrapper. A fully local assistant that runs on your machine, learns who you are, and compounds its usefulness every single day.

Day one: it interviews you. Day three: it's planning your mornings. Week two: it's catching patterns you didn't know you had. Month two: it's built custom skills for your specific workflow.

It connects to your calendar, your email, your Notion, your browser, and files on your own disk. It transcribes voice, processes photos and documents, drafts text that sounds like you wrote it, and challenges you before you waste time on the wrong thing. Every byte stays on your machine.

---

## What It Does

**Daily Operations**
- Morning briefing: 3-part auto-delivered package (calendar, email triage with draft replies, carry-forward todos)
- 13-step evening planning procedure (theme, signal/noise, 4-4-4 gap check, quarterly goal pulse, morning scan + analysis)
- 5-step end-of-day debrief with coaching and ledger commit
- Reminders in natural language ("remind me in 2 hours"), delivered by the bot scheduler
- Calendar conflict detection, deep-work protection, meeting-free day enforcement

**Memory and Continuity**
- Four memory layers, each with a job (see Memory Architecture below)
- MemPalace: long-term knowledge graph with temporal awareness and source tagging
- SQLite on the bot side: sessions, conversational memory, reminders, tasks
- Claude Agent SDK session resumption: no history replay needed
- Session hooks auto-save context in Claude Code at every stop
- Compiled domain summaries rebuild from raw memories during weekly review

**Coaching and Accountability**
- Signal-vs-noise filter on every new task
- Pattern detection (drift, avoidance, overcommitting, perfectionism, planning-as-procrastination)
- Pattern lifecycle: watching -> active -> resolved, never deleted
- Uses the user's own stated goals against them when they drift
- Business-mentor lens: names the model, asks about the money, challenges the GTM

**Writing**
- Voice DNA learned during onboarding and refined over time
- 25-pattern AI detection (Wikipedia "Signs of AI Writing" + blader/humanizer)
- Two-pass rewrite: kill patterns first, audit "obviously AI" second
- Dedicated skills for LinkedIn, Instagram, blog, bookmarks, brain dumps, research, video ideas

**Engineering**
- 14 specialist agents (Maya, Jake, Sara, Fatima, Dave, Max, Nina, Elena, Tom, Aisha, Liam, Yuki, Andre, Rachel) with declared models
- Engineering Guardian rule always active on code: TDD, security review, protective defaults
- Build workflow: `/status -> /inbox -> /pull -> /plan -> BUILD -> /qa -> /update`
- Research-first protocol (GitHub search -> library docs -> web)
- Complete-output enforcement: no `// TODO`, no truncated snippets

**Self-Evolution**
- Writes its own skills when it detects 3+ recurring manual tasks
- Post-session 8-point self-check after every meaningful session
- Weekly memory audit: contradictions, stale facts, duplicates, gaps
- Safety rails: read before write, one change at a time, security review on self-modification

---

## The System

### AI Engine

**Claude** through the Claude Agent SDK. The Telegram bot sets `resume: sessionId` on every message, so Claude continues the existing conversation without re-injecting history. Telegram context (the persona prefix) goes into the `appendSystemPrompt` slot — it stays stable across messages, which keeps it inside the prompt cache. Only the memory snippets and the raw user message go into the user turn.

Claude Code uses the CLI directly with full file access, MCP integrations, and bash execution.

### Model Routing (Telegram)

Every inbound message is classified by complexity before it reaches Claude. The router is heuristic-based — word count, sentence count, coaching language, media presence, narrative markers. No LLM call. Fast.

| Tier | Model | Thinking | Triggers |
|---|---|---|---|
| Light | Haiku 4.5 | 1K | Greetings, acks, one-word replies, social filler |
| Standard | Sonnet 4.6 | 8K | Default. Tool use, questions, moderate reasoning |
| Heavy | Sonnet 4.6 | 16K | Coaching language, multi-sentence narrative, strategy, planning, deep writing, media + long text |

Light only triggers when the message is clearly trivial. Anything uncertain falls through to standard. Better to overspend slightly on a simple message than underspend on a complex one.

In Claude Code, the 14 engineering agents declare their own models — Opus for strategy/architecture, Sonnet for coding, Haiku for docs.

### The Brain

A structured markdown knowledge base, version-controlled with Git. Every file is written as an AI directive, not human documentation. You don't open these files. Athena reads them.

| Layer | Files | Purpose |
|---|---|---|
| Core Identity | `personal/me.md` | Name, role, timezone, schedule, communication preferences |
| Personality | `personality.md`, `coaching.md`, `communication-style.md`, `writing-quality.md` | Voice, tone, challenge protocol, AI-pattern filter |
| Operating Rules | `operating-rules.md`, `proactive-rules.md` | Timezone, calendar routing, delegation tiers, guardrails |
| System Rules | `security.md`, `coding-standards.md`, `architecture.md`, `evolution.md`, `engineering-guardian.md`, `memory-protocol.md` | Security, code quality, self-improvement, memory routing |
| Engineering Rules (path-scoped) | `agents.md`, `development-workflow.md`, `git-workflow.md`, `testing.md`, `performance.md`, `patterns.md`, `hooks.md`, `teaching-mode.md`, `design-skills.md`, plus TypeScript variants | Load only when code is being touched |
| Session State | `personal/snapshot.md` (auto-loaded via hook) | Current priorities, flags, momentum |
| Deep Context | `goals.md`, `patterns.md`, `day-ledger.md`, `voice-dna.md`, `compiled/*.md` | Loaded on demand when planning, coaching, writing, reviewing |

Research backs the lean-by-default approach. Mem0's benchmarks showed 90% token savings with +26% accuracy over brute-force context. Athena follows the same principle: load the smallest useful context, reach for more only when the task demands it.

### Rules Engine (26 Rule Files)

Rule files load automatically. Personality rules are always on. Engineering rules are path-scoped (they activate when code files are in scope). Every rule follows a strict format: imperative voice, tables over prose, negative boundaries where they matter.

The 26 files cover:

- **Personality + Communication:** `personality.md`, `coaching.md`, `communication-style.md`, `writing-quality.md`
- **Operations + Proactivity:** `operating-rules.md`, `proactive-rules.md`
- **Architecture + Evolution:** `architecture.md`, `evolution.md`, `memory-protocol.md`
- **Security:** `security.md`
- **Engineering Guardian (always-on when code is touched):** `engineering-guardian.md`
- **Engineering path-scoped:** `agents.md`, `coding-standards.md`, `development-workflow.md`, `git-workflow.md`, `hooks.md`, `patterns.md`, `performance.md`, `testing.md`, `teaching-mode.md`, `design-skills.md`
- **TypeScript variants:** `typescript-coding-style.md`, `typescript-hooks.md`, `typescript-patterns.md`, `typescript-security.md`, `typescript-testing.md`

`engineering-guardian.md` is the invisible CS major. The user may not know to ask for input validation, rate limiting, test coverage, or secret management. Athena does it anyway, every time. Detects hardcoded secrets, SQL injection risk, XSS, missing validation, exposed errors. Fixes silently, explains after in plain English.

### Skills Engine (51 Skills)

Skills are on-demand capabilities. Each has a `SKILL.md` with YAML frontmatter and a "pushy" description — Anthropic's guidance is that Claude under-triggers skills, so descriptions must name every trigger phrase.

**Daily operating skills**
- `onboard` — 4-phase interview. Fills personal files, connects Calendar, Notion, Telegram bot, voice, scheduler, GitHub. Pause/resume capable.
- `day-planner` — two modes: **Evening** (13-step planning for tomorrow) and **Morning** (3-part briefing: calendar today + email triage with draft replies + carry-forward todos).
- `debrief` — fixed 5-step sequence (todos -> emails 8am-6pm -> tomorrow's calendar -> reflection -> commit). No mode branching.
- `weekly-review` — 7-phase audit. Triggers memory audit and recompile of stale domain summaries.
- `calendar-manager` — timezone-aware create/read/update/delete across all calendars. Never creates without confirmation.

**Writing + capture**
- `copywriter` — drafts LinkedIn, Instagram, blog, emails in the user's voice.
- `humanizer` — rewrites imported text to strip AI patterns.
- `bookmark` — saves URLs to Notion Bookmarks with auto-detected source. **(new)**
- `brain-dump` — splits stream-of-consciousness into separate Notion entries, categorizes. **(new)**
- `research` — persists research findings to Notion Research database with citations. **(new)**
- `video-ideas` — captures content ideas into Notion Video Ideas with status tracking. **(new)**

**Engineering**
- `code-engineer` — autonomous senior engineer. Full invisible pipeline: requirements -> research -> architecture -> TDD -> security review -> self-review -> verify.
- `building-explainer` — Feynman technique for any technical concept. Fires alongside code-engineer.
- `deep-research` — multi-source research with firecrawl + exa, cited reports.
- `blueprint` — turns a one-line objective into a multi-session construction plan with dependency graph and anti-pattern catalog.
- `tdd-workflow`, `eval-harness`, `verification-loop`, `continuous-agent-loop`, `agentic-engineering`, `agent-harness-construction`, `ai-first-engineering`, `enterprise-agent-ops`, `cost-aware-llm-pipeline`, `iterative-retrieval`, `output-enforcement`, `search-first`, `regex-vs-llm-structured-text`, `continuous-learning`
- `security-review`, `security-scan`, `redesign-audit`
- `api-design`, `backend-patterns`, `frontend-patterns`, `database-migrations`, `postgres-patterns`, `deployment-patterns`, `docker-patterns`, `e2e-testing`, `eng-claude-api`, `eng-coding-standards`, `eng-inbox`, `eng-update`
- `taste-design`, `soft-premium`, `minimalist-editorial`

**System + memory**
- `self-upgrade` — safe self-modification. Engineering pipeline applied to Athena's own brain.
- `migrate` — universal import from prior AI setups.
- `compile` — synthesizes MemPalace drawers into domain summaries.
- `memory-audit` — finds contradictions, stale facts, duplicates, gaps.

Self-creating skills: after 5+ sessions Athena reads patterns.md and day-ledger.md, identifies recurring manual tasks, proposes a new skill, writes the SKILL.md following the META format in `architecture.md`, tests it, installs it.

### Memory Architecture

Four layers. Each has a job. The routing table lives in `.claude/rules/memory-protocol.md`.

| Layer | What | Speed | Lifespan |
|---|---|---|---|
| **MemPalace** (MCP) | Long-term. Facts, decisions, relationships, life events. Knowledge graph with temporal awareness. | Medium | Forever |
| **personal/*.md** | Human-readable identity, goals, patterns, voice | Fast | Manual + weekly review |
| **snapshot.md** | Session state. Current priorities, active flags. | Instant | Every session |
| **Bot SQLite** | Telegram conversational memory. FTS5 + salience decay. | Instant | Days to weeks |

**Source tagging** is mandatory on every MemPalace write:

- `user_statement` — user said it. Ground truth. Wins every conflict.
- `system_inference` — Athena concluded it from context. Lower confidence.
- `onboarding` / `debrief` / `coaching` — context tags that explain where the fact came from.

**Knowledge graph** uses typed entities (person, company, project, goal, location, skill) with predicates (works_at, partner_of, decided_to, goal_is, prefers). Temporal facts set `valid_from`. When something changes — new job, new goal, breakup — Athena calls `kg_invalidate` on the old triple and creates a new one. Nothing is deleted; things expire.

**Compiled summaries** live in `personal/compiled/`. Rebuilt when 20+ new memories land in a room, during weekly review, or on request. Six domains: career, health, relationships, goals, finances, identity. Reading one compiled page is faster and more coherent than searching hundreds of fragments.

**Self-cleaning** runs during weekly review via `memory-audit`:
1. Contradictions (resolved by timestamp + source tag)
2. Stale facts (KG triples older than 6 months with no recent access — flagged, never auto-deleted)
3. Orphan memories (no KG connections, low access — consolidation candidates)
4. Paraphrased duplicates (below the 0.9 similarity threshold)
5. Gaps (topics where the user talks a lot but the room is empty)

### MCP Tools (6 Servers Out of the Box)

Configured in `.mcp.json.template`. Both Claude Code and the Telegram bot load the same config.

| Server | Purpose | Scope |
|---|---|---|
| `mempalace` | Long-term memory — drawers, knowledge graph, diary | Local to the project |
| `google-calendar` | CRUD across all calendars | User's Google Calendar |
| `gmail` | Read, search, label, draft | User's Gmail. Never sends without explicit approval. |
| `notion` | Pages, databases, search, comments | User's workspace |
| `playwright` | Headless browser — navigate, click, fill, screenshot, evaluate JS | Any public URL |
| `filesystem` (`bot/src/fs-mcp/server.ts`) | `list_directory`, `read_file`, `write_file`, `get_file_info`, `list_allowed_directories` | Hard allowlist from `ATHENA_FS_ALLOWED` in `bot/.env` (default: `~/Desktop`, `~/Documents`, `~/Downloads`) |

The filesystem MCP is the unlock. It converts Athena from a tool that talks about your files into a tool that reads and writes them. The allowlist is enforced by the server — it resolves every requested path to its real path (following symlinks) and refuses anything outside the configured directories. The user controls the allowlist with one env var.

This lets flows like: "screenshot this URL, save it to Desktop, send it to Telegram" run end-to-end. Playwright takes the shot, filesystem writes the file, Claude emits `<send_photo path="..." caption="..."/>`, the bot extracts the tag and sends the real image.

### Telegram Bot

TypeScript application using the Claude Agent SDK with session resumption. Runs locally. No cloud server.

| Component | Technology | Detail |
|---|---|---|
| Runtime | Node.js + TypeScript | Modular: `bot.ts`, `agent.ts`, `memory.ts`, `voice.ts`, `scheduler.ts`, `db.ts`, `router.ts`, `fs-mcp/` |
| Bot Framework | grammy | Handles text, voice, photo, document, video |
| AI Engine | Claude Agent SDK | `resume: sessionId` for continuity. Telegram context in `appendSystemPrompt` (cacheable). |
| Database | SQLite (better-sqlite3) | WAL mode, 7 tables, FTS5 full-text search with triggers |
| Memory | Dual-sector (semantic/episodic) | FTS5 search, 2%/day salience decay, auto-extraction |
| Media Output | `<send_photo>` / `<send_document>` tags | `extractMediaTags` parses Claude's reply and sends real Telegram attachments |
| Voice STT | Groq Whisper / OpenAI | Groq free tier, .oga -> .ogg conversion, sub-second transcription |
| Voice TTS | ElevenLabs | Optional. Toggled via `/voice` |
| Video | Google Gemini | Optional. Multimodal video analysis |
| Concurrency | FIFO queue limiter | Max 2 simultaneous Claude calls. Overflow queued. |
| Reminders | SQLite + 30-second polling | Natural language parsing: "remind me in 2 hours to call Mom" |
| Scheduler | cron-parser + 60-second polling | Recurring tasks: daily briefings, weekly reviews, custom prompts |
| WhatsApp | whatsapp-web.js (optional) | Bridge inbound to Telegram, reply via `/wa` |
| Health Check | `/health` command | Active features, memory count, pending reminders, uptime |
| Background | launchd (Mac) / systemd (Linux) | Auto-start on boot, auto-restart on crash |
| Graceful Shutdown | SIGTERM/SIGINT + PID lock | Kills stale processes on startup |

Setup: `cd bot && npm install && npm run setup`.

**Prompt architecture.** The bot splits every inbound message into two slots:

1. **System prompt (cacheable):** the Telegram persona prefix. Stable across messages, which means it stays inside Claude's prompt cache. Cheap.
2. **User turn (fresh):** memory context (from SQLite + MemPalace) + the raw user message. Changes every call.

This matters because prompt caching only works when the prefix is stable. Before, the persona lived in the user turn and cache-missed every message. Now it lives in `appendSystemPrompt` and hits cache.

### Data Layer

All bot state in one SQLite file (WAL mode, better-sqlite3):

| Table | Purpose |
|---|---|
| `sessions` | Chat ID -> Agent SDK session ID mapping |
| `memories` | Dual-sector (semantic/episodic) with salience scores |
| `memories_fts` | FTS5 virtual table for full-text search |
| `reminders` | Time-based reminders (natural-language parsed) |
| `scheduled_tasks` | Cron-based recurring tasks with `next_run` tracking |
| `wa_outbox` | WhatsApp outgoing queue |
| `wa_messages` | WhatsApp incoming archive |

Memory features:
- FTS5 search — relevant memories pulled before each Claude call
- Salience decay — 2% daily, memories below 0.1 are pruned
- Automatic extraction — semantic signals from conversation turns
- Accessed-at tracking — frequently used memories stay relevant

### Proactive Automation

Scheduled tasks live in SQLite, created via `/schedule` on Telegram. The scheduler polls every 60 seconds.

| Task | Cron | What It Does |
|---|---|---|
| Morning Briefing | `0 7 * * *` | Calendar today + email triage since 6pm + carry-forward todos |
| Weekly Review | `0 20 * * 0` | Week audit: accomplished, avoided, patterns, compile rebuild |
| Custom prompts | User-defined | Any recurring prompt the user configures |

Reminders are separate: natural-language parsed, stored in the `reminders` table, polled every 30 seconds.

### Session Continuity

Claude Code hooks fire automatically:

- **SessionStart:** reads `personal/snapshot.md` and injects it. Flags staleness.
- **SessionStop:** writes session metadata. Warns if `snapshot.md` wasn't updated.
- **Mid-session checkpoint:** in long sessions (30+ tool uses) Athena proactively saves decisions and open items to `snapshot.md` before the context window compresses.

Close the laptop. Come back tomorrow. Athena picks up where it left off.

---

## Privacy

- Runs on your machine. No cloud. No analytics. No telemetry.
- `personal/`, `bot/.env`, `.mcp.json`, `decisions/`, `context/` are gitignored by default.
- Filesystem MCP is allowlist-enforced. You control which directories Athena can touch via `ATHENA_FS_ALLOWED` in `bot/.env`. The server resolves real paths and refuses anything outside the list.
- Use a private GitHub repo for backup if you want sync across machines.

---

## Methodology and Sources

Athena synthesizes proven patterns from the open-source Claude Code community and AI engineering research. Not built from scratch.

### Architecture Influences

| Source | Author | What We Took |
|---|---|---|
| **claude-meta** | Aviad Rozenhek (aviadr1) | Self-improving CLAUDE.md pattern. "Reflect, abstract, generalize, write." Mistakes compound upward. |
| **bootstrap seed** | Christopher Allen (ChristopherA) | 1,400-token minimal seed that bootstraps a full system from nothing. Informed our lean CLAUDE.md. |
| **anthropics/skills** | Anthropic (official) | Skill specification, YAML frontmatter format, skill-creator evaluation loop. Our skills follow this spec. |
| **awesome-claude-code-toolkit** | Rohit Ghumare (rohitg00) | bug-detective debugging protocol, code-guardian review checklist. Integrated into code-engineer. |
| **everything-claude-code** | Affaan (affaan-m) | Engineering rules and conventions. |
| **claude-skills** | Jeff Allan (Jeffallan) | 66 skill patterns for full-stack development. Informed trigger design. |
| **blader/humanizer** | Siqi Chen (blader) | 25-pattern AI writing detection based on Wikipedia's "Signs of AI Writing". Integrated into `writing-quality.md`. |

### Memory Architecture Research

| Finding | Source | How We Applied It |
|---|---|---|
| Focused 1,800-token retrieval outperforms 26K-token full context | Anthropic research | Always-loaded context kept lean. Everything else on demand. |
| 90% token savings with +26% accuracy vs OpenAI Memory | Mem0 benchmarks | Progressive disclosure: snapshot first, deep context only when needed. |
| Write gating prevents memory bloat | Total Recall, claude-diary, Vestige | Evolution protocol requires 3 criteria before persisting a pattern: actionable, repeated, specific. |
| Hierarchical memory with only top tiers auto-loading | nikhilsitaram, Ethan-YS | 5-tier system: identity (always) > rules (always) > session state (auto) > skills (on-demand) > logs (never auto). |
| Agent self-managed memory outperforms static retrieval | Letta/MemGPT | Athena manages her own files: reads, writes, archives, evolves the knowledge base. |

### Skill Authoring Best Practices

From Anthropic's official guidance and the skill-creator framework:

- **Descriptions must be "pushy."** Claude under-triggers skills. "Manage calendar events" is weak. "Manage calendar events. Use when the user mentions meetings, events, scheduling, time, appointments, flights, deadlines, or anything time-bound" is strong.
- **Explain WHY, not just WHAT.** "If you find yourself writing ALWAYS in all caps, that's a yellow flag. Reframe and explain the reasoning." (Anthropic)
- **Keep it lean.** "Claude is already very smart. Only add context Claude doesn't already have." (Anthropic)
- **Bundle repeated patterns.** "If all 3 test cases resulted in the subagent writing a create_docx.py, that's a signal the skill should bundle that script." (Anthropic)

---

## Who This Is For

- The founder building a company while still holding a day job
- The executive who can't keep up with commitments they made three weeks ago
- The professional who wants to operate like they have a chief of staff
- The builder tired of AI that forgets everything and starts from zero every conversation
- Anyone who knows they could perform at a higher level with the right system behind them

## Who This Is NOT For

- People looking for a chatbot to answer questions
- People unwilling to invest 30 minutes in a proper setup
- People who want an assistant that just agrees with them. Athena challenges your thinking. That is the point.

---

## The Bottom Line

The most personalized AI system you will use. Not an app. Not a subscription. Your system, running on your infrastructure, learning your patterns, challenging your assumptions, holding you accountable to your own standard. It gets smarter every week. It never starts from scratch. It never agrees with you just to be agreeable.
