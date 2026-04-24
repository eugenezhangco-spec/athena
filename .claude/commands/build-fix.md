---
description: Fix build errors, type errors, and broken code. Reads errors, diagnoses, and fixes one at a time.
---

# /build-fix — This Is Broken, Fix It

Also triggers when you say: "this is broken", "the build is failing", "fix these errors", "is that an easy fix?"

This activates **Tom** (build/DevOps engineer). He incrementally fixes build and type errors with minimal, safe changes.

## Step 1: Detect and Run Build

```bash
npm run build 2>&1
```

If no build script, try:
```bash
npx tsc --noEmit 2>&1
```

## Step 2: Parse and Group Errors

1. Capture all error output
2. Group errors by file
3. Sort by dependency order (fix imports/types before logic errors)
4. Report: "Found X errors across Y files. Fixing now."

## Step 3: Fix Loop (One at a Time)

For each error:

1. **Read the file** — see the error in context
2. **Diagnose** — identify root cause (missing import, wrong type, syntax error, etc.)
3. **Fix minimally** — smallest change that resolves the error
4. **Re-run build** — verify the error is gone and no new errors appeared
5. **Move to next** — continue with remaining errors

## Step 4: Guardrails

**Stop and ask if:**
- A fix introduces MORE errors than it resolves
- The same error persists after 3 attempts
- The fix requires architectural changes (not just a build fix)
- Build errors come from missing dependencies (need `npm install`)

## Step 5: Explain

After fixing:
- How many errors were fixed
- What the errors were (in plain English)
- If any remain and why
- What caused them in the first place (learning moment)

## Project-Specific Error Patterns

Check `CLAUDE.md` for tech stack details (database client, API client, CSS framework, ORM) to anticipate common error types. Common patterns to watch for:
- External API client type mismatches (APIs often return inconsistent shapes)
- Database client type errors (missing type parameter for generated types)
- Framework boundary issues (e.g., Next.js client vs server component boundaries)
- CSS framework version conflicts

## Integration
- If build errors came from new code, suggest `/review` after fixing
- If errors are recurring, suggest `/plan` to address the root cause
