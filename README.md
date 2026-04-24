# Athena

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built on Claude Code](https://img.shields.io/badge/Built%20on-Claude%20Code-black)](https://claude.ai/code)
[![Made by a non-developer](https://img.shields.io/badge/made%20by-a%20non--developer-orange)](https://www.linkedin.com/in/eugenezhangco/)

I saved 40 hours last week using an AI agent I built.

I'm not a developer.

Athena is that agent, open sourced. Chief of staff. Life coach. Business mentor. Engineering team. One project that lives inside Claude Code.

Runs on your own Claude Pro or Max subscription. No separate API keys. No per-token billing. Your machine.

MIT. Free. Fork it, change it, ship it.

---

## What it actually does

| You say | Athena does |
|---|---|
| "Good morning" | Today's calendar, urgent emails with drafts ready, yesterday's carryover. |
| "Debrief" | 5-step close. Tomorrow seeded. |
| "Bookmark this [link]" | Filed to your Notion, source auto-detected. |
| "Brain dump: [3 ideas]" | Split into entries, tagged, filed. |
| *(receipt photo on Telegram)* | Merchant, amount, category extracted. Logged on your OK. |
| "How much did I spend on food this month?" | Queries your expenses DB. Breakdown. Tax-deductible totals on request. |
| "Read that file on my Desktop" | Reads it. No switching tools. |
| "Screenshot [url] and send to Telegram" | Playwright captures. Bot sends the image. |
| "Write me a LinkedIn post about X" | Drafts in your voice. 25-pattern humanizer before you see it. |
| "Build me a [thing]" | 14 engineering specialists ship it. |

---

## Install

Five minutes. You need a Claude Pro or Max subscription.

```bash
# 1. Install Claude Code if you don't have it
curl -fsSL https://claude.ai/install.sh | bash

# 2. Clone
git clone https://github.com/eugenezhangco-spec/athena.git
cd athena

# 3. Setup (memory, MCP servers, bot env)
./setup.sh
```

Open the folder in Claude Code or VS Code. Say hi.

Athena detects you're new. Runs a 10-minute onboarding. Your goals, your schedule, your voice, your tools. No forms.

---

## Why I built this

I run a real 9-to-5 at a bank. I'm non-technical. I was drowning in context.

Closed assistants forget between sessions. Raw API means per-token billing. Neither fit.

So I built Athena on top of Claude Code. It uses the models already in your Pro or Max plan. Memory lives on your disk. The engineering team is 14 specialists that ship real code.

Four months in, I still use it every day.

---

## How it works

### One project, four interfaces

```
athena/
  .claude/rules/      Always-on behavior (personality, coaching, communication)
  .claude/skills/     On-demand capabilities (planning, debrief, writing, expenses, ...)
  personal/           Who you are (gitignored)
  agents/             14 engineering specialists
  bot/                Telegram bot (optional)
```

Claude Code. VS Code. Telegram. Morning briefing. Scheduled jobs. Same project. Same memory.

### Memory, four layers

Most AI forgets the moment you close the tab. Athena doesn't.

| Layer | What | When loaded |
|---|---|---|
| **MemPalace** (MCP) | Long-term vault. Facts, decisions, relationships, life events, with dates. Source-tagged. | On demand |
| **personal/*.md** | You. Identity, goals, voice, patterns. | Always |
| **snapshot.md** | Current state. This week. Active flags. | Every session |
| **Bot SQLite** | Recent Telegram turns. Auto-decays. | Real-time |

Every fact is tagged `user_statement` (you said it) or `system_inference` (Athena concluded it). Conflicts resolve in your favor.

Weekly audit catches contradictions, stale facts, duplicates, gaps. Memory gets cleaner over time, not messier.

### Tools (MCP)

Four always on. Three opt-in at setup with a risk callout.

**Always on:** MemPalace (memory), Google Calendar, Gmail, Notion.

**Opt-in during `./setup.sh` (default OFF, explained at prompt):**

| Server | Use | Risk |
|---|---|---|
| `filesystem` | Read/write files under an allowlist you set (`~/Desktop`, `~/Downloads`, etc) | Medium. Scope the allowlist carefully. |
| `playwright` | Headless browser. Click, screenshot, submit forms. | Medium. Can interact with any site you're logged into. |
| `computer` | Mouse, keyboard, screen on macOS | High. Sees everything on screen. |

The filesystem MCP is the unlock for most people. Athena reads the CSV on your Desktop, fixes it, saves the result, Telegrams the summary. No tool switching.

### Model routing

Every Telegram message is classified and routed. Light stuff runs on Haiku. Heavy stuff runs on Sonnet with extended thinking. You stay inside your Pro or Max quota.

| Tier | Model | Thinking | Triggers |
|---|---|---|---|
| Light | Haiku 4.5 | 1K | Greetings, acks, simple questions |
| Standard | Sonnet 4.6 | 8K | Email, calendar, tasks, tool use |
| Heavy | Sonnet 4.6 | 16K | Coaching, strategy, planning, deep writing |

In Claude Code, the 14 engineering agents pick their own models. Opus for strategy and architecture. Sonnet for coding. Haiku for docs.

---

## Coaching

Athena does not agree with everything. Every idea gets stress-tested.

- **Signal-vs-noise filter.** Each new task checked against your goals. Flagged as signal, noise-dressed-as-signal, pure noise, or map-changer.
- **Pattern detection.** Drift. Avoidance. Comfort-zone work. Overcommitting. Perfectionism. Planning-as-procrastination. Flagged by name.
- **Business mentor lens.** Names the business model. Asks about the money. Challenges the GTM. Maps the other side's incentives.

Warmer than most coaching. Sharper than most assistants.

---

## Writing

Drafts emails, LinkedIn posts, messages in your voice. Not AI voice.

25-pattern detection filter from Wikipedia's "Signs of AI Writing" guide. Significance inflation. Hollow -ing constructions. Sycophantic openers. Synonym cycling. Em-dash overuse. Rule-of-three padding.

Two-pass rewrite. Kill patterns. Audit for "obviously AI". Then you see it.

Learns your voice during onboarding. Refines it every week.

---

## Engineering team

Say "build me X" and 14 specialists activate.

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

Engineering Guardian runs every build. Catches hardcoded secrets, SQL injection, XSS, missing validation, exposed error details. Fixed. Explained after.

---

## Daily loop

```
07:00  Morning briefing lands on Telegram.
       Calendar. Urgent emails with draft replies. Yesterday's carryover.

Through the day  Telegram for quick wins.
                 Reminders. Calendar adds. Screenshots.
                 "Bookmark this." "What's my next meeting?"
                 "Read that file on my Desktop and summarize it."

21:00  "Debrief" in Claude Code.
       What finished. Today's emails. Tomorrow's calendar.
       Your reflection logged to diary plus patterns. Tomorrow seeded.
```

---

## Self-evolution

Athena writes its own upgrades.

1. Detects recurring manual work after 5+ sessions.
2. Proposes a skill. "You write a status update every Friday. Want me to automate it?"
3. Writes the SKILL.md. Tests it. Installs it.
4. Corrects it twice, proposes a permanent rule.
5. 8-point self-check after every meaningful session.
6. Weekly compile. Raw memories into domain briefs. Career. Health. Relationships. Goals. Finances.

Safety rails. Reads before writing. One change at a time. Security review on self-modification. No personality changes without your consent.

---

## Privacy

Your machine. No cloud. No analytics. No telemetry.

Credentials gitignored by default. Personal data never committed. Use a private GitHub repo if you want sync across machines.

---

## Repo tour

```
.claude/
  rules/          Always-on behavior
  skills/         On-demand capabilities
  hooks/          Session lifecycle

personal/         Your data (gitignored, built during onboarding)
agents/           14 engineering specialists
bot/              TypeScript Telegram bot (Claude Agent SDK + SQLite + voice)
bot/src/fs-mcp/   Filesystem MCP server (allowlist-enforced)
decisions/        Decision log
context/          STATUS.md, ACTION-ITEMS.md
docs/             Setup, toolkit, playbook
```

---

## Not for you if

- You want a chatbot that just answers questions.
- You want AI that agrees with everything.
- You won't spend 10 minutes on real onboarding.

## For you if

- You make real decisions every day with no one to think alongside you.
- You want tools that remember what you told them last month.
- You'd rather your AI hold you accountable than be pleasant.

---

## Docs

- [docs/SETUP.md](docs/SETUP.md). Full install walkthrough. Every integration, every env var, troubleshooting.
- [docs/TOOLKIT.md](docs/TOOLKIT.md). Every skill, rule, agent, MCP tool.
- [OVERVIEW.md](OVERVIEW.md). Deep architecture tour.
- [docs/START-HERE.md](docs/START-HERE.md). Building mode and the engineering team.
- [docs/PLAYBOOK.md](docs/PLAYBOOK.md), [docs/TEAM.md](docs/TEAM.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Contributing

PRs welcome. Open an issue first for anything structural. Keep diffs small, describe the problem before the solution.

## License

MIT. See [LICENSE](LICENSE).

---

Built by [Eugene Zhang](https://www.linkedin.com/in/eugenezhangco/). [Instagram](https://www.instagram.com/eugenezhang__/).

Become the person AI works for. Not the person it replaces.
