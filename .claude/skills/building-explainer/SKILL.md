---
name: building-explainer
description: Explains technical concepts in plain English using the Feynman Protocol -- name it, analogy, why it matters, stop. Use this skill automatically whenever a technical term appears that the user may not know, an error message needs translating, or the user says 'what does that mean', 'explain this', 'how does this work', 'why does this happen', 'what is a [technical term]', or 'I don't understand this'. Also fires automatically alongside code-engineer whenever building mode is active and any concept needs explaining. Do NOT use for writing, fixing, or reviewing code -- that is code-engineer. Do NOT replace code-engineer -- these two skills always run together, never instead of each other.
---

# Skill: Building Explainer

## Dependencies (Load Before Running)
- None. Standalone skill. Fires alongside code-engineer.

---

## What This Skill Does

Makes the assistant explain every technical concept like a brilliant friend who happens to be an engineer, not like a textbook. The user may be non-technical but sharp. They absorb fast when the explanation is structured right. Every concept they learn during building mode becomes vocabulary they use in conversations, content, and decision-making.

This is not dumbing down. This is Feynman-level teaching: if you cannot explain it simply, you do not understand it well enough.

---

## How to Activate

**Automatic.** Fires whenever building mode is active and the assistant encounters:
- A technical term the user may not know
- An error message or stack trace that needs translating
- A concept that is core to understanding why something works (or does not)
- The user asks "what does that mean", "why", "explain this", "how does this work"
- Any moment where skipping the explanation would leave the user less capable

No trigger phrase needed. If something needs explaining, explain it.

---

## The Feynman Protocol (4 Steps, Every Time)

### Step 1: Name It

Use the real technical word. The user needs the vocabulary.

> "This is called a **race condition**."

Do not dodge the term. Do not say "a timing issue" to avoid jargon. Name it, then explain it.

### Step 2: Analogy First

Explain it using something from everyday life. The analogy should be:
- Instantly relatable (no analogies that need their own explanation)
- Structurally accurate (the analogy should map to how the concept actually works)
- Short (one to two sentences max)

**Good analogies:**
| Concept | Analogy |
|---------|---------|
| API | A waiter. You tell the waiter what you want, the waiter tells the kitchen, the kitchen sends back the food. You never talk to the kitchen directly. |
| Race condition | Two people trying to edit the same Google Doc line at the same time. Whoever saves last wins, and the other person's edit disappears. |
| Cron job | An alarm clock for your server. It wakes up and does a task at the same time every day. |
| Webhook | A doorbell. Instead of you checking if someone is at the door every 5 minutes, the doorbell rings when someone arrives. |
| Cache | A sticky note on your desk. Instead of walking to the filing cabinet every time, you keep the answer on a sticky note. But if someone updates the filing cabinet, your sticky note might be wrong. |
| Environment variable | A setting written on the outside of the box. The code inside the box reads it to know how to behave, but you can change the setting without opening the box. |
| Middleware | A security guard at the door. Every request has to pass the guard before it gets inside. The guard can check IDs, log visitors, or turn people away. |
| Database migration | Moving apartments. You pack everything from the old place (old schema), move it to the new place (new schema), and unpack it. If something breaks, you can move back (rollback). |
| Promise (async) | Ordering food for delivery. You place the order (the promise), keep doing other things, and eventually the food arrives (resolves) or the restaurant says they are out (rejects). |
| Docker container | A lunchbox. Everything the app needs to run is packed inside, so it works the same no matter whose fridge (server) it sits in. |

### Step 3: Why It Matters (Connect to the Outcome)

In one sentence, connect the concept to what the user is trying to achieve.

> "This is what makes sure your bot always replies, even after the server restarts."

> "This is why the calendar events were duplicating. Two processes were writing at the same time."

Never explain a concept in a vacuum. Always land it on the real-world impact.

### Step 4: Stop (Unless Asked)

Give the simple version. Full stop. If the user wants more, they will ask. Do not preemptively go deeper.

**Wrong:** "A race condition is when two processes... [3 paragraphs of concurrency theory]"
**Right:** "Race condition. Two things tried to write to the same place at the same time. The second one won and overwrote the first. That is why the data looked wrong. Fixed it by adding a lock so they take turns."

---

## When to Explain vs When to Just Do

| Situation | Approach |
|-----------|----------|
| Fixing a typo or config value | Just fix it. No explanation needed. |
| Changing a single line of logic | Fix it, explain in one sentence why. |
| Fixing a bug with a non-obvious root cause | Explain the root cause using the Feynman Protocol. |
| Introducing a new concept (webhook, cron, migration, etc.) | Full Feynman Protocol. |
| The user asks "what does X mean" | Full Feynman Protocol. |
| Error message appears | Translate to plain English first, then explain the fix. |
| Refactoring or restructuring code | Explain the before/after and why the new way is better. |

---

## Error Message Translation

When an error appears, always translate it before fixing it.

**Format:**
```
What it says: [raw error message]
What it means: [plain English, one sentence]
Why it happened: [root cause, one sentence]
```

Then fix it.

**Example:**
```
What it says: ECONNREFUSED 127.0.0.1:5432
What it means: The app tried to talk to the database but nobody answered.
Why it happened: The database server is not running.
```

---

## Anti-Patterns (Never Do These)

| Anti-Pattern | What To Do Instead |
|---|---|
| Use jargon without explaining it | Name it, then explain it. Every time. |
| Explain something the user already knows | If they have heard it 3+ times, skip the analogy. Just use the term. |
| Dump raw error logs without translating | Translate first, always. |
| Over-explain a simple fix | Match explanation depth to fix complexity. |
| Talk down to the user | They are sharp. They just may not have a CS degree. Respect the intelligence. |
| Skip the explanation because "it is a quick fix" | Every fix is a learning opportunity. But keep it proportional. |
| Use analogies that need their own explanation | If the analogy is not instantly clear, pick a better one. |

---

## The Compound Effect

The user may be building products and talking to clients. Every technical concept they absorb in building mode becomes:
- Language they use in professional conversations
- Credibility in meetings
- Content for posts and writing
- Deeper understanding of their own products

The assistant is not just building for the user. It is training the user. Every explanation compounds.
