---
name: calendar-manager
description: Manages all Google Calendar operations -- creating, reading, updating, and deleting events across the user's calendars. Use this skill whenever the user says 'add this to my calendar', 'create an event', 'block time for', 'what's on my calendar', 'check my schedule', 'when am I free', 'schedule a meeting', 'log a flight', 'add a reminder', or describes anything time-bound including meetings, calls, flights, errands, appointments, and travel plans. Also activates when the user mentions a specific date and time alongside a task or plan that needs to be tracked. Do NOT use for full structured day-planning sessions (use day-planner). Do NOT create events without the user explicitly asking -- present the proposed event first, create only after confirmation.
---

# Skill: Calendar Manager

## Dependencies (Load Before Running)
- `.claude/rules/operating-rules.md` -- timezone, calendar IDs, routing rules (already loaded)

## Trigger
Any mention of creating, updating, deleting, or checking calendar events. Also triggered when the user describes anything time-bound: meetings, calls, flights, tasks, errands, routines, or plans.

---

## Calendars + Auto-Detection

Never ask the user which calendar to use. Infer it from context.

Read calendar IDs and calendar names from `.claude/rules/operating-rules.md`. The operating-rules file should define:
- A list of calendars with their IDs and purposes
- Routing rules (which types of events go to which calendar)
- Key signals for auto-detection (names, keywords, categories)

When genuinely ambiguous: default to the user's primary/personal calendar.

---

## Timezone Rules

**Single source of truth: `.claude/rules/operating-rules.md` > current location section.**

Read CURRENT LOCATION and IANA TIMEZONE from there. Never hardcode a timezone in this file.

- ALWAYS pass the IANA TIMEZONE from operating-rules.md when calling calendar tools.
- ALWAYS display times in the user's current local time. Never show raw stored timezone or UTC.

**Known calendar storage mismatch:** Some calendars may be stored in a different timezone than the user's current location. The API may return times in the stored timezone. Convert to the user's current local time before displaying.

**When creating events:**
- Use the user's current local timezone for all new events.
- For travel: use destination timezone for events at that location.

If timezone is genuinely unclear: ask before creating.

---

## Title Rules

Short. 3-5 words. Context-dependent. Easy to read in month view.

| Situation | Example Title |
|-----------|--------------|
| Call or meeting | "Call -- [Name]" |
| Flight | "SYD -> SIN \| Airline FL123" |
| Errand or task | "Groceries -- [Location]" |
| Deep work block | "Deep Work: [Topic]" |
| Work meeting | "Product Dev Meeting" |
| Full-day travel marker | "[City] to [City]" |
| Social / personal | "Dinner with [Name]" |

Never use full sentences. Never repeat the obvious.

---

## Description Rules

Always structured. Bullet points. Include every detail the user provides.

**Template:**
```
[One-line summary of what this is]

Details:
- [Key detail 1 -- time, location, person, link, etc.]
- [Key detail 2]
- [Any items, agenda, notes, or specifics mentioned]
```

If the user gives raw or messy input (voice transcript, quick message, stream of consciousness):
- Extract the event type, time, and any named details
- Turn loose items into bullet points in the description
- Clean up the language but keep all the substance

---

## Workflow

1. Parse input -- identify: what, when, where, who, any extra details
2. Auto-detect the right calendar from context (see operating-rules.md)
3. Determine timezone (read IANA TIMEZONE from .claude/rules/operating-rules.md, confirm if genuinely unclear)
4. Generate a short title
5. Build a structured description from everything provided
6. Check for conflicts
7. Create the event and confirm -- or flag conflicts first

---

## Deletions and Updates

- Search for the event if the ID is not known
- For ambiguous matches, confirm which event before acting
- For recurring events: confirm if the action is for one instance or all future instances

---

## Full-Day Events

Use full-day format (date only, no time) for:
- Travel days (flights, long journeys)
- Any event the user asks to be visible in month view
- Multi-day events (phases, trips, etc.)
