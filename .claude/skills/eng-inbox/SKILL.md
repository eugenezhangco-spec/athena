# /inbox — Process New Context

When this skill is triggered, perform ALL of the following steps:

## Step 1: Check the inbox

List all files in `context/inbox/`. If empty, say "Inbox is empty — nothing to process" and stop.

## Step 2: Read every file

For each file in the inbox:
- **PDFs**: Read and extract all content
- **Word docs (.docx)**: Read and extract all content
- **Excel files (.xlsx)**: Read every sheet, every row, every cell
- **PowerPoint (.pptx)**: Read all slides and speaker notes
- **Email threads (.pdf/.eml)**: Read full thread, identify key decisions and action items
- **Markdown/text**: Read in full
- **Images/screenshots**: View and describe what's shown

## Step 3: Brief in plain English

For each file, provide:
- **What it is** (1 sentence)
- **What's new or important** (2-3 bullets)
- **Does it change our current plan?** (yes/no + why)
- **Action items** (if any)

Keep the briefing concise — just the highlights.

## Step 3b: Write AI Build Brief (if build-relevant)

If any inbox items contain new requirements, scope changes, feature requests, architectural decisions, or anything that affects what gets built:

1. Write a structured handoff file to `context/sessions/YYYY-MM-DD-HHMM-inbox-[topic].md`
2. Use the same format as a `/wrap` handoff (same frontmatter schema)
3. Set `status: ready` so `/pull` can load it

**File content must include:**
- **What This Session Was About** — why this inbox item matters to the build
- **What Was Decided** — any decisions or direction changes derived from the content, written as directives
- **Build Brief** — what needs to be built or changed, written for AI consumption. Specific and discrete. A fresh session must be able to plan from this without reading the original document.
- **Constraints and Boundaries** — what must not change, what assumptions must not be made
- **Open Questions** — anything that needs a decision before planning can start

4. Say: "I've written a build brief to `context/sessions/[filename]`. Run `/pull` in your build session to load it into planning."

**Do not write a build brief for purely informational items** (stakeholder profiles, historical docs, emails with no action items). Only write one when the inbox content has direct build implications.

## Step 4: Sort files to proper locations

Move each file from `context/inbox/` to the appropriate folder:

| File type | Destination |
|-----------|------------|
| Business plans, historical docs | `context/archive/business-plans/` |
| Technical specs, briefs | `context/archive/technical-briefs/` |
| Pitch decks, presentations | `context/archive/pitch-decks/` |
| Research, analysis, reports | `context/archive/research/` |
| Prep docs, confidential | `context/archive/prep-docs/` |
| Media files (audio, video) | `context/archive/media/` |
| Email threads, meeting notes | `context/communications/` |
| Requirements, schemas, strategies | `context/requirements/` |
| Stakeholder profiles | `context/stakeholders/` |

**Rename files** to be descriptive and kebab-case. Remove UUIDs and cryptic names.
Example: `6a485b84-e637-48dc...pdf` → `stakeholder-call-prep-march-2026.pdf`

**Create new subfolders** if needed. The structure is dynamic — if a file doesn't fit existing folders, create an appropriate one (e.g., `context/legal/`, `context/funding/`, `context/[partner-name]/`).

## Step 5: Update STATUS.md

Read `context/STATUS.md` and update with any new information:
- New decisions or direction changes
- Updated timelines or milestones
- New stakeholders or relationships
- Changed priorities or scope

## Step 6: Update ENGINEERING.md (if technical content)

If any inbox files contain technical specifications, schema changes, API details, or architecture decisions:
- Update `context/ENGINEERING.md` with the new technical details
- Note what changed and why in a changelog entry

## Step 7: Update EXPLAINED.md (if it affects the owner's understanding)

If new context changes the project direction, adds new concepts, or modifies how things work:
- Update `context/EXPLAINED.md` so the plain-English reference stays current
- Keep the plain-English style and teaching tone

## Step 8: Update ACTION-ITEMS.md

Read `context/ACTION-ITEMS.md` and add any new action items discovered during inbox processing:
- Action items explicitly mentioned in documents (e.g., "please review", "need to schedule", "follow up on")
- Implied work from new requirements or scope changes
- Follow-ups from communications ("get back to [person] about X")
- Anything flagged in the Step 3 briefing as needing action

For each new item, use the next available ID from the `next_id` counter, increment the counter, and follow the format defined in ACTION-ITEMS.md. Set the **Source** to the inbox file name and date.

Also check if any existing action items are resolved by the new context (e.g., an answer arrived for an open question). If so, mark them as done.

## Step 9: Update memory

Save any important new context to the memory system:
- New stakeholder information → update or create stakeholder memory
- New project decisions → update project memories
- New technical decisions → update technical decision memories
- Changed timelines or priorities → update status memories

## Step 10: Confirm

After processing, provide:
- Summary of what was processed
- Where each file was moved
- What was updated (STATUS.md, ENGINEERING.md, EXPLAINED.md, ACTION-ITEMS.md, memory)
- **Action items:** N new items added, N existing items updated
- Any questions or decisions that need input

## When to trigger

This skill runs when you say any of:
- "/inbox"
- "check the inbox"
- "new stuff"
- "read the updates"
- "there's new files"
- "I dropped something in the inbox"
- "process the inbox"

## Verbal context

Verbal context may also be provided in chat instead of dropping files. When notes from conversations, calls, lunches, or text messages are shared:
1. Capture the key points
2. Create a markdown file in `context/communications/` with the date and topic
3. Update STATUS.md and memory as needed
4. Brief on what was captured to confirm accuracy
5. **If the verbal context has build implications** (new requirements, scope changes, feature requests, direction changes): also apply Step 3b — write an AI build brief to `context/sessions/YYYY-MM-DD-HHMM-verbal-[topic].md` with `status: ready`. Say: "I've written a build brief to context/sessions/[filename]. Run /pull in your build session to load it into planning."
