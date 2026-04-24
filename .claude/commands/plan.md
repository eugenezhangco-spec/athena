---
description: Activate the planner to break down a feature or task into buildable steps. WAIT for approval before any code.
---

# /plan — How Do We Move Forward on This?

Also triggers when you say: "how do you want to move forward?", "what do you guys think?", "is this the right approach?", "what should we focus on?", "plan this out", "plan this"

This command activates **Jake** (lead planner) and **Sara** (lead architect).

## Process

1. **Restate** what's being requested in clear terms
2. **Read** `context/STATUS.md` to understand current project state
3. **Check** if a `/pull` handoff is loaded — if so, use the Build Brief as the feature request
4. **Check** existing code to understand what's already built
5. **Break down** the work into specific, ordered tasks
6. **Analyse task dependencies** — which tasks touch the same files? Which tasks depend on others being done first?
7. **Group tasks into waves** — tasks that share files or functionality go in the same wave. Independent waves can be built in separate sessions.

## Output Format

### What We're Building
One paragraph explaining the feature/task in plain English.

### Wave Map

Group all tasks into waves. Show the dependency between waves.

```
Wave 0: [Foundation] — must be done first
  → Task 1, Task 2
Wave 1: [Feature group name] — depends on Wave 0
  → Task 3, Task 4, Task 5
Wave 2: [Feature group name] — depends on Wave 0, independent of Wave 1
  → Task 6, Task 7
Wave 3: [Integration/polish] — depends on Wave 1 + Wave 2
  → Task 8
```

**Wave grouping rules:**
- Tasks that touch the **same files** go in the **same wave** (the agent already has those files in context — more efficient)
- Tasks with **no shared dependencies** go in **separate waves** (can be done in separate sessions)
- Wave 0 is always foundation work (schemas, types, shared utilities) that other waves depend on
- Final wave is always integration, polish, or wiring things together

### Tasks (in order, grouped by wave)

**Wave 0: [Foundation]**

**Task 1: [name]**
- **What gets built** — one sentence
- **Why** — how it connects to the bigger picture
- **Files involved** — which files get created or changed
- **Dependencies** — what must exist first, or "none"
- **Acceptance Criteria**
  - Given [starting context or state] / When [action taken] / Then [expected outcome]
  *(Add one Given/When/Then per meaningful check. Be specific enough that the team can verify it without asking.)*

**Task 2: [name]**
[same structure]

**Wave 1: [Feature group name]**

**Task 3: [name]**
[same structure]

...and so on for each wave.

### Boundaries (DO NOT CHANGE)
Explicit list of what must not be touched during this build:
- Files that are off-limits
- Behaviours that must not change
- Assumptions that must not be made
- Any constraints from a /pull handoff

### Risks
- What could go wrong
- What we're unsure about
- What might need a decision mid-build

### Estimated Scope
- **Small** (1-2 tasks, single wave) — build in one session
- **Medium** (3-5 tasks, 1-2 waves) — build in one session
- **Large** (6+ tasks, 3+ waves) — build wave by wave, one session per wave

## Rules

- **NEVER write code before approval ("go", "yes", or "proceed")**
- **Always group tasks into waves**, even for small plans (a small plan is just one wave)
- If the plan is Large (3+ waves), recommend building one wave per session and ask which wave to start with
- If requirements are unclear, ask 3 questions maximum before proposing a plan
- Reference the current phase from STATUS.md — don't plan work that belongs to a future phase unless asked

## After Approval

Once approved:

### For Small/Medium plans (1-2 waves):
Write a **single PLAN file** to `context/builds/YYYY-MM-DD-HHMM-[topic]-PLAN.md`.

### For Large plans (3+ waves):
Write a **master PLAN file** and **one PLAN file per wave**:

**Master file:** `context/builds/YYYY-MM-DD-HHMM-[topic]-PLAN.md`
```
---
topic: [topic name]
date: YYYY-MM-DD
time: HH:MM
phase: [current phase from STATUS.md]
status: in-progress
type: master
total_waves: [number]
---

## What We're Building
[One paragraph in plain English]

## Wave Map

| Wave | Name | Tasks | Depends On | Status |
|------|------|-------|------------|--------|
| 0 | [Foundation] | Task 1, Task 2 | — | not-started |
| 1 | [Feature group] | Task 3, Task 4, Task 5 | Wave 0 | not-started |
| 2 | [Feature group] | Task 6, Task 7 | Wave 0 | not-started |
| 3 | [Integration] | Task 8 | Wave 1, Wave 2 | not-started |

## Boundaries (DO NOT CHANGE)
- [explicit list — applies to ALL waves]

## Risks
- [what could go wrong]
```

**Per-wave file:** `context/builds/YYYY-MM-DD-HHMM-[topic]-wave-0-PLAN.md`
```
---
topic: [topic name]
date: YYYY-MM-DD
time: HH:MM
wave: 0
wave_name: [Foundation]
depends_on: []
master_plan: YYYY-MM-DD-HHMM-[topic]-PLAN.md
status: in-progress
---

## What This Wave Builds
[1-2 sentences — what this wave accomplishes and why it must be done first]

## Context for a Fresh Session
[Brief summary of the overall project, what's already built, and what this wave's role is.
Written so that a fresh agent can read this file cold and know exactly what to do — no conversation context needed.]

## Tasks

### Task 1: [name]
**Files:** [list of files to create or modify]
**Dependencies:** [what must exist first, or "none"]
**Acceptance Criteria:**
- Given [starting state] / When [action taken] / Then [expected outcome]

### Task 2: [name]
[same structure]

## Boundaries (DO NOT CHANGE)
- [from master plan — repeated here so a fresh session has them]

## Files Touched in This Wave
[Complete list of every file that will be created or modified — the agent should load all of these at the start of the build]
```

### After writing PLAN files:

1. **Hand off** to the right team member:
   - **Max** for implementation (tests first)
   - **Liam** for frontend work
   - Or both, depending on the task
2. For Large plans: ask which wave to start with (recommend Wave 0)
3. Build one wave at a time — run reconciliation after each wave

## Post-Build Reconciliation (Mandatory — runs after each wave)

When a wave is complete (or all tasks for a small plan), before anything else, output this reconciliation report:

```
RECONCILIATION CHECK
════════════════════════════════════
Plan: context/builds/[PLAN filename]
Wave: [N] — [wave name] (or "all" for single-wave plans)

Task 1: [name]
  Status: ✅ Built as planned
  Notes: —

Task 2: [name]
  Status: ⚠️ Changed
  What changed: [specific description]
  Why: [reason]

Task 3: [name]
  Status: ❌ Skipped
  Reason: [why it wasn't done]

────────────────────────────────────
Verdict: CLEAN / DEVIATIONS FOUND
[If CLEAN]: Everything matches the plan. Handing to Aisha for QA.
[If DEVIATIONS]: X deviation(s) found. Approve to continue, or flag for fix?
```

Wait for sign-off on any ⚠️ or ❌ items before proceeding.

**After wave reconciliation:**
- Update the wave PLAN file status to `complete`
- Update the master PLAN wave map status
- If more waves remain: ask if continuing in this session or picking up in a fresh one
- If all waves done and reconciliation is CLEAN: **immediately run `/qa` without waiting to be asked.** Aisha takes over. Do not prompt the user — just hand off and run it.

**Starting a new session for the next wave:**
If context is running low or a fresh session is preferred:
1. Run `/update` to save progress
2. In the new session, run `/status`
3. The team reads the master PLAN, sees which wave is next, loads that wave's PLAN file
4. Build continues from where it left off — no context lost

## Integration

- Start with `/plan`, then say "go" or "build it" or "yes"
- After each wave's reconciliation: continue to next wave or close out
- After final wave: `/devils-advocate` → `/review` → `/verify` → `/update`
