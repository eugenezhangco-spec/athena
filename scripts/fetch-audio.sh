#!/bin/bash
# Download audio from a URL using yt-dlp.
# If ~/.instagram-cookies.txt exists, pass it to yt-dlp — required for Instagram
# from data-center IPs (VPS) and also helps with rate-limited content elsewhere.
# Usage: fetch-audio.sh <URL> [output-dir]
# Outputs: writes audio.mp3 to output-dir (default: cwd); prints final path to stdout.
#
# Requirements: yt-dlp, ffmpeg
#   Mac:    brew install yt-dlp ffmpeg
#   Ubuntu: apt-get install -y ffmpeg && pipx install yt-dlp

set -u

URL="${1:-}"
OUT_DIR="${2:-.}"

if [ -z "$URL" ]; then
  echo "Usage: $0 <URL> [output-dir]" >&2
  exit 1
fi

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "yt-dlp not installed. Mac: brew install yt-dlp. Ubuntu: pipx install yt-dlp." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/audio.mp3"
rm -f "$OUT_FILE"

COOKIES_ARGS=()
COOKIES_FILE="$HOME/.instagram-cookies.txt"
if [ -f "$COOKIES_FILE" ]; then
  COOKIES_ARGS=(--cookies "$COOKIES_FILE")
fi

# Mobile user-agent improves compatibility on Instagram/TikTok from non-residential IPs
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

yt-dlp \
  "${COOKIES_ARGS[@]}" \
  --user-agent "$UA" \
  -x --audio-format mp3 --audio-quality 0 \
  -o "$OUT_FILE" \
  --no-warnings \
  "$URL" >&2 || {
    echo "yt-dlp failed for $URL" >&2
    exit 1
  }

if [ ! -f "$OUT_FILE" ]; then
  echo "Expected output file not found: $OUT_FILE" >&2
  exit 1
fi

echo "$OUT_FILE"
