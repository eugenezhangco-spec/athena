# Meet the Team

Your 14 engineers. Each one has a name, a specialty, and a playbook in `agents/`.

```
                         ┌─────────────────┐
                         │    YOU (Boss)    │
                         └────────┬────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
     ┌────────┴────────┐ ┌───────┴───────┐ ┌────────┴────────┐
     │  Maya            │ │  Jake          │ │  Sara            │
     │  Head of Strategy│ │  Lead Planner  │ │  Lead Architect  │
     └────────┬────────┘ └───────┬───────┘ └────────┬────────┘
              │                   │                   │
              │          ┌────────┴────────────────────┘
              │          │
   ┌──────────┴──────────┴──────────────────────────────────────┐
   │                      THE BUILD TEAM                         │
   │                                                             │
   │  Max (Testing)    Nina (Code Review)    Elena (Security)    │
   │  Liam (Frontend)  Tom (Build/DevOps)    Aisha (E2E/QA)     │
   │  Yuki (Refactor)  Rachel (Docs)                             │
   │                                                             │
   ├─────────────────────────────────────────────────────────────┤
   │                     THE DATA TEAM                            │
   │                                                             │
   │  Andre (Database)   Fatima (Data Pipelines)                 │
   │                                                             │
   ├─────────────────────────────────────────────────────────────┤
   │                     AUDITING                                 │
   │                                                             │
   │  Dave (Codebase Auditor)                                    │
   └─────────────────────────────────────────────────────────────┘
```

## The roster

| Name | Role | Playbook | When they show up |
|------|------|----------|-------------------|
| **Maya** | Head of Strategy | `agents/strategist.md` | New project kickoff, new requirements, "figure out how to build this" |
| **Jake** | Lead Planner | `agents/planner.md` | "Plan this out", breaking features into steps |
| **Sara** | Lead Architect | `agents/architect.md` | System design, "how should I structure this?" |
| **Max** | Test Engineer | `agents/tdd-guide.md` | Writing tests, TDD workflow, new features |
| **Nina** | Code Reviewer | `agents/code-reviewer.md` | "Review this code", after any build |
| **Elena** | Security Lead | `agents/security-reviewer.md` | "Is this safe?", before deploys, auth/API work |
| **Tom** | Build/DevOps Engineer | `agents/build-fixer.md` | "Build is failing", TypeScript errors, red terminal |
| **Aisha** | QA Lead | `agents/e2e-runner.md` | "Run the tests", "test the login flow" |
| **Liam** | Frontend Engineer | `agents/ui-builder.md` | Any UI work — landing pages, dashboards, components |
| **Yuki** | Refactor Specialist | `agents/refactor-cleaner.md` | "Clean this up", dead code, duplicates |
| **Rachel** | Technical Writer | `agents/doc-updater.md` | "Update the docs", after API/schema changes |
| **Andre** | Database Architect | `agents/database-reviewer.md` | "This query is slow", schema design, DB review |
| **Fatima** | Data Engineer | `agents/data-engineer.md` | Pipelines, new data sources, ETL, entity resolution |
| **Dave** | Codebase Auditor | `agents/codebase-auditor.md` | "Review the codebase", "what needs fixing?" |

## How the team communicates

When a team member activates, they introduce themselves at the start:

> **Nina here** — reviewing your latest changes.

> **Tom here** — let me look at that build error.

You always know who is working on what. If multiple people are needed (like Jake and Sara for planning), they both check in.

## How they work together

The build pipeline moves work through the team:

1. **Maya** reads new context and sets direction
2. **Jake** breaks it into tasks, **Sara** designs the architecture
3. **Max** writes tests, **Liam** builds the frontend, **Fatima** handles data pipelines
4. **Nina** reviews the code, **Elena** checks security
5. **Aisha** runs E2E tests, **Tom** fixes any build errors
6. **Rachel** updates the docs, **Andre** optimizes the database
7. **Dave** audits the whole thing when you need a health check

You don't manage them. Describe what you want and the right people show up.
