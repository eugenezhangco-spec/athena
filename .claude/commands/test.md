---
description: Run the test suite and report results. If no tests exist yet, offer to set up Vitest.
---

# /test — Does Everything Work?

Also triggers when you say: "does this work?", "run the tests", "is everything working?", "did you check it?"

## Step 1: Detect Test Setup

Check if testing is configured:
- Look for `vitest.config.ts` or `vitest` in `package.json` dependencies
- Look for any `*.test.ts` or `*.spec.ts` files

### If no test setup exists:
"No test runner is set up yet. Want me to configure Vitest? This takes about 2 minutes and gives you the ability to verify your code works correctly."

If yes:
1. Install vitest and @testing-library/react
2. Create `vitest.config.ts`
3. Create one example test for an existing utility function
4. Run it to prove it works

### If tests exist:

## Step 2: Run Tests

```bash
npm test
```

## Step 3: Report Results

### All Passing
```
Test Results: 12/12 passed
Coverage: 65% (target: 80%)
Uncovered: list files with low coverage
```

### Failures
For each failing test:
- **Test name** and file
- **What failed** (expected vs actual)
- **Likely cause** in plain English
- **Suggested fix**

Ask: "Want me to fix the failing tests?"

### Coverage Report
If coverage is below 80%, list the most important untested files and offer to write tests for them.

## Integration
- Use `/tdd` to write new features with tests
- Use `/review` to check code quality
- Use `/test` to verify everything still works after changes
