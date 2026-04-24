---
description: Audit the codebase against the project's original requirements. Checks schema drift, pipeline gaps, entity resolution compliance, and architecture readiness.
---

# /audit — Backend Spec Compliance Audit

Also triggers when you say: "audit the backend", "check for gaps", "are we missing anything", "compare against the spec", "what's drifted", "check the architecture"

This command activates **Dave** (codebase auditor) and **Andre** (database architect) against the project's original requirement documents.

## Process

### 1. Read Original Requirements

Read every document in `context/requirements/` IN FULL. Do not skip pages or sheets. These are the source of truth.

Key documents to look for:
- Database schema documents (Excel, PDF, or MD)
- Development strategy or specification documents
- Data source rollout plans
- Field reference documents or API specs

CRITICAL: Never check against memory or summaries alone. Always read the originals.

### 2. Read Current Implementation

- All database migrations: `[project]/[db_folder]/migrations/*.sql`
- All pipeline code: `[project]/pipeline/**/*.ts` (if applicable)
- Pipeline types: `[project]/pipeline/types.ts` (if applicable)
- Any golden file tests

Check `CLAUDE.md` for the project's actual folder structure.

### 3. Schema Drift Analysis

For each table in the requirements, compare every field against migrations:
- MATCH / MISSING / EXTRA / TYPE MISMATCH / DEFERRED

### 4. Pipeline Completeness (if applicable)

For each data source connector:
- Which fields does the requirements spec say should be extracted?
- Which fields does the connector actually extract?
- Flag missing extractions

Also check:
- Entity resolution: does implementation match the spec?
- Auto-population: do rules cover everything specified?

### 5. Architecture Readiness

- Can the current design scale to the next phase without a rewrite?
- Are there hardcoded assumptions that will break?
- Connector pattern scalability check

### 6. Data Integrity (if database access available)

- Record counts by source
- Orphaned records
- Null values in required fields
- Match status distribution

## Output Format

```
BACKEND AUDIT
Date: [today]
Checked against: [document names from context/requirements/]
=======================================================

SUMMARY
  Schema compliance: X/Y fields (Z%)
  Pipeline coverage: X/Y extractions working
  Auto-population: X rules active, Y gaps
  Entity resolution: COMPLIANT / X deviations
  Architecture: READY / X blockers

CRITICAL GAPS (fix before next milestone)
HIGH GAPS (fix before shipping)
MEDIUM GAPS (next phase scope)
SCHEMA DRIFT DETAIL
PIPELINE COVERAGE DETAIL
ARCHITECTURE NOTES
```

## Saving the Audit

Every audit MUST be saved to `context/audits/`:
- Filename: `YYYY-MM-DD-backend-audit.md`
- If multiple audits on the same day: `YYYY-MM-DD-backend-audit-2.md`
- Include the full report with all sections

## Rules
- ALWAYS read the original requirements. Never trust summaries alone.
- Backend only. Skip all frontend/UI.
- Every gap gets a fix effort estimate.
- After the audit, ask: "Want me to fix the critical gaps now?"
