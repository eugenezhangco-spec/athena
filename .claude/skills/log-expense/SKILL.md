---
name: log-expense
description: Extract and log an expense from a receipt photo into the user's Notion Expenses database. Auto-proposes the extraction, waits for approval before writing. Use when the user sends a receipt photo, says "log this expense", "add to expenses", "budget this", "track this spend", "save this receipt", or when an image sent on Telegram is clearly a receipt, invoice, or order confirmation.
---

# Skill: Log Expense

## When to Use

- User sends an image that is clearly a receipt, invoice, order confirmation, or proof-of-payment
- User says "log this expense", "add to expenses", "budget this", "track this spend", "save this receipt"
- User forwards an emailed receipt (screenshot or attachment)
- User types an expense manually ("log $42 coffee, client meeting")

**Do NOT auto-log without a proposal step.** Expenses are financial records — always show the extracted data and wait for approval before writing. This is a Yellow tier action.

## Prerequisites

Writes to a Notion database. The user must have configured in `personal/notion-databases.md`:

```
expenses_database_id: <user's Notion database ID>
expenses_data_source: collection://<data source id>
expenses_parent_page: <parent page id>
```

If the keys are missing, pause and guide the user through setup. Link to `docs/SETUP.md` section 9 (Notion Database Wiring).

## Expected Notion Schema

| Property | Type | Notes |
|----------|------|-------|
| Name | title | Merchant + short descriptor (e.g. "Starbucks — meeting coffee") |
| Amount | number | Positive, in the currency's base unit (4.85, not 485) |
| Currency | select | USD, EUR, GBP, SGD, AUD, JPY, CAD, Other |
| Category | select | Food & Drink, Groceries, Transport, Travel, Accommodation, Software & SaaS, Entertainment, Health, Shopping, Utilities, Home, Business, Tax-Deductible, Gifts, Other |
| Merchant | text | Name as it appears on the receipt |
| Date | date | Transaction date (from the receipt, not today) |
| Payment Method | select | Card, Cash, Transfer, Other |
| Tax Deductible | checkbox | True for business-related or clearly deductible items |
| Business | checkbox | True if the expense is work/company-related vs personal |
| Notes | text | Any context (client name, project, line items if meaningful) |

Adapt to the user's actual property names if they differ — do not fail the save over naming differences.

## Flow

### Step 1 — Extract

Read the image (Claude vision handles receipts natively). Pull:

1. **Merchant** — the store/business name at the top of the receipt.
2. **Amount** — the total paid (not subtotal). Include tip if shown on the same receipt.
3. **Currency** — infer from the symbol or merchant location. If ambiguous, ask.
4. **Date** — transaction date from the receipt. If only a time is visible, use today and flag it.
5. **Payment method** — from the footer if shown (last-4 card, CASH, etc.). Otherwise "Card" as default.
6. **Line items** — if helpful, summarize in Notes (e.g. "2x latte, 1x croissant"). Don't list every item if the receipt is long.

### Step 2 — Categorize

Assign a category from the list above. Use this heuristic:

| Pattern | Category |
|---|---|
| Restaurants, cafes, takeout, bars | Food & Drink |
| Supermarkets, farmers' markets | Groceries |
| Uber, Lyft, taxi, subway, train, gas, parking | Transport |
| Hotels, Airbnb | Accommodation |
| Flights | Travel |
| Software subscriptions, domains, hosting, SaaS | Software & SaaS |
| Cinema, concerts, streaming | Entertainment |
| Pharmacy, doctor, gym | Health |
| Clothes, electronics, general retail | Shopping |
| Electric, internet, phone bill | Utilities |
| Furniture, IKEA, home repair | Home |
| Client dinner, coworking, work travel, business tools | Business + Tax-Deductible |
| Anything gift-like | Gifts |

If the user has a pattern you've seen before (e.g. they always mark "Figma" as Business + Tax-Deductible), match that. Check MemPalace if uncertain.

### Step 3 — Propose

Show the extracted entry back to the user as a compact proposal. No Notion write yet.

```
Expense extracted:
- Merchant: Starbucks
- Amount: $4.85 USD
- Category: Food & Drink
- Date: 2026-04-22
- Payment: Card (ending 4321)
- Notes: —
- Tax-deductible: No  |  Business: No

Save? (yes / edit / skip)
```

On Telegram, keep it even tighter — same facts, no decoration:

```
Starbucks, $4.85, Food & Drink, 2026-04-22. Save? yes/edit/skip
```

### Step 4 — Handle the response

- **yes / ok / save** → write to Notion via `mcp__notion__notion-create-pages` using the database from `personal/notion-databases.md`. Confirm with the saved entry + a one-line aggregate ("Week-to-date food spend: $47").
- **edit / change X to Y** → update the field, show the proposal again, re-prompt.
- **skip / cancel / no** → discard. Confirm in one line.

If the user only sends an image with no text, treat that as "propose this expense" by default. They can reply "skip" if it's not actually for logging.

### Step 5 — Attach the receipt (optional)

If the Notion schema includes a `Receipt` files property and the user opted into filesystem access, attach the image file path to the created page. If not available or not configured, skip silently — the record is still useful without the attachment.

## Rules

- Never write without a proposal. Yellow tier.
- If the image is not a receipt (e.g. photo of food, a whiteboard, a dog) fall back to normal Claude vision describe-the-image behavior. Do not force this skill.
- If the user says "log it" multiple times with no image, ask them to describe it or resend.
- Always use the currency on the receipt, not convert. The user can query in native currency later.
- Date parsing: prefer ISO 8601 (YYYY-MM-DD). If the receipt only shows a time, use today's date and flag it in Notes.
- Do not log tips as a separate line unless the receipt separates them. Total-paid is what matters.

## Output Format (after save)

```
Logged to Expenses:
- [Name] — [Amount] [Currency], [Category], [Date]
[optional one-line context, e.g. "Month-to-date in [Category]: $XX"]
```

One-line confirmation. No emojis. No exclamation marks. No "Great!".

## Related Skills

- `spending-summary` — query and aggregate the Expenses database ("how much did I spend on food this month?", "what's my tax-deductible total for Q1?")
- `calendar-manager` — for recurring expenses that are also calendar events (conferences, subscriptions with renewal dates)
