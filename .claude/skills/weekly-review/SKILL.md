---
name: weekly-review
description: Runs a structured weekly review session where the assistant asks the user about their week, updates all context files, audits backlogs, and sets priorities for next week. Use this skill whenever the user says 'let's do the weekly review', 'weekly review', 'weekly check-in', 'let's review the week', 'end of week review', or 'how did this week go'. Also activates when the user wants to audit and clean up context files, update stale metrics, or align on priorities. Do NOT use for daily planning (use day-planner). This is the assistant and user sitting down once a week to get everything current.
---

# Skill: Weekly Review
# Trigger: "Let's do the weekly review", "weekly review", "weekly check-in"

---

## What This Skill Does

A structured 30-60 minute session between the assistant and the user. The assistant asks, the user answers, the assistant updates. The goal: every context file, flag, and backlog stays current. No stale data. No assumptions. Any new session that reads snapshot.md after a weekly review has an accurate picture of where things stand.

---

## Dependencies (Load Before Running)

Read these files before starting:
1. `personal/snapshot.md` (current flags and last session)
2. `personal/day-ledger.md` (this week's plan + debrief entries -- the primary data source for what happened)
3. `personal/patterns.md` (behavioral observations with lifecycle states)
4. `.claude/rules/proactive-rules.md` (guardrail tiers and proactive triggers)
5. `.claude/rules/evolution.md` (self-check protocol)

Query these external sources during the review:
- Task database: active tasks, completed this week, stale items (across all categories)
- Calendar: past week events (what actually happened vs what was planned)

---

## The 7-Phase Review

Run every phase in order. Each phase has specific questions the assistant asks the user. Do not skip phases. Do not rush. This is the one time per week everything gets audited.

### Phase 1: Check-in (5 min)

Purpose: Get the human read on the week before looking at data.

The assistant asks:
1. "How did this week feel? One word."
2. "What was the win of the week?" (one thing that moved the needle)
3. "What drained you the most?" (one thing that took more energy than it should have)

Listen. Do not optimize yet. This sets the emotional context for the rest of the review.

### Phase 2: Metrics and Facts (10 min)

Purpose: Update things the assistant cannot verify on its own. Go through each one and ask directly.

The assistant asks about each metric it cannot track automatically:
1. "Content/visibility: how many posts or outreach actions went out this week?" (update snapshot if needed)
2. "Key conversations: any new ones since last review?" (update count)
3. "Revenue: any money come in this week?" (update if changed)
4. "Active leads: any movement?" (update flags)
5. "Anything else happen this week I should know about?" (catch-all for things not mentioned in sessions)

Update snapshot.md flags with whatever the user reports. Remove resolved flags. Add new ones.

### Phase 3: Backlog Audit (10 min)

Purpose: Query the task database and clean up what is stale.

Do this for each task category:

**Primary Projects:**
- Query active tasks. Show the user the list.
- Flag anything older than 14 days with no progress: "This has been sitting for [X] days. Keep, kill, or reprioritize?"
- Flag any P1 tasks not in "Doing" status.
- Check for duplicates.

**Personal Life:**
- Query active tasks. Show the user the list.
- Flag anything overdue or stale.
- "Anything here that is done but not marked done?"

**Work Tasks (if applicable):**
- Query active tasks. Show the user the list.
- Flag overdue items.
- "Any new items or issues this week?"

For each stale item, offer three options: (a) keep as-is, (b) reprioritize, (c) archive/close.

### Phase 4: Calendar Review (5 min)

Purpose: Compare what was planned vs what actually happened.

- Read this week's day-ledger.md entries first. If debriefs were committed, the plan-vs-reality data is already captured. Use it.
- Pull last week's calendar events across all calendars to fill gaps (days without debriefs).
- Estimate: how many hours went to each priority area?
- Compare against the target time split (from goals or framework files).
- If project hours are under target, name it: "You got [X] project hours this week. Target is [Y]. What got in the way?"
- If work expanded beyond normal, name it: "Work took [X] hours this week. Is that temporary or a trend?"
- Note which days had debriefs and which did not. If debrief coverage is under 50%, flag it: "Only [X] of 7 days had debriefs. The loop works best when it runs daily."

### Phase 5: Patterns Check (5 min)

Purpose: Share behavioral observations and validate them with the user.

- Review patterns.md. Are existing patterns still accurate?
- Share any new observations from this week's sessions (things noted in snapshot.md flags as "watching").
- If an observation has been confirmed twice, promote it to patterns.md.
- If a pattern is no longer true, update or remove it.
- Ask: "Anything you have noticed about yourself this week that I should know?"

### Phase 6: Architecture Hygiene (5 min)

Purpose: Keep the assistant's files clean and current.

- Check inbox.md: any pending items that should be actioned or archived?
- Check snapshot.md: are all flags still relevant?
- Check if any on-demand files were loaded in 5+ consecutive sessions (should they be promoted to always-loaded?)
- Check if any always-loaded content was not used in recent sessions (should it move to on-demand?)
- Flag any files that feel bloated or stale.
- Ask: "Anything about how I work that felt off this week? Too noisy? Missing something?"

### Phase 7: Next Week Setup (10 min)

Purpose: Set the priorities for the coming week.

The assistant asks:
1. "What are the top 3 things that matter next week?" (the user decides, the assistant does not assume)
2. "Any deadlines I should watch?" (add to flags)
3. "Any people you need to follow up with?" (add to flags)
4. "Anything you want me to proactively push you on?" (update proactive approach)

After the user answers:
- Update snapshot.md with new flags and next-week priorities.
- Update patterns.md if new observations were confirmed.
- Update inbox.md (action or archive pending items).
- Note the review date in snapshot.md: "Last review: [date]. Next: [date + 7 days]."

---

## After the Review

1. Summarize what was updated in one clean block:
   - Files updated: [list]
   - Flags added: [list]
   - Flags resolved: [list]
   - Tasks archived/closed: [count]
   - Patterns added/updated: [list]

2. End with one observation. Something human. Not a task. A read on the week.

3. Set the next review date. Suggest the same day/time next week.

---

## Rules

- The assistant asks. The user answers. The assistant updates. That is the flow.
- Never assume a metric. If the assistant does not know, it asks.
- Never skip the check-in phase. The human read matters.
- Keep each phase moving. If the user gives a one-word answer, accept it and move on.
- This is not a performance review. It is two people getting current. Warm, direct, efficient.
- If the user wants to skip a phase, let them. Note what was skipped in the summary.
- All updates happen during the session, not after. The user should see changes in real time.
