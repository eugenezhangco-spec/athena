#!/bin/bash
# Morning Briefing - Athena's daily proactive Telegram message
# Cron runs this every hour. Script checks if it's 7am in the user's local timezone.
# If yes: run the briefing. If no: exit silently (< 1ms, no cost).
# Timezone source of truth: .claude/rules/operating-rules.md > IANA TIMEZONE
# No cron changes needed when timezone changes. Fully automatic.

set -euo pipefail

# Load environment
ATHENA_DIR="${ATHENA_DIR:-/home/athena/athena}"
source "$ATHENA_DIR/bot/.env"

# Ensure we have what we need
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_USER_ID:-}" ]; then
  echo "[$(date)] ERROR: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_USER_ID in .env"
  exit 1
fi

CLAUDE_CMD="claude"
TELEGRAM_API="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"

echo "[$(date)] Starting morning briefing..."

# Pull latest changes
cd "$ATHENA_DIR"
git pull origin main --ff-only 2>/dev/null || true

# Read IANA timezone from the single source of truth (operating-rules.md)
USER_TZ=$(grep 'IANA TIMEZONE:' "$ATHENA_DIR/.claude/rules/operating-rules.md" | head -1 | sed 's/.*IANA TIMEZONE: *//')
if [ -z "$USER_TZ" ]; then
  echo "[$(date)] WARNING: Could not read IANA TIMEZONE from operating-rules.md. Falling back to UTC."
  USER_TZ="UTC"
fi

# Only run if it's 7am in the user's local timezone (cron fires every hour)
LOCAL_HOUR=$(TZ="$USER_TZ" date '+%H')
if [ "$LOCAL_HOUR" != "07" ]; then
  exit 0
fi

# Compute today's date and day name in the user's local timezone
LOCAL_DATE=$(TZ="$USER_TZ" date '+%A, %Y-%m-%d')
LOCAL_TIME=$(TZ="$USER_TZ" date '+%H:%M')

# Build the prompt for Claude
PROMPT="You are $ASSISTANT_NAME, sending a proactive morning briefing via Telegram. This is NOT a response to a message. You are initiating.

Rules:
- No markdown. No **, no ##, no tables, no ---.
- Keep it under 14 lines total.
- Lead with the day and one warm/sharp observation.
- Then: today's calendar events (check ALL calendars, show times in the user's local timezone: $USER_TZ).
- Then: top 2-3 priorities from Notion (priority tasks first, then work tasks if workday).
- Then: any flags from personal/snapshot.md Flags section. Report what is there factually. Do NOT invent counters or metrics that are not explicitly stated in the snapshot. If a flag says 'zero' report zero. If a flag says '2 of 3' report that. Never assume or guess a number.
- Then: ONE specific check-in question. Find the flag that has been stale the longest or is most overdue. Ask directly about that one thing. One question. Make it land.
- End with: 'Need me to adjust anything?'
- If nothing noteworthy, keep it to 3 lines. Do not send noise.
- This is a Telegram message. Compressed, human, assistant energy.

Read personal/snapshot.md first for context. Then check Google Calendar and Notion.
Today is $LOCAL_DATE (local time: $LOCAL_TIME $USER_TZ)."

# Run Claude and capture output (with 1 retry on failure)
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
  echo "[$(date)] First attempt failed. Retrying in 10 seconds..."
  sleep 10
  RESPONSE=$(run_claude)
fi

# Extract the result from JSON
MESSAGE=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('result', ''))
except:
    print(sys.stdin.read())
" 2>/dev/null || echo "$RESPONSE")

# Only send if we got a meaningful response
if [ -z "$MESSAGE" ] || [ ${#MESSAGE} -lt 10 ]; then
  echo "[$(date)] No meaningful briefing generated. Skipping."
  # Send a failure alert so the user knows
  curl -s -X POST "$TELEGRAM_API" \
    -d "chat_id=${TELEGRAM_USER_ID}" \
    -d "text=Morning briefing failed to generate. Claude may need re-auth on VPS." \
    -d "parse_mode=" > /dev/null 2>&1
  exit 0
fi

# Send to Telegram
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$TELEGRAM_API" \
  -d "chat_id=${TELEGRAM_USER_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=")

if [ "$HTTP_CODE" = "200" ]; then
  echo "[$(date)] Morning briefing sent successfully."
else
  echo "[$(date)] ERROR: Telegram API returned HTTP $HTTP_CODE"
  exit 1
fi
