---
name: debrief
description: End-of-day check-in. Fixed 5-step sequence: (1) list today's todos and ask what was finished, reallocate the rest to tomorrow; (2) pull today's emails 8am-6pm grouped urgent / important / noise, draft 2-sentence replies for urgent items; (3) show tomorrow's calendar; (4) ask for thoughts on today, coach, and log to diary/patterns. Use when the user says 'debrief', 'wrap up the day', 'end of day', 'how did today go', 'close out the day', 'night', or 'goodnight'. Do NOT use for full daily planning (use day-planner). Do NOT use for weekly review (use weekly-review).
---

# Skill: Debrief
# Trigger: "debrief", "end of day", "wrap up the day", "goodnight", "night"

---

## What This Skill Does

Closes the daily loop. Fixed 5-step flow every time:

1. **Today's todos** — list them, user says what's done, rest carries to tomorrow.
2. **Today's emails (8am–6pm)** — grouped urgent / important / noise, with 2-sentence draft replies for urgent items.
3. **Tomorrow's calendar** — clean chronological view with flags.
4. **Thoughts on today** — user reflects, assistant coaches, logs to diary + patterns.
5. **Commit** — write everything to ledger, snapshot, task database, patterns, MemPalace.

The assistant leads. The user answers. No mode branching.

---

## Dependencies (Load Before Running)

Read these files before starting:
1. `personal/day-ledger.md` -- TODAY plan section (if it exists). Primary reference for today's todos/reminders.
2. `personal/snapshot.md` -- current flags and session context.
3. `personal/patterns.md` -- behavioral patterns to check against today.
4. `personal/goals.md` -- quarterly targets for connecting today to the bigger picture.
5. `.claude/rules/evolution.md` -- post-session self-check protocol.

Query these external sources (silent, before any response):
- Google Calendar: today's actual events AND tomorrow's events across all calendars.
- Gmail: all emails received today between 08:00 and 18:00 in user's timezone.
- Task database / Notion: tasks and reminders due today.

---

## The Debrief Flow

Fixed 5-step sequence. The assistant leads each step, waits for the user's response, then moves to the next.

### Phase 0: Silent Data Gathering

Before saying anything, gather all data in parallel:

1. Today's todos/reminders — from `day-ledger.md` TODAY Plan section, plus any reminders in Notion or the task database due today.
2. Today's emails — Gmail search for messages received today between 08:00 and 18:00 user local time. Pull sender, subject, snippet.
3. Tomorrow's calendar — Google Calendar, all calendars, for tomorrow's date in user's timezone.
4. Active patterns from `patterns.md`.

The assistant now has everything. No need to ask the user to supply any of it.

### Step 1: Today's Todos

Present every todo/reminder that was on today's list. Clean numbered list. No commentary yet.

> "Here is what was on the list for today:
> 1. [Task A]
> 2. [Task B]
> 3. [Reminder C]
> ...
>
> What did you finish? Anything I should know about the rest?"

Wait for the user's reply.

When they respond:
- Mark finished items as Done (task database + ledger).
- Everything they did not finish gets carried to tomorrow — added to tomorrow's Plan section in `day-ledger.md` and, if applicable, rescheduled in the task database. Note the reason if the user gave one.
- If they finished something not on the list, capture it.

### Step 2: Today's Emails (08:00 – 18:00)

Present emails grouped into three buckets. Keep it tight — sender + one-line subject/summary per email.

```
URGENT — reply today
- [Sender]: [subject] — [one-line why it's urgent]
  Draft reply:
  "[2-sentence draft the user can send with minor edits]"

IMPORTANT — not urgent
- [Sender]: [subject] — [one-line summary]

NEWSLETTERS / NOISE
- [count] items, skim or archive: [brief list or categories]
```

Urgency rule: "urgent" means something the sender is waiting on today or there's a real deadline. Not just that it feels important. Be strict. If unsure, put it in Important.

Drafts: match the user's voice-dna.md. Two sentences. No filler. No "Hope you're well." No emojis. No em dashes.

Wait for the user to tell you which replies to send, edit, or skip.

### Step 3: Tomorrow's Calendar

Show tomorrow's calendar in clean chronological order. Day of week + date at the top.

```
TOMORROW — [Day, Date]
08:30  [Event] — [location/attendees if relevant]
10:00  [Event]
14:00  [Event]
...
```

Flag anything worth flagging: back-to-back meetings, deep work block at risk, travel time gaps, a meeting with no prep.

### Step 4: Thoughts on Today

Open the floor.

> "Any thoughts on today? What was heavy, what felt good, what is sitting with you."

Let the user talk. Do not interrupt with advice. Listen first.

When they finish:
- Pick the one or two most important threads.
- Coach, not counsel. Reference patterns.md if a pattern showed up. Reference goals.md if today drifted from priorities.
- Log the reflection to `personal/diary.md` (create if it does not exist) as a dated entry — their words first, then the assistant's observation.
- If a pattern was confirmed or a new one observed, update `patterns.md` using the pattern lifecycle rules (WATCHING → ACTIVE → RESOLVED).
- Mine any user-stated facts, preferences, or decisions to MemPalace with source tag `debrief`.

Then: **"Locking this in."** (Commit point -- see Phase 3.)

---

## Phase 3: The Commit

At the end of Step 4, execute all writes in one pass:

### 1. Day Ledger
Append the Debrief section to today's entry in `personal/day-ledger.md`:
- Committed at (current time, user's timezone)
- Finished today: [tasks the user confirmed done]
- Rolled to tomorrow: [tasks moved forward, with reason if given]
- Emails handled: [count urgent / important / noise; which drafts were sent or edited]
- User's thoughts: (their words, compressed but faithful)
- Assistant observed: (patterns, dots connected, one coaching line)

### 2. Task Database
- Mark finished tasks as Done.
- Reschedule unfinished tasks to tomorrow's date (dedup before creating new ones).
- Create new tasks the user mentioned during Step 4.

### 3. Tomorrow's Plan Seed
Write a "Carried forward" block into tomorrow's section of `day-ledger.md`. This is what the morning briefing and day planner read first.

### 4. Snapshot
Update `personal/snapshot.md`:
- Last Session: today's date, debrief completed.
- Flags: add/resolve based on the conversation.

### 5. Patterns + Diary
- `personal/patterns.md`: confirm, promote, or resolve patterns per lifecycle rules.
- `personal/diary.md`: dated entry with user's reflection + assistant's observation. Create file if it does not exist.

### 6. MemPalace
Mine user-stated facts, preferences, or decisions from Step 4 to MemPalace with source tag `debrief`.

### 7. Sign-off
One clean block:

```
DEBRIEF LOCKED

Finished: [N tasks]
Rolled to tomorrow: [N tasks]
Emails: [X urgent replied, Y important flagged, Z archived]
Tomorrow's first move: [specific task]
[One human observation — not mechanical]
```

---

## What the Debrief is NOT

- Not a performance review. The assistant is not grading the user's day.
- Not a full backlog audit. That is the weekly review.
- Not a planning session. That is the day planner.
- Not a guilt trip. If the day went sideways, acknowledge it and move on. "Rough day. Tomorrow is a reset."
- Not optional forever. But it should feel easy enough that the user wants to do it. A few minutes, every night.

---

## How This Feeds the System

```
Morning Briefing
  reads: yesterday debrief "Carried forward" from ledger
  reads: snapshot.md flags
  -> sends compressed wake-up message

Day Planner
  reads: today ledger (if briefing seeded anything)
  reads: snapshot.md, patterns.md, goals.md, task database, calendar
  -> writes Plan section to ledger on commit

The Day (user lives their life)

Debrief
  reads: today Plan from ledger
  reads: calendar (actual), task database (actual), patterns.md
  -> writes Debrief section to ledger on commit
  -> updates snapshot.md, patterns.md, task database
  -> seeds tomorrow "Carried forward"

Weekly Review
  reads: 7 days of ledger entries (plan + debrief pairs)
  -> full audit, pattern confirmation, goal tracking, architecture hygiene
```

The daily loop feeds the weekly loop. The weekly loop feeds the quarterly goals. Nothing is reconstructed from scratch. Everything compounds.

---

## Tone in Debrief

End of day. The user is tired. Match the energy.

- Warmer than morning. Less push, more presence.
- Efficient, no fluff, but not cold. "Good day. Three things moved. One thing to carry."
- During Step 4 (Thoughts on today): slow down. Let silences land. This is where the real stuff surfaces.
- If the day was rough: "Yeah, that is a lot. Tomorrow is a different day." Not "I am sorry to hear that."
- If the day was great: "That is a win. Remember this feeling when the next hard day hits."
- Always close clean. No trailing offers to help. The debrief closes the day. Let it close.

---

## Context to Load

- `personal/day-ledger.md` -- FIRST. Today plan section.
- `personal/snapshot.md` -- Current flags, last session.
- `personal/patterns.md` -- Active behavioral patterns.
- `personal/goals.md` -- Quarterly targets (for connecting today to the bigger picture).
- `.claude/rules/evolution.md` -- Self-check protocol.
- `.claude/rules/operating-rules.md` -- Already loaded. Timezone, day type, priority stack.
