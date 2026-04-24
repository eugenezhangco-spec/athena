---
description: Pre-deployment checklist. Verifies code quality, tests, and security before shipping.
---

# /deploy — Are We Ready? Let's Ship.

Also triggers when you say: "are we ready?", "so all good?", "we are secure?", "let's ship", "let's deploy"

This command runs a pre-deployment checklist before shipping to Vercel.

## Pre-Deploy Checklist

Run through each item. Stop at any FAIL.

### 1. Code Quality
- [ ] `npm run build` passes with zero errors
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] No `console.log` statements in production code
- [ ] No `any` types without justification comments

### 2. Security
- [ ] `.env.local` is in `.gitignore`
- [ ] No hardcoded API keys in source files
- [ ] No secrets in git history (`git log -p | grep -i "sk-\|api_key\|secret"`)
- [ ] API routes validate inputs
- [ ] Auth/RLS policies exist for public-facing tables

### 3. Tests (if configured)
- [ ] All tests pass
- [ ] Coverage meets target (80%+)

### 4. Git Status
- [ ] Working directory is clean (all changes committed)
- [ ] Branch is up to date with remote
- [ ] Commit messages follow conventional format

### 5. Build
- [ ] `npm run build` succeeds
- [ ] No build warnings that indicate runtime issues

## Report

### Ready to Ship
If all checks pass:
"All checks passed. Ready to deploy. Run `git push` to trigger Vercel deployment, or push to a preview branch first."

### Not Ready
If any checks fail:
List each failure with:
- What failed
- Why it matters
- How to fix it
- Offer to fix automatically where possible

## First Deployment

If this is the first deploy (no Vercel config detected):
1. Check if Vercel CLI is installed
2. Run `vercel` setup
3. Ensure environment variables are configured in Vercel dashboard
4. Suggest deploying to preview first, not production

## Integration
- Run `/review` before `/deploy`
- Run `/test` before `/deploy`
- Run `/update` after a successful deploy
