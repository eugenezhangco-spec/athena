#!/bin/bash
# Mac auto-sync: pull remote changes (VPS/Telegram), then push local changes (VS Code)
# Runs every 1 minute via launchd
# Bidirectional: Mac <-> GitHub <-> VPS

export PATH="/usr/bin:/usr/local/bin:/opt/homebrew/bin:$PATH"
ATHENA_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOGFILE="$ATHENA_DIR/logs/mac-sync.log"
cd "$ATHENA_DIR" || exit 1
mkdir -p logs

# Pull remote changes first (from VPS via GitHub)
git pull origin main --ff-only >> "$LOGFILE" 2>&1

# Push local changes (from VS Code edits)
if [ -n "$(git status --porcelain)" ]; then
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
    git add personal/ .claude/ decisions/ archives/ scripts/ context/ docs/ agents/ bot/src/ bot/package.json
    git add CLAUDE.md OVERVIEW.md README.md .gitignore .mcp.json.template 2>/dev/null
    if [ -n "$(git diff --cached --name-only)" ]; then
        git commit -m "Auto-save $TIMESTAMP" >> "$LOGFILE" 2>&1
        git push origin main >> "$LOGFILE" 2>&1
    fi
fi
