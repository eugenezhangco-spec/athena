# Deployment Guide

This guide walks you through setting up Athena's Telegram bot and all its features. The bot runs locally on your machine — no cloud server needed.

**Time:** 15-20 minutes
**Cost:** Free (all services have free tiers)

---

## Before You Start

You need:
- A computer with Node.js 20+ installed
- Claude Code CLI installed and authenticated (`claude --version` works)
- A Telegram account on your phone
- A Claude Pro or Max subscription (claude.ai)

---

## Quick Setup (Recommended)

The interactive wizard handles everything:

```bash
cd bot
npm install
npm run setup
```

The wizard:
1. Checks Node.js and Claude CLI are installed
2. Asks for your Telegram bot token (guides you through @BotFather)
3. Asks your name and assistant name
4. Offers voice setup (Groq STT, ElevenLabs TTS)
5. Offers video analysis setup (Google Gemini)
6. Offers WhatsApp bridge
7. Builds the project
8. Opens CLAUDE.md for personalization
9. Helps you get your Chat ID
10. Optionally installs as a background service

After setup: `npm start` to run the bot.

---

## Manual Setup

If you prefer to configure manually:

### Step 1: Create the Telegram Bot

1. Open Telegram, search for @BotFather
2. Send `/newbot`, follow the prompts
3. Copy the bot token

### Step 2: Configure .env

```bash
cd bot
cp .env.example .env
```

Edit `.env` with your values:

```
TELEGRAM_BOT_TOKEN=your_token_here
USER_NAME=YourName
ASSISTANT_NAME=Athena
ATHENA_DIR=/path/to/athena-v2
```

### Step 3: Get Your Chat ID

```bash
npm run build
npm start
```

Open Telegram, message your bot: `/chatid`. Copy the number and add it to `.env`:

```
ALLOWED_CHAT_ID=your_chat_id
```

Restart the bot.

### Step 4: Add Optional Features

**Voice transcription (free):**
- Get a Groq API key at console.groq.com
- Add `GROQ_API_KEY=your_key` to `.env`

**Voice replies:**
- Get an ElevenLabs API key at elevenlabs.io
- Pick a voice, copy the Voice ID
- Add `ELEVENLABS_API_KEY=your_key` and `ELEVENLABS_VOICE_ID=your_id` to `.env`

**Video analysis:**
- Get a Google API key at aistudio.google.com
- Add `GOOGLE_API_KEY=your_key` to `.env`

**WhatsApp bridge:**
- Install: `npm install whatsapp-web.js qrcode-terminal`
- Add `WHATSAPP_ENABLED=true` to `.env`
- Restart bot, scan QR code with WhatsApp

---

## Background Service

Run the bot 24/7 without keeping a terminal open.

### Mac (launchd)

The setup wizard offers this automatically. To install manually:

```bash
npm run setup
# Say "Yes" to "Install as background service"
```

Or use the bot's built-in service installer which creates a launchd plist at `~/Library/LaunchAgents/com.athena.bot.plist`.

Check logs: `cat /tmp/athena-bot.log`

### Linux (systemd)

```bash
npm run setup
# Say "Yes" to "Install as background service"
```

Check status: `systemctl --user status athena-bot`

### Windows (PM2)

```bash
npm install -g pm2
pm2 start dist/index.js --name athena-bot
pm2 save
pm2 startup
```

---

## Health Check

Run `npm run status` in the bot folder for a full diagnostic:
- Node.js and Claude CLI versions
- .env configuration check
- Database stats (sessions, memories, reminders, tasks)
- Build status
- Background service status

On Telegram: send `/health` to your bot.

---

## Multi-User Setup

To allow additional Telegram users:

Add their chat IDs to `.env`:

```
ADDITIONAL_CHAT_IDS=123456789,987654321
```

Each user gets their own session and memory space.

---

## Bot Commands Reference

| Command | What it does |
|---------|-------------|
| `/start` | Welcome message |
| `/chatid` | Show your chat ID |
| `/newchat` | Fresh conversation (clears session) |
| `/voice` | Toggle voice replies on/off |
| `/health` | System status and active features |
| `/memory` | View stored memories |
| `/wipememory` | Clear all memories |
| `/reminders` | View pending reminders |
| `/schedule` | Manage recurring tasks |
| `/wa` | WhatsApp bridge (list/read/reply) |

Natural language reminders: "remind me to call Mom in 2 hours"

---

## Troubleshooting

**Bot not responding:**
- Check the token in `.env` matches @BotFather
- Check `ALLOWED_CHAT_ID` matches your chat ID
- Run `npm run status` for diagnostics

**Voice not working:**
- Check `GROQ_API_KEY` is set in `.env`
- Run `/health` on Telegram to see if STT is active

**Background service not starting:**
- Mac: `launchctl list | grep athena`
- Linux: `systemctl --user status athena-bot`
- Check logs at `/tmp/athena-bot.log`

**WhatsApp QR code not showing:**
- Make sure `whatsapp-web.js` is installed: `npm list whatsapp-web.js`
- Check `WHATSAPP_ENABLED=true` in `.env`

**Claude not responding to messages:**
- Run `claude --version` to verify CLI is installed
- Check that Claude Code is authenticated
