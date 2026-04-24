# Compile — Synthesize Memory into Domain Summaries

## Trigger
- "Catch me up on [topic]", "summarize what you know about my [career/health/etc]"
- "Compile memories", "update summaries"
- Auto-triggered during weekly review when 20+ new memories exist in any room
- Auto-triggered when user asks a broad question about a life domain

## What This Does

Reads all MemPalace drawers in a specific room (or all rooms), synthesizes them into a clean, authoritative summary page, and saves it to `personal/compiled/[domain].md`. This is the Karpathy-inspired "compiled knowledge" upgrade — instead of searching hundreds of memory fragments every time, Athena reads one synthesized brief.

## Procedure

1. **Pick the domain.** If the user specified one, use it. If auto-triggered, compile the room with the most new memories since the last compile.

2. **Pull all drawers from MemPalace.**
   ```
   Use mempalace_search with the room name, pull up to 100 results.
   Also query the knowledge graph: mempalace_kg_query for all entities in this domain.
   ```

3. **Separate by source tag.**
   - `user_statement` memories are ground truth. Lead with these.
   - `system_inference` memories are supporting context. Include but flag confidence.

4. **Synthesize into sections.** Write a clean markdown summary with:
   - **Current state** — what's true right now
   - **Key facts** — undisputed, high-confidence information
   - **Recent changes** — what changed in the last 30 days
   - **Open questions** — things Athena isn't sure about
   - **People involved** — relevant KG entities and relationships
   - Timestamp at the top: `Last compiled: YYYY-MM-DD`

5. **Save to `personal/compiled/[domain].md`.** Overwrite the previous version entirely. The old version is in git history if needed.

6. **Tell the user** in one sentence what was compiled and any gaps found.

## Domain Map

| Room | Compiled File | What It Covers |
|------|-------------|---------------|
| career | career.md | Jobs, projects, professional milestones, skills, ambitions |
| health | health.md | Physical health, fitness, mental health, habits, conditions |
| relationships | relationships.md | Key people, dynamics, recent interactions |
| goals | goals.md | Active goals, progress, deadlines, abandoned goals |
| finances | finances.md | Income, expenses, investments, runway, financial goals |
| identity | identity.md | Values, beliefs, origin story, personality traits |
| coaching | coaching.md | Behavioral patterns, growth areas, accountability history |

## Quality Rules

- Never invent information. Only compile what exists in MemPalace.
- Flag low-confidence inferences explicitly: "(inferred, not directly stated)"
- If two memories contradict, note the contradiction and timestamp both. Don't silently pick one.
- Keep it under 2000 words per domain. This is a brief, not an encyclopedia.
- Write in third person about the user: "[Name] works at..." not "You work at..."
  Use the user's actual name from `personal/me.md`. This keeps the compiled page readable as a reference document.
