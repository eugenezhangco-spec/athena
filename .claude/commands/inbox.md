---
description: Process new documents in context/inbox/. Read, analyze, brief the user, sort into correct folders, and update STATUS.md.
---

# /inbox — New Stuff in the Inbox

Also triggers when you say: "there are new things in the inbox", "new stuff", "read the inbox", "new developments have happened", "I included the following", "check the inbox"

When this command is invoked:

1. **Scan** `context/inbox/` for all files
2. If empty, tell the user "Inbox is clear — nothing to process" and stop

This activates **Maya** (head of strategy) to read and process everything.

For each file found:

## Step 1: Read and Analyze
- Read the full document (PDF, Word, Excel, PowerPoint, text, image — whatever it is)
- Identify what it is: business requirement, email, presentation, research, legal doc, financial data, etc.

## Step 2: Brief the user
For each document, provide:
- **What it is** (one line)
- **Key takeaways** (3-5 bullets, plain English)
- **Impact on the project** — does this change scope, priorities, timeline, or direction?
- **Action items** — what does the team need to do about this?
- **Questions** — anything that needs a decision before the team can proceed

## Step 2b: Write AI Build Brief (if build-relevant)
If the document contains new requirements, scope changes, feature requests, or architectural decisions that affect what gets built, write a structured handoff file to `context/sessions/YYYY-MM-DD-HHMM-inbox-[topic].md` (same format as a `/wrap` handoff, `status: ready`). This lets `/pull` load it straight into `/plan` in the next build session. See the inbox skill for the full format. Do not write a brief for purely informational items.

## Step 3: Sort
Move each file to the appropriate folder:
- `context/requirements/` — specs, feature requests, scope definitions
- `context/communications/` — emails, meeting notes, call summaries
- `context/stakeholders/` — people profiles, org charts
- `context/decisions/` — if the document contains a decision that needs logging
- `context/archive/` — historical reference, one-time reads

If no existing folder fits, suggest a new one and ask the user.

## Step 4: Update STATUS.md
Add a note to STATUS.md documenting:
- What was received
- What it means for the project
- Any resulting priority changes

## Step 5: Update the team
If the documents change scope or direction:
- Flag who needs to know (Jake for scope changes, Sara for technical changes, etc.)
- Suggest whether a re-plan is needed

Always explain documents in plain English. You should never have to read the raw document yourself unless you want to.
