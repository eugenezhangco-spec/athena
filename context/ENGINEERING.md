# [PROJECT NAME] — Engineering Reference

> This document is the technical source of truth for the project.
> It is updated by the engineering team as the codebase evolves.
> The `/inbox` command updates this file automatically when technical documents arrive.

---

## Architecture Overview

[Describe the system architecture once it's defined. Include:
- Frontend framework and hosting
- Backend / API layer
- Database
- External APIs and data sources
- Auth provider
- Any other key infrastructure]

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | [e.g., Next.js 15, React 19] | |
| Styling | [e.g., Tailwind CSS 4] | |
| Database | [e.g., Supabase (PostgreSQL)] | |
| Auth | [e.g., Supabase Auth / NextAuth] | |
| Deployment | [e.g., Vercel] | |
| Testing | [e.g., Vitest + Playwright] | |

---

## Data Flow

[Describe how data moves through the system:
- User interaction → API route → database → response
- External data sources → ingestion pipeline → database
- etc.]

---

## Key Decisions

[Architecture decisions get logged here as they're made. Format:
- **Decision**: What was decided
- **Why**: The reason behind the decision
- **Alternatives considered**: What else was evaluated
- **Date**: When this was decided]

---

## Database Schema

[Describe the key tables/collections and their relationships once the schema is defined.]

---

## External APIs and Integrations

| Service | Purpose | Auth Method | Notes |
|---------|---------|------------|-------|
| [Service name] | [What it does] | [API key / OAuth / etc.] | |

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|---------|
| [VARIABLE_NAME] | [What it does] | Yes/No |

---

## Codebase Map

[Updated as the codebase grows. Key files and what they do:]

- [path/to/file.ts] — [What it does]

---

## Changelog

[The engineering team logs significant technical changes here:]

| Date | Change | Why |
|------|--------|-----|
| [DATE] | [What changed] | [Reason] |
