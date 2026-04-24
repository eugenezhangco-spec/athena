#!/bin/bash
# Stop hook: save session metadata + trigger MemPalace conversation mining
# Mines the conversation to long-term memory so nothing is lost between sessions.

ATHENA_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
LAST_SESSION="$ATHENA_DIR/personal/.last-session"
SNAPSHOT="$ATHENA_DIR/personal/snapshot.md"

# Read stop hook input from stdin
INPUT=$(cat)
STOP_REASON=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('stop_hook_reason','unknown'))" 2>/dev/null || echo "unknown")

# Write session end marker
cat > "$LAST_SESSION" << EOF
last_ended: $(date '+%Y-%m-%d %H:%M')
stop_reason: $STOP_REASON
EOF

# Check if snapshot.md was updated during this session (within last 3 hours)
if [ -f "$SNAPSHOT" ]; then
    SNAPSHOT_MOD=$(stat -f %m "$SNAPSHOT" 2>/dev/null || stat -c %Y "$SNAPSHOT" 2>/dev/null || echo 0)
    NOW=$(date +%s)
    DIFF=$((NOW - SNAPSHOT_MOD))

    if [ "$DIFF" -gt 10800 ]; then
        echo "snapshot_stale: true" >> "$LAST_SESSION"
    else
        echo "snapshot_stale: false" >> "$LAST_SESSION"
    fi
fi

# Mine conversation to MemPalace (if installed)
# Uses the convo_miner module to extract memories from the session
MINED="false"
if command -v mempalace-mine &> /dev/null 2>&1; then
    # Find the most recent Claude Code session log
    SESSION_LOG_DIR="$HOME/.claude/sessions"
    if [ -d "$SESSION_LOG_DIR" ]; then
        LATEST_LOG=$(ls -t "$SESSION_LOG_DIR"/*.jsonl 2>/dev/null | head -1)
        if [ -n "$LATEST_LOG" ]; then
            mempalace-mine "$LATEST_LOG" --wing athena_user --quiet 2>/dev/null && MINED="true"
        fi
    fi
elif python3 -c "import mempalace" 2>/dev/null; then
    # Fallback: use Python module directly
    SESSION_LOG_DIR="$HOME/.claude/sessions"
    if [ -d "$SESSION_LOG_DIR" ]; then
        LATEST_LOG=$(ls -t "$SESSION_LOG_DIR"/*.jsonl 2>/dev/null | head -1)
        if [ -n "$LATEST_LOG" ]; then
            python3 -m mempalace.convo_miner "$LATEST_LOG" --wing athena_user --quiet 2>/dev/null && MINED="true"
        fi
    fi
fi

echo "mempalace_mined: $MINED" >> "$LAST_SESSION"
