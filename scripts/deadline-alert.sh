#!/bin/bash
# Deadline Alert - Check for deadlines within 48 hours
# Cron runs every hour. Script checks local time.
# Checks: Important Dates calendar + Notion due dates

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
# Only run at 8am local (cron fires every hour)
LOCAL_HOUR=$(TZ="$USER_TZ" date '+%H')
if [ "$LOCAL_HOUR" != "08" ]; then
  exit 0
fi

LOCAL_DATE=$(TZ="$USER_TZ" date '+%A, %Y-%m-%d')

PROMPT="You are $ASSISTANT_NAME, sending a proactive deadline alert via Telegram. This is NOT a response to a message. You are initiating.

Check for anything due within the next 48 hours:
1. Google Calendar: check Important Dates calendar for upcoming deadlines
2. Notion: query task databases for tasks with due dates in the next 48 hours
3. Check personal/snapshot.md Flags for any time-sensitive items

Rules:
- No markdown. No **, no ##, no tables, no ---.
- If NOTHING is due in 48 hours, do NOT send a message. Output nothing.
- If something IS due: lead with the deadline, then what needs to happen, then 'Want me to block time for this?'
- Max 5 lines. Compressed $ASSISTANT_NAME energy.
- Only actionable items. No reminders about things already done.

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

# Only send if meaningful (deadline alerts are silent when nothing is due)
if [ -z "$MESSAGE" ] || [ ${#MESSAGE} -lt 10 ]; then
  exit 0
fi

curl -s -X POST "$TELEGRAM_API" \
  -d "chat_id=${TELEGRAM_USER_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=" > /dev/null 2>&1
