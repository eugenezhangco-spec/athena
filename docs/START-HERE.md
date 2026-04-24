# Start Here

You just downloaded your engineering team. This guide explains what you have, how to start, and how things work. Read it once; after that, everything is conversational.

---

## What is this?

Think of this folder like hiring a 14-person engineering team that lives inside your computer. Instead of one AI assistant that does everything okay, you get specialists:

- **Maya** (strategist) translates your business idea into a technical plan
- **Jake** (planner) breaks work into steps with checklists
- **Sara** (architect) designs how the pieces fit together
- **Max** (test engineer) writes tests first, every time
- **Liam** (frontend) builds the interfaces you and your users see
- **Elena** (security) checks for vulnerabilities before anything ships
- **Nina** (code reviewer) catches bugs and bad patterns
- **Aisha** (QA) runs end-to-end browser tests
- **Tom** (DevOps) fixes builds when they break
- Plus **Yuki** (refactoring), **Rachel** (docs), **Andre** (database), **Fatima** (data), and **Dave** (auditing)

You never have to call them by name. Describe what you want, and the right person activates. See `docs/TEAM.md` for the full org chart.

**The key difference from regular AI coding:** This team has guardrails. Code gets planned before it's built. It gets reviewed after it's built. Tests prove it works. Security gets checked. Nothing ships without passing through multiple quality gates. This is how professional software teams operate — except these specialists work 24/7 and never forget context.

---

## How to start

### Step 1: Open the folder in Claude Code

If using the terminal:
```
cd path/to/this/folder
claude
```

If using VS Code or Cursor: open this folder, then open the Claude Code panel.

### Step 2: Send any message

That's it. The team detects it's a new project and starts onboarding automatically. It'll ask:

1. **Are you building something new?** — The team plans from scratch.
2. **Do you have existing code?** — The team reads your code, runs a health check, and tells you what's good, what's broken, and what to fix first.

The setup takes about 2 minutes. After that, you're building.

---

## The two types of sessions

Every time you open Claude Code, you're in one of two modes:

```
 ┌─────────────────────────────────────────────────────────┐
 │                                                         │
 │   BRAINSTORM SESSION          BUILD SESSION             │
 │   ==================          =============             │
 │                                                         │
 │   Think, explore, decide.     Execute. Write code.      │
 │   No rules. Talk freely.      Follow the workflow.      │
 │                                                         │
 │   End with:                   End with:                 │
 │   /wrap [topic]               /update                   │
 │                                                         │
 │   Your decisions get saved    Your code gets saved       │
 │   as a handoff file.          to the project.           │
 │           |                          ^                   │
 │           |     /pull loads it       |                   │
 │           └──────────────────────────┘                   │
 │                                                         │
 └─────────────────────────────────────────────────────────┘
```

**Brainstorm** = thinking. **Build** = doing. Keep them separate. The `/wrap` and `/pull` system bridges them so nothing gets lost.

---

## The build workflow (visual)

When you're in a build session, the work moves through a pipeline. Each step checks the work before passing it to the next one. Think of it like a factory assembly line — each station has a specific job.

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                    THE BUILD PIPELINE                            │
 │                                                                  │
 │  /status ──> /inbox ──> /pull ──> /plan ──> BUILD               │
 │     |           |          |         |        |                  │
 │  "Where      "Any new    "Load    "Break    Tests               │
 │   are we?"   docs?"     brainstorm work    first,               │
 │                          notes"   into     then                  │
 │                                  steps"    code                  │
 │                                    |        |                    │
 │                              YOU APPROVE    |                    │
 │                              THE PLAN       |                    │
 │                                             v                    │
 │  /update <── /verify <── /review <── /devils-advocate           │
 │     |           |           |              |                     │
 │  "Save       "Run tests  "Security     "Two engineers           │
 │   everything  + check     + quality      argue about             │
 │   for next    every       checklist"     the code"               │
 │   time"       requirement"                                       │
 │                  |                                                │
 │            PASS / FAIL                                           │
 │                                                                  │
 └──────────────────────────────────────────────────────────────────┘
```

**You don't need to memorize this.** The team knows the order. Just follow along. But here's what each step does:

| Step | Command | What it does (in plain English) |
|------|---------|-------------------------------|
| 1 | `/status` | Checks in. "Where are we? What was the last thing we worked on? What's next?" |
| 2 | `/inbox` | Reads any new documents you dropped in the inbox folder. Briefs you on what's new. |
| 3 | `/pull` | Loads decisions from a brainstorm session (if you had one). |
| 4 | `/plan` | Breaks the work into tasks with checklists. Shows you the plan. **Nothing gets built until you say "go."** |
| 5 | Build | The team writes tests first (to prove things work), then writes the code. Automatic. |
| 6 | `/devils-advocate` | Two engineers argue about the code. One defends it, one attacks it. Finds problems before testing. |
| 7 | `/review` | Security and quality checklist. Gets a verdict: APPROVE, WARNING, or BLOCK. |
| 8 | `/verify` | Runs all tests and checks every requirement from the plan. Verdict: PASS, PARTIAL, or FAIL. |
| 9 | `/update` | Saves everything — decisions, progress, context — so the next session picks up right where this one ended. |

---

## When to use which command (decision tree)

Not sure what to do? Start here:

```
  What do you need?
       |
       ├── "I just opened a new session"
       │        └── /status  (always start here)
       │
       ├── "I have new documents / files / notes"
       │        └── Drop them in context/inbox/, then /inbox
       │
       ├── "I brainstormed last time, now I want to build"
       │        └── /pull  (loads your brainstorm decisions)
       │
       ├── "I want to build a new feature"
       │        └── /plan  (breaks it into steps)
       │
       ├── "The code is done, is it any good?"
       │        └── /devils-advocate  then  /review
       │
       ├── "Do the tests pass?"
       │        └── /verify  (runs tests + checks requirements)
       │
       ├── "I'm done for today"
       │        └── /update  (saves everything, never skip this)
       │
       ├── "I was just thinking out loud, save my decisions"
       │        └── /wrap [topic]  (saves brainstorm as handoff)
       │
       ├── "The build is broken / there are errors"
       │        └── Just paste the error or say "the build is failing"
       │
       ├── "Is the codebase healthy?"
       │        └── /audit  (full health check)
       │
       ├── "Explain what you just did"
       │        └── /explain  (plain English breakdown)
       │
       └── "I want to ship this"
                └── /deploy  (pre-flight checklist)
```

---

## The context system (your project's memory)

Everything your team knows lives in the `context/` folder. Think of it as a filing cabinet:

```
  context/
     |
     ├── STATUS.md ............ The dashboard. "Where are we right now?"
     ├── ACTION-ITEMS.md ...... The to-do list. Every task, tracked.
     ├── inbox/ ............... Drop zone. Put new files here.
     │
     ├── sessions/ ............ Brainstorm handoffs (from /wrap)
     ├── builds/ .............. Build records (plans + results)
     ├── decisions/ ........... Why we chose what we chose
     ├── requirements/ ........ What needs to be built
     ├── communications/ ...... Emails, meeting notes, call summaries
     └── archive/ ............. Old documents (read once, kept forever)
```

**How to use it:**
- **Got a PDF, email, or spec?** Drop it in `context/inbox/` and say "check the inbox."
- **Want to know where things stand?** The team reads `STATUS.md` automatically at the start of every session.
- **Wondering why something was built a certain way?** Check `context/decisions/`.

You don't need to organize anything yourself. The team reads, files, and cross-references everything.

---

## Giving the team context (it's just talking)

You don't need to write formal specs. Talk naturally:

- "I had lunch with my partner today and he said we should prioritize the mobile view."
- "Here's an email thread from the client — they want SSO by April."
- "We should also fix that bug where the dashboard takes forever to load."

The team captures all of this. Verbal context gets saved to `context/communications/`. Action items get tracked in `ACTION-ITEMS.md`. Nothing gets lost.

---

## For an existing codebase

If you already have code (from VibeCoding, another tool, or a developer):

1. Run setup (happens automatically on first message)
2. Tell the team where the code is
3. The team runs `/audit` — a full health check that tells you:
   - What's working
   - What's broken
   - Security issues
   - What to fix first
4. Drop any existing documents into `context/inbox/`
5. Start building from there

The team doesn't judge how the code was written. It reads it, understands it, and helps you make it production-ready.

---

## Commands at a glance

### Every session
| Command | When | What it does |
|---------|------|-------------|
| `/status` | Start of every session | Checks in, shows where things stand |
| `/update` | End of every session | Saves everything for next time |

### Building
| Command | When | What it does |
|---------|------|-------------|
| `/plan` | Before building anything | Breaks work into steps, waits for your OK |
| `/devils-advocate` | After code is written | Two engineers debate the code |
| `/review` | After debate | Security and quality checklist |
| `/verify` | Final check | Runs tests and verifies requirements |

### Context
| Command | When | What it does |
|---------|------|-------------|
| `/inbox` | When you have new documents | Reads, briefs you, files everything |
| `/wrap [topic]` | End of a brainstorm | Saves decisions as a handoff |
| `/pull` | Start of a build | Loads brainstorm decisions |

### Occasional
| Command | When | What it does |
|---------|------|-------------|
| `/audit` | Health checks | Full codebase review |
| `/deploy` | Ready to ship | Pre-flight checklist |
| `/milestone` | Progress reports | Formal milestone summary |
| `/explain` | Confused | Plain English breakdown of what happened |

---

## Tips

1. **You don't need to memorize commands.** Just describe what you want. The team figures out which command to run.
2. **Always end with `/update`.** Skip it and the next session starts cold. It's like saving your game.
3. **Keep brainstorming and building separate.** Think in one session, build in another. The `/wrap` and `/pull` system connects them.
4. **Drop files, don't explain them.** Put a client email in the inbox and say "check the inbox." The team reads it and briefs you.
5. **Nothing ships without your approval.** The team shows you the plan and waits. You're always in control.
