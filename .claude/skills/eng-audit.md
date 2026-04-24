# /audit — Backend Spec Compliance Audit

When this skill is triggered, perform ALL of the following steps.

## Purpose

Compare what was originally specified (requirements documents) against what actually exists in the codebase and database. Find gaps, drift, missing fields, and architectural misalignment. Backend only. No frontend.

## When to Trigger

This skill runs when you say any of:
- "/audit"
- "audit the backend"
- "check for gaps"
- "are we missing anything"
- "compare against the spec"
- "what's drifted"
- "spec compliance"
- "check the architecture"

## Step 1: Read Original Source Documents

Read every file in `context/requirements/` IN FULL. Do not skip sheets or pages. These are the source of truth, not summaries.

Look for:
- Database schema documents (Excel, PDF, Markdown)
- Development strategy documents
- Data source rollout plans
- API field reference documents

CRITICAL: Never check against memory alone. Always read the originals.

## Step 2: Read Current Codebase

Scan the actual implementation. Check `CLAUDE.md` for the project's folder structure, then:

### Database Schema
- Read all migration files
- Read seed files
- Read any schema definition files

### Pipeline (if applicable)
- Read all connectors
- Read entity resolution
- Read auto-population logic
- Read pipeline types

### Config Tables
- Check auto-population rules coverage
- Check field authority rules
- Check data source entries

### Tests
- Read any golden file tests
- Check for other test files

## Step 3: Schema Drift Analysis

Compare the requirements schema against actual migrations:

For each table specified in requirements:
- List every field that was specified
- Check if that field exists in the migrations
- Flag: MISSING (in spec, not in DB), EXTRA (in DB, not in spec), TYPE MISMATCH, NAME MISMATCH
- Note which fields are intentionally deferred (with reason)

### Output Format
```
SCHEMA DRIFT: [table_name]
  [field_name] -- MATCH (Spec: type, Ours: type)
  [field_name] -- MISSING (spec says it should exist)
  [field_name] -- EXTRA (we added, not in spec)
  [field_name] -- DEFERRED (planned for Phase X)
```

## Step 4: Pipeline Completeness (if applicable)

For each data source connector:
- List every field the requirements expect to be extracted
- Check which ones the connector actually extracts
- Flag missing extractions

Also check:
- Entity resolution: does implementation match the spec?
- Auto-population: do rules cover everything specified?
- Field authority: do rules match the specified source hierarchy?

## Step 5: Architecture Alignment

Check if current architecture supports the growth path:

- Can sources be added without redesigning?
- Can auto-population rules scale?
- Can entity resolution handle more sources?
- Are there hardcoded assumptions that will break with new sources?

## Step 6: Data Integrity Check

If database credentials are available, run diagnostic queries:
- Count records by source
- Check for orphaned records
- Check for null values in required fields
- Check match status distribution

If no database access, generate the SQL queries for manual execution.

## Step 7: Gap Report

Produce a single consolidated report:

```
BACKEND AUDIT
Date: [today]
Checked against: [document names from context/requirements/]
=======================================================

SUMMARY
  Schema compliance: X/Y fields implemented (Z%)
  Pipeline coverage: X/Y expected extractions working
  Auto-population: X rules active, Y gaps identified
  Entity resolution: COMPLIANT / X deviations
  Architecture: READY for next phase / X blockers

CRITICAL GAPS (fix before next milestone)
  1. [gap] -- [what spec says] vs [what we have] -- [fix effort]

HIGH GAPS (fix before shipping)
  1. [gap] -- [what spec says] vs [what we have] -- [fix effort]

MEDIUM GAPS (next phase scope, acceptable for now)
  1. [gap] -- [why it's deferred]

SCHEMA DRIFT DETAIL
  [full table-by-table comparison]

PIPELINE COVERAGE DETAIL
  [connector-by-connector field list]

ARCHITECTURE NOTES
  [scalability assessment for next phase]
```

## Step 8: Recommendations

Prioritize findings:
1. **Fix now** (before next milestone): anything that would fail in a demo or contradicts the explicit spec
2. **Fix before shipping**: anything that shows what was built doesn't match what was said
3. **Next phase**: anything correctly deferred per the phased plan
4. **Nice to have**: improvements beyond the spec

## Rules

- ALWAYS read the original requirements. Never trust summaries alone.
- Compare against EXACT field names, types, and descriptions from the spec.
- If a field is missing but intentionally deferred, say so (don't flag it as a bug).
- If we added something not in spec, flag it but note it as an enhancement.
- Focus on backend only. Ignore frontend/UI issues entirely.
- Keep the report actionable. Every gap has a fix effort estimate.
- After the audit, ask: "Want me to fix the critical gaps now?"
