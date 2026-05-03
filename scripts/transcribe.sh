#!/bin/bash
# Transcribe an audio file to plain text.
# Primary: Groq API (whisper-large-v3) — works everywhere (Mac + VPS) if GROQ_API_KEY is set.
# Fallback: whisper-cli locally (Mac only, no API key required).
# Usage: transcribe.sh <audio-file>
#
# GROQ_API_KEY can be set via:
#   - Environment variable
#   - bot/.env (project root)
#   - .env (project root)

set -u

FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: $0 <audio-file>" >&2
  exit 1
fi

# Load GROQ_API_KEY from common env file locations if not already in env
if [ -z "${GROQ_API_KEY:-}" ]; then
  REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  for ENV_FILE in "$REPO_ROOT/bot/.env" "$REPO_ROOT/.env"; do
    if [ -f "$ENV_FILE" ]; then
      KEY=$(grep -E '^GROQ_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"' | tr -d "'")
      if [ -n "$KEY" ]; then
        GROQ_API_KEY="$KEY"
        break
      fi
    fi
  done
fi

# Primary path: Groq API
if [ -n "${GROQ_API_KEY:-}" ]; then
  RESULT=$(curl -sS --fail "https://api.groq.com/openai/v1/audio/transcriptions" \
    -H "Authorization: Bearer $GROQ_API_KEY" \
    -F "file=@$FILE" \
    -F "model=whisper-large-v3" \
    -F "response_format=text" 2>&1) || {
    echo "Groq API failed: $RESULT" >&2
    # Fall through to whisper-cli fallback
    RESULT=""
  }

  if [ -n "$RESULT" ]; then
    echo "$RESULT"
    exit 0
  fi
fi

# Fallback path: whisper-cli (local, Mac)
if command -v whisper-cli >/dev/null 2>&1; then
  MODEL="${WHISPER_MODEL:-$HOME/.local/share/whisper-models/ggml-base.en.bin}"
  if [ ! -f "$MODEL" ]; then
    echo "whisper-cli model not found at $MODEL" >&2
    exit 1
  fi

  TMPDIR_OUT=$(mktemp -d)
  WAV="$TMPDIR_OUT/audio.wav"

  # Convert to 16kHz mono PCM (whisper.cpp input format)
  if ! ffmpeg -y -i "$FILE" -ar 16000 -ac 1 -c:a pcm_s16le "$WAV" -loglevel error 2>&1; then
    rm -rf "$TMPDIR_OUT"
    echo "ffmpeg conversion failed" >&2
    exit 1
  fi

  # Run whisper-cli silently, read plain text from output file
  whisper-cli -m "$MODEL" -f "$WAV" --no-prints --output-txt --output-file "$TMPDIR_OUT/out" >/dev/null 2>&1
  if [ -f "$TMPDIR_OUT/out.txt" ]; then
    cat "$TMPDIR_OUT/out.txt"
    rm -rf "$TMPDIR_OUT"
    exit 0
  fi

  rm -rf "$TMPDIR_OUT"
  echo "whisper-cli produced no output" >&2
  exit 1
fi

echo "No transcription path available: GROQ_API_KEY not set and whisper-cli not installed" >&2
exit 1
