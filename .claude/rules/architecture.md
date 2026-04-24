---
description: System architecture principles. How to structure capabilities, write new rules and skills, and maintain system coherence.
---

# Architecture

## Core Rule

Every new capability gets its own home. Never bolt functionality onto an unrelated file.

## Structure Map

```
.claude/
  rules/              # Behavioral rules (always loaded, always active)
    personality.md     # Voice and tone
    communication-style.md  # Formatting and channel behavior
    coaching.md        # Challenge and accountability
    operating-rules.md # Calendar, tasks, delegation
    architecture.md    # This file — system design
    evolution.md       # Self-improvement protocol
    proactive-rules.md # Proactive behavior tiers
    security.md        # Security fundamentals
    coding-standards.md # Code quality rules
  skills/             # Triggered capabilities (invoked on demand)
  hooks/              # Session lifecycle scripts
snapshot.md           # Living state — user's current context, goals, priorities
```

## How to Build New Capabilities

1. Determine if it's a **rule** (always-on behavior) or a **skill** (triggered on demand).
2. Create a new file. Never add unrelated behavior to an existing file.
3. Follow the format standards below.
4. Test it in a session before considering it stable.
5. Log the addition in snapshot.md under system changes.

## Quality Over Speed

- A half-built capability that fires incorrectly is worse than no capability at all.
- Every rule and skill must have clear boundaries — what it does AND what it does not do.
- If a capability overlaps with an existing one, merge or differentiate. Never duplicate.

## META: How to Write Rules

Rules are always-on behavioral directives. They shape every response.

### Rule File Format

```markdown
---
description: One line. What this rule controls.
---

# Rule Name

## Section

- Directive in imperative form
- Tables for structured information
- No prose paragraphs
```

### Rule Writing Standards

- Use imperative voice. "Do X." Not "The assistant should do X."
- Use NEVER, ALWAYS, DEFAULT for clarity of intent.
- Use tables for anything with three or more parallel items.
- Keep files focused. One domain per file. Split when a file covers two unrelated things.
- Negative boundaries are as important as positive directives. Say what NOT to do.

## META: How to Write Skills

Skills are triggered capabilities. They activate on demand or via auto-fire rules.

### Skill File Format

```markdown
---
description: Pushy, opinionated one-liner that makes the skill impossible to miss.
---

# Skill Name

## When to Use
[Trigger conditions]

## Steps
[Ordered instructions]

## Output Format
[What the output looks like]
```

### Skill Writing Standards

- Descriptions must be pushy and specific. "Generate a morning briefing with calendar, tasks, and priorities" not "Help with morning planning."
- Include negative boundaries. "Does NOT send emails. Does NOT create events."
- Steps must be numbered and concrete. No vague directives.
- Include output format so behavior is predictable.

## Auto-Fire Skills

Some skills should trigger automatically based on context:

- User says "good morning" or similar -> morning briefing skill
- User drops a brain dump -> capture and organize skill
- User asks about their week -> weekly review skill
- Session starts -> load snapshot.md

Define auto-fire triggers in the skill's "When to Use" section.

## Channel Behavior

### VS Code / Full Interface

- Full formatting. Headers, tables, code blocks.
- Long-form responses when warranted.
- Full coaching and accountability mode.

### Telegram / Compressed Channels

- Plain text only. No markdown.
- 3-5 lines maximum.
- Lead with answer. Context only if critical.
- Personality intact, just compressed.

Detect the channel from context and adapt automatically.
