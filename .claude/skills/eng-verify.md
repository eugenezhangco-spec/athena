# /verify — Generate Verification Checklist

Also triggers when you say: "how do I check this?", "verify this", "is this correct?", "can you prove it worked?"

## Purpose

After ANY build, fix, update, or change — generate a step-by-step verification checklist that can be followed to confirm the work is correct. No code required. Just look, click, and compare.

## When to Trigger

This skill should run AUTOMATICALLY after:
- Pipeline code changes (connectors, entity resolution, auto-population)
- Pipeline re-runs
- Database migrations
- Frontend changes
- Config changes (rules, seed data)
- Any fix or improvement

## What to Generate

### 1. What Changed (summary)
List every file changed and what the change does, in plain English.

### 2. Verification Steps
For each change, provide concrete verification steps:

**For database/pipeline changes:**
- SQL queries to paste into the database editor
- What to look for in the table view (which table, which column, which record)
- Expected values and what "wrong" looks like

**For frontend changes:**
- URL to visit (localhost or deployed URL)
- What to click and what should appear on screen
- Before/after comparison if layout changed

**For code/logic changes (connectors, entity resolution, auto-population):**
- Run `/golden` and confirm all checks pass
- If a new rule or field was added, explain what record to check and what value should appear
- Show the before state and expected after state

**For config changes (rules, seed data, migrations):**
- Which table/file to check in the database
- What values should be there
- Row count expectations

**For skills, commands, or workflow changes:**
- How to trigger the new command
- What the expected output looks like
- Edge cases to test

**For git/deployment changes:**
- What branch, what commit
- Is the deploy live
- Does the live site match expectations

### 3. Spot Check
Pick ONE specific record and do a full trace:
- Source data (what the external source says)
- Database data (what's stored)
- Frontend display (what the user sees)
- Do all three match?

### 4. Golden File Test (if applicable)
If the project has a data pipeline, remind to run `/golden` after verification.

## Format

```
VERIFICATION CHECKLIST: [What was changed]
════════════════════════════════════════════

1. [Step — what to do]
   Expected: [what you should see]
   If wrong: [what it means and what to do]

2. [Step — what to do]
   Expected: [what you should see]
   If wrong: [what it means and what to do]

SPOT CHECK: [Record name]
─────────────────────────
Source says: [value from the source]
Database has: [SQL query to run]
Expected match: [yes/no and why]

GOLDEN TEST (if applicable):
─────────────
Run: npx tsx pipeline/tests/golden-file-test.ts
Expected: All checks pass (exit code 0)
```

## Rules

- Every step must be doable WITHOUT writing code
- Every step must have an EXPECTED result
- Every step must say what to do IF the result is wrong
- Keep it short — 5-10 verification steps max, not 50
- Focus on the CHANGES, not everything in the system
