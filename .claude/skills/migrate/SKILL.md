---
name: migrate
description: "Migrate to Athena from ANY previous AI setup — another Claude Code assistant, ChatGPT exports, Gemini history, Apple Notes, documents, or anything. Use when the user says 'migrate', 'bring over my old assistant', 'import my data', 'I have an existing assistant', 'I have ChatGPT history', 'I want to bring over my context', 'switch to Athena', or when the user mentions they have existing AI context they want to preserve. Also triggers when personal/me.md is empty and the user mentions having prior context. Handles everything: detects what they are coming from, imports what matters, sets up private infrastructure, gets the bot running. No re-onboarding needed if enough context is imported."
---

# Skill: Migrate

## What This Skill Does

Brings a user into Athena from wherever they are coming from — whether that is a previous Claude Code assistant, ChatGPT conversation history, Gemini exports, personal documents, or nothing at all. Detects what they have, imports what matters, skips what Athena already handles better, and gets them up and running with the minimum number of questions.

The goal: nobody starts from zero if they do not have to.

## Dependencies (Load Before Running)

- `docs/DEPLOYMENT.md` — full infrastructure setup guide (reference during infrastructure setup)
- `.claude/SYSTEM.md` — current system manifest
- `.claude/skills/onboard/SKILL.md` — onboarding flow (used when import covers some but not all context)

---

## How to Activate

**Explicit triggers:**
- "Scan my old assistant at [path]" — goes straight to autonomous scan-and-plan mode
- "Migrate from my old assistant" / "Bring over my data"
- "I have ChatGPT history" / "I have exports from [AI tool]"
- "Import from [path]" / "Switch to Athena" / "Move everything over"
- `/migrate`
- User pastes the kickoff prompt from `KICKOFF.md`

**Auto-detection:**
- User opens Athena and `personal/me.md` is empty
- User mentions they have an existing AI assistant or prior context
- If auto-detected, ask: "It looks like this is a fresh start. Are you coming from another AI assistant, or is this your first one? If you have any existing context — chat exports, notes, documents — I can use them to skip the basics."

---

## CRITICAL RULES

1. NEVER delete or modify files in any source folder. Only READ from it, WRITE to Athena.
2. NEVER copy system files (rules, skills, configs) from another Claude Code assistant. Only personal data migrates. Athena's system IS the upgrade.
3. If credentials are found, show variable names (NOT values) and ask for confirmation before copying.
4. If anything fails, explain in plain English and offer to retry or skip.
5. The user may be nervous about switching. Reassure them: "Your data comes with you."

---

## SCAN-AND-PLAN MODE (Kickoff Prompt)

If the user provides a path and asks you to "scan" their old assistant, skip the detection questions. Go autonomous:

1. **Scan everything.** Read all files in the old assistant's `personal/` folder, `decisions/` folder, and any other folders that contain personal information (check for folders like `context/`, `notes/`, `journal/`, `logs/`, or anything non-system). Also check `bot/.env` for credentials.

2. **Build a profile summary.** Present everything you found about the user:
   - Who they are (name, role, timezone, work schedule)
   - Their goals (short-term and long-term)
   - Their behavioral patterns (productivity patterns, avoidance patterns, strengths)
   - Key relationships (people mentioned, roles, context)
   - Key decisions made (from decision log)
   - Daily history (how many days of plans/debriefs exist, recent themes)
   - Anything unique (custom categories, special files, data that does not fit standard categories)

3. **Present the migration plan.** Map every piece of personal context to its destination in Athena:

   ```
   MIGRATION PLAN

   [Old file] → [Athena file] — [what it contains, any adaptations needed]
   [Old file] → [Athena file] — [...]

   ITEMS WITH NO CLEAR HOME:
   [File or data] — [description, ask user where it should go]

   CREDENTIALS FOUND:
   [Variable names only, never values] — [ask to copy yes/no]

   WILL NOT MIGRATE (system files — Athena's versions are the upgrade):
   [List of skipped system files so user knows nothing was lost by accident]
   ```

4. **Ask follow-up questions:**
   - "Did I miss anything? Is there context you shared with [old assistant name] that I did not find in the files?"
   - "Anything in the 'no clear home' list you want to keep? Tell me where."
   - "Want me to copy the bot credentials so your Telegram bot keeps working?"

5. **Wait for confirmation.** Do NOT execute until the user says go.

6. **Execute the migration.** Copy everything according to the confirmed plan. Adapt content to Athena's file format where the structure differs — do NOT change Athena's file structure, adapt the content to fit it.

7. **Summarize what was done.** Then move to infrastructure setup (Phase 2 below).

---

## INTERACTIVE MODE (When No Path Is Given)

If the user does not provide a specific path, guide them through detection.

## STEP 1: Detect What They Have

Ask: "What are you coming from? Pick whichever fits:"

- **A) I have another Claude Code assistant** (folder on this computer with personal files, a bot, maybe a server)
- **B) I have been using ChatGPT, Gemini, or another AI** (conversation history, exports, or just memory of what I told it)
- **C) I have documents about myself** (bio, resume, notes, goals, business plan, anything)
- **D) I am starting fresh** (nothing to import)

If they are unsure, help them figure it out:
```bash
# Check for Claude Code assistant folders on Desktop
ls -d ~/Desktop/*/personal/me.md 2>/dev/null
ls -d ~/Desktop/*/.claude/rules/ 2>/dev/null
```

Based on their answer, route to the appropriate migration path below.

---

## PATH A: Migrating from Another Claude Code Assistant

This is the most complete migration. The old assistant has structured personal data in the same format Athena uses.

### A1: Find and Verify

Ask for the folder path. Verify it exists and has personal data:
- Check for `personal/me.md` with content (not just a template placeholder)
- Check for `personal/goals.md`, `personal/patterns.md`, `personal/snapshot.md`
- Report what was found: "I can see your profile, goals, [X] behavioral patterns, and [X] days of history."

### A2: Copy Personal Data

Read each file, verify it has meaningful content, write to Athena:

| Source | Destination | What It Contains |
|---|---|---|
| `personal/me.md` | `personal/me.md` | Identity, role, preferences |
| `personal/goals.md` | `personal/goals.md` | Goals and targets |
| `personal/patterns.md` | `personal/patterns.md` | Behavioral patterns |
| `personal/snapshot.md` | `personal/snapshot.md` | Current state and priorities |
| `personal/day-ledger.md` | `personal/day-ledger.md` | Daily plans and debriefs |
| `personal/inbox.md` | `personal/inbox.md` | Pending thoughts and tasks |
| `personal/personal-life/` | `personal/personal-life/` | All files (relationships, etc.) |
| `decisions/log.md` | `decisions/log.md` | Decision history |

Do NOT copy: `.claude/rules/`, `.claude/skills/`, `bot/bot.js`, `scripts/`, `CLAUDE.md`, or any system files. Athena's versions are the upgrade.

### A3: Copy Credentials (if they exist)

Check for `[old-path]/bot/.env`. If found:
"I found your old bot credentials: Telegram token, user ID, Groq key. Want me to copy them? Your existing Telegram bot will keep working — same bot, same chat history, new brain behind it."

If yes: copy to `bot/.env` in Athena.
If no: set up fresh credentials during infrastructure setup.

### A4: Assistant Name

Check `personal/me.md` for an assistant name. If the user had renamed their old assistant:
"Your old assistant was called [name]. Want to keep that, go with Athena, or pick something new?"

Update all name references if they choose a new name (same list as onboard skill Block 1).

### A5: Skip to Infrastructure Setup (Phase 2 below)

No onboarding needed. Personal data is migrated. Go straight to setting up their private GitHub, server, and sync.

---

## PATH B: Coming from ChatGPT, Gemini, or Another AI

The user has been using another AI and has context they do not want to re-explain. They may have:
- Exported conversation history (JSON, HTML, or text files)
- Screenshots of important conversations
- Memory of what they told the other AI but no exports

### B1: Check for Exports

"Do you have any exported files from your old AI? ChatGPT lets you export your data (Settings > Data Controls > Export Data). Gemini has a Google Takeout option. If you have those files, drop them here."

**If they have ChatGPT exports:**
- The export is usually a ZIP containing `conversations.json`
- Read the conversations. Extract ONLY user messages — ignore AI responses.
- Look for: name, role, timezone, goals, projects, relationships, work patterns, communication preferences, recurring topics, decisions made
- Summarize what was found: "From your ChatGPT history, I can see you work in [field], you have been focused on [project], you mentioned [people], and you tend to ask about [topics]."

**If they have Gemini exports:**
- Similar approach. Read the export, extract user context.

**If they have screenshots:**
- Read the images. Extract any personal context visible.

**If they have no exports but remember what they shared:**
- "No worries. Tell me the key things your old AI knew about you. The top 3-5 things. I will take it from there."

### B2: Pre-Fill Personal Files

Use the extracted context to pre-fill Athena's personal files:
- `personal/me.md` — identity, role, timezone, preferences
- `personal/goals.md` — goals mentioned in conversations
- `personal/patterns.md` — any behavioral patterns visible in the history

### B3: Run a Compressed Onboarding

The imports probably did not capture everything. Run a shortened version of the onboard flow:

"I got a lot from your history. Let me confirm what I know and fill in the gaps. This should only take 5 minutes instead of 15."

For each onboarding block (Identity, Goals, How You Work, Communication):
- State what was learned from the import
- Ask only about gaps
- "From your history I can see [X]. Anything wrong or missing?"

### B4: Continue to Infrastructure Setup (Phase 2 below)

---

## PATH C: They Have Documents

The user has documents about themselves — a resume, bio, business plan, meeting notes, goal lists, journal entries, anything.

### C1: Receive and Read

"Drop whatever you have. I will read everything and extract what I need. Resumes, bios, business plans, notes, spreadsheets, anything."

Read all provided documents. Extract:
- Name, role, company, industry
- Goals (business and personal)
- Projects, clients, stakeholders
- Skills, background, experience
- Schedule patterns, preferences
- Relationships mentioned

### C2: Pre-Fill and Confirm

Write extracted context to personal files. Then run a compressed onboarding (same as Path B, Step B3) to fill gaps.

### C3: Continue to Infrastructure Setup (Phase 2 below)

---

## PATH D: Starting Fresh

No prior context. Route to the full onboard skill:

"Fresh start it is. Let me get to know you."

Trigger the onboard skill (`/onboard`). The updated onboard flow will ask upfront if they have any documents to share before starting the interview.

Skip the infrastructure setup below — the onboard skill handles tool connections in its Phase 2.

---

## PHASE 2: Infrastructure Setup (Paths A, B, C)

This phase sets up the user's private infrastructure. It is the same regardless of which import path they took.

### Step 1: Private GitHub Repository

"Your personal data needs a private home. Let's set up your own GitHub repo so nobody else can see your files."

1. Check if they have a GitHub account. If not, guide through signup (github.com/signup).
2. Create a new private repository.
3. Disconnect from the template repo and connect to theirs:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/THEIR_USERNAME/THEIR_REPO.git
   git branch -M main
   git push -u origin main
   ```
4. Verify: visit the repo URL in a browser, confirm "Private" badge.

### Step 2: Telegram Bot

"Want to talk to me from your phone? We can set up Telegram access. It takes 5 minutes."

If yes:
1. Create a bot via @BotFather on Telegram
2. Get their user ID via @userinfobot
3. Get a Groq API key for voice messages (console.groq.com, free)
4. Save credentials to `bot/.env`

If they already have credentials (from Path A migration): skip this step.

If no: "No problem. You can set this up any time later. Just say 'let us set up Telegram.'"

### Step 3: Server (Hetzner VPS)

"For Telegram to work 24/7 and for everything to stay in sync, you need a small server. It costs $4 a month."

If they want Telegram: guide through the full Hetzner setup from `docs/DEPLOYMENT.md`:
1. Create Hetzner account
2. Create server (Ubuntu 24.04, CAX11 ARM, $4/month)
3. Add SSH key
4. SSH in and run setup script
5. Copy `.env` to server
6. Install and auth Claude on server
7. Start the bot with PM2
8. Test

If they do not want Telegram yet: skip the server. Athena works fully from VS Code / terminal without it.

### Step 4: Mac Auto-Sync

If GitHub is set up, configure auto-sync so changes flow between their Mac and GitHub every 60 seconds:
1. Update the sync script path in `scripts/mac-auto-sync.sh`
2. Create and load the launchd job
3. Verify sync works

Follow the steps in `docs/DEPLOYMENT.md` Phase 5.

### Step 5: Privacy Handover

If anyone else helped set up their server:
1. Remove helper's SSH key from `~/.ssh/authorized_keys`
2. Change root password (have the user type it, do not see it)
3. Verify the helper is locked out

"Your server, your GitHub, your Telegram, your data. Nobody else can access any of it."

---

## PHASE 3: Verify and Close

Run through the checklist:

| Check | How to Verify |
|-------|--------------|
| Athena knows who you are | "Tell me about myself" — should reference profile |
| GitHub is private | Visit repo URL, confirm "Private" badge |
| Telegram bot responds (if set up) | Send a message from phone |
| Voice messages work (if set up) | Send a voice note |
| Mac sync running (if set up) | Make a change, wait 2 min, check server |
| Morning briefing scheduled (if server set up) | Check crontab on server |

Close with confidence:
"You are set up. Athena knows who you are, what you are working on, and how you like to communicate. [If migrated: Everything from your old setup carried over.] Your data is private. Say 'plan my day' tomorrow morning and see what happens."

---

## If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Cannot find old assistant folder | Search Desktop, Documents, home dir. `ls ~/Desktop/*/personal/me.md` |
| Old assistant was never set up (empty files) | Skip import, run `/onboard` instead. |
| ChatGPT export is too large to read | Read the most recent 50 conversations. Extract themes, not details. |
| Telegram bot not responding | `pm2 logs athena-bot --lines 30`. Check token, check Claude auth. |
| Git push fails | Check remote URL. May need personal access token for HTTPS. |
| Claude not authed on server | Run `claude` on server, follow browser auth. |

---

## Tone

Be confident. This is an upgrade, not a risk. Their data comes with them. The whole point is that switching is painless.

If they seem nervous: "I have done this before. Your data moves over, nothing gets lost, and the new system is strictly better. If anything goes wrong, your old setup is still sitting right where you left it."

Do not rush. If they want to pause, save progress to `personal/.migrate-state.json` and pick up later.
