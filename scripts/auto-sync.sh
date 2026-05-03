#!/bin/bash
# VPS auto-sync: pull remote changes, then push bot-generated writes.
# Runs every 1 minute via athena user cron (configured by server-setup.sh).
#
# SAFETY: no `git reset --hard origin/main` fallback.
# Stashes in-flight work, retries rebase, and logs conflicts for human review.
# Detects bot source changes (TypeScript md5 hash) and reloads PM2 only when needed.
#
# Defaults can be overridden via env vars:
#   ATHENA_DIR          (default: /home/athena/athena)
#   PM2_PROCESS_NAME    (default: athena-bot)

export PATH="/usr/bin:/usr/local/bin:$PATH"
ATHENA_DIR="${ATHENA_DIR:-/home/athena/athena}"
PM2_PROCESS_NAME="${PM2_PROCESS_NAME:-athena-bot}"
LOGFILE="$ATHENA_DIR/logs/auto-sync.log"

cd "$ATHENA_DIR" || exit 1
mkdir -p "$ATHENA_DIR/logs"

TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Snapshot bot src hash before pull (detects TypeScript source changes, not just compiled output)
OLD_HASH=""
if [ -d bot/src ]; then
    OLD_HASH=$(find bot/src -name '*.ts' -exec md5sum {} \; 2>/dev/null | sort | md5sum | cut -d' ' -f1)
fi

# Stash any dirty state before pulling so rebase has a clean tree
STASHED=0
if [ -n "$(git status --porcelain)" ]; then
    if git stash push -u -m "auto-sync-$TIMESTAMP" >/dev/null 2>&1; then
        STASHED=1
    fi
fi

# Fetch + rebase. On conflict, abort + log — DO NOT reset hard.
git fetch origin main >/dev/null 2>&1
if ! git rebase origin/main >/dev/null 2>&1; then
    git rebase --abort 2>/dev/null
    echo "[$TIMESTAMP] REBASE CONFLICT — manual intervention needed. Remote HEAD: $(git rev-parse --short origin/main). Local HEAD: $(git rev-parse --short HEAD)." >> "$LOGFILE"
    [ "$STASHED" = "1" ] && git stash pop >/dev/null 2>&1
    exit 1
fi

# Re-apply stashed work
if [ "$STASHED" = "1" ]; then
    if ! git stash pop >/dev/null 2>&1; then
        echo "[$TIMESTAMP] STASH POP CONFLICT after clean rebase. Stash preserved. Manual intervention needed." >> "$LOGFILE"
        # Don't exit — still attempt push of whatever's clean
    fi
fi

# Rebuild and reload bot if TypeScript source changed
if [ -d bot/src ]; then
    NEW_HASH=$(find bot/src -name '*.ts' -exec md5sum {} \; 2>/dev/null | sort | md5sum | cut -d' ' -f1)
    if [ "$OLD_HASH" != "$NEW_HASH" ] && [ -n "$NEW_HASH" ]; then
        echo "[$TIMESTAMP] Bot source changed — rebuilding..." >> "$LOGFILE"
        (cd bot && npm run build >/dev/null 2>&1)
        pm2 reload "$PM2_PROCESS_NAME" >/dev/null 2>&1
        echo "[$TIMESTAMP] Bot reloaded ($PM2_PROCESS_NAME)." >> "$LOGFILE"
    fi
fi

# Push bot-generated writes (personal/, decisions/, scripts produce, etc.)
# IMPORTANT: add each path separately. `git add` fails atomically on any
# missing pathspec — one nonexistent directory blocks all the others, and
# `2>/dev/null` swallows the error so the failure is silent.
if [ -n "$(git status --porcelain)" ]; then
    for path in personal .claude decisions archives scripts bot/store bot/reminders.json logs; do
        [ -e "$path" ] && git add "$path" 2>/dev/null
    done
    if [ -n "$(git diff --cached --name-only)" ]; then
        git commit -m "Auto-save $TIMESTAMP" >/dev/null 2>&1
        git push origin main >> "$LOGFILE" 2>&1
    fi
fi
