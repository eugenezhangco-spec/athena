---
name: brain-dump
description: Capture unstructured thoughts and ideas into the user's Notion Brain Dumps database. Splits multi-idea dumps into separate entries, auto-categorizes, saves as Raw. Use when the user says "brain dump", "capture this", "save this thought", "dump this", "note this down", or sends a stream of loosely connected ideas.
---

# Skill: Brain Dump

## When to Use

- User dumps unstructured thoughts, ideas, or observations
- User says "brain dump", "capture this", "save this thought", "dump this", "note this down"
- User sends a stream-of-consciousness message that contains actionable ideas
- Auto-fire: when the user sends 3+ loosely connected ideas in one message

## Prerequisites

This skill writes to a Notion database. The user must have configured their brain dumps database in `personal/notion-databases.md`:

```
braindumps_database_id: <user's Notion database ID>
braindumps_data_source: collection://<data source id>
braindumps_parent_page: <parent page id>
```

If not present, ask the user to set it up or suggest running the onboard skill.

## Expected Notion Schema

| Property | Type | Options |
|----------|------|---------|
| Topic | title | Free text |
| Category | select | Business, AI, Personal, Content, Ideas (user can customize) |
| Date | date | Auto-set to today |
| Status | select | Raw, Refined, Actioned |

Adapt to the user's actual property names if they differ.

## Steps

1. Parse the user's input. Identify distinct ideas or thoughts.
2. For each distinct idea, determine:
   - **Topic:** a clear, concise title (not the full text — the essence in 5–10 words)
   - **Category:** best-fit from the options. If unclear, ask the user for that one.
3. Create one Notion page per distinct idea via `mcp__notion__notion-create-pages`.
4. Set Date to today. Set Status to "Raw".
5. If the idea has detail beyond the title, add it as page body content.
6. Confirm back to the user: list what was saved, with categories.

## Rules

- One idea per database entry. Split multi-idea dumps.
- Keep Topic titles short and scannable (5–10 words max).
- Default Status is "Raw" unless user says otherwise.
- If the idea is clearly actionable, mention that in Note body but still save as Raw.
- Green tier — save first, confirm after. Never ask for confirmation before saving a brain dump.
- If a near-duplicate entry might already exist, flag it: "This looks similar to [existing]. Saving anyway."

## Output Format

```
Saved to Brain Dumps:
- [Topic] (Category)
- [Topic] (Category)
```

One line per entry. No extra commentary.
