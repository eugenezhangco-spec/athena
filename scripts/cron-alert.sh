#!/usr/bin/env bash
# Failure alerting for scheduled jobs, with hard deduplication.
#
# THE PROBLEM THIS SOLVES
# Every scheduled job here is silent by design — it only messages you when it
# has something worth saying. Which means "nothing needed you today" and "I died
# at 3am" look identical from your phone. A morning briefing that never fired is
# indistinguishable from a morning with nothing in it.
#
# THE PROBLEM THIS AVOIDS
# Naked alerting is worse than silence. The sync job runs every five minutes, so
# one bad afternoon is 288 messages. You mute the thread, and the next real
# alert is invisible. Muted alerting is no alerting with extra steps.
#
# THE GUARANTEE
# At most TWO messages per broken job. One when it breaks, one when it recovers.
# A job failing the same way all week sends one message on day one and nothing
# after that.
#
# USAGE
# Wrap the job with cron-run.sh (easier), or call this directly:
#
#     source "$(dirname "$0")/cron-alert.sh"
#     ... the job ...
#     cron_alert "morning-briefing" "$?" "Calendar API 401 after 3 tries"

CRON_ALERT_STATE_DIR="${CRON_ALERT_STATE_DIR:-$HOME/.local/state/athena/cron-alerts}"

# cron_alert <job> <exit_code> [detail]
cron_alert() {
  local job="$1" code="${2:-0}" detail="${3:-}"
  local state_file="$CRON_ALERT_STATE_DIR/${job}.state"

  mkdir -p "$CRON_ALERT_STATE_DIR" 2>/dev/null || return 0

  # Signature = exit code + the LAST line of detail, normalised. A job failing a
  # genuinely different way is a new fact worth one more message; the same
  # failure repeating is not.
  #
  # Normalising matters more than it looks. The raw text of a failure varies run
  # to run — a timestamp, a retry count, a different line of preceding noise —
  # and any of that would read as "new error" and re-alert. That is the exact
  # flood this mechanism exists to prevent. So: last line only, timestamps and
  # standalone numbers stripped, whitespace collapsed.
  #
  # No \b in the pattern: sed -E supports it on GNU and not on BSD, so the same
  # script would deduplicate differently on a Linux server and a Mac, and the
  # self-test would pass on one while production flooded on the other. Plain
  # [0-9]+ is portable. It means a 401 and a 500 on the same job collapse into
  # one alert, which is the right call anyway — both mean that job is broken.
  local sig
  sig="${code}:$(printf '%s' "$detail" \
    | grep -v '^[[:space:]]*$' | tail -1 \
    | sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2}([T ][0-9:]+)?//g; s/[0-9]+/N/g; s/[[:space:]]+/ /g; s/^ //; s/ $//' \
    | cut -c1-120)"
  local previous=""
  [ -f "$state_file" ] && previous="$(cat "$state_file" 2>/dev/null)"

  if [ "$code" -eq 0 ]; then
    # Recovered: say so once, and only if a failure was actually reported.
    if [ -n "$previous" ]; then
      _cron_alert_send "Cron recovered · ${job}
Back to normal on its own."
      rm -f "$state_file"
    fi
    return 0
  fi

  # Failing, and this exact failure was already reported. Stay quiet.
  [ "$previous" = "$sig" ] && return 0

  printf '%s' "$sig" > "$state_file"

  local body="Cron failed · ${job}"
  [ -n "$detail" ] && body="${body}
$(printf '%s' "$detail" | head -2 | cut -c1-200)"
  body="${body}
exit ${code}. Silent from here until it changes or recovers."

  _cron_alert_send "$body"
}

_cron_alert_send() {
  # Plain text only. Error strings contain arbitrary characters, and a stray one
  # must never break the message.
  local text="$1"
  local env_file="${TELEGRAM_ENV:-${ATHENA_DIR:-$HOME/athena}/bot/.env}"
  # shellcheck disable=SC1090
  [ -f "$env_file" ] && . "$env_file"
  : "${TELEGRAM_BOT_TOKEN:=}" "${TELEGRAM_USER_ID:=}"

  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_USER_ID" ]; then
    # No Telegram configured is a normal state, not an error — plenty of people
    # run this without the bot. Print instead, so the log still carries it.
    echo "cron-alert: no telegram credentials, would have sent:" >&2
    echo "$text" >&2
    return 0
  fi

  curl -s -o /dev/null --max-time 15 \
    -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_USER_ID}" \
    --data-urlencode "text=${text}" || true
}

# Self-check: bash scripts/cron-alert.sh --selftest
if [ "${1:-}" = "--selftest" ]; then
  CRON_ALERT_STATE_DIR="$(mktemp -d)"
  TELEGRAM_ENV=/nonexistent          # forces the dry-run branch
  fail=0

  count() { cron_alert "$@" 2>&1 | grep -c "^Cron" || true; }

  [ "$(count selftest 1 'boom')" = "1" ] || { echo "FAIL: first failure should alert"; fail=1; }
  [ "$(count selftest 1 'boom')" = "0" ] || { echo "FAIL: repeat of same failure must be silent"; fail=1; }
  # The flood cases: same underlying error, noisy surroundings. All must be silent.
  [ "$(count selftest 1 'unrelated noise
boom')" = "0" ] || { echo "FAIL: preceding noise changed but error is the same"; fail=1; }
  [ "$(count selftest 1 '2026-08-12 23:04:11 boom')" = "0" ] || { echo "FAIL: timestamp must not count as a new error"; fail=1; }
  [ "$(count selftest 1 'boom after 7 retries')" = "1" ] || { echo "FAIL: genuinely different text should alert"; fail=1; }
  [ "$(count selftest 1 'boom after 12 retries')" = "0" ] || { echo "FAIL: retry COUNT must not count as a new error"; fail=1; }
  [ "$(count selftest 1 'different error entirely')" = "1" ] || { echo "FAIL: a NEW failure should alert"; fail=1; }
  [ "$(count selftest 0 '')" = "1" ] || { echo "FAIL: recovery should alert once"; fail=1; }
  [ "$(count selftest 0 '')" = "0" ] || { echo "FAIL: staying healthy must be silent"; fail=1; }

  rm -rf "$CRON_ALERT_STATE_DIR"
  [ "$fail" -eq 0 ] && echo "cron-alert selftest: pass (2 messages max per broken job)"
  exit "$fail"
fi
