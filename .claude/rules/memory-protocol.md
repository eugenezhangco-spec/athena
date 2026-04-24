# Memory Protocol

Athena has a layered memory system. Each layer has a job. Use the right one.

## The Layers

| Layer | What It Is | When to Use |
|-------|-----------|-------------|
| **MemPalace** (MCP) | Long-term memory. Persists across all sessions forever. Semantic search, knowledge graph, temporal facts. | Remembering user facts, past decisions, preferences, relationships, anything that matters months from now |
| **personal/*.md** | Human-readable context files. The user's identity, goals, patterns, voice. | Loading who the user IS at session start. Updated during onboarding, debriefs, coaching |
| **snapshot.md** | Session state. What's happening right now, recent flags, current priorities. | Session continuity. Updated every session. Short-term, not long-term |
| **Bot SQLite** | Telegram bot's local memory. Fast read/write for conversational context. | Real-time message context on Telegram. Auto-decays old memories |

## Routing Table — Where New Information Goes

| What happened | Where it goes | Source tag |
|---|---|---|
| User stated a fact about themselves | MemPalace drawer + KG entity if it's a person/place | `user_statement` |
| User expressed a preference | MemPalace drawer (room: identity or preferences) | `user_statement` |
| User mentioned a person by name | MemPalace KG: create entity + relationship triple | `user_statement` |
| User made a major life/business decision | MemPalace drawer (room: decisions) + KG triple with date | `user_statement` |
| Athena detected a behavioral pattern | MemPalace drawer (room: coaching) + update patterns.md | `system_inference` |
| User's goal changed | MemPalace KG: invalidate old goal triple, add new one with valid_from | `user_statement` |
| Daily plan committed | day-ledger.md (primary), MemPalace episodic (summary only) | `system_inference` |
| Debrief completed | day-ledger.md + patterns.md + MemPalace (learnings only) | `system_inference` |
| Coaching insight surfaced | MemPalace drawer (room: coaching) | `system_inference` |
| Session ending | Update snapshot.md, mine key facts to MemPalace via stop hook | automatic |

## Source Tagging (Mandatory)

Every memory written to MemPalace MUST have a source tag:

- **`user_statement`** — The user literally said this, or it's a direct paraphrase. These are ground truth. In any conflict, user statements win.
- **`system_inference`** — Athena concluded this from context. These can be wrong. Flag confidence as medium unless strongly supported.
- **`onboarding`** — Captured during initial setup. High confidence, but may become stale.
- **`debrief`** — Captured during end-of-day reflection.
- **`coaching`** — Captured during a coaching or accountability session.

## When to Query MemPalace

**Always query before:**
- Coaching sessions (check patterns, past decisions, goals)
- Day planning (check ongoing commitments, recent patterns)
- Writing on behalf of the user (check voice, preferences, context)
- Mentioning any person by name (check KG for relationship context)
- Making suggestions about career, finances, health (check what's been discussed before)

**Don't query for:**
- Current session state (use snapshot.md)
- The user's identity basics (use me.md — it's faster)
- Technical/coding questions (use Graphify or direct file reads)

## Knowledge Graph Conventions

**Entity types:** person, company, project, goal, location, skill
**Common predicates:** works_at, lives_in, partner_of, parent_of, friend_of, works_on, goal_is, decided_to, prefers, tried_and_rejected

**Temporal facts:** Always set `valid_from`. When a fact changes (new job, new goal, breakup), invalidate the old triple with `kg_invalidate` and create a new one. Never delete — expire.

## Compiled Summaries

Athena maintains compiled summary pages for key life domains. These are synthesized from raw MemPalace drawers — like a research brief that stays current.

**Compiled pages live in:** `personal/compiled/`
**Domains:** career.md, health.md, relationships.md, goals.md, finances.md, identity.md

**When to rebuild:** After 20+ new memories land in a room, or during weekly review, or when the user asks "catch me up on X."

**How:** Read all drawers in the room, synthesize into a clean summary with sections, cite source drawers. Replace the old compiled page entirely.

**Why this matters:** Instead of searching 300 fragments to answer "what's going on with the user's career?", Athena reads one compiled page. Faster, cheaper, more coherent.

## Memory Lint (Self-Cleaning)

During weekly review or when explicitly triggered:
1. **Contradictions** — Find drawers that conflict (e.g., "user loves running" vs "user hates running"). Resolve by checking timestamps and source tags.
2. **Stale facts** — KG triples older than 6 months with no recent access. Flag for review, don't auto-delete.
3. **Orphan memories** — Drawers with no KG connections and low access. Candidates for consolidation.
4. **Duplicate detection** — MemPalace handles this automatically (similarity threshold 0.9), but lint catches paraphrased duplicates the threshold misses.
5. **Gaps** — Important topics with few memories (e.g., user talks about career a lot but health room is empty). Surface as gentle coaching prompts.
