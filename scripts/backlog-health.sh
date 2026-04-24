#!/bin/bash
# Backlog Health - Check for stale tasks and backlog drift
# Cron runs every hour. Script checks local time.

set -euo pipefail

ATHENA_DIR="${ATHENA_DIR:-/home/athena/athena}"
source "$ATHENA_DIR/bot/.env"

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_USER_ID:-}" ]; then
  exit 1
fi

CLAUDE_CMD="claude"
TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

cd "$ATHENA_DIR"
git pull origin main --ff-only 2>/dev/null || true

USER_TZ=$(grep 'IANA TIMEZONE:' "$ATHENA_DIR/.claude/rules/operating-rules.md" | head -1 | sed 's/.*IANA TIMEZONE: *//')
USER_TZ="${USER_TZ:-UTC}"
# Only run at 9am local every 3rd day (cron fires every hour)
LOCAL_HOUR=$(TZ="$USER_TZ" date '+%H')
DAY_OF_YEAR=$(TZ="$USER_TZ" date '+%j')
if [ "$LOCAL_HOUR" != "09" ] || [ $((DAY_OF_YEAR % 3)) -ne 0 ]; then
  exit 0
fi

LOCAL_DATE=$(TZ="$USER_TZ" date '+%A, %Y-%m-%d')

PROMPT="You are $ASSISTANT_NAME, sending a proactive backlog health check via Telegram. This is NOT a response to a message. You are initiating.

Audit the backlogs:
1. Query Notion: check task databases. Find priority tasks not in 'Doing' status. Find tasks with no update in 7+ days.
2. Query Notion: check all databases. Find tasks older than 10 days still open.
3. Query Notion: find overdue items across all task databases.
4. Read personal/snapshot.md Flags for stale flags.
5. Read personal/inbox.md Pending section. Count items that have been sitting unprocessed.

Report:
- Stale priority tasks (name them)
- Tasks stuck for 7+ days (name them)
- Inbox items that need processing
- One recommendation: archive, reprioritize, or act

Rules:
- No markdown. No **, no ##, no tables, no ---.
- If everything is healthy (no stale tasks, no overdue items): do NOT send a message. Output nothing. Silence is better than noise.
- If issues found: max 8 lines. Name the specific tasks. Be direct.
- End with: 'Want me to clean any of this up?'

Today is $LOCAL_DATE ($USER_TZ)."

run_claude() {
  echo "$PROMPT" | $CLAUDE_CMD \
    --print \
    --dangerously-skip-permissions \
    --output-format json \
    --no-session-persistence \
    2>/dev/null
}

RESPONSE=$(run_claude)
if [ $? -ne 0 ] || [ -z "$RESPONSE" ]; then
  sleep 10
  RESPONSE=$(run_claude)
fi

MESSAGE=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('result', ''))
except:
    print(sys.stdin.read())
" 2>/dev/null || echo "$RESPONSE")

if [ -z "$MESSAGE" ] || [ ${#MESSAGE} -lt 10 ]; then
  exit 0
fi

curl -s -X POST "$TELEGRAM_API" \
  -d "chat_id=${TELEGRAM_USER_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=" > /dev/null 2>&1
