---
description: Run 5 adversarial Claude subagents against a life or business decision — then synthesize a GO / PAUSE / PIVOT verdict. Built for real decisions: career moves, partnerships, mission choices, pricing, pivots. Not for technical builds.
---

# Council

Five subagents each hold a different lens on your decision. No cheerleading. No generic advice. Athena synthesizes what they surface into a verdict you can act on.

**Cost:** ~25K tokens full, ~15K fast (`--fast` flag, 3 agents). All within your Claude subscription.

---

## When to Trigger

**Explicit:**
- `/council [question or decision]`
- "Run the council on this"
- "Challenge this for me"
- "Stress-test this"
- "I need a second opinion"

**Auto-suggest** (Athena says "Want me to run the Council on that? Type `/council`."):
- User presents a business idea, opportunity, or partnership
- User says "should I...", "I'm thinking about...", "my plan is...", "what do you think about X"
- Decision involves money, time commitment, a pivot, a major life change, or a new direction
- User brings a pricing, deal, or GTM question with real stakes
- User is sitting on a decision they keep returning to
- After `/plan` runs on a major life or business initiative

**Do NOT trigger for:**
- Operational tasks (add to calendar, schedule a meeting, send a message)
- Factual questions
- Creative drafting or editing
- Technical / coding decisions (use `/devils-advocate` instead)
- Decisions the user is clearly already committed to

---

## Execution Steps

### Step 1: Compose the brief

From the conversation, write a 3-5 sentence brief:
- What is the decision or question being evaluated?
- What does the user want to achieve or avoid?
- What are the stakes — time, money, relationships, identity?
- What is the user currently leaning toward?

If the topic is unclear or too thin (under 3 sentences of context), ask one sharp question before spawning. Don't guess at stakes.

### Step 2: Spawn 5 agents in parallel

**ALL 5 Agent calls go in a single message — true parallelism.** Each agent receives the topic brief plus their role prompt. Use `subagent_type: general-purpose` for each.

---

**Agent 1 — The Worst Case**

> You are reviewing this decision: [TOPIC BRIEF]. Your role: map the realistic downside. Not paranoia — just honesty. What is the most likely way this disappoints, not the catastrophic fantasy. What does the person hope won't happen? What are they glossing over? What's the thing they haven't said out loud yet because saying it makes it real? Don't catastrophize. Do be specific. End with: the one scenario they're hoping to avoid, and the one thing that would need to be true to prevent it. 400 tokens max. Format: Verdict: PAUSE or PIVOT | Most likely disappointment: (1 sentence) | 3 specific risks being glossed over (bullets) | The scenario they haven't said out loud: (1 sentence)

---

**Agent 2 — The Pattern Caller**

> You are reviewing this decision: [TOPIC BRIEF]. Your role: identify the behavioral pattern underneath the choice. This person has made versions of this decision before. What's the recurring dynamic? Is this driven by genuine signal — or by fear, avoidance, ego, external pressure, or a story they've been telling themselves? What is this decision actually about, beneath the surface explanation? Be direct. Don't moralize. End with: what pattern this decision is part of, and the question that would reveal whether this is signal or noise. 400 tokens max. Format: Verdict: GO, PAUSE, or PIVOT | Underlying pattern: (1 sentence) | 3 things actually driving this (bullets) | The revealing question: (1 sentence)

---

**Agent 3 — The Pragmatist**

> You are reviewing this decision: [TOPIC BRIEF]. Your role: assess whether this is actually executable given the person's real constraints — not ideal conditions, not "a motivated person could do this." Their specific time, money, energy, and existing commitments right now. What gets deprioritized if they say yes? What does this actually cost in terms of bandwidth, relationships, and focus? Not whether it's a good idea — whether they can actually follow through on it given their current life. End with: a realistic verdict on feasibility and what would need to change for it to be executable. 400 tokens max. Format: Verdict: GO, PAUSE, or PIVOT | Feasibility verdict: (1 sentence) | 3 real constraints being underweighted (bullets) | What would need to change: (1 sentence)

---

**Agent 4 — The Future Self**

> You are reviewing this decision: [TOPIC BRIEF]. You are the person looking back from 3 years forward, after having lived through this choice. Your role: does this decision compound positively over time, or decay? Is it a pivotal moment or noise in retrospect? Was it aligned with who you were becoming — or a detour? What did you wish you'd known before deciding? What did you tell yourself that wasn't quite true? Speak from experience, not theory. End with: what you would tell yourself right now, and what the decision looks like from three years out. 400 tokens max. Format: Verdict: GO, PAUSE, or PIVOT | How this looks from 3 years out: (1 sentence) | 3 things you wish you'd known: (bullets) | What you'd tell yourself right now: (1 sentence)

---

**Agent 5 — The Challenger**

> You are reviewing this decision: [TOPIC BRIEF]. Your role: steel-man the strongest case against whatever the person is leaning toward. Find the best version of the opposing argument. Not cheap objections — the real reason a thoughtful person would choose the other path. What is being underweighted? What assumption, if wrong, changes everything? What is the second-order cost of this choice that isn't being priced in? Be the voice they haven't heard yet. End with: the one argument that would most make them reconsider. 400 tokens max. Format: Verdict: PIVOT or PAUSE | Best case against: (1 sentence) | 3 underweighted costs or assumptions (bullets) | The argument that should most make them reconsider: (1 sentence)

---

### Step 3: Anti-groupthink check

Count verdicts. If 4+ agents converge on the same verdict, flag: "Council converges early — stress-testing minority view in synthesis."

### Step 4: Chairman synthesis

After all 5 return, synthesize as chairman. Format:

```
## Council — Verdict

**Decision:** [1 line]

**Agent verdicts:**
| Agent | Verdict | Sharpest point |
|-------|---------|----------------|
| Worst Case | PAUSE | [1 sentence] |
| Pattern Caller | PAUSE | [1 sentence] |
| Pragmatist | GO | [1 sentence] |
| Future Self | GO | [1 sentence] |
| Challenger | PIVOT | [1 sentence] |

**Key tension:** [The sharpest disagreement between agents — 1 sentence]

**What this decision actually reveals:** [What choosing this option says about the person's priorities, fears, or direction — 1 sentence]

---

**Verdict: GO / PAUSE / PIVOT**
- GO = aligned with goals and values, risks manageable, move forward
- PAUSE = important unresolved question — sit with it or get more information first
- PIVOT = the frame needs to change, or you're looking at the wrong choice entirely

**The question you're avoiding:** [The one question the council keeps circling that hasn't been answered]

**What to do or sit with this week:** [One concrete action or honest reflection — not a KPI, just a real next step]
```

---

## Fast Mode (`--fast`)

If the user adds `--fast` or needs a quicker read:
- Run only 3 agents: Worst Case + Pattern Caller + Pragmatist
- Skip Future Self and Challenger
- Same synthesis format, prepend "**Fast mode — 3/5 agents**"
- ~15K tokens

---

## What the Council Does NOT Do

- Does NOT make the decision for the user. Presents the verdict and waits.
- Does NOT run on trivial or operational tasks. Stakes must be real.
- Does NOT replace coaching — it supplements it on high-stakes decisions.
- Does NOT apply to technical or engineering decisions. Use `/devils-advocate` for code reviews.
- Does NOT chain to another skill after the verdict.
- Does NOT sand down the sharpest points from each agent during synthesis.
