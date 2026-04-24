#!/bin/bash
# Calendar Gap Analysis - Compare calendar vs goals
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
# Only run at 8am local (cron fires every hour)
LOCAL_HOUR=$(TZ="$USER_TZ" date '+%H')
if [ "$LOCAL_HOUR" != "08" ]; then
  exit 0
fi

LOCAL_DATE=$(TZ="$USER_TZ" date '+%A, %Y-%m-%d')

PROMPT="You are $ASSISTANT_NAME, sending a proactive calendar gap analysis via Telegram. This is NOT a response to a message. You are initiating.

Analyze today's calendar against priorities:
1. Check Google Calendar: ALL calendars. List today's events and time blocks.
2. Read .claude/rules/operating-rules.md for the 4-4-4 framework split and priority stack.
3. Calculate: how many hours are blocked for priority work today? How many for other work? How many are unblocked?
4. Query Notion: what are the top priority tasks right now?

Report ONLY if there is a gap:
- If priority work time is under 3 hours today, flag it: 'Your priority time is thin today. [X] hours blocked. [Y] hours free.'
- If a priority task has no calendar block, name it: '[Task name] is a priority but has no time block today.'
- If there are open gaps (cancelled meetings, light work day), suggest what to fill them with: 'You have 90 minutes free at [time]. [Specific task] is ready to go.'
- If focus area split is off: name which area is underweighted.

Rules:
- No markdown. No **, no ##, no tables, no ---.
- If the day looks well-balanced and Mission time is 3+ hours: do NOT send a message. Output nothing.
- If gaps found: max 5 lines. Name specific tasks and times. Be actionable.
- End with: 'Want me to block time for any of this?'

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
