#!/bin/bash
# SessionStart hook: inject snapshot + last-session context + MemPalace essential story
# Athena always picks up where she left off with full long-term memory.

ATHENA_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
SNAPSHOT_FILE="$ATHENA_DIR/personal/snapshot.md"
LAST_SESSION="$ATHENA_DIR/personal/.last-session"

CONTEXT=""

# Load last-session flag if it exists
if [ -f "$LAST_SESSION" ]; then
  STALE=$(grep 'snapshot_stale: true' "$LAST_SESSION" 2>/dev/null)
  LAST_ENDED=$(grep 'last_ended:' "$LAST_SESSION" | cut -d' ' -f2-)

  if [ -n "$STALE" ]; then
    CONTEXT="NOTICE: Last session ended at $LAST_ENDED WITHOUT updating snapshot.md. Context may be stale. Consider asking what was worked on or running a quick update.\n\n"
  elif [ -n "$LAST_ENDED" ]; then
    CONTEXT="Last session ended: $LAST_ENDED\n\n"
  fi

  # Check for unmined session (session ended without stop hook completing)
  MINED=$(grep 'mempalace_mined: true' "$LAST_SESSION" 2>/dev/null)
  if [ -z "$MINED" ] && [ -n "$LAST_ENDED" ]; then
    CONTEXT="${CONTEXT}NOTICE: Previous session may not have been mined to MemPalace. Consider running memory recovery if important context was discussed.\n\n"
  fi

  # Clean up the flag file
  rm -f "$LAST_SESSION"
fi

# Load snapshot
if [ -f "$SNAPSHOT_FILE" ]; then
  SNAPSHOT_CONTENT=$(head -100 "$SNAPSHOT_FILE")
  CONTEXT="${CONTEXT}${SNAPSHOT_CONTENT}"
fi

# Check MemPalace availability and load essential story (Layer 1)
if command -v mempalace-mcp &> /dev/null || python3 -c "import mempalace" &> /dev/null 2>&1; then
  CONTEXT="${CONTEXT}\n\n[MemPalace: ACTIVE — long-term memory available. Query with MCP tools before coaching, planning, or discussing people/decisions.]"
else
  CONTEXT="${CONTEXT}\n\n[MemPalace: NOT INSTALLED — run './setup.sh' from the project root to install. Without this, long-term memory across sessions is disabled. If onboarding is in progress, the onboard skill will guide the user through installation in Phase 0.]"
fi

# Check for compiled summaries
COMPILED_DIR="$ATHENA_DIR/personal/compiled"
if [ -d "$COMPILED_DIR" ] && [ "$(ls -A "$COMPILED_DIR" 2>/dev/null)" ]; then
  COMPILED_COUNT=$(ls "$COMPILED_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
  CONTEXT="${CONTEXT}\n[Compiled summaries: ${COMPILED_COUNT} domain summaries available in personal/compiled/]"
fi

# Output as hook response
if [ -n "$CONTEXT" ]; then
  ESCAPED=$(echo "$CONTEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")
  echo "{\"hookSpecificOutput\":{\"additionalContext\":$ESCAPED}}"
fi
