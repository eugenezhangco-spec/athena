# Athena

**The open-source Claude-native AI chief of staff.** Life coach, business mentor, executive assistant, engineering team — in one project that lives inside Claude Code.

No separate API keys. No per-token billing. No OpenAI dependency. Your Claude Pro or Max subscription is the whole cost — Athena runs natively on Claude Code, using the models already included in your plan.

Remembers you. Challenges you. Writes in your voice. Ships code. Gets sharper every week. Your data stays on your machine.

---

## Why Athena

| | Closed AI assistants | DIY with the raw API | **Athena** |
|---|---|---|---|
| **Cost model** | Monthly subscription per app | Per-token billing that scales with use | Your existing Claude Pro/Max sub. Nothing extra. |
| **Where it runs** | Someone else's cloud | Whatever you wire up | Your machine, inside Claude Code |
| **Model access** | Whatever they picked | You pay for every call | Uses the models already included in Claude Code |
| **Memory** | Forgets between sessions (mostly) | You build it | Four-layer memory with temporal knowledge graph |
| **Code** | Proprietary | Yours | Open source — MIT licensed |
| **Data** | Uploaded to vendor | Depends | Local. No telemetry. No analytics. |

Athena is a project folder, not a SaaS. Clone it, run `./setup.sh`, and you have a personal assistant that uses Claude Code's built-in model access. The only API keys you add are for services you choose to connect (Notion, Gmail, Calendar, voice) — and those are your own accounts.

---

## What Athena actually does

| You say | Athena does |
|---|---|
| "Good morning" | Briefing lands: today's calendar, urgent emails with draft replies, yesterday's unfinished todos. |
| "Debrief" | 5-step close: finished/not, email triage, tomorrow's calendar, reflection → logged to diary + patterns. |
| "Bookmark this [link]" | Saved to your Notion Bookmarks database, source auto-detected. |
| "Brain dump: [3 ideas]" | Split into 3 separate Notion entries, categorized, tagged Raw. |
| *[send a receipt photo on Telegram]* | Extracts merchant, amount, date, category. Proposes the entry. Logs to Notion on your OK. |
| "How much did I spend on food this month?" | Queries the Expenses DB, totals by category, shows the breakdown. Tax-deductible totals on request. |
| "Read that file on my Desktop" | Reads it. No switching tools. (Filesystem MCP under an allowlist.) |
| "Screenshot [url] and send to Telegram" | Playwright captures, filesystem saves, bot sends the real image. |
| "Write me a LinkedIn post about X" | Drafts in your voice. Runs the 25-pattern humanizer before you see it. |
| "Build me a [thing]" | 14 specialist agents — planner, architect, TDD, security, reviewer, QA — build it, explain it. |

---

## Install — 5 minutes

You need a Claude Pro or Max subscription. That's it.

```bash
# 1. Install Claude Code (skip if you already have it)
curl -fsSL https://claude.ai/install.sh | bash

# 2. Clone Athena
git clone https://github.com/eugenezhangco-spec/athena.git
cd athena

# 3. Run setup (installs memory, wires MCP servers, sets up the bot env)
./setup.sh
```

Then open the folder in Claude Code. Say hi. Athena detects you're new and runs a 10-minute onboarding: your goals, schedule, voice, tools. No forms.

**Going further:**
- [docs/SETUP.md](docs/SETUP.md) — full install walkthrough (every integration, every env var, troubleshooting)
- [docs/TOOLKIT.md](docs/TOOLKIT.md) — complete capability catalog (every skill, rule, agent, MCP tool)
- [OVERVIEW.md](OVERVIEW.md) — deep architecture tour

---

## How it works

### One project, four interfaces

```
┌────────────────────────────────────────────────┐
│  athena/  (this repo)                          │
│                                                │
│  .claude/rules/      Always-on behavior        │
│  .claude/skills/     On-demand capabilities    │
│  personal/           Who you are (gitignored)  │
│  bot/                Telegram bot (optional)   │
│  agents/             14 engineering specialists│
└────────────────────────────────────────────────┘
        │         │           │          │
     Claude     Telegram    Morning   Scheduled
      Code     (your phone) briefing   cron jobs
```

Same project. Same memory. Whichever interface you open, Athena remembers the last conversation.

### Memory — four layers

Most AI forgets the second you close the tab. Athena doesn't.

| Layer | What | When loaded |
|---|---|---|
| **MemPalace** (MCP) | Long-term vault. Facts, decisions, relationships, life events, with dates. Source-tagged: your words > its guesses. | On demand |
| **personal/*.md** | You. Identity, goals, voice, patterns. | Always |
| **snapshot.md** | Current state. Active flags. What's happening this week. | Auto-loaded per session |
| **Bot SQLite** | Recent Telegram turns. Auto-decays. | Real-time |

Every fact written to MemPalace is tagged `user_statement` (you said it) or `system_inference` (Athena concluded it). Conflicts always resolve in your favor.

Weekly memory audit catches contradictions, stale facts, duplicates, and gaps. Memory gets cleaner over time, not messier.

### Tools (MCP)

Four servers are always on. Three more are **opt-in at setup** with a risk callout — you pick which Athena gets.

**Always on:**

| Server | Use |
|---|---|
| `mempalace` | Long-term memory |
| `google-calendar` | Read + write your calendar |
| `gmail` | Read, search, draft (never sends without approval) |
| `notion` | Pages, databases, search |

**Opt-in during `./setup.sh` (default OFF, fully explained at prompt):**

| Server | Use | Risk class |
|---|---|---|
| `filesystem` | Read/write files under an allowlist you set (e.g. `~/Desktop`, `~/Documents`, `~/Downloads`) | Medium — scope the allowlist carefully |
| `playwright` | Headless browser — navigate, click, screenshot, submit forms on any URL | Medium — can interact with any site you're logged into elsewhere |
| `computer` | Full mouse / keyboard / screen control on macOS | **High** — sees anything on screen, can click anywhere |

Each prompt lists what it unlocks and what could go wrong before you answer. You can re-run `./setup.sh` any time to change your mind.

The filesystem MCP is the unlock for most people: Athena can read the CSV on your Desktop, fix it, save the result, and Telegram you the summary — without you switching tools.

### Model routing

Every Telegram message is classified by complexity and routed to the right model. Light stuff runs on Haiku (cheap, fast). Heavy stuff runs on Sonnet with extended thinking. You stay inside your Pro/Max quota.

| Tier | Model | Thinking | Triggers |
|---|---|---|---|
| Light | Haiku 4.5 | 1K | Greetings, acks, simple questions |
| Standard | Sonnet 4.6 | 8K | Email, calendar, tasks, tool use |
| Heavy | Sonnet 4.6 | 16K | Coaching, strategy, planning, deep writing |

In Claude Code, the 14 engineering agents declare their own models — Opus for strategy and architecture, Sonnet for coding, Haiku for docs.

---

## The coaching engine

Athena does not agree with everything. Every idea gets stress-tested.

- **Signal-vs-noise filter:** each new task checked against your stated goals. Flagged as signal, noise-dressed-as-signal, pure noise, or map-changer. Enforces 80/20.
- **Pattern detection:** drift, avoidance, comfort-zone work, overcommitting, perfectionism, planning-as-procrastination. Flagged by name.
- **Business-mentor lens:** names the model, asks about the money, challenges the GTM, maps the other side's incentives in negotiations.

Warmer than most coaching. Sharper than most assistants.

---

## The writing engine

Drafts emails, LinkedIn posts, messages in your voice — not AI voice.

- 25-pattern detection filter from Wikipedia's "Signs of AI Writing" guide (significance inflation, hollow -ing constructions, sycophantic openers, synonym cycling, em-dash overuse, rule-of-three padding)
- Two-pass rewrite: kill patterns first, then audit for "obviously AI"
- Learns your voice during onboarding and refines it over time

---

## The engineering team

When you say "build me X", 14 specialists activate:

| Name | Role | Model |
|---|---|---|
| Maya | Head of Strategy | Opus |
| Jake | Lead Planner | Opus |
| Sara | Lead Architect | Opus |
| Fatima | Data Engineer | Opus |
| Dave | Codebase Auditor | Opus |
| Max | Test Engineer (TDD) | Sonnet |
| Nina | Code Reviewer | Sonnet |
| Elena | Security Lead | Sonnet |
| Tom | Build / DevOps | Sonnet |
| Aisha | QA Lead (E2E) | Sonnet |
| Liam | Frontend Engineer | Sonnet |
| Yuki | Refactor Specialist | Sonnet |
| Andre | Database Architect | Sonnet |
| Rachel | Technical Writer | Haiku |

You describe what you want in plain English. They handle requirements, research, architecture, tests, security review, QA, and docs. You get a working thing plus a plain-English explanation.

**Engineering Guardian** runs over every build: catches hardcoded secrets, SQL injection, XSS, missing validation, exposed error details. Fixed automatically, explained after.

---

## Daily loop

```
07:00  Morning briefing lands on Telegram.
       Calendar + urgent emails (with draft replies) + yesterday's carry-forward.

Through the day  Telegram for quick wins — reminders, calendar adds, screenshots,
                 "bookmark this", "what's my next meeting?", "read that file and summarize".

21:00  "Debrief" in Claude Code.
       5-step close: what finished, today's emails, tomorrow's calendar,
       your reflection → logged to diary + patterns. Tomorrow's plan seeded.
```

---

## Self-evolution

Athena writes its own upgrades:

1. Detects recurring manual tasks after 5+ sessions
2. Proposes a skill: "You write a status update every Friday. Want me to automate it?"
3. Writes the SKILL.md, tests it, installs it
4. When you correct it twice, proposes a permanent rule
5. Runs an 8-point self-check after every meaningful session
6. Weekly: compiles raw memories into domain briefs (career, health, relationships, goals, finances)

Safety rails: reads before writing, one change at a time, security review on self-modification, no personality changes without consent.

---

## Privacy

- Runs on your machine. No cloud. No analytics. No telemetry.
- All credentials gitignored by default.
- Personal data (`personal/me.md`, `voice-dna.md`, relationships, etc.) never committed.
- Use a private GitHub repo for backup if you want sync across machines.

---

## What's inside the repo

```
.claude/
  rules/          Always-on behavior (personality, coaching, communication)
  skills/         On-demand capabilities (planning, debrief, writing, bookmarks, ...)
  hooks/          Session lifecycle (auto-save context between sessions)

personal/         Your data (gitignored — built during onboarding)
agents/           14 engineering specialists, each with a model declared
bot/              TypeScript Telegram bot (Claude Agent SDK + SQLite + voice)
bot/src/fs-mcp/   Filesystem MCP server (allowlist-enforced)
decisions/        Decision log
context/          Project-state files (STATUS.md, ACTION-ITEMS.md)
```

---

## Not for you if

- You want a chatbot that just answers questions.
- You want an AI that agrees with everything you say.
- You won't spend 10 minutes on real onboarding.

## For you if

- You make real decisions every day with no one to think alongside you.
- You want your tools to remember what you told them last month.
- You'd rather your AI hold you accountable than be pleasant.

---

**Docs:**
- [docs/SETUP.md](docs/SETUP.md) — full install walkthrough
- [docs/TOOLKIT.md](docs/TOOLKIT.md) — every skill, rule, agent, MCP tool
- [OVERVIEW.md](OVERVIEW.md) — architecture tour
- [docs/START-HERE.md](docs/START-HERE.md) — building mode (engineering team)
- [docs/PLAYBOOK.md](docs/PLAYBOOK.md) · [docs/TEAM.md](docs/TEAM.md) · [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

Built by [Eugene Zhang](https://www.linkedin.com/in/eugenezhangco/) | [Instagram](https://www.instagram.com/eugenezhang__/)
