# Context System

This folder is the project's knowledge base. It grows over time as you provide new documents, emails, notes, and verbal context.

## How It Works

1. **Drop files into `inbox/`** (or share context verbally in chat)
2. **The strategist processes them** — reads, briefs you, sorts into the right folder
3. **STATUS.md gets updated** to reflect any changes to project direction, scope, or status
4. **Files move out of inbox/** into their permanent home

## Folder Structure

All project context lives under `context/`. No duplicate folders at root level.

| Folder / File | What Goes Here | Examples |
|--------|---------------|----------|
| `context/STATUS.md` | **THE source of truth.** Project state, phase, priorities. Read first every session. | Current status, who's involved, what's next |
| `context/ACTION-ITEMS.md` | **Persistent action item tracker.** Every task from first mention to completion. | Open items, blocked items, completed items with source attribution |
| `context/inbox/` | Unprocessed files. The drop zone. | Anything: PDFs, Excel, Word, PPT, emails, screenshots |
| `context/sessions/` | Brainstorm handoff files. Written by `/wrap`, loaded by `/pull`. | Decisions from separate brainstorm sessions, inbox build briefs |
| `context/builds/` | Build records per feature. PLAN files (from `/plan`) and RESULT files (from `/verify`). | 2026-03-23-1500-user-notifications-PLAN.md |
| `context/stakeholders/` | Profiles of people involved in the project | Co-founders, partners, investors, advisors |
| `context/decisions/` | Key decisions and WHY they were made | Architecture choices, scope decisions, partnership terms |
| `context/requirements/` | What needs to be built, organized by phase | Feature specs, product strategy docs, development plan |
| `context/communications/` | Email threads, meeting notes, conversation summaries | Partner emails, investor meeting notes, call transcripts |
| `context/archive/` | Historical documents (read once, reference later) | Original pitch, technical brief, early research |
| `context/reports/` | Generated reports and milestone summaries | Master report, milestone completions |
| `context/versions/` | Snapshots of key documents at specific points | Engineering spec v1, explained doc v1 |

Archive subfolders:
| Subfolder | Purpose |
|-----------|---------|
| `archive/business-plans/` | Original business plans and strategy docs |
| `archive/media/` | Podcast transcripts, audio notes |
| `archive/pitch-decks/` | Pitch deck drafts and presentations |
| `archive/prep-docs/` | Meeting prep materials (CONFIDENTIAL) |
| `archive/research/` | UX reports, competitive analysis |
| `archive/technical-briefs/` | Original technical briefs |

## Rules

- **STATUS.md is always the starting point.** Every new session reads this first.
- **ACTION-ITEMS.md tracks all outstanding work.** Every action item gets captured here — from formal plans to casual mentions. Items are never lost once recorded.
- **Folders are dynamic.** New folders can be added as the project evolves (e.g., `legal/`, `funding/`, `partner-name/`).
- **Inbox is always empty after processing.** If there are files in inbox, they haven't been read yet.
- **Nothing is deleted.** Old documents move to archive, they don't disappear.
- **Verbal context counts.** If you share something important in chat, the team captures it in the right place.

## File Formats We Handle

- PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
- Plain text, Markdown
- Email threads (paste or screenshot)
- Audio files (transcribed by the team)
- Images and screenshots
