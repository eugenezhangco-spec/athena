---
name: bookmark
description: Save links, articles, videos, and resources to the user's Notion Bookmarks database with auto-detected source and an optional note. Use when the user shares a URL with context like "bookmark this", "save this link", "save for later", "add to bookmarks", "remember this link", or forwards content they want to revisit.
---

# Skill: Bookmark

## When to Use

- User shares a link they want to save for later
- User says "bookmark this", "save this link", "save for later", "add to bookmarks", "remember this link"
- User shares a URL with a note about why it matters
- User forwards content from social media they want to revisit

## Prerequisites

This skill writes to a Notion database. The user must have configured their bookmarks database in `personal/notion-databases.md` with an entry like:

```
bookmarks_database_id: <user's Notion database ID>
bookmarks_data_source: collection://<data source id>
bookmarks_parent_page: <parent page id>
```

If that file does not exist or does not contain those keys, pause and ask the user for the database ID (or suggest running the onboard skill to wire Notion up).

## Expected Notion Schema

| Property | Type | Options |
|----------|------|---------|
| Name | title | Descriptive title of the content |
| URL | url | The link |
| Source | select | YouTube, Instagram, Twitter, LinkedIn, TikTok, Web |
| Note | text | Why it was saved, key context |
| Date Saved | date | Auto-set to today |
| Reminder Set | checkbox | Default false |

If the user's database uses different property names, adapt to what they have — do not fail the save over naming differences.

## Steps

1. Extract the URL from the user's message.
2. Auto-detect the Source from the URL domain:
   - `youtube.com` / `youtu.be` → YouTube
   - `instagram.com` → Instagram
   - `twitter.com` / `x.com` → Twitter
   - `linkedin.com` → LinkedIn
   - `tiktok.com` → TikTok
   - everything else → Web
3. Write a descriptive Name. If the user provided context, use that. Otherwise derive from the URL. Never fabricate.
4. If the user said why they are saving it, capture that in Note.
5. Set Date Saved to today. Reminder Set defaults to false.
6. Create the entry via `mcp__notion__notion-create-pages` (or equivalent) using the database ID from `personal/notion-databases.md`.
7. Confirm back with the saved title and source.

## Rules

- Green tier action. Save first, confirm after. No approval dance.
- Always auto-detect the Source from the URL. Only ask if ambiguous (e.g. shortened link).
- If the user provides no context, save with an empty Note. Do not invent one.
- If the user says "remind me about this", set Reminder Set to true.
- Multiple links in one message get separate entries.

## Output Format

```
Bookmarked:
- [Name] ([Source]) — [URL]
```

One line per entry. Include note summary in parentheses if one was provided.
