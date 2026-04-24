# TOOLKIT

A flat catalog of every capability Athena ships with: skills, rules, engineering agents, MCP tools, native Claude Code tools, and lifecycle hooks. Built for anyone scanning what's in the box before committing to install — browse by section or grep for a trigger word like "debrief", "plan my day", "security review", or "humanizer". Descriptions are lifted from actual file frontmatter in this repo, not invented.

This is the reference document. For the elevator pitch see [`README.md`](../README.md). For architecture see [`OVERVIEW.md`](../OVERVIEW.md) and [`.claude/rules/architecture.md`](../.claude/rules/architecture.md). For the engineering build pipeline see [`docs/START-HERE.md`](START-HERE.md), [`docs/TEAM.md`](TEAM.md), and [`docs/PLAYBOOK.md`](PLAYBOOK.md).

---

## 1. Skills

Skills live in `.claude/skills/`. Each has a `SKILL.md` with trigger conditions. Some are triggered by phrases, some auto-fire on context (code being written, session starting, etc.), some are slash commands like `/humanizer` or `/plan`.

### 1.1 Daily operations

Life cadence. Morning, evening, weekly. Ties into the priority stack, calendar, and patterns files.

| Skill | Trigger | What it does |
|---|---|---|
| `onboard` | `/onboard`, first session, empty `personal/me.md`, "set up tools", "connect my calendar" | Runs an adaptive interview that fills out every personal context file. Warm life-coach surface, systematic knowledge capture underneath. |
| `day-planner` | "plan my day", "plan tomorrow", "morning", "good morning", "what's on my plate" | Structured planning session mapping the day to the priority stack. Two modes: Evening (plans tomorrow) and Morning (confirms last night's plan). |
| `debrief` | "debrief", "end of day", "goodnight", "wrap up the day" | Fixed 5-step close: review todos, group today's emails, show tomorrow's calendar, coach on the day, log to diary/patterns. |
| `weekly-review` | "weekly review", "let's review the week", "end of week review" | Sit-down once a week. Audits all context files, backlogs, stale metrics, priorities. Triggers memory audit and recompile. |

### 1.2 Calendar and scheduling

| Skill | Trigger | What it does |
|---|---|---|
| `calendar-manager` | "add to my calendar", "what's on my schedule", "when am I free", any time-bound plan | Creates, reads, updates, deletes Google Calendar events. Presents proposed events for approval. Never auto-creates. |

### 1.3 Writing

Voice-matched drafting. Always runs the humanizer pass. Never sends — just drafts.

| Skill | Trigger | What it does |
|---|---|---|
| `copywriter` | "write me a post", "draft something", "content session", "write for LinkedIn" | Writes in the user's voice. Loads `voice-dna.md`, adapts to platform (LinkedIn, Instagram, blog, email), runs humanizer. |
| `humanizer` | `/humanizer` or "make this sound less like AI" | Rewrites pasted text to strip AI patterns and match project voice. Manual tool; the rule file keeps humanizer logic always-on for originals. |

### 1.4 Memory and context

MemPalace is the long-term brain. These skills read, write, summarize, and clean it.

| Skill | Trigger | What it does |
|---|---|---|
| `compile` | "catch me up on [topic]", "summarize what you know about my [domain]", 20+ new memories in a room | Synthesizes all drawers in a MemPalace room into a single compiled summary at `personal/compiled/[domain].md`. |
| `memory-audit` | "audit my memories", "check for contradictions", auto during weekly review | Finds contradictions, stale facts, duplicates, orphans, and gaps in MemPalace. Fixes what it can; flags the rest. |
| `remember` | `remember` skill invocation | Saves session state for clean continuation next session. |
| `eng-inbox` | `/inbox` | Processes every file in `context/inbox/` (PDFs, Word, Excel, PowerPoint), briefs the user, sorts into correct folders, updates STATUS.md. |
| `eng-update` | `/update`, "save this", "update yourselves" | Saves all session decisions, conclusions, and context to memory and STATUS.md so the team stays current across instances. |

### 1.5 Notion integrations

Lightweight capture skills that route into Notion databases without thinking.

| Skill | Trigger | What it does |
|---|---|---|
| `bookmark` | "bookmark this", "save this link", forwarded URL with a note | Saves links/articles/videos to the Notion Bookmarks database with auto-detected source and optional note. |
| `brain-dump` | "brain dump", "capture this", stream-of-consciousness message with 3+ loose ideas | Splits multi-idea dumps into separate entries in Notion Brain Dumps, auto-categorizes, saves as Raw. |
| `research` | "save this research", "add to research", post-deep-research | Saves research findings and key takeaways to the Notion Research database. |
| `video-ideas` | "video idea", "content idea", "I should film" | Captures video ideas into Notion Video Ideas, tracks Draft → Ready → Published. |
| `log-expense` | Receipt photo on Telegram, "log this expense", "budget this", "track this spend" | Extracts merchant/amount/date/category from a receipt image via Claude vision, proposes the entry (Yellow tier), writes to Notion Expenses DB on approval. |
| `spending-summary` | "how much did I spend", "monthly summary", "tax-deductible total", "what did I spend on [category]" | Queries the Notion Expenses DB and produces summaries by period / category / merchant / tax status, with one-line coaching observation. |
| `deep-research` | "research X in depth", "competitive analysis", due diligence requests | Multi-source research via firecrawl and exa MCPs. Synthesizes and cites. |

### 1.6 Engineering — build pipeline

Slash-command workflow: `/status → /inbox → /pull → /plan → BUILD → /qa → /update`.

| Skill | Trigger | What it does |
|---|---|---|
| `setup` | First message when STATUS.md has placeholder text | Asks a few questions and gets the engineering team ready to build. |
| `status` | `/status` | Reads STATUS.md and briefs on current project state, last work, and what's next. |
| `inbox` | `/inbox` (general, not eng-inbox) | Processes documents in `context/inbox/`, briefs, sorts, updates STATUS.md. |
| `pull` | `/pull` | Loads a brainstorming-session handoff into the current build session and routes to `/plan`. |
| `wrap` | `/wrap` | Closes a brainstorming session and exports decisions to a structured handoff file for later import. |
| `plan` | `/plan` | Activates the planner to break a feature into buildable steps. Waits for approval before any code. |
| `blueprint` | "blueprint this", "roadmap for [multi-session project]" | Turns a one-line objective into a step-by-step construction plan with adversarial review gate, dependency graph, parallel-step detection. |
| `code-engineer` | Any build/fix/error/debug request — auto-fire | World-class autonomous engineer. Runs requirements → architecture → tests → security → delivery invisibly. Fires alongside `building-explainer`. |
| `build-fix` | "fix the build", "build is broken", failing build output | Fixes build errors and type errors one at a time with minimal diffs. |
| `test` | `/test` | Runs the test suite and reports. Offers to set up Vitest if none exists. |
| `golden` | `/golden`, "run the golden test", "check the pipeline" | Runs golden-file regression tests on the data pipeline against known records. |
| `pipeline` | `/pipeline` | Runs the data pipeline — ingest from configured sources, check health, show logs. |
| `audit` | `/audit`, "spec compliance", "what's drifted" | Compares requirements docs against current codebase and DB. Finds gaps, drift, missing fields. Backend only. |
| `review` | `/review` | Comprehensive code review on recent changes. Security, quality, project-specific patterns. |
| `devils-advocate` | `/devils-advocate` | Adversarial review of current branch diff against master. |
| `verify` | `/verify`, "verify this", "prove it worked" | Generates a step-by-step verification checklist after any change. Look, click, compare. |
| `qa` | `/qa` — auto-fires after every build | Full autonomous QA chain: tests → investigation → code review → plan verification → SHIP or HOLD verdict. |
| `milestone` | `/milestone` | Creates a milestone report and updates the master document. |
| `report` | `/report` | Shows the master report. |
| `deploy` | `/deploy` | Pre-deployment checklist. Code quality, tests, security before ship. |
| `update` | `/update` | Saves all session decisions and progress to memory and STATUS.md. End of every session. |
| `explain` | "explain what just happened", post-build clarity check | Plain-English recap of what changed in the last significant action. |

### 1.7 Coaching and growth

| Skill | Trigger | What it does |
|---|---|---|
| `building-explainer` | Any unfamiliar technical term, "what does that mean", auto with code-engineer | Feynman Protocol: name it, analogy, why it matters, stop. Teaches without lecturing. |
| `self-upgrade` | "upgrade yourself", "add a new skill", "you should be able to X" | Safely modifies Athena's own rules, skills, and system files. Read before write. One change at a time. |
| `migrate` | "migrate", "switch to Athena", "bring over my ChatGPT history" | Imports from any prior AI setup — other Claude Code assistants, ChatGPT/Gemini exports, Notes, documents. Skips what Athena handles better. |

### 1.8 Engineering references — patterns and standards

These are always-on reference skills that activate when the topic surfaces. Pattern libraries, not workflows.

| Skill | Trigger | What it does |
|---|---|---|
| `eng-coding-standards` | Starting a project, code review, refactoring | Universal standards for TS, JS, React, Node.js. |
| `frontend-patterns` | React/Next.js/UI work | State management, data fetching, rendering, performance patterns. |
| `backend-patterns` | API work, service layers | Node/Express/Next API routes, repositories, DB optimization. |
| `api-design` | Designing new endpoints | REST conventions: resource naming, status codes, pagination, versioning, rate limiting. |
| `postgres-patterns` | Writing SQL, schema design | PostgreSQL and Supabase patterns: query optimization, indexing, security. |
| `database-migrations` | Schema changes, backfills | Safe reversible migrations across Prisma, Drizzle, Django, TypeORM, golang-migrate. |
| `docker-patterns` | Containerization work | Docker Compose, container security, networking, volumes. |
| `deployment-patterns` | CI/CD setup, Dockerizing, shipping | Pipelines, blue-green/canary/rolling, health checks, rollback. |
| `e2e-testing` | Playwright tests, flaky test triage | Page Object Model, CI integration, artifact management. |
| `tdd-workflow` | New feature, bug fix, refactor | Enforces test-first with 80%+ coverage across unit, integration, E2E. |
| `security-review` | Auth work, user input, secrets, payment features | Comprehensive security checklist and vulnerability patterns. |
| `security-scan` | Auditing `.claude/` configuration | Scans CLAUDE.md, settings.json, MCP servers, hooks, and agent definitions using AgentShield. |
| `eng-claude-api` / `claude-api` | Building with `anthropic` SDK or `@anthropic-ai/sdk` | Messages API, streaming, tool use, vision, extended thinking, batches, prompt caching, Claude Agent SDK. |

### 1.9 Engineering references — design

| Skill | Trigger | What it does |
|---|---|---|
| `taste-design` | Frontend build with design quality requirements | Senior UI/UX engineer mode. Strict component architecture, CSS hardware acceleration, balanced design engineering. |
| `soft-premium` | "make it feel expensive", agency-tier brief | Principal UI/UX architect + motion choreographer. Haptic depth, cinematic rhythm, obsessive micro-interactions. |
| `minimalist-editorial` | "clean document-style UI", editorial brief | Warm monochrome, typographic contrast, bento grids, muted pastels. No gradients, no heavy shadows. |
| `redesign-audit` | "upgrade this existing site", "redesign this project" | Audits current design, identifies generic AI patterns, applies premium standards without breaking functionality. |
| `frontend-design` (plugin) | Building web components/pages/apps from scratch | Creates distinctive production-grade frontend with high design quality. Avoids generic AI aesthetics. |

### 1.10 Agentic engineering patterns

Reference skills for teams building with LLMs and agents.

| Skill | Trigger | What it does |
|---|---|---|
| `ai-first-engineering` | Process/review design for AI-assisted teams | Operating model when AI generates most implementation. Shifts review focus from syntax to system behavior. |
| `agentic-engineering` | Workflow design for agent-heavy projects | Eval-first execution, decomposition, cost-aware model routing. |
| `agent-harness-construction` | Designing tool definitions or agent action spaces | Optimize action space, tool definitions, observation formatting for higher completion rates. |
| `enterprise-agent-ops` | Long-lived cloud-hosted agents | Runtime lifecycle, observability, safety controls, kill switches. |
| `continuous-agent-loop` | Autonomous agent loops | Quality gates, evals, recovery controls. V1.8+ canonical loop skill. |
| `cost-aware-llm-pipeline` | Batch LLM processing on a budget | Model routing by complexity, budget tracking, retry logic, prompt caching. |
| `eval-harness` | Setting up eval-driven development | Formal pass/fail criteria for Claude Code tasks. |
| `output-enforcement` | Tasks needing complete unabridged output | Bans placeholder patterns. Handles token-limit splits cleanly. No `// TODO`, no `// ...`. |
| `regex-vs-llm-structured-text` | Parsing forms, invoices, quizzes, structured docs | Decision framework: regex first for 95-98% of cases, LLM only for low-confidence edges. |
| `iterative-retrieval` | Multi-agent workflows with context unknowns | Progressively refines retrieval when subagents don't know what context they need until they start. |
| `verification-loop` | Any session that needs end-of-run proof | Comprehensive verification system for Claude Code sessions. |
| `continuous-learning` | Stop-hook pattern extraction | Auto-extracts reusable patterns from sessions and saves them as learned skills for future use. |
| `search-first` | Before any custom implementation | Research-before-coding. Invokes the researcher agent to find existing tools, libraries, patterns. |
| `tdd-workflow` | See section 1.8 | Listed here too because it's the baseline for agentic engineering. |
| `blueprint` | See section 1.6 | Multi-session/multi-agent planning. Self-contained context briefs per step. |

---

## 2. Rules

Rules live in `.claude/rules/`. They are always-on behavioral directives. Path-scoped rules only activate when matching file types are in play. Descriptions come from the file frontmatter.

### 2.1 Core behavior

Always active. Shape every response.

| Rule | Governs |
|---|---|
| `personality.md` | Core identity, voice, tone, behavioral boundaries, quality standards for every interaction. |
| `communication-style.md` | Formatting across channels (VS Code vs Telegram), tone adaptation, output structure. |
| `coaching.md` | Challenge-before-support framework. Signal vs noise filter. Stress-testing protocol. Pattern detection. |
| `proactive-rules.md` | Green/Yellow/Red behavior tiers. What to auto-do, what to suggest, what to never touch. |
| `operating-rules.md` | User profile, calendar rules, task delegation tiers, time blocking, deep work protection, priority stack. |

### 2.2 Writing quality

| Rule | Governs |
|---|---|
| `writing-quality.md` | Catches AI patterns in everything written — emails, posts, messages, drafts. Two passes: kill AI patterns, then add soul. |

### 2.3 Architecture and evolution

| Rule | Governs |
|---|---|
| `architecture.md` | System architecture principles. How to structure capabilities, write new rules/skills, maintain coherence. |
| `evolution.md` | Self-improvement protocol. Session self-check, mistake protocol, architecture evolution, skill lifecycle, token optimization. |
| `memory-protocol.md` | Four-layer memory routing (MemPalace / personal/*.md / snapshot.md / Bot SQLite). Source tagging, compiled summaries, self-cleaning. |

### 2.4 Engineering (path-scoped — active when code files are in play)

| Rule | Governs |
|---|---|
| `engineering-guardian.md` | Always-on engineering safety net. Invisible CS-major pipeline — security, architecture, testing, protective defaults. |
| `coding-standards.md` | Code quality: completeness (no TODOs), immutability, error handling, naming, file size caps. |
| `security.md` | Secrets management, input validation, API security, self-modification safety, credential file handling. |
| `development-workflow.md` | Plan-first, TDD, code review, verification-before-shipping sequence. |
| `git-workflow.md` | Conventional commits, branch naming, attribution, PR standards. |
| `hooks.md` | Lifecycle hooks, security hooks, session management guidelines. |
| `patterns.md` | Repository pattern, API design, custom hooks, error handling patterns. |
| `testing.md` | 80% coverage requirement, TDD workflow, unit/integration/E2E split. |
| `performance.md` | Model routing, cost optimization, caching strategies. |
| `teaching-mode.md` | Feynman-style explanation rules when code is present. |
| `design-skills.md` | Triggers for taste-design, redesign-audit, soft-premium, output-enforcement, minimalist-editorial. |

### 2.5 TypeScript-specific (path-scoped)

| Rule | Governs |
|---|---|
| `typescript-coding-style.md` | TS-specific style rules. |
| `typescript-patterns.md` | TS patterns for hooks, utilities, types. |
| `typescript-security.md` | TS-specific security guidance. |
| `typescript-testing.md` | TS test patterns with Vitest. |
| `typescript-hooks.md` | React hook patterns in TS. |

### 2.6 Agents

| Rule | Governs |
|---|---|
| `agents.md` | Team orchestration. Which specialist agents exist, when they activate automatically, how to run them in parallel. |

---

## 3. Engineering agents

Fourteen specialists in `agents/`. Each is a named character with a specific lane. They auto-invoke when their domain surfaces during a build.

| Name | Role | Model | File |
|---|---|---|---|
| Sara | Lead Architect — system design, trade-offs, architectural decisions | opus | `agents/architect.md` |
| Jake | Lead Planner — breaks features into actionable implementation plans | opus | `agents/planner.md` |
| Maya | Head of Strategy / acting CTO — phased build plans from MVP → pilot → scale | opus | `agents/strategist.md` |
| Liam | Frontend Engineer — Next.js, React, Tailwind, shadcn/ui | sonnet | `agents/ui-builder.md` |
| Max | Test Engineer — TDD enforcement, red-green-refactor, 80%+ coverage | sonnet | `agents/tdd-guide.md` |
| Nina | Code Reviewer — quality, security, maintainability on every change | sonnet | `agents/code-reviewer.md` |
| Tom | Build/DevOps Engineer — build and TypeScript error resolution with minimal diffs | sonnet | `agents/build-fixer.md` |
| Aisha | QA Lead / E2E Specialist — post-build QA chain, Playwright/Vercel Agent Browser | sonnet | `agents/e2e-runner.md` |
| Andre | Database Architect — PostgreSQL optimization, schema, security, Supabase patterns | sonnet | `agents/database-reviewer.md` |
| Elena | Security Lead — OWASP Top 10, secrets, injection, SSRF, unsafe crypto | sonnet | `agents/security-reviewer.md` |
| Fatima | Data Engineer — ETL, connectors, entity resolution, auto-population | opus | `agents/data-engineer.md` |
| Dave | Codebase Auditor — prioritized report on existing projects | opus | `agents/codebase-auditor.md` |
| Yuki | Refactor Specialist — knip/depcheck/ts-prune, dead code removal | sonnet | `agents/refactor-cleaner.md` |
| Rachel | Technical Writer — codemaps, READMEs, guides, keeping docs current | haiku | `agents/doc-updater.md` |

Orchestration rules in `.claude/rules/agents.md` describe automatic invocation and parallel execution.

---

## 4. MCP tools

MCP servers wire external systems into the assistant. Configured via `.mcp.json` (template at `.mcp.json.template`). Four are always on by default. Three more are opt-in during `./setup.sh` with a risk callout.

### Always-on (baseline)

| MCP server | Tools | Scope |
|---|---|---|
| `mempalace` | `mempalace_search`, `mempalace_kg_query`, `mempalace_kg_add`, `mempalace_kg_invalidate`, `mempalace_add_drawer`, `mempalace_diary_write` | Long-term memory. Semantic search over drawers, typed knowledge graph with temporal facts, Athena's own session diary. |
| `google-calendar` | `list_calendars`, `list_events`, `get_event`, `create_event`, `update_event`, `delete_event`, `respond_to_event`, `suggest_time` | Full CRUD over Google Calendar. Source of truth for the user's schedule. |
| `notion` | `notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`, `notion-create-database`, `notion-update-data-source`, `notion-duplicate-page`, `notion-move-pages`, `notion-create-view`, `notion-update-view`, `notion-create-comment`, `notion-get-comments`, `notion-get-users`, `notion-get-teams` | Notion pages, databases, views, comments. Backs bookmark/brain-dump/research/video-ideas skills. |
| `gmail` | `search_threads`, `get_thread`, `create_draft`, `list_drafts`, `create_label`, `list_labels`, `label_message`, `label_thread`, `unlabel_message`, `unlabel_thread` | Gmail read, search, draft, and label management. Never sends — drafts only, by design. |

### Opt-in (informed-consent prompts in `setup.sh`)

| MCP server | Tools | Scope | Gate |
|---|---|---|---|
| `filesystem` | `list_allowed_directories`, `list_directory`, `read_file`, `write_file`, `get_file_info` | Filesystem access under the allowlist from `bot/.env` `ATHENA_FS_ALLOWED`. Source at `bot/src/fs-mcp/server.ts`. Fail-closed — exits if env var missing. | `setup.sh` prompt + allowlist entry |
| `playwright` | Full Playwright browser toolkit | Headless/headed browser automation: navigate, click, fill forms, screenshot, eval JS on any public URL. Can submit forms and interact with logged-in sessions. First run downloads browser binaries (~300MB). | `setup.sh` prompt |
| `computer` | `screenshot`, `click`, `move`, `type`, `key`, clipboard ops, app management | Full mouse / keyboard / screen control on macOS via `@zavora-ai/computer-use-mcp`. Can see anything on screen, click anywhere, type anything. Requires Rust toolchain (first build) and Accessibility + Screen Recording permissions. | `setup.sh` prompt + `ATHENA_COMPUTER_USE=true` |

Risk posture (see `.claude/rules/proactive-rules.md` for the tier definitions): filesystem reads/writes and browser navigation are Green tier when scoped to the allowlist; computer-use screenshots and reads are Green, but any click that could hit Delete / Send / Confirm / Purchase is Yellow tier (propose and wait for approval). See `docs/SETUP.md` section 4 for the full walk-through.

Additional MCP servers may appear in a user's Claude Code install (e.g. `context7` for live library docs, Google Drive, Canva, Miro). Those are not shipped in the template — they are environment-level.

---

## 5. Native Claude Code tools

Built into the runtime. No configuration needed. All are scoped to the project directory or (for Bash) the shell they inherit.

| Tool | One-liner |
|---|---|
| `Read` | Read a file from the local filesystem. Supports text, images, PDFs, Jupyter notebooks. |
| `Write` | Write or overwrite a file at an absolute path. Must Read first if the file exists. |
| `Edit` | Exact-string replacement in a file. Preferred over Write for existing files. |
| `Glob` | Fast file pattern matching across the codebase (e.g. `**/*.ts`). |
| `Grep` | Ripgrep-powered content search across the codebase with regex, file-type filters, and context lines. |
| `Bash` | Execute shell commands. Persists working directory between calls, inherits user's shell profile. |

All file-editing tools operate inside the current project directory. Bash inherits the user's environment but should be used with absolute paths.

---

## 6. Scheduler and Telegram commands

The Telegram bot runs a polling scheduler (`bot/src/scheduler.ts`) — 60s task poll, 30s reminder poll. Scheduled tasks are stored in SQLite; reminders in `bot/reminders.json`. Both fire by sending a Telegram message to the owning `chat_id`.

### Telegram commands

| Command | Purpose |
|---|---|
| `/schedule` | List all scheduled tasks for this chat. |
| `/schedule defaults` | Seed three opt-in recurring jobs: morning briefing (7am), debrief nudge (9pm), weekly review nudge (Sun 5pm). Idempotent. |
| `/schedule create "prompt" "cron"` | Create a custom recurring task. |
| `/schedule pause <id>` / `resume <id>` / `delete <id>` | Task lifecycle. |
| `/chatid` | Get the current chat's Telegram ID. |
| `/voice on` / `off` | Toggle TTS voice replies. |
| `/reminders` | List upcoming reminders (from inline `<set_reminder>` tags Claude emits). |

### Default schedules (`/schedule defaults`)

| Label | Cron | What fires |
|---|---|---|
| Morning briefing | `0 7 * * *` | Calendar today + Gmail triage since 6pm yesterday (urgent/important/noise with 2-sentence draft replies for urgent) + unfinished todos from yesterday's `day-ledger.md`. |
| Evening debrief nudge | `0 21 * * *` | Short Telegram prompt to run `/debrief` in Claude Code. |
| Weekly review nudge | `0 17 * * 0` | Sunday 5pm prompt to run `/weekly-review` in Claude Code. |

Prompts and dedup markers live in `bot/src/scheduler.ts` `DEFAULT_SCHEDULES`. Re-running `/schedule defaults` is safe — existing entries are skipped by marker match.

---

## 7. Hooks

Shell scripts in `.claude/hooks/`. Fire on Claude Code session lifecycle events.

| Hook | When it runs | What it does |
|---|---|---|
| `session-start.sh` | Every new Claude Code session | Reads `personal/.last-session` for the previous session's end time and stale/unmined flags. Injects a notice into context if the last session ended without updating `snapshot.md` or without mining to MemPalace. Cleans up the flag file afterward. |
| `session-stop.sh` | When a Claude Code session ends | Reads the stop reason from stdin. Writes `personal/.last-session` with `last_ended`, `stop_reason`, and a `snapshot_stale` flag based on whether `snapshot.md` was modified in the last 3 hours. Triggers the MemPalace conversation-mining step so nothing is lost between sessions. |

---

## Want to add a new skill?

1. Read `.claude/rules/architecture.md` — specifically the "How to Write Skills" section. It covers frontmatter format, description style, and the negative-boundaries requirement.
2. Fire the `self-upgrade` skill. It handles safe self-modification: reads the existing system first, checks for security issues, applies one change at a time, and logs the addition in `snapshot.md`.
3. Decide whether the new capability is a **rule** (always-on behavior) or a **skill** (triggered on demand). Never bolt unrelated behavior onto an existing file.
4. Test the capability in one session before considering it stable.
