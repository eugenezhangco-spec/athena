---
description: Run a comprehensive code review on recent changes. Checks security, quality, and project-specific patterns.
---

# /review — Is This Good? Check Everything.

Also triggers when you say: "review this", "check the code", "is this clean?", "is this ready?", "did you check it thoroughly?"

This command activates **Nina** (code reviewer) and **Elena** (security lead).

## Process

1. Run `git diff --staged` and `git diff` to see all changes
2. If no diff, check recent commits with `git log --oneline -5`
3. Review every changed file against the checklist below
4. Report findings by severity

## Review Checklist

### Security (CRITICAL — blocks merge)
- Hardcoded API keys or secrets
- `.env` or credentials in committed files
- SQL injection in database queries
- XSS in React components (unescaped user input)
- Missing input validation on API routes
- Missing auth/RLS policies on new database tables

### Project-Specific (HIGH)
- Check `CLAUDE.md` and `context/decisions/` for project-specific patterns to enforce
- External API calls missing error handling or rate limiting
- Pipeline connectors not following the project's `DataConnector` interface (if applicable)
- New API routes missing the standard error response format
- Database schema changes without migration files
- Components missing loading/error states
- Database queries without proper typing

### Code Quality (MEDIUM)
- Functions over 50 lines
- Files over 300 lines
- Missing TypeScript types (no `any`)
- Console.log statements left in
- Dead code or unused imports
- Missing ARIA attributes on interactive elements

### Best Practices (LOW)
- Naming conventions (kebab-case files, PascalCase components)
- Commit message format (conventional commits)
- TODOs without context

## Output Format

```
[CRITICAL] Issue title
File: path/to/file.ts:42
Issue: What's wrong and why it matters
Fix: Specific fix recommendation

[HIGH] Issue title
...
```

## Summary

End with:
| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | X     | BLOCK/PASS |
| HIGH     | X     | WARN/PASS  |
| MEDIUM   | X     | INFO       |
| LOW      | X     | NOTE       |

**Verdict**: APPROVE / WARNING / BLOCK

## Rules
- Only report issues you're >80% confident about
- Consolidate similar issues (don't list the same problem 10 times)
- Always suggest the specific fix, not just the problem
- After the review, ask if the issues should be fixed automatically
