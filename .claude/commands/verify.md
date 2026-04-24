---
description: Verify a build — runs tests, checks acceptance criteria from the plan, produces a go/no-go verdict, and saves the result to context/builds/.
---

# /verify — Did We Build What We Planned?

Also triggers when you say: "verify this", "is this correct?", "check everything", "did it work?", "can you prove it worked?", "run the checks", "how do I check this?"

/verify is the final gate before /update. It does two things in one pass:
1. Runs the automated test suite
2. Checks the build against the acceptance criteria approved in /plan

Running /verify replaces running /test separately — it includes the test run.

---

## Process

### Step 1: Load the Plan

Read the most recent PLAN file from `context/builds/`:
- Find the latest file ending in `-PLAN.md` by date/time
- Extract every task and its acceptance criteria (Given/When/Then)
- If no PLAN file exists: ask what was supposed to be built, then proceed with criteria check only

### Step 2: Run Tests

```bash
npm test
```

Report: X/Y passing, coverage %, any failures with plain-English explanation.

If no test setup exists: note it and proceed to acceptance criteria check. Offer to set up Vitest at the end.

### Step 3: Check Acceptance Criteria

For each task in the plan, evaluate each Given/When/Then criterion:

| Symbol | Meaning |
|--------|---------|
| ✅ PASS | Criterion met — verified in code or output |
| ❌ FAIL | Criterion not met |
| ⚠️ PARTIAL | Partially met — explain what's missing |
| 👁 MANUAL | Needs manual verification (UI, external API, visual check) |

For MANUAL items, generate a concrete step:
- What URL to visit, what to click, what should appear
- What SQL to run in the database editor, what value to expect

### Step 4: Spot Check

Pick ONE specific change and trace it end to end:
- **For pipeline/data:** External source → database → frontend display
- **For API:** Request → Processing → Response
- **For UI:** User action → State change → Visual result

Confirm all steps match expected behaviour.

### Step 5: Write Build Result

Write to `context/builds/YYYY-MM-DD-HHMM-[topic]-RESULT.md`:

```
---
date: YYYY-MM-DD
time: HH:MM
topic: [derived from PLAN file]
plan_file: [PLAN filename]
verdict: PASS | PARTIAL | FAIL
tests: X/Y passing
coverage: Z%
---

## Test Results
X/Y passing. Coverage: Z%. [List failures if any]

## Acceptance Criteria

| Task | Criterion | Result | Notes |
|------|-----------|--------|-------|
| [task name] | Given X / When Y / Then Z | ✅ | |
| [task name] | Given X / When Y / Then Z | 👁 MANUAL | Visit localhost:3000/... |

## Verdict
[PASS / PARTIAL / FAIL] — [one sentence explanation]

## Manual Checks
[Numbered list of any 👁 MANUAL items with exact steps]

## What to Fix (if PARTIAL or FAIL)
[Specific items that need resolution before /update]
```

### Step 6: Present Results

Show a clean summary:
- Test results (one line)
- Acceptance criteria table
- Verdict in bold
- Manual checks (if any) as a numbered list to follow
- If PASS: "All clear. Ready for /update."
- If PARTIAL or FAIL: "Here's what needs fixing before we close this out."

---

## Verdict Definitions

**PASS** — All tests pass AND all acceptance criteria met (or MANUAL items are minor)
**PARTIAL** — Tests pass but some criteria unmet, OR tests fail on non-critical paths
**FAIL** — Core acceptance criteria failed or tests broken on critical paths. Do not proceed to /update.

---

## Rules

- PASS requires both tests AND criteria — passing tests alone is not enough
- Write the result file BEFORE presenting results
- Focus on THIS build's changes only — not the entire system history
- Keep manual check steps doable without writing code
- Every manual step must have an expected result and a "if wrong, do this" instruction
- After the verdict, ask: "Want me to fix anything before we update?"
