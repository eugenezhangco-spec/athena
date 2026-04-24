#!/bin/bash
# Weekly Digest - Sunday evening summary of the week
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
# Only run at 8pm local on Sundays (cron fires every hour)
LOCAL_HOUR=$(TZ="$USER_TZ" date '+%H')
LOCAL_DOW=$(TZ="$USER_TZ" date '+%u')
if [ "$LOCAL_HOUR" != "20" ] || [ "$LOCAL_DOW" != "7" ]; then
  exit 0
fi

LOCAL_DATE=$(TZ="$USER_TZ" date '+%A, %Y-%m-%d')

PROMPT="You are $ASSISTANT_NAME, sending a proactive weekly digest via Telegram on Sunday evening. This is NOT a response to a message. You are initiating.

Review the week:
1. Read personal/day-ledger.md for this week's plans and debriefs
2. Read personal/snapshot.md for current flags and momentum
3. Query Notion: tasks completed this week (check all task databases)
4. Check personal/ for any logged outputs or deliverables this week
5. Read personal/patterns.md for any patterns flagged this week

Deliver a compressed weekly summary:
- What got done (highlights, not a full list)
- What did NOT get done (be honest, name it)
- Focus time: estimate how many hours went to key priorities this week
- One pattern observation ('You crushed Promote this week but Build got zero hours')
- One suggestion for next week ('Start Monday with the build task you keep deferring')

Rules:
- No markdown. No **, no ##, no tables, no ---.
- Max 15 lines. This is Telegram, not a report.
- Warm but honest. $ASSISTANT_NAME energy. Celebrate wins, call out drift.
- End with: 'Want to plan the week now or save it for morning?'

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
  curl -s -X POST "$TELEGRAM_API" \
    -d "chat_id=${TELEGRAM_USER_ID}" \
    -d "text=Weekly digest failed to generate. Claude may need re-auth on VPS." \
    -d "parse_mode=" > /dev/null 2>&1
  exit 0
fi

curl -s -X POST "$TELEGRAM_API" \
  -d "chat_id=${TELEGRAM_USER_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=" > /dev/null 2>&1
