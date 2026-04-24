# /golden — Run Pipeline Quality Check

Also triggers when you say: "run the golden test", "check the pipeline", "verify the data", "is the pipeline working?"

## What This Does

Runs the golden file test — a set of known records checked against expected values in the database. If any field doesn't match the expected value, the test fails and shows exactly what's wrong.

Golden tests are regression tests for your data pipeline. They prove that the pipeline is still producing the right output after any change.

## Usage

- `/golden` or `/golden all` — run all golden tests
- `/golden [source]` — run tests for a specific data source

Configure your golden test data in `pipeline/tests/golden-file-test.ts` (or equivalent).

## When to Run

- **After any pipeline code change** (connectors, entity resolution, auto-population)
- **After re-running the pipeline** (re-ingesting data)
- **After schema changes** (migrations)
- **Before deploying**
- **When something looks wrong** in the frontend or data layer

## How to Execute

```bash
npx tsx pipeline/tests/golden-file-test.ts [source|all]
```

Check `CLAUDE.md` or `context/ENGINEERING.md` for the project's exact test runner command.

## Reading the Output

- `✓` = field matches expected value
- `✗` = field does NOT match — shows expected vs actual, plus WHY it should be that value
- Exit code 0 = all good
- Exit code 1 = something broke

## After Failure

If a test fails:
1. Read the failure message — it tells you exactly which field is wrong
2. Check if it's a data issue (source changed) or a code issue (we broke something)
3. If code issue: fix the pipeline code, re-run the pipeline, run `/golden` again
4. If data issue: update the golden file expected values in the test file

## Setting Up Golden Tests for a New Project

When no golden tests exist yet:
1. Run the pipeline once and verify the output looks correct
2. Pick 2-3 representative records (ideally one per data source)
3. Write expected values for the key fields you care about most
4. These become your regression baseline — any future change that breaks them is flagged
