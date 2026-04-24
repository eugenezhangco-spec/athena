---
name: humanizer
description: Rewrite existing text to remove AI patterns and match the project's voice. Use when pasting text from another AI, rewriting old drafts, or cleaning up imported content.
user-invocable: true
---

# /humanizer — Rewrite Existing Text to Remove AI Patterns

> **Note:** The humanizer rules are ALWAYS ON via `.claude/rules/writing-quality.md`. Every external draft is written with these patterns in mind automatically. This `/humanizer` command exists as a manual tool for rewriting text that was already written — by another AI, pasted from somewhere, or from an earlier draft that slipped through.
>
> Think of it this way: the rule file is DNA (always present in every cell). This skill is a tool (you pick it up when you need it for a specific job).

---

## Voice DNA

**Step 1: Load `personal/voice-dna.md`.** If it exists, that IS the user's voice. Match it exactly.

**Step 2: Read the room.** The same person writes differently to a client vs a friend vs their team. Match the context:

| Context | Register |
|---------|----------|
| Client email | Professional but still them. No corporate stiffness unless that IS their style. |
| Friend / casual | How they'd text. Short, loose, personality showing. |
| LinkedIn / public | Their brand voice. Confident, specific, opinionated. |
| Internal / team | Direct, efficient. Skip the niceties unless that's their culture. |
| Formal (legal, board, investor) | Measured and precise. Still them, just buttoned up. |

**Step 3: If no voice-dna.md exists,** use these defaults until one is built:
- Direct. No warm-up paragraphs.
- Specific. Name the number, the person, the date.
- Conversational. Write like talking to a smart colleague.
- Vary rhythm. Short sentences. Then a longer one. Fragments are fine.

---

## The 25 AI Writing Patterns

Detect and fix all of the following. Based on Wikipedia's "Signs of AI Writing" guide.

### Content Patterns

**1. Significance inflation.** Words like "testament", "pivotal moment", "vital role", "indelible mark", "setting the stage", "deeply rooted." AI puffs up importance. Cut it. State the fact.
- Before: "This marks a pivotal moment in the evolution of modern analytics."
- After: "We shipped cross-source data aggregation. Users can now query both providers in one search."

**2. Notability inflation.** Listing media coverage or follower counts without context. If you cite coverage, say what was said, not just where.
- Before: "Featured in multiple industry publications."
- After: "TechReview covered our aggregation approach in their March issue, calling it 'the first practical implementation.'"

**3. Superficial -ing analyses.** Tacking "-ing" phrases onto sentences for fake depth: "highlighting", "underscoring", "symbolizing", "showcasing", "fostering", "ensuring."
- Before: "The platform aggregates data from multiple sources, showcasing how integration enhances transparency."
- After: "The platform pulls data from multiple sources into one view."

**4. Promotional language.** "Groundbreaking", "vibrant", "stunning", "breathtaking", "nestled", "boasts", "renowned." Describe what the thing does, not how impressive it is.
- Before: "The product boasts a groundbreaking approach to data management."
- After: "The product pulls data from multiple providers into one searchable database."

**5. Vague attributions.** "Experts say", "industry observers note", "some critics argue." Name the person or drop the claim.
- Before: "Industry experts agree that data fragmentation is the biggest challenge."
- After: "Our lead engineer, who spent 10 years in the space, calls data fragmentation the core problem."

**6. Formulaic "challenges and future" sections.** "Despite challenges... continues to thrive." "The future looks bright." State what's actually happening.
- Before: "Despite challenges in data standardization, the company continues to thrive."
- After: "Data formats vary by provider. We normalize them into a common schema."

### Language and Grammar Patterns

**7. Overused AI vocabulary.** Additionally, crucial, delve, enduring, enhance, fostering, garner, highlight (verb), interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, valuable, vibrant. Replace with simpler words or cut entirely.

**8. Copula avoidance.** "Serves as", "stands as", "functions as", "boasts", "features", "offers." Just use "is", "are", "has."
- Before: "The product serves as a single source of truth for operational data."
- After: "The product is a single source of truth for operational data."

**9. Negative parallelisms.** "It's not just X, it's Y." "Not only... but also..." Overused. Just state the point.
- Before: "It's not just a database. It's a decision-making tool for operators."
- After: "Operators use it to compare options before committing."

**10. Rule of three.** AI forces ideas into groups of three. Real people don't always think in threes.
- Before: "Speed, accuracy, and transparency."
- After: "It's fast and the data is traceable."

**11. Synonym cycling.** Using different words for the same thing to avoid repetition: "the platform", "the tool", "the system", "the solution." Pick one and stick with it.
- Before: "The platform aggregates data. The tool normalizes formats. The system resolves conflicts."
- After: "The product aggregates data, normalizes formats, and resolves conflicts across sources."

**12. False ranges.** "From X to Y" constructions where X and Y aren't on a meaningful scale.
- Before: "From small startups to global enterprises, from simple to complex."
- After: "We work with companies at different scales. Most are mid-market."

### Style Patterns

**13. Em dash overuse.** AI loves em dashes. Use commas, periods, or parentheses instead. One em dash per piece of writing maximum.

**14. Excessive bold.** Don't bold every key phrase. If everything is emphasized, nothing is.

**15. Inline-header vertical lists.** Bullet points starting with "**Header:** description" is an AI tell. Convert to flowing prose or simple bullets without bold headers.

**16. Title Case in headings.** Use sentence case. "Strategic partnerships" not "Strategic Partnerships."

**17. Emojis.** Never. Not in emails, not in LinkedIn posts, not anywhere in external communications.

**18. Curly quotes.** Use straight quotes ("like this") not curly quotes.

### Communication Patterns

**19. Chatbot artifacts.** "I hope this helps!", "Let me know if you'd like me to expand", "Great question!", "Here is an overview of..." Delete these entirely.

**20. Knowledge-cutoff disclaimers.** "As of my last update", "While specific details are limited..." If you don't know something, say so plainly or don't mention it.

**21. Sycophantic tone.** "Great question!", "You're absolutely right!", "That's an excellent point!" React to content, not to the person asking.

**22. Filler phrases.** "In order to" -> "To." "Due to the fact that" -> "Because." "At this point in time" -> "Now." "It is important to note that" -> cut it.

**23. Excessive hedging.** "It could potentially possibly be argued that it might..." -> State it or don't.

**24. Generic positive conclusions.** "The future looks bright." "Exciting times ahead." End with something specific or don't end with an outlook at all.

**25. Hyphenated word pair overuse.** AI hyphenates with perfect consistency. Humans are inconsistent. For common compounds (cross functional, high quality, data driven), drop the hyphen unless it genuinely aids clarity.

---

## Process

The goal is simple: **do not sound like AI. Sound like the user.**

When the user says `/humanizer` or asks to humanize a draft:

1. **Load voice-dna.md.** That is the target voice. If it does not exist, use the defaults above.
2. **Detect context.** Who is this for? Client, friend, public, internal? Adjust register.
3. **First pass.** Kill all 25 AI patterns above. Apply the user's voice. Keep the core message.
4. **Gut check.** Read it back. Would a human reading this think AI wrote it? If yes, find why:
   - Every sentence the same length?
   - No opinion or personality?
   - Too tidy, too structured?
   - Missing "I" where the user would naturally use it?
5. **Second pass.** Fix what the gut check caught.
6. **Present the final version.** Brief summary of what changed.

## Output Format

```
## Rewrite

[The humanized text]

## What changed
- [Brief bullets listing the patterns that were fixed]
```

If the original text is clean, say so. Don't rewrite for the sake of rewriting.

---

## Context-Specific Guidelines

### Emails to partners / stakeholders
- Be direct. Peers are peers, not customers.
- Skip pleasantries beyond a one-line opener. Get to the point.
- End with a clear ask or next step, not a vague sign-off.

### LinkedIn posts
- Hook in the first line. LinkedIn truncates after ~150 characters.
- Write like you're telling a friend what happened. Not like you're writing a press release.
- One idea per post. Don't try to cover everything.
- No hashtag spam. Two or three max, at the end.

### Pitch materials (investors, partners, clients)
- Lead with the problem, not the solution.
- Use real numbers. "2,000 customers across 3 markets" beats "rapid growth."
- Name names. Specificity builds trust.
- Acknowledge what doesn't exist yet. Honesty about roadmap beats vaporware.

### Investor updates
- Lead with metrics, then narrative. Numbers first, story second.
- Bad news early, not buried. Investors respect candor.
- End with a specific ask if you have one. Don't waste the touchpoint.

---

## Reference

Patterns sourced from [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), maintained by WikiProject AI Cleanup. Adapted for founder-led project communications.
