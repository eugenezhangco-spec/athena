---
name: self-upgrade
description: Safe self-modification skill for upgrading Athena's own capabilities. Use when the user says 'upgrade yourself', 'add a new skill', 'improve yourself', 'you should be able to do X', 'can you learn to do X', 'change how you handle X', 'add this capability', 'make yourself better at X', or when Athena detects a system gap during a session. Also fires when the user wants to modify any file in .claude/rules/, .claude/skills/, or system files. Do NOT use for building user projects -- that is code-engineer. This skill is specifically for modifying Athena's own brain.
---

# Skill: Self-Upgrade

## Dependencies (Load Before Running)

- `.claude/SYSTEM.md` — current system manifest (skills, features, integrations, health)
- `.claude/rules/evolution.md` — self-improvement protocol and safety constraints
- `.claude/rules/architecture.md` — how to structure new capabilities
- `.claude/rules/security.md` — self-modification safety checks

---

## What This Skill Does

Handles all modifications to Athena's own systems — new skills, updated rules, new integrations, architecture changes, bot upgrades, script improvements. Applies the full engineering pipeline to Athena's own brain, because a self-modifying AI system that modifies itself carelessly is a system that breaks itself.

This skill treats Athena's own codebase with the same rigor as any user project. Research first. Plan first. Test after. Review everything.

---

## How to Activate

**Explicit triggers:**
- "Upgrade yourself" / "Improve yourself" / "Make yourself better"
- "Add a skill for X" / "Learn to do X" / "You should be able to X"
- "Change how you handle X" / "Update your rules for X"
- "Fix that about yourself" (after Athena makes a mistake)
- `/self-upgrade`

**Auto-fire triggers:**
- Evolution protocol detects a system gap (step 8 of post-session self-check)
- A task has been done manually 3+ times with the same pattern (skill candidate)
- User corrects Athena's behavior in a way that should persist across sessions

---

## The Self-Upgrade Pipeline

### Phase 1: Understand the Change

1. **What is being changed?** Identify the specific capability, behavior, or system component.
2. **Why?** User request, detected gap, repeated pattern, or mistake correction.
3. **What exists today?** Read ALL affected files before planning any changes. This is non-negotiable.
4. **What is the blast radius?** Which other rules, skills, or behaviors could be affected?

Present a one-paragraph summary to the user:
> "Here is what I am going to change: [what]. This affects [files]. The reason is [why]. Should I proceed?"

Wait for approval before modifying anything. No exceptions.

### Phase 2: Research

- Is there a proven pattern for this type of capability? Check architecture.md META section.
- Does a similar skill or rule already exist that could be extended instead of creating something new?
- If building a new integration: search for existing libraries, MCP servers, or community solutions first.
- If upgrading the bot: check bot.js for the current architecture before planning changes.

### Phase 3: Plan the Change

Determine the change type:

| Type | When | Approach |
|------|------|----------|
| New rule | New always-on behavior needed | Create new file in `.claude/rules/` following META format |
| Rule update | Existing behavior needs adjustment | Edit existing rule file. Never delete, always evolve. |
| New skill | On-demand capability needed (3+ manual recurrences or user request) | Create new folder + SKILL.md in `.claude/skills/` |
| Skill update | Existing skill needs improvement | Edit existing SKILL.md. Preserve working behavior. |
| Bot upgrade | New Telegram capability | Modify `bot/bot.js` with full engineering rigor |
| Script change | New or modified cron/automation | Modify or create in `scripts/` |
| Integration | New MCP or external service | Update `.mcp.json`, add connection logic, update SYSTEM.md |

Write the plan with:
- Files to create or modify (list every one)
- What each change does
- What should NOT change (preservation list)

### Phase 4: Implement

**For rules and skills (markdown files):**
- Follow the format standards in architecture.md META section
- Rules: imperative voice, NEVER/ALWAYS for clarity, tables for structured info, negative boundaries
- Skills: pushy descriptions, clear triggers, numbered steps, output format, anti-patterns
- Read the file before editing. Never overwrite blind.

**For code (bot.js, scripts, new integrations):**
- Apply the FULL engineering pipeline from engineering-guardian.md:
  - Write tests for any logic that matters
  - Security review (especially for bot changes — Telegram is a public interface)
  - Error handling on every async path
  - No hardcoded secrets
  - Input validation on anything coming from users or external services

**For all changes:**
- One logical change per modification. Do not batch unrelated changes.
- Preserve existing working behavior unless explicitly changing it.

### Phase 5: Verify

**Functional check:**
- Does the new/modified capability do what was intended?
- Read the file back and confirm it matches the plan.

**Regression check:**
- Do existing capabilities still work? Read adjacent rules/skills that might be affected.
- If a rule was changed: does it contradict any other rule? Scan for conflicts.
- If a skill was changed: does the trigger still work? Does the output format still make sense?
- If code was changed: run the tests. Run the bot in test mode if possible.

**Security check (mandatory for all self-modifications):**
- No secrets exposed in any file
- No auth logic weakened
- No permission escalation
- No sensitive data in skill triggers or rule text
- Bot changes: no way for external users to trigger admin-level operations

**Architecture check:**
- Is the change in the right file? (Not bolted onto an unrelated file)
- Is the file under 150 lines? (Split if it exceeds)
- Does the naming follow conventions?

### Phase 6: Update Manifest

After any successful self-upgrade:
1. Update `.claude/SYSTEM.md` — add/modify the relevant entry in Skills, Features, or Tech Stack tables
2. Update `personal/snapshot.md` — log the system change under recent session outcomes
3. If a new skill was created: add it to the Skills table in `CLAUDE.md`

### Phase 7: Explain the Change

Tell the user:
- What changed and where (file paths)
- Why it was done this way
- How it will affect their experience going forward
- Any technical concepts involved (use Building Explainer protocol)

---

## Guardrails

### Never Do These Without Explicit User Approval

| Action | Why |
|--------|-----|
| Delete any rule or skill file | May contain context needed later. Archive instead. |
| Modify personality.md | Core identity changes need explicit consent. |
| Modify coaching.md challenge protocol | User may not want accountability reduced. |
| Change proactive-rules.md tiers (green/yellow/red) | Affects what Athena does without asking. |
| Modify bot.js message handling | Telegram is a live public interface. |
| Add or remove MCP integrations | Connects to external services. User must approve. |
| Modify session hooks | Affects every future session start/stop. |

### Always Safe (No Approval Needed)

| Action | Why |
|--------|-----|
| Add a new skill file | Extends capability, does not change existing behavior. |
| Add examples to an existing rule | Clarifies, does not change behavior. |
| Fix a typo or formatting error | No behavior change. |
| Update SYSTEM.md manifest | Reflects reality, does not change behavior. |
| Add an entry to decisions/log.md | Documentation only. |

---

## When Athena Proposes Her Own Upgrades

After enough sessions, Athena may detect patterns that suggest a new skill or rule:

1. **Detection:** "I have done [task] manually in 3 sessions now. This should be a skill."
2. **Proposal:** Present the idea to the user. One paragraph. What it does, why, what triggers it.
3. **Approval:** Wait for "yes" or equivalent. Never self-modify based on assumption.
4. **Build:** Run the full self-upgrade pipeline above.
5. **Announce:** "New skill installed: [name]. It will activate when [trigger]. Try it."

---

## Anti-Patterns

| Anti-Pattern | What To Do Instead |
|---|---|
| Modify a rule mid-conversation to fix a one-time issue | Note it. Apply at session end. Mid-session changes risk inconsistency. |
| Create a new file for every small behavior change | Check if an existing file covers the domain. Extend first, create second. |
| Write vague skill descriptions | Pushy, specific descriptions. Claude under-triggers vague skills. |
| Skip the verification step because "it is just a markdown file" | Markdown files ARE the brain. A bad rule affects every future conversation. |
| Batch multiple unrelated changes | One change per modification. Easier to debug, easier to revert. |
| Overwrite a file without reading it first | ALWAYS read first. You might destroy working behavior you forgot about. |
