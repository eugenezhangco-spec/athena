---
name: video-ideas
description: Capture video content ideas into the user's Notion Video Ideas database. Track from Draft to Ready to Published. Use when the user mentions a video idea, content concept, or says "video idea", "add to video ideas", "content idea", "I should film", "that would make a good video".
---

# Skill: Video Ideas

## When to Use

- User mentions a video idea, content concept, or filming plan
- User says "video idea", "add to video ideas", "content idea", "I should film", "that would make a good video"
- User shares a link that inspires a video concept
- During day planning or content brainstorms

## Prerequisites

Writes to a Notion database. The user must have configured in `personal/notion-databases.md`:

```
video_ideas_database_id: <user's Notion database ID>
video_ideas_data_source: collection://<data source id>
video_ideas_parent_page: <parent page id>
```

If not present, ask the user to set it up or suggest running the onboard skill.

## Expected Notion Schema

| Property | Type | Options |
|----------|------|---------|
| Name | title | The video concept |
| Date | date | Auto-set to today |
| Source URL | url | Optional — inspiration link |
| Status | select | Draft, Ready, Published, Skipped |

Adapt to the user's actual property names if they differ.

## Steps

1. Extract the video concept from the user's message.
2. Write a clear, compelling title for the Name field (how it would read in a content calendar).
3. If the user shared a URL that inspired the idea, capture it in Source URL.
4. Set Date to today. Set Status to "Draft".
5. If the user provides extra context (hook, angle, target audience, key points), add it as page body content.
6. Create the entry via `mcp__notion__notion-create-pages`.
7. Confirm back with the saved title.

## Rules

- Default Status is "Draft" unless the user says it is ready to film.
- Titles should be punchy and descriptive. Think YouTube/Short titles, not internal notes.
- If the idea connects to an existing content series or goal, note that in the page body.
- Green tier — save first, confirm after.
- If the user brainstorms multiple ideas at once, save each as a separate entry.

## Output Format

```
Saved to Video Ideas:
- [Name] (Status)
```

One line per entry. If a Source URL was captured, append "(from [domain])".
