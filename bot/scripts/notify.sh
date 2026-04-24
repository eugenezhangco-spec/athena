#!/bin/bash
#
# Send a Telegram message from the shell.
# Usage: ./scripts/notify.sh "Your message here"
#
# Reads TELEGRAM_BOT_TOKEN and ALLOWED_CHAT_ID from .env
# Useful for long-running tasks, cron jobs, or CI notifications.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env not found at $ENV_FILE"
  exit 1
fi

get_env() {
  grep "^$1=" "$ENV_FILE" | head -1 | cut -d'=' -f2- | sed 's/^["'"'"']//;s/["'"'"']$//'
}

TOKEN=$(get_env TELEGRAM_BOT_TOKEN)
CHAT_ID=$(get_env ALLOWED_CHAT_ID)

if [ -z "$TOKEN" ] || [ -z "$CHAT_ID" ]; then
  echo "Error: TELEGRAM_BOT_TOKEN or ALLOWED_CHAT_ID not set in .env"
  exit 1
fi

MESSAGE="$*"
if [ -z "$MESSAGE" ]; then
  # Read from stdin if no arguments
  MESSAGE=$(cat)
fi

if [ -z "$MESSAGE" ]; then
  echo "Usage: notify.sh <message>"
  echo "   or: echo 'message' | notify.sh"
  exit 1
fi

curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=${MESSAGE}" \
  -d "parse_mode=HTML" \
  > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "Sent."
else
  echo "Failed to send message."
  exit 1
fi
