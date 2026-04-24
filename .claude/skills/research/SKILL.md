---
name: research
description: Save research findings, articles, and learnings to the user's Notion Research database with key takeaways. Use when the user says "save this research", "add to research", "log this finding", "research note", or after a deep-research session when findings should be persisted.
---

# Skill: Research

## When to Use

- User shares research findings, an article summary, or key learnings
- User says "save this research", "add to research", "log this finding", "research note"
- After a deep-research session, when findings should be persisted
- User discovers something relevant to their business, industry, or goals

## Prerequisites

Writes to a Notion database. The user must have configured in `personal/notion-databases.md`:

```
research_database_id: <user's Notion database ID>
research_data_source: collection://<data source id>
research_parent_page: <parent page id>
```

If not present, ask the user to set it up or suggest running the onboard skill.

## Expected Notion Schema

| Property | Type | Options |
|----------|------|---------|
| Topic | title | Clear research topic |
| Category | select | Business, AI, Marketing, Finance, Industry (user can customize) |
| Source URL | url | Optional — where the info came from |
| Key Takeaways | text | The essential findings, 2–5 bullet points |
| Date | date | Auto-set to today |
| Status | select | Unread, Read, Applied |

Adapt to user's actual property names if they differ.

## Steps

1. Identify the research topic from the user's message or session context.
2. Determine the best Category fit.
3. Write concise Key Takeaways (2–5 bullet points, plain language, actionable where possible).
4. Capture Source URL if provided.
5. Set Date to today. Set Status to "Read" if the user has already reviewed the content, "Unread" if saving for later.
6. Create the entry via `mcp__notion__notion-create-pages`.
7. If the research has detailed findings beyond the takeaways, add them as page body content.
8. Confirm back with topic and category.

## Rules

- Key Takeaways should be specific and actionable, not generic summaries.
- After a deep-research session, proactively suggest saving the findings here.
- If the research connects to a current goal or project (from `personal/goals.md`), mention that connection.
- Yellow tier when proactively suggesting. Green tier when user explicitly asks.
- One entry per distinct research topic. Don't combine unrelated findings.

## Output Format

```
Saved to Research:
- [Topic] ([Category]) — [X] takeaways captured
```

One line per entry.
