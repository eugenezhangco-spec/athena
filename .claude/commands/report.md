# /report — Show Master Report

Also triggers when the user says: "show me the report", "what's the full picture?", "investor update", "where do we stand overall?"

This command is READ-ONLY. It does not modify anything.

## Process

1. Read `context/reports/MASTER-REPORT.md`
2. Present it to the user in full
3. If the master report doesn't exist, tell the user to run `/milestone` first

## Notes

- This is for quick reference only — no changes made
- If the report looks stale, suggest running `/milestone` to update it
- The master report is written for external stakeholders (executives, investors, partners)
