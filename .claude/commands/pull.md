---
description: Load a brainstorming session handoff into the current build session and route to /plan.
---

# /pull — Pull In Brainstorm Context

Also triggers when you say: "pull in that session", "load the brainstorm", "bring in what we discussed", "load the context", "what did we decide before?", "bring over the decisions", "load the handoff", "pull in the other session"

Bridges brainstorm sessions into build sessions. Reads handoff files written by /wrap and feeds them into /plan — never directly to build.

## Process

1. **Check** `context/sessions/` for files with `status: ready`

2. **If none found:**
   Say: "No ready handoffs in context/sessions/. If you wrapped a brainstorm session, run /wrap [topic] there first."
   Stop.

3. **If one file found:** Load it automatically. Skip the selection prompt.

4. **If multiple files found:** Present a numbered list:
   ```
   Ready handoffs:
   1. 2026-03-23 14:30 — paul-workflow
   2. 2026-03-22 10:15 — auth-redesign

   Which one? (type a number or topic name)
   ```
   Wait for your choice.

5. **Read the chosen file in full.**

6. **Brief** in plain English:
   - What the session was about (2 sentences max)
   - Key decisions (bullet list)
   - The Build Brief — what needs to be built
   - Any open questions that need an answer before planning

7. **Surface open questions first** — if the file has unresolved questions, ask for answers before routing to /plan. Do not proceed to planning until they're resolved.

8. **Check for conflicts** — if the Build Brief conflicts with current priorities in `context/STATUS.md`, flag it:
   "This handoff asks for [X] but STATUS.md shows [Y] as current priority. Which takes precedence?"

9. **Route to planning:**
   Say: "Handoff loaded. Run /plan or say 'plan this' and the team will use this build brief as the starting point."

10. **Update the file** — set `status: imported` and `imported_at: [current timestamp]`

## Rules

- NEVER route directly to build — always through /plan first
- Keep the handoff content in active context through the entire planning phase
- If the file references external documents (PDFs, Excel), confirm they exist before planning starts
- After loading, the handoff Build Brief becomes the input to /plan — the planner should treat it as the feature request
