---
description: Close a brainstorming session and export all decisions to a structured handoff file for import into a build session.
argument-hint: [topic-slug] (e.g., paul-workflow, auth-redesign, api-connector)
---

# /wrap — Close This Brainstorm

Also triggers when you say: "wrap this up", "save this session", "we're done here", "export this", "close out this brainstorm", "let's conclude", "save what we decided", "lock this in"

Closes a brainstorming session cleanly. Extracts every decision and conclusion from the conversation and writes a structured handoff file that a fresh build session can read cold — no conversation context needed.

## When to Use

At the END of a brainstorming session, after decisions are made. The output lands in `context/sessions/` and gets loaded by `/pull` in the build session.

## Process

1. **Review the full conversation** and extract:
   - What this brainstorm was about
   - Every decision made (final state — not the journey, not "we considered X and Y")
   - What needs to be built (the Build Brief)
   - What must NOT change or be assumed (Constraints and Boundaries)
   - Any open questions not yet resolved
   - Any files, documents, prior sessions, or external resources referenced

2. **Generate the filename:**
   Format: `YYYY-MM-DD-HHMM-[topic-slug].md`
   Use today's date and current time. Use $ARGUMENTS as the topic slug.
   If no argument provided: derive a short slug from the main conversation topic (e.g., `workflow-upgrade`).

3. **Write the file** to `context/sessions/[filename]`

4. **Confirm** — show the filepath and a 3-bullet summary of what was captured. Ask if you want to review the file before closing.

## Output File Format

```
---
topic: [topic name]
date: YYYY-MM-DD
time: HH:MM
status: ready
imported_at: null
---

## What This Session Was About
[1-2 sentences. Why this brainstorm happened. What problem it addressed.]

## What Was Decided
[Bullet list. Written as directives, not discussion summaries.
CORRECT: "Use PAUL reconciliation pattern, not full PAUL install"
WRONG: "We talked about PAUL and GSD and decided to use the reconciliation pattern"]

## Build Brief
[What needs to be built. Specific and discrete. Written for AI consumption —
a fresh session should be able to plan from this without needing the conversation.
Each item is a separate buildable thing. If it's vague, break it down further.]

## Constraints and Boundaries
[What NOT to do. What must not change. Assumptions that must not be made.
These are as important as the Build Brief. Be explicit.]

## Open Questions
[Anything unresolved that the user needs to decide before or during planning.
If all decisions are made: "None — all decisions made."]

## Context Referenced
[Files, documents, prior sessions, external resources that informed this brainstorm.
Include paths where known: context/requirements/..., context/decisions/..., etc.]
```

## Rules

- Write for an AI reading cold — assume zero conversation context
- Build Brief items must be discrete and actionable ("add /wrap command to .claude/commands/" not "improve the system")
- Constraints are as important as Build Brief — never skip this section
- After writing, confirm the filepath and ask if you want to review before closing
- Status must be set to `ready` — this signals the file is available for /pull
