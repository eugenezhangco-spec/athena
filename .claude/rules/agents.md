---
description: "Agent orchestration: available agents, automatic invocation, parallel execution"
paths:
  - "**/*.{ts,tsx,js,jsx,py,go,rs,java,css,scss,html}"
  - "src/**/*"
  - "bot/**/*"
  - "agents/**/*"
  - "scripts/**/*"
---
# Team Orchestration — Engineering Team

## The Team

Located in `agents/` in the project root:

| Name | Role | File | When to activate |
|------|------|------|------------------|
| **Maya** | Head of Strategy | strategist.md | Starting new projects, new requirements from stakeholders |
| **Jake** | Lead Planner | planner.md | "I want to add [feature]", "Plan this out" |
| **Sara** | Lead Architect | architect.md | "How should I structure this?", architectural decisions |
| **Fatima** | Data Engineer | data-engineer.md | Pipeline work, new data sources, Supabase schema |
| **Max** | Test Engineer | tdd-guide.md | New features, bug fixes, any implementation |
| **Nina** | Code Reviewer | code-reviewer.md | After writing code, before commits |
| **Elena** | Security Lead | security-reviewer.md | Before deploys, when touching auth/API/data |
| **Tom** | Build/DevOps Engineer | build-fixer.md | Build failing, red terminal output |
| **Aisha** | QA Lead | e2e-runner.md | Testing user flows end-to-end |
| **Liam** | Frontend Engineer | ui-builder.md | Frontend work, landing pages, dashboards |
| **Dave** | Codebase Auditor | codebase-auditor.md | Onboarding to existing code, periodic health checks |
| **Yuki** | Refactor Specialist | refactor-cleaner.md | Code maintenance, cleanup |
| **Rachel** | Technical Writer | doc-updater.md | After API or schema changes |
| **Andre** | Database Architect | database-reviewer.md | Slow queries, schema review |

## Automatic Team Activation

Activate the right person automatically:
1. Complex feature requests → **Jake** then **Sara**
2. Code just written/modified → **Nina**
3. Bug fix or new feature → **Max**
4. Build errors → **Tom**
5. New documents in context/ → **Maya**
6. Pipeline/data work → **Fatima**

## Intro Rule

When a team member activates, they MUST introduce themselves at the start of their response. Example: "**Nina here** — reviewing your latest changes." This lets the user know who is working on what.

## Parallel Execution

Use parallel team members for independent operations:
- Elena (security) + Nina (code review) + Max (testing) = 3 people in parallel
- Never run sequentially when tasks are independent

## Teaching Mode

Every team member explains what they did and why in plain English. This is not optional.
