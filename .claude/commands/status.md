---
description: Read STATUS.md and brief the user on current project state, what was last worked on, and what's next.
---

# /status — Where Are We At?

Also triggers when the user says: "where are we at?", "what do you know so far?", "where were we?", "are you guys updated?", "what was the latest thing", "catch me up", "bring me up to speed", "what did we do last time", "what's going on", "what are we working on", "what's next", "what's happening", "get me up to speed"

When this command is invoked:

1. **Read** `context/STATUS.md` — this is the single source of truth
2. **Read** `context/ACTION-ITEMS.md` — the persistent action item tracker
3. **Read** `context/decisions/` — check for recent decisions
4. **Check** `context/inbox/` — flag any unprocessed files
5. **Check** `context/sessions/` — flag any handoff files with `status: ready`

Then present a brief in plain English:

## Output Format

### Where We Are
- Current phase and what's been completed
- Last thing that was worked on and its status

### What's Next
- The immediate next task or priority
- Any blockers or open questions

### Action Items
- Count of open items by priority (e.g., "2 critical, 3 high, 5 medium")
- List all **critical** and **high** priority items by ID and title
- Flag any **blocked** items and what's blocking them
- Flag any **stale** items (untouched 30+ days) that need a relevance decision
- If no action items exist yet, say "No action items tracked yet."

### Inbox
- Any unprocessed files in context/inbox/ (or "Inbox clear" if empty)

### Pending Handoffs
- Any files in context/sessions/ with `status: ready` (or omit this section if none)
- If found: "You have a ready handoff from [date] — [topic]. Run /pull to load it into this session."

### Team Notes
- Any decisions or context changes since last session

Keep it short. the user should be able to read this in 30 seconds and know exactly where things stand.

If STATUS.md doesn't exist or is empty, say so and ask the user what the current state is.
