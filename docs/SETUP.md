# Athena Setup

Full installation walkthrough for a self-hosted Athena. This is where you go when the 3-command `./setup.sh` quickstart is not enough — when you want long-term memory, calendar, Gmail, Notion, voice, and Telegram all wired up properly. Budget 20–30 minutes end to end if your external accounts (Google Cloud, Notion, Telegram, Groq, ElevenLabs) are already ready. Longer if you need to create them.

The walkthrough assumes you have already cloned the repo and run `./setup.sh` once. That script handles the local wiring. This doc handles everything that needs you to log into third-party services.

---

## 1. Prerequisites

| Requirement | Why | How to verify |
|---|---|---|
| Claude Pro or Max subscription | Athena runs on Claude Code, which requires an Anthropic plan | Log in at https://claude.ai |
| Node.js 20+ | Telegram bot, filesystem MCP, most MCP servers | `node -v` |
| Python 3.10+ | Long-term memory (MemPalace) | `python3 --version` |
| git | Clone the repo | `git --version` |
| A Unix-like shell | Scripts are bash | macOS Terminal, Linux, or WSL |

On macOS, Homebrew handles all four:

```bash
brew install node python3 git
```

On Ubuntu/Debian:

```bash
sudo apt update && sudo apt install -y nodejs npm python3 python3-pip git
```

---

## 2. Install Claude Code

Athena is a Claude Code workspace. Install the CLI first.

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Verify:

```bash
claude --version
```

If the command is not found, add the Claude Code install directory to your shell `PATH` (the installer prints instructions). Then log in once so the CLI can reach your subscription:

```bash
claude
```

Follow the browser prompt. Quit the CLI (`/quit`) once you are logged in.

---

## 3. Clone the Repo and Run `./setup.sh`

```bash
git clone <your-athena-repo-url> athena
cd athena
./setup.sh
```

`setup.sh` handles the local machine. Under the hood it:

1. Checks that `claude`, `node` 20+, and `python3` are installed.
2. Installs MemPalace (long-term memory) using `pipx install mempalace`, or falls back to `pip install --user mempalace` if `pipx` is not available. Skips if neither Python path works — that feature is optional.
3. Copies `.mcp.json.template` to `.mcp.json` with the **baseline** MCP servers (mempalace, google-calendar, notion, gmail).
4. **Prompts you** about three higher-risk tools (filesystem, playwright, computer-use) and adds them to `.mcp.json` only if you say yes. See section 4.
5. Copies `bot/.env.example` to `bot/.env` if the bot env file does not exist yet.
6. Writes any env vars your opt-ins require (e.g. `ATHENA_FS_ALLOWED`, `ATHENA_COMPUTER_USE`) into `bot/.env`.
7. Marks `.claude/hooks/*.sh` as executable.

If the script reports issues or warnings, fix them and re-run. The rest of this doc covers the pieces `setup.sh` cannot automate — the ones that need your credentials and third-party accounts.

---

## 4. Optional High-Capability Tools (Informed Consent)

`setup.sh` prompts you for three tools that are powerful enough to deserve a conscious yes/no. All three default to **OFF**. You can re-run `./setup.sh` any time (it will not overwrite an existing `.mcp.json`, so delete that file first if you want the prompts back).

### 4a. Filesystem MCP (`mcp__filesystem__*`)

**Enables** — "read that file on my Desktop", "save this screenshot to Downloads", "edit this CSV for me", direct file operations from Telegram.

**Risk** — Athena can read/write any file under the paths you list. If the allowlist covers folders with secrets, API keys, financial docs, or credentials, Athena can read those too.

**If you say yes**, `setup.sh` asks for the allowlist. Default: `~/Desktop:~/Documents:~/Downloads`. Colon-separated absolute paths.

Edit later in `bot/.env`:

```
ATHENA_FS_ALLOWED=/Users/you/Desktop:/Users/you/Documents:/Users/you/Code
```

Rules:
- Server resolves each path with `realpath` at startup and refuses any request that falls outside the resolved allowlist.
- Paths that do not exist are silently skipped. If every path is invalid, the server exits.
- If the variable is missing entirely, the server prints `ATHENA_FS_ALLOWED not set in bot/.env — refusing to start` and exits. Fail-closed.

Restart the bot after any change.

### 4b. Playwright MCP (`mcp__playwright__*`)

**Enables** — "research X and summarize the top 5 results", "take a screenshot of this URL", "log into my dashboard and check the metric" (when approved).

**Risk** — Can submit forms to any public site. Can make purchases if you're logged in elsewhere. Can scrape content from any page the browser can reach.

**If you say yes**, `setup.sh` adds `@playwright/mcp@latest` to `.mcp.json`. First invocation downloads Chromium/Firefox/WebKit (~300MB, cached after).

Pre-warm optional:

```bash
npx -y playwright install
```

### 4c. Computer Use MCP (`mcp__computer__*`)

**Enables** — "open my Excel file and update row 23", "automate a task I do every Monday", "screenshot my whole screen and describe what I'm looking at".

**RISK — read before enabling:**

- Athena can click anything on your screen, including Delete, Send, Confirm, Purchase.
- Athena can see everything currently visible — passwords, private messages, bank pages, anything.
- If the bot runs unattended, scheduled jobs could in theory perform actions you never explicitly approved.
- **macOS only.** Uses the community package `@zavora-ai/computer-use-mcp`.
- Requires **Rust and Cargo** (first-run native build). If you don't have it:

  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

- Requires **Accessibility + Screen Recording permissions** in `System Settings → Privacy & Security`. Grant these to the terminal you run the bot from (e.g. iTerm, Terminal, VS Code).

**If you say yes**, `setup.sh` adds the server to `.mcp.json` and writes `ATHENA_COMPUTER_USE=true` to `bot/.env`. The Claude Code runtime (and the Telegram bot, via `mcp__computer__*` in `allowedTools`) can now invoke screenshot, click, move, type, key, clipboard, and app management.

**Athena's safety posture with computer-use active:**
- Read-only ops (screenshot, list apps, read clipboard) are Green tier — execute freely.
- Any click on Delete / Send / Confirm / Purchase / similar is Yellow tier — propose the exact click, wait for confirmation.
- Destructive file ops via computer-use are never Green.

**Disabling later:** remove the `"computer"` block from `.mcp.json` and set `ATHENA_COMPUTER_USE=false` in `bot/.env`.

---

## 5. Long-Term Memory / MemPalace (`mcp__mempalace__*`)

MemPalace is Athena's long-term memory. Knowledge graph (entities and relationships), drawers (semantic memories), and a private session diary. Optional — Athena works without it, she just forgets things between sessions.

Install via `pipx` (recommended — isolates dependencies):

```bash
pipx install mempalace
```

Or via `pip`:

```bash
python3 -m pip install --user mempalace
```

Verify:

```bash
mempalace-mcp --help
```

If the binary is not on your `PATH` after a `pip --user` install, add `~/.local/bin` (Linux) or `~/Library/Python/3.x/bin` (macOS) to your `PATH`.

`setup.sh` already attempts this install for you. Re-run it after manually installing if you want the installer to confirm it detected MemPalace.

Memory data lives under `~/.local/share/mempalace` (or the platform equivalent). Nothing ever leaves your machine.

---

## 6. Google Calendar MCP (`mcp__google-calendar__*`)

Reads and writes your Google Calendar. Needs a Google OAuth client and a one-time browser auth handshake.

### Create an OAuth client

1. Go to https://console.cloud.google.com and create a project (or use an existing one).
2. Enable the Google Calendar API for that project (`APIs & Services` → `Library` → search "Google Calendar API" → `Enable`).
3. Configure the OAuth consent screen (`APIs & Services` → `OAuth consent screen`). External user type is fine for a personal setup. Add your own email as a test user.
4. Create credentials: `APIs & Services` → `Credentials` → `Create Credentials` → `OAuth client ID` → `Desktop app`. Name it "Athena".
5. Download the JSON. Rename it to `calendar-credentials.json` and move it to your home directory:

```bash
mv ~/Downloads/client_secret_*.json ~/calendar-credentials.json
```

### Path conventions

The launcher at `scripts/calendar-mcp.js` resolves paths automatically:

| Variable | Value |
|---|---|
| `GOOGLE_OAUTH_CREDENTIALS` | `~/calendar-credentials.json` |
| `GOOGLE_CALENDAR_MCP_TOKEN_PATH` (macOS/Linux) | `~/.config/google-calendar-mcp-athena/tokens.json` |
| `GOOGLE_CALENDAR_MCP_TOKEN_PATH` (Windows) | `%USERPROFILE%\.config\google-calendar-mcp\tokens.json` |

### First-time auth

Start Claude Code in the project (`claude` from the repo root). The first time a Google Calendar tool runs, `@cocal/google-calendar-mcp` opens a browser tab asking you to approve. Approve, and the resulting token is cached at the path above. Every future launch reuses it silently.

---

## 7. Gmail MCP (`mcp__gmail__*`)

Gmail read and draft via `@gongrzhe/server-gmail-autoauth-mcp`. Same OAuth model as Calendar — desktop OAuth client, one-time browser flow.

Full auth instructions live on the upstream package readme: https://www.npmjs.com/package/@gongrzhe/server-gmail-autoauth-mcp

Short version:

1. In Google Cloud Console, enable the Gmail API for the same project you used for Calendar.
2. Use the existing desktop OAuth client (or create a new one if you want Gmail isolated).
3. Download the credentials JSON and place it at the location the package expects (see its readme — the default is `~/.gmail-mcp/gcp-oauth.keys.json`).
4. First time a Gmail tool fires, the package opens a browser for consent. Approve. Token caches automatically.

Athena defaults to drafting only. Sending requires explicit instruction per the `operating-rules.md` red-tier policy.

---

## 8. Notion MCP (`mcp__notion__*`)

Notion integration uses an internal integration token, not OAuth. Faster to set up than Google but needs per-page sharing.

### Create the integration

1. Go to https://www.notion.so/profile/integrations.
2. Click `New integration`. Name it "Athena". Associate it with your workspace. Set it to `Internal`.
3. Under `Capabilities`, enable Read content, Update content, and Insert content. (Match what you want Athena able to do.)
4. Save. Copy the `Internal Integration Token`.

### Store the token

Open `bot/.env` and add:

```
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

`.mcp.json.template` references `${NOTION_TOKEN}` — the bot's agent loader reads `bot/.env` and substitutes the value when launching Claude Code. No hardcoding in `.mcp.json`.

### Share pages and databases with the integration

Integrations only see pages explicitly shared with them. For every database or parent page you want Athena to read or write:

1. Open the page in Notion.
2. Click the `...` menu → `Connections` (or `Add connections`).
3. Select your Athena integration.

Anything not shared is invisible to the MCP server. That is the security model.

---

## 9. Notion Database Wiring for the Skills

Six built-in skills read/write Notion databases: `bookmark`, `brain-dump`, `research`, `video-ideas`, `log-expense`, `spending-summary`. Each reads its database ID from `personal/notion-databases.md`. If the file is missing or a key is missing, the skill pauses and asks you to set it up.

### Expected file format

Create `personal/notion-databases.md` with an entry per skill:

```
bookmarks_database_id: <database id>
bookmarks_data_source: collection://<data source id>
bookmarks_parent_page: <parent page id>

braindumps_database_id: <database id>
braindumps_data_source: collection://<data source id>
braindumps_parent_page: <parent page id>

research_database_id: <database id>
research_data_source: collection://<data source id>
research_parent_page: <parent page id>

video_ideas_database_id: <database id>
video_ideas_data_source: collection://<data source id>
video_ideas_parent_page: <parent page id>

expenses_database_id: <database id>
expenses_data_source: collection://<data source id>
expenses_parent_page: <parent page id>
```

To find the database ID: open the database in Notion as a full page, copy the URL, and grab the 32-character hex block before `?v=`.

### Expected schemas

Each skill expects specific columns but will adapt to your property names. Build your databases with these columns and the skills just work. Custom naming works too — the skills match by intent.

**Bookmarks**

| Property | Type | Options |
|---|---|---|
| Name | title | Descriptive title |
| URL | url | The link |
| Source | select | YouTube, Instagram, Twitter, LinkedIn, TikTok, Web |
| Note | text | Why saved, context |
| Date Saved | date | Auto-set to today |
| Reminder Set | checkbox | Default false |

**Brain Dumps**

| Property | Type | Options |
|---|---|---|
| Topic | title | Free text, 5–10 words |
| Category | select | Business, AI, Personal, Content, Ideas |
| Date | date | Auto-set to today |
| Status | select | Raw, Refined, Actioned |

**Research**

| Property | Type | Options |
|---|---|---|
| Topic | title | Clear research topic |
| Category | select | Business, AI, Marketing, Finance, Industry |
| Source URL | url | Where the info came from |
| Key Takeaways | text | 2–5 bullet points |
| Date | date | Auto-set to today |
| Status | select | Unread, Read, Applied |

**Video Ideas**

| Property | Type | Options |
|---|---|---|
| Name | title | Video concept |
| Date | date | Auto-set to today |
| Source URL | url | Inspiration link |
| Status | select | Draft, Ready, Published, Skipped |

**Expenses** (for `log-expense` and `spending-summary`)

| Property | Type | Options |
|---|---|---|
| Name | title | Merchant + short descriptor (e.g. "Starbucks — meeting coffee") |
| Amount | number | Positive, in the currency's base unit |
| Currency | select | USD, EUR, GBP, SGD, AUD, JPY, CAD, Other |
| Category | select | Food & Drink, Groceries, Transport, Travel, Accommodation, Software & SaaS, Entertainment, Health, Shopping, Utilities, Home, Business, Tax-Deductible, Gifts, Other |
| Merchant | text | Name as on the receipt |
| Date | date | Transaction date from the receipt |
| Payment Method | select | Card, Cash, Transfer, Other |
| Tax Deductible | checkbox | Business or clearly deductible items |
| Business | checkbox | Work/company-related vs personal |
| Notes | text | Client name, project, line items |
| Receipt | files | Optional — attach the receipt photo |

Share each database with the Athena Notion integration (section 8). If you forget, the skill will fail with a Notion permissions error.

---

## 10. Telegram Bot

Lets you talk to Athena from your phone. Voice notes, photos, videos, forwarded links all flow through.

### Create the bot

1. On Telegram, message `@BotFather`.
2. Send `/newbot`. Pick a display name and a unique username.
3. Copy the token BotFather gives you.

Paste into `bot/.env`:

```
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
```

### Find your chat ID

Start the bot once so you can message it:

```bash
cd bot
npm install
npm run dev
```

Open Telegram, find the bot by its username, send it any message. In the terminal running the bot, look for a log line that includes your chat ID — or send the bot `/chatid` and it will reply with the ID. Paste it into `bot/.env`:

```
ALLOWED_CHAT_ID=987654321
```

Restart the bot. Only this chat ID can send messages now. Anyone else gets ignored.

### Optional: multiple users

```
ADDITIONAL_CHAT_IDS=111111111,222222222
```

Each additional chat gets its own isolated session and memory.

### Seed default schedules (optional but recommended)

Athena's scheduler is empty on a fresh install. Run this once from Telegram to seed three recurring jobs:

```
/schedule defaults
```

Adds (idempotent — safe to re-run):

| Job | Cron | What fires |
|---|---|---|
| Morning briefing | `0 7 * * *` | 7am daily: calendar for today + Gmail triage since 6pm yesterday (urgent / important / noise, with draft replies for urgent) + unfinished todos from yesterday |
| Evening debrief nudge | `0 21 * * *` | 9pm daily: short Telegram nudge to run `/debrief` |
| Weekly review nudge | `0 17 * * 0` | Sunday 5pm: nudge to run `/weekly-review` |

Manage them with `/schedule` (list), `/schedule pause <id>`, `/schedule resume <id>`, `/schedule delete <id>`. Or create your own with `/schedule create "prompt" "cron"`.

The scheduler only runs while the bot process is running. Make sure the bot is kept alive (see `npm start` + PM2 note further down) or recurring jobs won't fire.

---

## 11. Voice (Optional)

Speech-to-text transcribes voice notes you send. Text-to-speech makes the bot reply with audio.

### Groq (STT, free tier)

1. Sign up at https://console.groq.com.
2. Generate an API key.
3. Add to `bot/.env`:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

Alternative: OpenAI Whisper (`OPENAI_API_KEY`). Paid per minute. Groq is faster and free for personal use.

### ElevenLabs (TTS)

1. Sign up at https://elevenlabs.io.
2. Generate an API key. Pick a voice from the voice library and copy its voice ID.
3. Add to `bot/.env`:

```
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

Leave these blank to disable TTS. Athena will reply in text only.

---

## 12. Video Analysis (Optional)

Forward a video to the bot, Athena analyzes it with Google Gemini.

1. Go to https://aistudio.google.com.
2. Create an API key.
3. Add to `bot/.env`:

```
GOOGLE_API_KEY=AIza...
```

Leave blank to skip. Photos and text still work without it.

---

## 13. Running the Bot in the Background

Dev mode (auto-reload, readable logs):

```bash
cd bot
npm run dev
```

Production mode (compiled, faster startup):

```bash
cd bot
npm run build
npm start
```

`npm start` runs `node dist/index.js` against the compiled output in `dist/`. Run `npm run build` any time you edit the bot source.

### Keep it running with PM2

PM2 is a process manager that restarts the bot on crash and on reboot.

```bash
npm install -g pm2
cd bot
npm run build
pm2 start dist/index.js --name athena-bot
pm2 save
pm2 startup
```

The last line prints a command you need to run once with `sudo` so PM2 launches on boot. Copy, paste, done.

Useful PM2 commands:

| Command | What it does |
|---|---|
| `pm2 logs athena-bot` | Tail the bot's logs |
| `pm2 restart athena-bot` | Restart after code or env changes |
| `pm2 stop athena-bot` | Stop without removing |
| `pm2 delete athena-bot` | Remove from PM2 |
| `pm2 status` | Show running processes |

Alternatives: `systemd` unit on Linux, `launchd` plist on macOS, `tmux`/`screen` for quick manual sessions.

---

## 14. Verification Checklist

Run each command and confirm the expected output.

**Claude Code is installed:**

```bash
claude --version
```

**Types compile cleanly:**

```bash
cd bot
npm run typecheck
```

No output means success.

**Tests pass:**

```bash
cd bot
npm test
```

Expect 103 tests passing. Any failures mean something in your env is off.

**MemPalace is callable:**

```bash
mempalace-mcp --help
```

If the command is not found but you expected it, check your `PATH` (section 6).

**Filesystem MCP starts:**

```bash
cd bot
npm run fs-mcp
```

Server should print `athena-filesystem MCP running. Allowed: <your dirs>` on stderr. Kill with Ctrl-C.

**Claude Code sees the MCP servers:**

```bash
claude
```

Inside the CLI, run `/mcp` to list connected servers. You should see `mempalace`, `google-calendar`, `notion`, `gmail`, `playwright`, `filesystem`.

**Telegram bot is alive:**

Send a message to your bot on Telegram. Expect a reply within a few seconds. If nothing comes back, check the bot logs.

---

## 15. Troubleshooting

**`ATHENA_FS_ALLOWED not set in bot/.env — refusing to start`**

The filesystem MCP refuses to run without an explicit allowlist. Open `bot/.env` and add the variable (see section 4). If `setup.sh` ran successfully this should already be there — check you are editing the right `.env` file, not `.env.example`.

**Google Calendar OAuth fails or keeps asking to re-auth**

Verify `~/calendar-credentials.json` exists and is valid JSON (`cat ~/calendar-credentials.json | python3 -m json.tool`). Delete `~/.config/google-calendar-mcp-athena/tokens.json` to force a fresh consent flow. Confirm the Calendar API is enabled in your Google Cloud project and your email is listed as a test user on the consent screen.

**A Notion skill pauses and asks for a database ID**

`personal/notion-databases.md` is missing or missing the relevant key. Add the six lines for that skill (ID, data source, parent page — see section 10). Also confirm the database is shared with the Athena Notion integration in Notion itself (section 9).

**Telegram bot is silent**

Check `ALLOWED_CHAT_ID` in `bot/.env` matches the chat ID you see in bot logs when you send a message. Wrong ID means every message is filtered out. Also confirm `TELEGRAM_BOT_TOKEN` is set and the bot process is actually running (`pm2 status` or check your terminal).

**Playwright hangs on first use**

First run downloads ~300MB of browser binaries. Let it finish once. Subsequent runs are fast. If your network blocks the Playwright CDN, pre-install with `npx -y playwright install` on a different network, or set `PLAYWRIGHT_BROWSERS_PATH` to a pre-populated cache.

**MemPalace installed but Claude Code says the server failed to start**

The `mempalace-mcp` binary is not on the `PATH` Claude Code inherits. Confirm with `which mempalace-mcp` from the same shell you launch `claude` in. If `pipx` installed it to `~/.local/bin`, add that to your shell rc file (`.zshrc`, `.bashrc`) and restart your terminal.

---

That is the full walkthrough. From here, open the repo in your editor, run `claude` from the repo root, and say hi. Athena handles the rest.
