# Athena

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Built on Claude Code](https://img.shields.io/badge/Built%20on-Claude%20Code-black)](https://claude.ai/code)
[![Open Source](https://img.shields.io/badge/open-source-brightgreen)](https://github.com/eugenezhangco-spec/athena)

**The open-source AI chief of staff that lives inside Claude Code.**

Most AI forgets you the moment you close the tab. Athena doesn't.

Chief of staff, life coach, business mentor, and a 14-person engineering team. One project. One memory. Runs on your Claude Pro or Max subscription. No extra API keys. No per-token billing. Your data stays on your machine.

MIT licensed.

---

## What you get

- **Stop re-explaining yourself.** Every conversation picks up where the last one ended. Forever.
- **Stop paying per token.** Uses the models already in your Claude Pro or Max plan.
- **An AI that pushes back.** Every idea gets stress-tested against your stated goals before you execute.
- **Writing that sounds like you.** A 25-pattern humanizer kills AI patterns before you see a draft.
- **Real software, shipped.** 14 specialist agents handle requirements, architecture, tests, security, and QA.
- **Your data, your machine.** No cloud. No analytics. No telemetry. No vendor lock-in.

---

## What it does

| You say | Athena does |
|---|---|
| "Good morning" | Briefing lands. Today's calendar, urgent emails with drafts ready, yesterday's carryover. |
| "Debrief" | 5-step close. Tomorrow seeded. |
| "Bookmark this [link]" | Filed to Notion. Source auto-detected. |
| "Brain dump: [3 ideas]" | Split into entries. Tagged. Filed. |
| *(receipt photo on Telegram)* | Merchant, amount, category extracted. Logged on your OK. |
| "How much did I spend on food this month?" | Queries the expenses DB. Breakdown. Tax-deductible totals on request. |
| "Read that file on my Desktop" | Reads it. No switching tools. |
| "Screenshot [url] and send to Telegram" | Playwright captures. Bot sends the image. |
| "Write me a LinkedIn post about X" | Drafts in your voice. Humanizer runs first. |
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

Athena detects a new user and runs a 10-minute onboarding. Goals, schedule, voice, tools. No forms.

---

## How it works

### One project, four interfaces

```
athena/
  .claude/rules/      Always-on behavior (personality, coaching, communication)
  .claude/skills/     On-demand capabilities (planning, debrief, writing, expenses, ...)
  personal/           User profile (gitignored, built during onboarding)
  agents/             14 engineering specialists
  bot/                Telegram bot (optional)
```

Claude Code. VS Code. Telegram. Morning briefing. Scheduled jobs. Same project. Same memory.

### Memory, five layers

| Layer | What | When loaded |
|---|---|---|
| **MemPalace** (MCP) | Long-term vault. Facts, decisions, relationships, life events, with dates. Source-tagged. | On demand |
| **knowledge/** | The wiki. What you have concluded, rewritten as you learn more. | On demand |
| **personal/*.md** | Identity, goals, voice, patterns. | Always |
| **snapshot.md** | Current state. This week. Active flags. | Every session |
| **Bot SQLite** | Recent Telegram turns. Auto-decays. | Real-time |

Every fact is tagged `user_statement` (you said it) or `system_inference` (Athena concluded it). Conflicts resolve in your favour.

**The first two are different jobs and mixing them up is expensive.** MemPalace is recall: it answers "what did Sarah say in June." The wiki is synthesis: it answers "what do I actually know about pricing." A recall system will never produce understanding no matter how much you put in it, because it stores rather than reads. Both are needed. See [knowledge/CLAUDE.md](knowledge/CLAUDE.md).

### Memory that does not rot

A memory system does not crash when it goes wrong. It keeps answering, confidently, and the answers are quietly untrue. There is no error and no alert, so nothing will ever prompt you to look.

Three layers stop that, and the order matters:

```bash
python3 scripts/memory-guard.py     # the gate: a locked vocabulary, enforced at the write path
python3 scripts/memory-lint.py      # the lint: what rotted after — run monthly
python3 scripts/wiki.py lint        # same idea, pointed at the wiki
```

The guard is the part most systems get wrong. Writing your approved categories into a rules file does not work, because background hooks file memories without ever reading your rules. **A rule is a note on the wall; the guard is a lock on the door** — it patches the write call so an off-vocabulary memory is rejected with the valid options handed back, and the assistant corrects itself.

The lint catches what a gate cannot: a fact that was true in May, the same person stored twice under two spellings, two relationship names that mean the same thing. It backs up before touching anything, **expires rather than deletes** so history stays answerable, and refuses to guess where the answer is genuinely ambiguous — a lint that guessed would manufacture the exact errors it exists to catch.

Edit `personal/memory-taxonomy.md` to fit your life, then re-run the guard.

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

## Coaching engine

Athena does not agree with everything. Every idea gets stress-tested.

- **Signal-vs-noise filter.** Each new task checked against stated goals. Flagged as signal, noise-dressed-as-signal, pure noise, or map-changer.
- **Pattern detection.** Drift. Avoidance. Comfort-zone work. Overcommitting. Perfectionism. Planning-as-procrastination. Flagged by name.
- **Business mentor lens.** Names the business model. Asks about the money. Challenges the GTM. Maps the other side's incentives.

**What you get:** fewer wasted weeks. Fewer bad deals. Shorter decision cycles.

---

## Writing engine

Drafts emails, LinkedIn posts, and messages in your voice. Not AI voice.

25-pattern detection filter from Wikipedia's "Signs of AI Writing" guide. Significance inflation. Hollow -ing constructions. Sycophantic openers. Synonym cycling. Em-dash overuse. Rule-of-three padding.

Two-pass rewrite. Kill patterns. Audit for "obviously AI". Then you see it.

Learns your voice during onboarding. Refines it every week.

**What you get:** content that actually sounds like you. Posts that get read, not scrolled past.

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

Describe what you want in plain English. They handle requirements, research, architecture, tests, security review, QA, and docs. You get a working thing plus a plain-English explanation.

Engineering Guardian runs every build. Catches hardcoded secrets, SQL injection, XSS, missing validation, exposed errors. Fixed. Explained after.

**What you get:** production-quality software without a CS degree. Non-technical users ship real tools.

---

## Daily loop

```
07:00  Morning briefing lands on Telegram.
       Calendar. Urgent emails with draft replies. Yesterday's carryover.

Through the day  Telegram for quick wins.
                 Reminders. Calendar adds. Screenshots. Bookmarks.
                 "What's my next meeting?"
                 "Read that file on my Desktop and summarize it."

21:00  "Debrief" in Claude Code.
       What finished. Today's emails. Tomorrow's calendar.
       Reflection logged to diary plus patterns. Tomorrow seeded.
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

Safety rails. Reads before writing. One change at a time. Security review on self-modification. No personality changes without consent.

**What you get:** an assistant that gets sharper every week. Not a tool you outgrow.

---

## Privacy

Local by default. No cloud, no analytics, no telemetry. There is no server belonging to this project and no account to create.

Everything you tell Athena lives in `personal/`, `~/.mempalace/`, and `knowledge/` on your own disk. Credentials are gitignored and personal data is never committed. Use a **private** repo if you want to sync across machines, and read `.gitignore` before you push anything.

Your conversations do reach Anthropic, because Claude runs there. That is your own subscription and its terms, the same as any tool built on Claude Code.

Full detail, including the optional Telegram bot and how to vet an MCP server before installing it: [SECURITY.md](SECURITY.md).

---

## Repo tour

```
.claude/
  rules/          Always-on behavior
  skills/         On-demand capabilities
  hooks/          Session lifecycle

personal/         User data (gitignored)
knowledge/        The wiki. raw sources, topic pages, open questions
agents/           14 engineering specialists
bot/              TypeScript Telegram bot (Claude Agent SDK + SQLite + voice)
bot/src/fs-mcp/   Filesystem MCP server (allowlist-enforced)
scripts/          Setup, sync, scheduled jobs, memory hygiene
decisions/        Decision log
context/          STATUS.md, ACTION-ITEMS.md
docs/             Setup, toolkit, playbook
```

Every script here carries a `--selftest`. A check with no self-test is a claim.

```bash
bash   scripts/cron-alert.sh   --selftest
python3 scripts/memory-guard.py --selftest
python3 scripts/memory-lint.py  --selftest
cd bot && npm run typecheck && npm test
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
- [knowledge/CLAUDE.md](knowledge/CLAUDE.md). How the wiki works and why it is separate from memory.
- [personal/memory-taxonomy.md](personal/memory-taxonomy.md). The memory vocabulary. Edit it to fit your life.
- [SECURITY.md](SECURITY.md). What this touches and what to check before pushing.

---

## Contributing

PRs welcome, and **you do not need to be a developer.** Most of this is markdown — a rule that reads better or a setup step that confused you is a real contribution.

One change per PR. Describe the problem before the solution. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

---

Maintained by [Eugene Zhang](https://www.linkedin.com/in/eugenezhangco/).
