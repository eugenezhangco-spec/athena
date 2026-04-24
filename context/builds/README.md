# context/builds/

Build records — one pair of files per build: a PLAN and a RESULT.

## File Types

| Suffix | Written by | Contains |
|--------|-----------|----------|
| `-PLAN.md` | `/plan` (after The user approves) | Tasks, acceptance criteria, boundaries |
| `-RESULT.md` | `/verify` | Test results, criteria check, verdict |

## File Naming

`YYYY-MM-DD-HHMM-[topic]-PLAN.md`
`YYYY-MM-DD-HHMM-[topic]-RESULT.md`

Example pair:
```
2026-03-23-1500-user-notifications-PLAN.md
2026-03-23-1645-user-notifications-RESULT.md
```

## How It Works

1. The user approves a plan → PLAN file written automatically
2. Build happens
3. Post-build reconciliation compares PLAN vs actual → deviations flagged
4. `/verify` runs tests + criteria check → RESULT file written
5. RESULT links back to PLAN for traceability

## Why This Exists

This folder is your build memory. It answers:
- "What were we supposed to build?" → PLAN file
- "Did we actually build it?" → RESULT file
- "When did we do this?" → filename timestamp

/verify reads the latest PLAN when it runs — so the acceptance criteria are always tied to what was actually approved, not what someone remembered.
