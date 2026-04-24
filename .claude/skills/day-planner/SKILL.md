---
name: day-planner
description: Runs structured planning sessions that map the user's day to their priority framework, delegation triage, goals-aware mentorship, and productivity principles. Two modes -- Evening (primary, plans tomorrow) and Morning (lightweight, confirms last night's plan). Use this skill whenever the user says 'let's plan tomorrow', 'help me structure my day', 'what should I focus on tomorrow', 'night-before planning', 'plan my day', 'help me prioritise tomorrow', 'what should I work on', 'build my schedule for tomorrow', 'how should I structure today', 'what's on my plate today', 'morning', or 'good morning'. Also activates when the user asks for a full daily plan across their priority areas. Do NOT use for creating individual calendar events (use calendar-manager). Output is a structured daily plan with time blocks, triage, gap analysis, and a mentorship push.
---

# Skill: Day Planner

## Dependencies (Load Before Running)
- `personal/snapshot.md` -- current state, flags, active priorities (FIRST)
- `personal/day-ledger.md` -- today's debrief "Carried forward" notes
- `personal/patterns.md` -- behavioral insights that shape recommendations
- `personal/goals.md` -- quarterly targets
- `.claude/rules/operating-rules.md` -- timezone, day type, priority stack (already loaded)

---

## What This Skill Does

Plans the next day the night before. Reviews everything on the user's plate, detects whether tomorrow is a workday or weekend, allocates time across the user's priority areas, runs delegation triage, connects the plan to quarterly goals, and delivers a mentorship push. Acts as business mentor and life coach, not just a scheduler.

Also supports a lightweight morning mode that confirms last night's plan and adjusts for any changes.

---

## Two Modes

### Evening Mode (Primary)
The default. Plans TOMORROW. The user runs this before bed so they wake up with the plan already locked in. No decision fatigue in the morning.

**Triggers:** "Let's plan tomorrow", "plan my day", "night-before planning", "help me structure my day", "what should I work on tomorrow", "what should I focus on", or after a debrief session naturally flows into planning.

**Plans for:** Tomorrow (the next calendar day).

### Morning Mode (Lightweight)
Delivers a three-part briefing: calendar, email triage, and unfinished todos from yesterday.

**Triggers:** "Morning", "good morning", "what's on my plate today"

**Behavior:**

Run all three in parallel, then present in this exact order:

**1. Calendar Today**
- Query Google Calendar for today's events in the user's timezone.
- Sort chronologically. Show time, title, attendees if relevant.
- If empty: say "Calendar is clear today."

**2. Email Triage (since 6pm yesterday)**
- Query Gmail for emails received from 6pm yesterday (user's local time) through now.
- Group into three buckets:

  | Bucket | Criteria |
  |---|---|
  | **Urgent — needs reply today** | Client or deal-related, questions directed at the user, time-sensitive asks, anything with a same-day ask or deadline |
  | **Important but not urgent** | FYI from real people, updates on active projects, things to read but not reply to today |
  | **Newsletters / noise** | Marketing, newsletters, automated notifications, receipts. Count them, do not list individually. |

- For each **urgent** item: draft a 2-sentence reply the user can send with minor edits. Show the draft inline. Do NOT send.
- If a bucket is empty, say so ("Nothing urgent.") instead of omitting the section.

**3. Yesterday's Unfinished Todos**
- Read `personal/day-ledger.md` for yesterday's entry.
- Pull any task marked Planned, In Progress, or not marked Done.
- If no ledger entry for yesterday: say "No plan logged for yesterday — nothing to carry forward."
- Present as a list with status.

**Output Format:**

```
GOOD MORNING — [Date, Day]

CALENDAR TODAY
[Time] [Event] ([attendees if relevant])
...

EMAIL SINCE 6PM YESTERDAY

Urgent — reply today ([N]):
- From [sender]: [subject]
  Why: [one line on why it's urgent]
  Draft reply:
  > [2-sentence draft]

Important — not urgent ([N]):
- From [sender]: [subject] — [one-line summary]

Noise: [N] newsletters / automated.

CARRIED FORWARD FROM YESTERDAY
- [Task] — [status]
```

Morning mode is a briefing, not a session. No theme, no mentorship push, no morning scan. The user gets what they need and moves.

---

## How to Activate

The user will say something like:
- "Let's plan tomorrow" / "Plan my day" -> Evening Mode
- "Night-before planning" / "What should I focus on tomorrow?" -> Evening Mode
- After a debrief: "Want to plan tomorrow?" -> Evening Mode
- "Morning" / "Good morning" -> Morning Mode
- "What's on my plate today?" -> Morning Mode (or Evening fallback if no plan exists)

**Ambiguity rule:** If triggered after 6pm local time, default to Evening Mode (planning tomorrow). If triggered before 2pm, default to Morning Mode. Between 2pm and 6pm, ask: "Planning for today or tomorrow?"

---

## The Planning Procedure (Evening Mode)

Run every step in order. Do not skip. All references to "today" in the output become "tomorrow" since this runs the night before.

### Step 1: Read snapshot.md + patterns.md + goals.md + day-ledger.md
Load all four. snapshot.md gives session context, active priorities, and flags. patterns.md gives behavioral insights that shape recommendations. goals.md connects tomorrow to quarterly targets. day-ledger.md gives today's debrief "Carried forward" notes -- incorporate these into tomorrow's theme and planning.

If snapshot is stale (>24 hours), note it and do a full query anyway.

### Step 2: Detect Day Type (for Tomorrow)
Check what day of the week TOMORROW is (based on the user's current timezone from operating-rules.md).

**Workday:**
- Work tasks are active. Check work calendar for tomorrow's meetings. Check task backlog for active/overdue tasks.
- Plan includes both personal priority and work blocks.

**Weekend:**
- Work disappears entirely. Do not surface work tasks, do not check work calendar.
- Full weight goes to personal priorities and projects.
- Reweight time allocation: heavier on creative, building, and personal projects.

### Step 3: Set Tomorrow's Theme (Mentorship Push)
This is the tone-setter. Before listing any tasks, analyze:
- Where the user stands against quarterly goals (goals.md)
- What patterns are emerging (patterns.md)
- What flags are active (snapshot.md)
- What priority area has been underweighted recently
- What today's debrief carried forward (day-ledger.md)

Then deliver ONE clear theme for tomorrow. Not a task. A direction.

Examples:
- "You have been building for 5 days straight. Zero visibility work. Tomorrow tips toward outreach. The audience does not build itself."
- "Quarterly goal 3 is still at zero. Tomorrow is about outreach, not building."
- "Light calendar. Deep work day. Pick the hardest task and give it 3 unbroken hours."

This is where the assistant earns its seat. Not by listing what exists, but by telling the user what tomorrow SHOULD be about.

### Step 4: Check Calendar (Tomorrow + 48hrs)
Query ALL calendars for tomorrow + the following day. On weekends, skip work calendars.

Map hard commitments first. These are immovable. Everything else builds around them. Always sort chronologically.

Summarize the shape of the day: "3 meetings, biggest gap is 2-4pm" is more useful than listing every event when there are many. If 3 or fewer events, list them. If more, summarize the shape and list the immovable ones.

### Step 5: Query Task Backlogs
Pull from the user's task database if connected. Priority order:

**Workdays:**
1. Personal projects / side projects -- P1 tasks first, then P2
2. Work tasks -- active/overdue tasks in current sprint
3. Personal life -- anything with a due date or flagged urgent

**Weekends:**
1. Personal projects / side projects -- P1 tasks first, then P2
2. Personal life -- anything with a due date or flagged urgent
3. (No work tasks)

The task database is the source of truth. Never rely on .md files for task state.

### Step 6: Signal vs Noise Filter

Before building the plan, run EVERY task through the signal vs noise gate. This is mandatory. Load `personal/goals.md` for the priority stack.

For each task on the backlog and each item the user wants to do tomorrow, ask: **does this directly advance a top-3 priority or quarterly goal?**

| Verdict | Criteria | What Happens |
|---------|----------|-------------|
| **Signal** | Directly advances a top-3 priority or quarterly goal | Goes into the plan. Gets prime time slots. |
| **Noise dressed as signal** | Feels productive but serves a lower priority or no priority | Flag it. "This looks productive but it does not move [Goal 1] or [Goal 2]. Still want it in?" |
| **Pure noise** | No connection to any stated goal | Drop it or push to end-of-day admin. Do not give it prime hours. |
| **Map-changer** | Genuinely redefines a priority | Pause. "If this replaces [current priority], say that explicitly. Otherwise it is a distraction with a good story." |

**The 80/20 rule:** 80% of planned time must go to signals. 20% max on noise (personal admin, maintenance, errands). If the ratio flips, say so before presenting the plan: "Right now 60% of tomorrow is noise. That is backwards. What gets cut?"

**Recurring noise detector:** If the same noise item shows up across three or more planning sessions, stop entertaining it. "This keeps coming back but never makes it to your goals. Either commit and put it on the priority stack, or let it go."

Show the signal/noise breakdown in the output. The user should see at a glance how their day maps to what actually matters.

### Step 7: Run Delegation Triage
Apply the Task Delegation Protocol (operating-rules.md) to every task:
- Tier 1: Assistant handles it -- list these and offer to act on them now or first thing tomorrow
- Tier 2: Assistant starts it -- identify these, flag what context is needed before building
- Tier 3: User must do it -- surface these clearly but do not offer to execute

After the triage, offer once: "I can handle [Tier 1 list]. Want me to knock these out now so tomorrow is clean?"

### Step 8: Estimate Time for Every Task
For each task the user will work on, state a realistic time estimate. "This will take ~2 hours. That one is 30 mins." Do not just list tasks -- size them. Cross-reference against available hours after fixed commitments.

If total task time exceeds available hours, say so immediately: "You have [X] hours of tasks for a [Y]-hour day. Something gets cut. What drops?"

### Step 9: Build the Plan
Map tasks to the user's priority buckets (defined in their goals or framework files).

Allocate time across the user's priority areas based on their defined split. If no split is defined, default to the **4-4-4 framework** (Alex Hormozi):

| Block | Hours | What It Covers |
|-------|-------|----------------|
| **Promote** | 4 hrs | Visibility, outreach, content, networking, audience building. The work that makes future revenue possible. |
| **Deliver** | 4 hrs | Client work, shipping to customers, fulfilling commitments. The work that earns current revenue. |
| **Build** | 4 hrs | Creative work, business development, new opportunities, upgrading systems, strategic thinking. The work that compounds. |

**4-4-4 rules:**
- Not every day hits exactly 4-4-4. The split is a target, not a cage. But if any block hits zero for two days straight, flag it.
- Weekends: heavier on Promote and Build. Deliver only if client deadlines demand it.
- The user's onboarding may define a custom framework. If so, use that instead. The 4-4-4 is the default when nothing else is specified.
- GAP CHECK (Step output) must reference whichever framework is active, not generic categories.

**Due dates are floors, not ceilings.** If a P1 task can be completed tomorrow and capacity exists, schedule it regardless of when it is "due". Overwork on needle-movers. Never coast because something is not due until next week.

Block personal priorities first. Work tasks around them (workdays only). Personal admin last. Fitness is non-negotiable -- slot it at a natural break.

Minimum 90-minute blocks for deep work. Never fragment creative or build tasks.

Respect flow state: batch by domain, use natural breaks (meals, workouts) as transitions between domains.

### Step 10: Suggest What Is Missing (Business Mentor Lens)
After showing existing tasks, identify the next move. Not just "what is on the list" -- what should be added based on where things stand relative to goals.

Mandatory checks:
- Visibility/outreach behind target? Name the specific action to take tomorrow.
- Key conversations behind target? Name who to reach out to and what to say.
- Project time under target hours? Call it out. Find where to add it.
- All planned time is planning, nothing shipping? Say so. Push for one shippable output tomorrow.
- Quarterly goals check: which goal has seen zero movement? Name the one action that moves it forward tomorrow.

Present suggestions as specific tasks, not categories. "Write the build-in-public post" beats "do some content."

### Step 11: Morning Scan (News + Analysis)
Run a quick web search for relevant topics. One factual line each in a table. No hype, no clickbait, no speculation. Just what happened.

**Relevance filter:** Every item in the table must pass: "Does the user need to know this for their work, their positioning, or their decisions?" Filter through their context from snapshot.md and goals.md. If a topic has nothing relevant, say "Nothing relevant today" in that row.

Topics (customize based on user's domain from operating-rules.md):
1. **Economy:** Global macro, central bank moves, anything that affects markets or fundraising climate
2. **AI:** What shipped or changed in the last 24 hours (not announcements or roadmaps)
3. **Industry:** News relevant to the user's primary domain
4. **Local:** News relevant to the user's location
5. **Markets:** Key index direction + the driver behind the move

After the table, add an **ANALYSIS** section:

```
ANALYSIS
- Signal: [one line -- the single most relevant thing from the scan today]
- Opportunity: [one line -- what the user could do with this information]
- Watch: [one line -- something developing that is not actionable yet but worth tracking]
```

This is reading the room. Opinionated. Specific to the user's projects, positioning, and timing. Not a news summary.

Place this at the end of the output format as MORNING SCAN + ANALYSIS.

### Step 12: Present the Plan and Confirm
Show the full plan for tomorrow using the output format below. Wait for the user to confirm. Then and only then:
- Block the full day flow into calendar (all time blocks, not just meetings)
- Execute any Tier 1 tasks approved in Step 6
- **Write the committed plan to `personal/day-ledger.md`** (see Step 12)
- Close with ONE specific check-in question (see below)

### Step 13: Write to Day Ledger (Commit Point)
After the user confirms the plan ("lock it in", "that works", "yes", or any affirmative), write TOMORROW's entry to `personal/day-ledger.md`. This is the commit point. Nothing is written to the ledger until this moment.

Format:
```
## YYYY-MM-DD (Day) | Workday/Weekend

### Plan
Committed at: [HH:MM timezone] (night before)
Theme: [tomorrow's theme from Step 3]
The One Thing: [from output format]

| Time | Task | Est. | Bucket | Status |
|------|------|------|--------|--------|
| [from the confirmed plan] | | | | Planned |
```

This entry persists across sessions. The debrief skill reads it at end of day to compare plan vs reality. If no ledger entry exists, the debrief uses calendar and task database as baseline instead.

---

## The Close (Check-in Question)

After the plan is confirmed and execution offers are made, close with ONE specific question drawn from patterns.md, goals.md, and snapshot.md flags.

Not "how are things going?" -- that is noise. Find the one thing that has been sitting longest or where a behavioral pattern suggests a real blocker.

Examples:
- "Key conversations are at 2 of 3 with [X] days left. Who is the third? Name them now."
- "Outreach has been empty all week. What is actually getting in the way -- not the schedule, the real reason."
- "Quarterly goal 3 is still 'Not started' with 16 days left in the quarter. What is the first step tomorrow?"
- "The project block on this plan is all strategy, nothing shipping. What is the one thing that could land tomorrow?"

One question. Then done. If the answer reveals something worth capturing, note it in patterns.md (if confirmed pattern) or snapshot.md Flags (if watching).

---

## Output Format (Evening Mode)

```
PLAN: [Tomorrow's Date, Day] | [Workday/Weekend]

CALENDAR: [calendar link if available]

TOMORROW'S THEME
[One sentence. The direction for the day. The mentorship push.]
[One sentence connecting it to a quarterly goal or active flag.]

THE ONE THING
[Single most important task. If only this gets done, the day wins.]

PRIORITY BLOCK -- [X hrs] [category split]
| Time | Task | Est. | Category |
|------|------|------|----------|
| [Time] | [Task] | ~Xh | [category] |
| [Time] | [Task] | ~Xh | ... |

WORK BLOCK -- [X hrs] (workdays only)
| Time | Task | Est. | Status |
|------|------|------|--------|
| [Time] | [Task] | ~Xh | [overdue/due today/in progress] |

FITNESS
[Time] [Activity] (~Xmin)

PERSONAL / ADMIN (batched)
[Any personal tasks -- kept short, end of day]

ASSISTANT HANDLES (Tier 1 -- ready on your "yes")
- [Task 1]
- [Task 2]

ASSISTANT CAN START (Tier 2 -- needs your go-ahead + context)
- [Task]: needs [specific context before starting]

SUGGESTED ADDITIONS (Mentor push)
- [Specific action recommended for tomorrow]
- [Why: connected to which goal or flag]

SIGNAL / NOISE CHECK (80/20 rule)
Signal: [X hrs] ([Y]%) | Noise: [X hrs] ([Y]%)
[If ratio is healthy: "Clean. 80%+ on what matters."]
[If ratio is flipped: "Problem. More than half your day is noise. [specific items] are not moving any goal. Cut or reschedule."]
[If a noise item has appeared 3+ sessions: "[Item] keeps showing up but is not on your goals. Commit or kill it."]

GAP CHECK (against user's framework -- default: 4-4-4)
Promote: [X hrs planned] | Deliver: [X hrs] | Build: [X hrs]
[Flag if any block is at zero or significantly underweight vs target split]
[Flag if this continues a multi-day pattern: "Third day with zero Promote hours. The audience is not building itself."]

QUARTERLY GOAL PULSE
| Goal | Status | Movement This Week |
|------|--------|--------------------|
| [Goal 1] | [status] | [what happened or "stalled"] |
| ... | ... | ... |

MORNING SCAN

| Topic | What Happened |
|-------|--------------|
| Economy | [one factual line] |
| AI | [one line, what actually shipped or changed] |
| Industry | [one line, relevant to user's domain] |
| Local | [one line, relevant to user's location] |
| Markets | [key index, direction + driver] |

ANALYSIS
- Signal: [the single most relevant thing from the scan today]
- Opportunity: [what the user could do with this information]
- Watch: [something developing, not actionable yet, worth tracking]
```

## Output Format (Morning Mode -- Plan Exists)

```
MORNING: [Today's Date, Day] | [Workday/Weekend]

YOUR PLAN (locked in last night)
[Summary of the plan -- theme, one thing, key blocks]

CALENDAR CHECK
[Any new events added overnight? Conflicts? Changes?]

Anything changed since last night?
```

---

## The Assistant's Role in This Skill

Set the tone. Push execution, not planning. If the backlog is full of strategy tasks and nothing is shipping, say it.

"You have got 4 hours of building planned but everything is research and strategy. What is the one thing that ships tomorrow?"

If outreach is zero: "No visibility time tomorrow. That is 3 days in a row. The audience is not building itself. We are adding it."

If a quarterly goal has not moved: "Goal 3 has said 'Not started' for 75 days. That is not a goal, that is a wish. What changes tomorrow?"

Never let the user coast on due dates. If something important can happen tomorrow, push for tomorrow.

If overloaded: help cut ruthlessly. "You have 14 hours of tasks for a 6-hour day. Three things get dropped. Which three?"

If tomorrow is a weekend: bring the energy. "No work tomorrow. Full project day. Let's make it count."

The mentorship is not optional. It is the difference between a to-do list and a coach.

---

## Debrief-to-Planning Flow

The debrief skill (/debrief) wraps up today. This skill plans tomorrow. When both run in the same session:

1. Debrief finishes and writes "Carried forward" notes to the ledger
2. The assistant naturally transitions: "Want to plan tomorrow?"
3. If yes, Evening Mode activates. The carried-forward notes feed directly into Step 3 (theme) and Step 9 (suggestions).
4. This creates a clean loop: close today, open tomorrow, go to sleep with the plan locked.

The debrief skill can reference this transition but should not duplicate the planning procedure.

---

## Context to Load

- `personal/day-ledger.md` -- Check for today's debrief "Carried forward" notes. If present, incorporate into tomorrow's theme and planning.
- `personal/snapshot.md` -- FIRST. Current state, flags, active priorities.
- `personal/patterns.md` -- Behavioral patterns. Load alongside snapshot.md. Use to shape time block recommendations, theme selection, and check-in framing.
- `personal/goals.md` -- Quarterly targets. Every day should serve at least one of these.
- `.claude/rules/operating-rules.md` -- Timezone, day type, priority stack. Already loaded but reference for day detection.
