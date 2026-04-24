---
name: spending-summary
description: Query the user's Notion Expenses database and produce spending summaries — by month, category, merchant, tax-deductible status, or arbitrary date range. Use when the user says "how much did I spend", "summarize my spending", "budget for [period]", "tax-deductible total", "what did I spend on [category]", "monthly summary", "spending breakdown", or asks anything analytical about their expenses.
---

# Skill: Spending Summary

## When to Use

- User asks "how much did I spend [in some period / on some category]"
- User asks for a monthly / weekly / quarterly / YTD summary
- User asks "what's my tax-deductible total for [period]"
- User asks "what's my biggest expense category this month"
- User asks "how often do I spend at [merchant]"
- User asks "am I over budget on [category]"
- User asks for data to send to their accountant

## Prerequisites

Reads from the user's Notion Expenses database. Same keys as `log-expense`:

```
expenses_database_id: <user's Notion database ID>
expenses_data_source: collection://<data source id>
```

If the keys aren't configured or the database has zero rows, say so and stop — don't fabricate numbers.

## Expected Schema

Same as `log-expense`:
- Name (title), Amount (number), Currency (select), Category (select), Merchant (text), Date (date), Payment Method (select), Tax Deductible (checkbox), Business (checkbox), Notes (text)

## Flow

### Step 1 — Parse the ask

Extract filters from the user's message:
- **Period** — "this month", "last week", "Q1 2026", "2025", "March", "since March 1", "this year"
- **Category** — any value from the Category select, or keyword matches ("food", "travel")
- **Merchant** — specific name or pattern
- **Tax status** — "tax-deductible", "business only", "personal"
- **Aggregation** — total, average, breakdown by category, top merchants, frequency

Resolve relative dates to absolute dates in the user's timezone (from `.claude/rules/operating-rules.md` User Profile).

### Step 2 — Query

Use `mcp__notion__notion-fetch` or the Notion data-source query tool to pull the matching rows. Typical filters:

| User ask | Notion query |
|---|---|
| "How much this month" | Date between first-of-month and today |
| "Food spending this year" | Date ≥ Jan 1 2026, Category = "Food & Drink" OR "Groceries" |
| "Tax-deductible Q1" | Date in Q1, Tax Deductible = true |
| "Biggest category this month" | Date in month, group by Category, sum Amount |
| "How often at Starbucks" | Merchant contains "Starbucks", count |

If the dataset is small (under 200 rows), pull everything and aggregate locally for flexibility.

### Step 3 — Aggregate

Compute the right shape for the question:

- **Total:** sum of Amount, grouped by Currency (don't collapse different currencies).
- **Breakdown by category:** sum + percent of total, sorted descending.
- **By merchant:** top 5 merchants by spend + count.
- **Over time:** bucket by week/month, show trend.
- **Tax-deductible:** total of rows with Tax Deductible = true, with a note about consulting an accountant.

### Step 4 — Report

Output format depends on the interface:

**On Telegram** — compressed, plain text, under 10 lines:

```
April 2026 spending:
Total: $1,847 USD
Food & Drink: $412 (22%)
Transport: $389 (21%)
Groceries: $285 (15%)
Shopping: $234 (13%)
Other: $527 (29%)

Tax-deductible: $178
```

**In Claude Code** — slightly richer, with a one-line observation at the bottom:

```
## April 2026 Spending

Total: $1,847 USD (12 days into the month)

| Category | Amount | % |
|---|---|---|
| Food & Drink | $412 | 22% |
| Transport | $389 | 21% |
| Groceries | $285 | 15% |
| Shopping | $234 | 13% |
| Software & SaaS | $187 | 10% |
| Business | $140 | 8% |
| Other | $200 | 11% |

Tax-deductible total: $178

Observation: Food & Drink is trending 18% higher than March. Mostly takeout.
```

### Step 5 — Offer the next action

Based on what the user asked, suggest a follow-up:

- If they asked for a monthly summary → offer to export to CSV for their accountant (`mcp__filesystem__write_file`, if filesystem MCP is enabled)
- If they're over a mental budget → offer to flag the category in `snapshot.md`
- If they asked for tax-deductible → remind them to double-check with their accountant; Athena is not a tax advisor

## Rules

- Never invent data. If the query returns zero rows or the database isn't configured, say so plainly.
- Keep currencies separate in the output. Mixed-currency totals are usually wrong.
- Round to the nearest unit in output; keep full precision in calculations.
- If the user asks about a category that doesn't exist in their data, say so and list the categories that do appear.
- Never suggest tax strategies. Surface the deductible total and stop.

## Observations the mentor might add

After presenting numbers, Athena's coaching lens can surface:
- Pattern detection: "You've spent $400 on food delivery this month. Last month was $180."
- Underpricing pattern: if the user runs a business and expenses are low relative to stated revenue
- Comfort-zone work: if a category keeps creeping up (e.g. retail therapy after stressful weeks documented in diary.md)

Keep observations tight. One sentence. Never moralize.

## Output Format

Always lead with the numbers. Observations come last, one sentence, optional.

## Related Skills

- `log-expense` — capture a receipt/invoice into the Expenses DB
- `compile` — synthesize spending history into a longer-term brief ("what are my financial patterns?")
- `weekly-review` — budget audit fits naturally into the weekly review flow
