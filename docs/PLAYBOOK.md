# Playbook

Your cheat sheet. Keep this open until the workflow is second nature.

---

## The pipeline

Every build session follows this flow. Each step checks the work before passing it forward.

```
  /status ──> /inbox ──> /pull ──> /plan ──> BUILD ──> /devils-advocate ──> /review ──> /verify ──> /update
     |           |          |         |        |              |                |           |           |
  Check in    Process    Load      Break    Tests &        Debate           Security    Run tests    Save
              new docs   brainstorm into     code           the code         + quality   + check      for
                         notes     steps                                    checklist   requirements  next
                                    |                                                      |         time
                                YOU APPROVE                                          PASS / FAIL
```

---

## Quick decision tree

```
  "What should I do?"
       |
       ├── Just opened a session ──────────> /status
       ├── Have new files / documents ─────> /inbox
       ├── Brainstormed earlier ───────────> /pull
       ├── Ready to build something ───────> /plan
       ├── Code is written ────────────────> /devils-advocate then /review
       ├── Need to check if tests pass ────> /verify
       ├── Done for today ─────────────────> /update
       ├── Thinking, not building ─────────> just talk (then /wrap when done)
       ├── Build is broken ────────────────> paste the error
       ├── Is the codebase healthy? ───────> /audit
       ├── Ready to ship ─────────────────> /deploy
       └── What just happened? ────────────> /explain
```

---

## Two session types

```
  ┌────────────────────┐          ┌────────────────────┐
  │   BRAINSTORM       │          │   BUILD            │
  │                    │  /wrap   │                    │
  │   Think, explore,  │ ──────> │   Plan, code,      │
  │   decide.          │  /pull   │   test, ship.      │
  │                    │ <────── │                    │
  │   Ends: /wrap      │          │   Ends: /update    │
  └────────────────────┘          └────────────────────┘
```

**Brainstorm** = thinking out loud. No structure needed. End with `/wrap [topic]` to save your decisions.

**Build** = executing. Follow the pipeline. End with `/update` to save progress.

Keep them separate. The `/wrap` -> `/pull` bridge connects them cleanly.

---

## All commands

### Every session (mandatory)

| Command | What it does |
|---------|-------------|
| `/status` | Reads the project dashboard. Start every session here. |
| `/update` | Saves all progress, decisions, and context. End every session here. |

### The build pipeline (in order)

| Command | What it does | Analogy |
|---------|-------------|---------|
| `/inbox` | Reads new documents from context/inbox/. Briefs you. Files them. | A secretary who reads your mail and gives you the highlights. |
| `/pull` | Loads a brainstorm handoff into the build session. | Picking up the notes from yesterday's whiteboard session. |
| `/plan` | Breaks work into tasks with checklists. Waits for your OK. | An architect drawing blueprints before construction starts. |
| `/devils-advocate` | Two engineers argue about the code across 6 topics. | Stress-testing a bridge before opening it to traffic. |
| `/review` | Security + quality checklist. Verdict: APPROVE / WARNING / BLOCK. | A building inspector checking the electrical and plumbing. |
| `/verify` | Runs tests + checks every requirement. Verdict: PASS / PARTIAL / FAIL. | Final inspection: does it match the approved blueprints? |

### Brainstorm tools

| Command | What it does |
|---------|-------------|
| `/wrap [topic]` | Saves all decisions from a brainstorm as a structured handoff file. |
| `/pull` | Loads that handoff into a build session and routes to `/plan`. |

### On-demand tools

| Command | When to use | What it does |
|---------|-------------|-------------|
| `/audit` | Health checks, milestone moments | Full codebase review against original requirements. |
| `/deploy` | Ready to ship | Pre-flight checklist: tests, security, quality. |
| `/milestone` | Progress reports | Creates a formal milestone summary. |
| `/report` | View progress | Shows the master report (read-only). |
| `/explain` | Confused about what happened | Plain English breakdown of recent changes. |
| `/humanizer` | Rewriting AI-sounding text | Removes AI writing patterns from any draft. |
| `/pipeline` | Data ingestion | Runs the data pipeline from configured sources. |
| `/golden` | Data quality check | Confirms data records are correct. |

---

## What fires automatically

You don't trigger these — they happen on their own.

| When | What happens |
|------|-------------|
| Session starts | Team loads STATUS.md, checks inbox, shows action items summary |
| First-ever session | Auto-onboarding kicks in (setup flow) |
| Build completes | Reconciliation: did we build what the plan said? |
| Session ends | Reminder to run `/update` if you haven't |

---

## The team

Describe what you want. The right specialist activates. You don't name them.

```
  LEADERS                    BUILDERS                  REVIEWERS
  ─────────                  ────────                  ─────────
  Strategist                 TDD Guide                 Code Reviewer
  Planner                    UI Builder                Security Reviewer
  Architect                  Data Engineer             Database Reviewer
                             Build Fixer               Codebase Auditor

                             SUPPORT
                             ───────
                             E2E Runner (tests)
                             Refactor Cleaner
                             Doc Updater
```

| You say | Who activates |
|---------|--------------|
| "Plan this feature" | Planner + Architect |
| "Build it" / "Go" | TDD Guide + UI Builder |
| "The build is broken" | Build Fixer |
| "Check security" | Security Reviewer |
| "Review the code" | Code Reviewer |
| "This query is slow" | Database Reviewer |
| "Explain what you did" | Explainer |
| "Clean this up" | Refactor Cleaner |

---

## The rules

1. **The team asks before building.** They show the plan and wait for your "go."
2. **Always `/update` before closing.** Skip it and the next session starts from scratch. It's like saving your game.
3. **`/verify` includes running tests.** You don't need to run `/test` separately.
4. **`/devils-advocate` comes before `/review`.** Structural problems first, checklist second.
5. **`/audit` is for milestone moments.** It's heavy. Save it for health checks, not daily use.
6. **Drop files, don't explain them.** Put them in `context/inbox/`, say "check the inbox." The team reads and briefs you.
7. **Brainstorm and build are separate sessions.** Think in one, execute in another. `/wrap` and `/pull` connect them.
