# /milestone — Create Milestone Report & Update Master

Also triggers when the user says: "create a milestone", "I need to report", "weekly update", "update the master report", "milestone report"

This command does TWO things:
1. Creates a new milestone report file
2. Updates the master report with the new milestone

## Step 1: Gather Context

1. Read `context/STATUS.md` for current project state
2. Read `context/reports/MASTER-REPORT.md` (if it exists) for the current master report
3. Read all files in `context/reports/milestones/` to find the most recent milestone
4. Read recent memory files for decisions and context from recent sessions
5. Check git log for recent commits since the last milestone

## Step 2: Determine Milestone Number

- List existing milestone files in `context/reports/milestones/`
- The new milestone number = highest existing number + 1
- If no milestones exist, start at 001
- Ask for a short milestone name if not obvious (e.g. "phase0-complete", "v1-launch", "first-demo")

## Step 3: Create Milestone File

Create `context/reports/milestones/[NNN]-[name].md` with this structure:

```markdown
# Milestone [NNN]: [Name]

**Date:** [today's date]
**Phase:** [current phase from STATUS.md]
**Previous milestone:** [link to previous milestone file]

---

## Recap
[2-3 sentences summarizing where we were before this milestone. Reference previous milestone.]

## Goal
[What this milestone set out to achieve. One paragraph max.]

## What Was Built
[Specific deliverables, numbers, results. Use tables where appropriate.]

## Key Decisions
[Any architectural, scope, or business decisions made during this period.]

## Issues Found & Resolved
[Bugs, data quality issues, design changes. What we learned.]

## Impact on Master Plan
[Did anything change about the overall direction? New risks? Shifted timelines?]

## Current Numbers
[Key metrics: products in database, sources connected, fields populated, etc.]

## Next Milestone
[What comes next. What's blocking. What needs a decision from stakeholders.]
```

## Step 4: Update Master Report

Read `context/reports/MASTER-REPORT.md` and update:

1. **Executive Summary** — rewrite to reflect current state (5 lines max)
2. **Timeline & Milestones** table — add new row for this milestone
3. **Current Capabilities** — update with what's now possible
4. **Data Coverage** — update product counts, source counts, field coverage
5. **What's Next** — update with immediate priorities
6. **Risk Register** — update if new risks emerged or old ones resolved
7. **Appendix** — add link to new milestone file

If the master report doesn't exist, create it from scratch using the template in Step 5.

## Step 5: Master Report Template (for first creation only)

```markdown
# [PROJECT NAME] — Development Report

**Last updated:** [date]
**Prepared by:** [Your Name], CTO

---

## Executive Summary
[5 lines max. What is the project, what has been built, what's the current state, what's next.]

---

## What Is [PROJECT NAME]
[2 paragraphs. The elevator pitch. Never changes unless the product pivots.]

---

## Timeline & Milestones

| # | Date | Milestone | Key Achievement |
|---|------|-----------|----------------|
| 001 | [date] | [name] | [one-line summary] |

---

## Current Capabilities
[What [PROJECT NAME] can do today. Written as bullet points that an executive can scan.]

---

## Technical Infrastructure

| Component | Technology | Status |
|-----------|-----------|--------|
| [Component] | [Technology] | [Status] |
| ... | ... | ... |

---

## Data Coverage

| Metric | Value |
|--------|-------|
| Products in database | [number] |
| Data sources connected | [number] |
| ... | ... |

---

## Confidence Assessment

| Component | Confidence | Notes |
|-----------|-----------|-------|
| Phase 0 | [score]/10 | [brief note] |
| Phase 1 | [score]/10 | [brief note] |
| ... | ... | ... |

---

## What's Next
[Immediate priorities. What's being built. What's blocking.]

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| ... | ... | ... | ... |

---

## Appendix: Milestone Reports
- [Milestone 001: name](milestones/001-name.md)
```

## Step 6: Confirm

Tell the user:
- Milestone [NNN] created
- Master report updated
- Summary of what changed
- When the next milestone report should probably be created

## Integration with /update

The `/update` command should check the date of the most recent milestone file. If it's been more than 7 days, append a reminder:
"Master report hasn't been updated in [X] days. Run /milestone when you're ready to report."
