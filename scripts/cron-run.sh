#!/usr/bin/env bash
# Run a scheduled job and report it ONLY if it fails.
#
# A wrapper rather than an edit to every job, so working jobs keep their exact
# behaviour and any of it is reversible by changing one crontab line back.
#
#   cron-run.sh <job-name> <command> [args...]
#
# Crontab goes from:
#   0 * * * * bash /home/athena/athena/scripts/morning-briefing.sh >> LOG 2>&1
# to:
#   0 * * * * /home/athena/athena/scripts/cron-run.sh morning-briefing bash /home/athena/athena/scripts/morning-briefing.sh >> LOG 2>&1
#
# Output still flows to the same log. This only adds a message on failure,
# deduplicated by cron-alert.sh so a job broken all week sends one message
# rather than one per run.
#
# Exits with the wrapped command's own exit code, so nothing downstream changes.

set -uo pipefail

JOB="${1:?usage: cron-run.sh <job-name> <command> [args...]}"
shift

HERE="$(cd "$(dirname "$0")" && pwd)"
# shellcheck disable=SC1091
. "$HERE/cron-alert.sh"

# Capture output so a failure can carry its real error, while still writing
# everything through to the job's normal log.
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

# `env` rather than "$@" directly: a crontab entry may carry VAR=value prefixes.
# Bash treats those as assignments only when it parses the line itself — passed
# as arguments they become a command name, and the job dies with "command not
# found" on every run. env handles both shapes and passes a plain command
# through untouched.
env "$@" > >(tee "$OUT") 2> >(tee -a "$OUT" >&2)
CODE=$?

if [ "$CODE" -ne 0 ]; then
  # The last non-empty lines are almost always the real error; the rest is noise.
  DETAIL="$(grep -v '^[[:space:]]*$' "$OUT" 2>/dev/null | tail -2 || true)"
  cron_alert "$JOB" "$CODE" "$DETAIL"
else
  cron_alert "$JOB" 0 ""
fi

exit "$CODE"
