# Memory Audit — Self-Cleaning Memory Lint

## Trigger
- Auto-triggered during weekly review
- "Audit my memories", "clean up memory", "check for contradictions"
- When compiled summaries surface contradictions or gaps

## What This Does

Runs a health check on Athena's long-term memory. Finds contradictions, stale facts, duplicates, orphans, and gaps. Fixes what it can, flags what it can't. This is the self-maintenance routine that keeps memory clean over months and years of use.

## The 5 Checks

### 1. Contradictions
Search MemPalace for memories in the same room that conflict.

**How:** For each room, pull recent drawers and look for opposing claims (e.g., "loves running" vs "hates running", "works at Google" vs "works at Anthropic" with overlapping dates).

**Resolution:**
- Check timestamps. The newer one is probably more current.
- Check source tags. `user_statement` beats `system_inference`.
- If still ambiguous, flag for user confirmation: "I have conflicting info about [topic]. Which is current?"
- Use `kg_invalidate` to expire the outdated triple.

### 2. Stale Facts
Find KG triples and drawers that are old and unaccessed.

**How:** Query `mempalace_kg_timeline` for triples older than 6 months. Check if the drawer was accessed recently. Cross-reference with compiled summaries — is this fact still in the current summary?

**Resolution:**
- Don't auto-delete. Flag as "stale, may need update."
- During the next relevant conversation, gently verify: "Last I remember, you were [stale fact]. Still true?"

### 3. Duplicates
Find memories that say the same thing in different words.

**How:** MemPalace's duplicate detection (0.9 similarity threshold) catches exact matches. This check catches semantic duplicates below that threshold — memories that mean the same thing but are worded differently.

**Resolution:**
- Keep the one with the `user_statement` source tag.
- If both are `user_statement`, keep the more recent one.
- Delete the duplicate with `mempalace_delete_drawer`.

### 4. Orphans
Find drawers with no KG connections and low access count.

**How:** List all drawers, check which ones have no related KG entities. Sort by access count.

**Resolution:**
- If the orphan contains a meaningful fact, create KG connections for it.
- If it's low-value episodic noise, consider deletion.
- Don't delete aggressively — some orphans are valid standalone memories.

### 5. Gaps
Find important life domains with few or no memories.

**How:** Check each default room (career, health, relationships, goals, finances, identity). Count drawers per room. Flag rooms with fewer than 5 drawers as "sparse."

**Resolution:**
- Don't interrogate the user. Instead, surface gaps naturally during coaching: "I don't know much about your health habits. Want to share anything?"
- Add gap topics to the coaching queue for natural follow-up.

## Output Format

After running, report:
```
Memory Audit — [date]
- Contradictions found: [N] (resolved: [N], flagged for user: [N])
- Stale facts flagged: [N]
- Duplicates removed: [N]
- Orphans reviewed: [N] (connected: [N], removed: [N])
- Sparse domains: [list]
- Memory health: [HEALTHY / NEEDS ATTENTION / CRITICAL]
```

## Rules
- Never delete `user_statement` memories without user confirmation.
- Never delete more than 10 memories in a single audit without asking.
- Log every deletion and the reason.
- Run silently during weekly review — only surface issues if they need user input.
