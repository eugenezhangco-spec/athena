---
description: Run the data pipeline — ingest data from configured sources into the database. Check pipeline health and ingestion logs.
---

# /pipeline — Run the Pipeline

Also triggers when you say: "run the pipeline", "pull the data", "ingest", "run [source name]", "let's look at the data"

This command manages the project's data ingestion pipeline.

## Usage

- `/pipeline` — show pipeline status and health
- `/pipeline run [source]` — run a specific connector (replace [source] with your source name)
- `/pipeline run all` — run all connectors
- `/pipeline status` — check last ingestion results
- `/pipeline add [source]` — plan a new data source connector

## Step 1: Check Prerequisites

Before running any pipeline:
1. Verify `.env.local` (or `.env`) exists with required keys:
   - API tokens for each configured data source
   - Database connection keys
2. Verify the database is accessible (try a simple query)
3. Check that migrations have been applied (tables exist)

Check `CLAUDE.md` and `context/ENGINEERING.md` for the project's specific environment variable names.

If anything is missing, explain what's needed in plain English.

## Step 2: Run Connectors

For each connector:
```bash
npx tsx pipeline/connectors/[connector-name]-connector.ts
```

Monitor output for:
- Records fetched
- Records normalized
- Records loaded to database
- Errors (per-record and fatal)
- Rate limiting status

## Step 3: Report Results

### Pipeline Report
| Source | Records Fetched | Loaded | Errors | Status |
|--------|----------------|--------|--------|--------|
| [Source 1] | — | — | — | — |
| [Source 2] | — | — | — | — |

### Errors (if any)
For each error type:
- What went wrong
- How many records affected
- Whether it needs fixing or is expected (some records may have incomplete data)

### Next Steps
- Suggest running entity resolution if new data was loaded
- Flag if any connector needs updating (API changes, new fields)

## Adding a New Data Source

When `/pipeline add [source]` is requested:

1. Read `pipeline/types.ts` to understand the `DataConnector` interface
2. Read an existing connector as a reference
3. Plan the new connector following the same pattern:
   - `fetchRecords()` — paginated fetch with rate limiting
   - `normalizeRecord()` — transform to unified format
   - `loadRecords()` — upsert to database with ingestion logging
4. Present the plan and wait for approval before building
