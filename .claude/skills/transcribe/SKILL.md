---
description: Drop a video or audio URL — Athena fetches the audio, transcribes it, and returns a clean transcript plus a short summary. Works on YouTube, Instagram reels, TikTok, podcasts, and any yt-dlp-supported platform. Use when the user shares a link and wants the content extracted, not just bookmarked.
---

# Transcribe

Pulls audio from any supported URL, transcribes it, and surfaces the content. Pure ingestion — what the user does with it (memory, notes, content remix) is downstream.

---

## When to Trigger

**Auto-fire on URL drops** — if the user pastes a link from any of these platforms with no other instruction, ask "Want me to transcribe it?" then run:

| Platform | Method |
|----------|--------|
| YouTube / Shorts | yt-dlp → audio → transcribe |
| Instagram Reels | yt-dlp (with cookies) → audio → transcribe |
| TikTok | yt-dlp → audio → transcribe |
| Podcasts (RSS/MP3 link) | direct download → transcribe |
| Twitter/X video | yt-dlp → audio → transcribe |
| Any audio/video URL yt-dlp accepts | same flow |

**Explicit triggers:**
- "Transcribe this"
- "What does this video say"
- "Summarize this clip"
- "Pull the transcript from [URL]"
- "/transcribe [URL]"

**Do NOT trigger for:**
- Article links (use WebFetch instead — no audio to transcribe)
- Links the user has clearly already watched and is referencing
- The user pasting a link to share with Athena, not to ingest

---

## Requirements

| Tool | Install | Purpose |
|------|---------|---------|
| `yt-dlp` | Mac: `brew install yt-dlp` / Ubuntu: `pipx install yt-dlp` | Fetches audio from any video URL |
| `ffmpeg` | Mac: `brew install ffmpeg` / Ubuntu: `apt-get install ffmpeg` | Audio conversion |
| `GROQ_API_KEY` | Free tier at console.groq.com — set in `bot/.env` or `.env` | Whisper transcription (primary path) |
| `whisper-cli` (optional, Mac fallback) | `brew install whisper-cpp` | Local transcription if no Groq key |

If neither Groq nor whisper-cli is available, tell the user how to set up Groq (free tier, 30s) and stop.

---

## Steps

### Step 1: Confirm intent

If user dropped a URL with no other instruction, ask one short question: "Want me to transcribe it?" Wait for confirmation. Skip this if user explicitly said transcribe.

### Step 2: Fetch audio

```bash
bash scripts/fetch-audio.sh "<URL>" /tmp/transcribe-$$
```

Returns the path to `audio.mp3`. If yt-dlp fails (private video, geo-block, expired link), report cleanly: "Couldn't fetch — [reason]. Got a different link?"

### Step 3: Transcribe

```bash
bash scripts/transcribe.sh /tmp/transcribe-$$/audio.mp3
```

Returns plain text on stdout. Capture it.

### Step 4: Clean up

```bash
rm -rf /tmp/transcribe-$$
```

### Step 5: Deliver

Output format:

```
**Transcript** ([duration] · [platform])

[3-5 sentence summary — what the speaker actually says, not metadata. Lead with the thesis.]

---

**Full transcript:**
[Full text. If over ~3000 words, save to `personal/inbox/transcripts/<slug>-<date>.md` and link instead.]
```

### Step 6: Offer next moves (one line, not a menu)

Pick the most likely follow-up based on context:
- Coaching/learning content → "Want me to extract the key takeaways?"
- Long-form interview/podcast → "Want me to save this to your inbox?"
- Tutorial/how-to → "Want me to pull out the action items?"
- Otherwise → no follow-up offer; just end clean.

---

## Output Rules

- Lead with the summary, not the metadata. The user wants to know what was said.
- If the transcript is short (under 500 words), inline the full text. If long, save to disk and link.
- Don't editorialize the transcript itself — it's the speaker's words, not Athena's interpretation.
- The summary IS Athena's interpretation — be sharp, not neutral.
- If the audio is mostly music or non-verbal, say so: "Mostly background music, no transcribable speech." Don't fabricate.

---

## What This Skill Does NOT Do

- Does NOT chain to content-creation skills (no auto-remix to LinkedIn posts, etc.).
- Does NOT save to long-term memory automatically — user must ask.
- Does NOT translate. If the transcript comes back in another language, deliver it as-is and offer translation as a follow-up.
- Does NOT extract video frames or screenshots — audio only.
- Does NOT work on protected content where yt-dlp can't access (DRM, paywall). Report and stop.
