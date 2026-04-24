---
description: "Hook system guidelines: lifecycle hooks, security hooks, session management"
paths:
  - "**/*.{ts,tsx,js,jsx,py,go,rs,java,css,scss,html}"
  - "src/**/*"
  - "bot/**/*"
  - "agents/**/*"
  - "scripts/**/*"
---
# Hooks System

## Hook Types

- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks)
- **Stop**: When session ends (final verification)

## Session Hooks (Installed)

- **SessionStart** (`.claude/hooks/session-start.sh`): Auto-loads `context/STATUS.md` + last-session flags into every new conversation. The team picks up where it left off.
- **Stop** (`.claude/hooks/session-stop.sh`): Saves session metadata when the session ends. Flags if STATUS.md was not updated (stale context warning for next session).

## Mid-Session Context Save (Long Sessions)

In long sessions (30+ tool uses or 45+ minutes), proactively save key context to `context/STATUS.md` before continuing. This prevents context loss when the conversation window compresses older messages.

**When to checkpoint:**
- After completing a major task or wave
- Before switching to a different feature or domain
- When the conversation is getting long
- After any significant architectural decision

**What to save (update STATUS.md):**
- What was built or changed (summary)
- Key decisions made
- Open items or next steps
- Any unfinished work that should be resumed

Tell the user: "Checkpointed to STATUS.md. Long session." Then continue working.

## Auto-Accept Permissions

Use with caution:
- Enable for trusted, well-defined plans
- Disable for exploratory work
- Never use dangerously-skip-permissions flag
- Configure `allowedTools` in `~/.claude.json` instead

## TodoWrite Best Practices

Use TodoWrite tool to:
- Track progress on multi-step tasks
- Verify understanding of instructions
- Enable real-time steering
- Show granular implementation steps

Todo list reveals:
- Out of order steps
- Missing items
- Extra unnecessary items
- Wrong granularity
- Misinterpreted requirements
