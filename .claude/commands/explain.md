---
description: Explain what just happened in plain English. Use after any significant change, build, or when confused.
---

# /explain — What Did We Just Do?

Also triggers when you say: "what the hell is [X]?", "explain like I'm 12", "can you explain that in a simpler fashion?", "I don't understand what you mean", "what does that mean?", "I want to learn too, teach me this", "explain what you built", "what happened?", "can you break that down?"

## Scope Rule (CRITICAL)

ONLY explain what was worked on in THIS session. Do not explain the full project, the architecture, or unrelated systems. If nothing was done yet in this session, say so and ask what they want explained.

## Why This Command Exists

The user builds production tools and talks to real stakeholders — partners, clients, investors. When someone asks "what did you build?", the user needs to answer confidently. This command teaches them the words to use and what those words mean, one session at a time. Over time, they build real technical fluency.

## Process

1. **Look at this session only** — what files changed, what was built, what was fixed
2. **Pick the 1-3 most important things** — not everything, just what matters
3. **Explain using the format below**

## Output Format

### What we did
- 1-3 bullet points. One sentence each. Plain English.
- Name the technical thing, then immediately explain it in parentheses.
- Example: "We added a webhook endpoint (a URL that Stripe calls automatically when someone pays, so your app finds out instantly instead of having to keep checking)."

### Why it matters
- One sentence: what can be done now that couldn't before?
- One sentence: what problem or risk did this solve?

### The one thing to remember (Feynman moment)
Pick ONE technical concept from this session. Teach it like this:
1. **Name it** — use the real term. "This is called a migration."
2. **Analogy** — explain it with something from everyday life. "A migration is like a set of instructions for rearranging furniture. You write down exactly what to move and where, so anyone can follow the steps and end up with the same room layout."
3. **Why you'd say it** — give them the sentence they'd use in a meeting. "If a stakeholder asks, you'd say: 'We wrote a database migration to add the new fields for tracking subscriptions.'"

### What's next
- One sentence on the immediate next step.

## Rules

- **This session only.** Never recap the whole project. Never explain systems that weren't touched today.
- **Super beginner level.** Explain like you're teaching someone who's smart but has never written code. No assumed knowledge.
- **Short.** The whole explanation should take under 90 seconds to read. If you're writing more than that, you're over-explaining.
- **Name the tech, then translate.** Always say the real technical term so the user learns the vocabulary, but always follow it with a plain English definition in the same sentence.
- **One Feynman moment per explain.** Don't try to teach five concepts. Pick the one that matters most and make it stick.
- **Give them the words.** Always include a sentence they could say to a stakeholder. This is the most practical part.
- **No jargon without a definition.** If you say "API", "endpoint", "middleware", "schema", "migration", "component", "state" — define it right there, in parentheses, that same sentence.
- **Don't be condescending.** They're sharp. They just don't have the vocabulary yet. Teach, don't lecture.
