require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const Groq = require('groq-sdk');
const { spawn } = require('child_process');
const { createWriteStream, readFileSync, writeFileSync, unlink, mkdirSync, existsSync } = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');

const IMAGES_DIR = path.join(__dirname, 'images');
mkdirSync(IMAGES_DIR, { recursive: true });

// -- Config ------------------------------------------------------------------

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USER_ID = parseInt(process.env.TELEGRAM_USER_ID, 10);
const ATHENA_DIR = process.env.ATHENA_DIR || path.resolve(__dirname, '..');
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const IS_WIN = process.platform === 'win32';
const CLAUDE_CMD = IS_WIN ? 'claude.cmd' : 'claude';

const USER_NAME = process.env.USER_NAME || 'User';
const ASSISTANT_NAME = process.env.ASSISTANT_NAME || 'Assistant';

const MAX_HISTORY = 50;
const SESSION_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 hours inactivity = reset
const MAX_CONCURRENT = 2;
const RETRY_DELAY_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 60 * 60 * 1000;
const REMINDER_CHECK_MS = 30 * 1000; // check reminders every 30 seconds
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const REMINDERS_FILE = path.join(__dirname, 'reminders.json');
const TELEGRAM_CONTEXT_FILE = path.join(ATHENA_DIR, '.claude', 'telegram-context.md');

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');
if (!ALLOWED_USER_ID) throw new Error('TELEGRAM_USER_ID is not set in .env');

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// -- Telegram prefix (read from file, no more drift) ------------------------

function loadTelegramPrefix() {
  try {
    return readFileSync(TELEGRAM_CONTEXT_FILE, 'utf8');
  } catch {
    console.error('Could not read telegram-context.md, using fallback prefix');
    return `You are ${ASSISTANT_NAME}, responding via Telegram. Keep replies short (3-5 lines). No markdown. Lead with the answer.`;
  }
}

// -- Concurrency limiter with queue ----------------------------------------

let activeClaude = 0;
const messageQueue = [];

async function withClaudeLimit(fn) {
  if (activeClaude >= MAX_CONCURRENT) {
    // Queue the request instead of rejecting
    return new Promise((resolve, reject) => {
      messageQueue.push({ fn, resolve, reject });
    });
  }
  return runWithLimit(fn);
}

async function runWithLimit(fn) {
  activeClaude++;
  try {
    return await fn();
  } finally {
    activeClaude--;
    // Process next queued message if any
    if (messageQueue.length > 0) {
      const next = messageQueue.shift();
      runWithLimit(next.fn).then(next.resolve).catch(next.reject);
    }
  }
}

// -- Heartbeat ---------------------------------------------------------------

const HEARTBEAT_FILE = path.join(ATHENA_DIR, 'logs', 'heartbeat');
mkdirSync(path.join(ATHENA_DIR, 'logs'), { recursive: true });

function writeHeartbeat() {
  try {
    writeFileSync(HEARTBEAT_FILE, new Date().toISOString());
  } catch (e) {
    console.error('Heartbeat write failed:', e.message);
  }
}

writeHeartbeat();
setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);

// -- Reminders ---------------------------------------------------------------

function loadReminders() {
  try {
    if (existsSync(REMINDERS_FILE)) {
      return JSON.parse(readFileSync(REMINDERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load reminders:', e.message);
  }
  return [];
}

function saveReminders(reminders) {
  try {
    writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
  } catch (e) {
    console.error('Failed to save reminders:', e.message);
  }
}

function checkReminders(bot) {
  const reminders = loadReminders();
  if (reminders.length === 0) return;

  const now = new Date();
  const due = [];
  const remaining = [];

  for (const r of reminders) {
    if (new Date(r.time) <= now) {
      due.push(r);
    } else {
      remaining.push(r);
    }
  }

  if (due.length > 0) {
    saveReminders(remaining);
    for (const r of due) {
      bot.sendMessage(ALLOWED_USER_ID, `Reminder: ${r.message}`)
        .catch(err => console.error('Failed to send reminder:', err.message));
    }
  }
}

// -- Reminder creation (bot-owned, not delegated to Claude) ------------------

const REMINDER_PATTERNS = [
  // "remind me in X minutes/hours/days to ..."
  /remind\s+me\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)/i,
  // "remind me at HH:MM to ..."
  /remind\s+me\s+at\s+(\d{1,2})[:\.](\d{2})\s*(?:to\s+)?(.+)/i,
  // "remind me tomorrow to ..."
  /remind\s+me\s+tomorrow\s+(?:to\s+)?(.+)/i,
  // "set a reminder for X minutes/hours ..."
  /set\s+(?:a\s+)?reminder\s+(?:for\s+)?(?:in\s+)?(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)/i,
];

function parseReminder(text) {
  // Pattern: "remind me in X [unit] to [message]"
  const relativeMatch = text.match(REMINDER_PATTERNS[0]) || text.match(REMINDER_PATTERNS[3]);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2].toLowerCase();
    const message = relativeMatch[3].trim();

    let ms;
    if (unit.startsWith('min')) ms = amount * 60 * 1000;
    else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000;
    else if (unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000;
    else return null;

    return { time: new Date(Date.now() + ms).toISOString(), message };
  }

  // Pattern: "remind me at HH:MM to [message]"
  const atMatch = text.match(REMINDER_PATTERNS[1]);
  if (atMatch) {
    const hours = parseInt(atMatch[1], 10);
    const minutes = parseInt(atMatch[2], 10);
    const message = atMatch[3].trim();

    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    // If time already passed today, set for tomorrow
    if (target <= new Date()) target.setDate(target.getDate() + 1);

    return { time: target.toISOString(), message };
  }

  // Pattern: "remind me tomorrow to [message]"
  const tomorrowMatch = text.match(REMINDER_PATTERNS[2]);
  if (tomorrowMatch) {
    const message = tomorrowMatch[1].trim();
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(9, 0, 0, 0); // Default to 9am tomorrow

    return { time: target.toISOString(), message };
  }

  return null;
}

function createReminder(reminder) {
  const reminders = loadReminders();
  reminders.push(reminder);
  saveReminders(reminders);

  // Verify the write actually succeeded
  const verified = loadReminders();
  const found = verified.some(r => r.time === reminder.time && r.message === reminder.message);
  return found;
}

function formatReminderTime(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = d - now;
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 60) return `${diffMin} minutes`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''}`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''}`;
}

// -- Session memory (persists to disk) --------------------------------------

const sessions = new Map();

function loadSessions() {
  try {
    if (existsSync(SESSIONS_FILE)) {
      const data = JSON.parse(readFileSync(SESSIONS_FILE, 'utf8'));
      for (const [key, val] of Object.entries(data)) {
        sessions.set(Number(key), val);
      }
      console.log(`Loaded ${sessions.size} sessions from disk.`);
    }
  } catch (e) {
    console.error('Failed to load sessions:', e.message);
  }
}

function saveSessions() {
  try {
    const obj = {};
    for (const [key, val] of sessions) {
      obj[key] = val;
    }
    writeFileSync(SESSIONS_FILE, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save sessions:', e.message);
  }
}

loadSessions();
// Save sessions to disk every 2 minutes
setInterval(saveSessions, 2 * 60 * 1000);

function getSession(chatId) {
  const session = sessions.get(chatId);
  if (!session) return null;

  if (Date.now() - session.lastActive > SESSION_TIMEOUT_MS) {
    sessions.delete(chatId);
    return null;
  }

  return session;
}

function addToSession(chatId, role, content) {
  let session = getSession(chatId);
  if (!session) {
    session = { messages: [], lastActive: Date.now() };
  }

  session.messages.push({ role, content });
  session.lastActive = Date.now();

  if (session.messages.length > MAX_HISTORY) {
    session.messages = session.messages.slice(-MAX_HISTORY);
  }

  sessions.set(chatId, session);
}

// -- Prompt builder ----------------------------------------------------------

function buildPrompt(chatId, newMessage) {
  const prefix = loadTelegramPrefix();
  const session = getSession(chatId);
  if (!session || session.messages.length === 0) return prefix + '\n\n' + newMessage;

  const history = session.messages
    .map(m => `${m.role === 'user' ? USER_NAME : ASSISTANT_NAME}: ${m.content}`)
    .join('\n\n');

  return `${prefix}\n\nPrevious conversation:\n${history}\n\n${USER_NAME}: ${newMessage}`;
}

// -- URL Detection (Research Inbox) ------------------------------------------

const URL_REGEX = /https?:\/\/[^\s]+/i;
const EXCLUDED_DOMAINS = [
  'notion.so', 'google.com', 'google.co', 'github.com', 'anthropic.com',
  'claude.ai', 'localhost', 'clicktime.com', 'linear.app',
  'telegram.org', 'api.telegram.org',
];

function detectSource(url) {
  if (/instagram\.com|instagr\.am/i.test(url)) return 'Instagram';
  if (/twitter\.com|x\.com|t\.co/i.test(url)) return 'Twitter';
  return 'Other';
}

function checkResearchInbox(text) {
  const urlMatch = text.match(URL_REGEX);
  if (!urlMatch) return null;

  const url = urlMatch[0];
  if (EXCLUDED_DOMAINS.some(d => url.includes(d))) return null;

  const source = detectSource(url);
  const note = text.replace(URL_REGEX, '').trim();

  if ((source === 'Instagram' || source === 'Twitter') && note.length < 150) {
    return { url, source, note };
  }

  if (note.length < 50) {
    return { url, source, note };
  }

  return null;
}

function buildResearchInboxPrompt(url, source, note) {
  const today = new Date().toISOString().split('T')[0];

  let extractStep;
  if (source === 'Instagram') {
    extractStep = `This is an Instagram reel. Extract audio and transcribe:
   a) Download audio: yt-dlp -x --audio-format mp3 --no-playlist --cookies ${process.env.INSTAGRAM_COOKIES_PATH || '/tmp/cookies/instagram.txt'} -o "/tmp/ri_audio.%(ext)s" "${url}"
   b) Transcribe: curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" -H "Authorization: Bearer $GROQ_API_KEY" -H "Content-Type: multipart/form-data" -F "file=@/tmp/ri_audio.mp3" -F "model=whisper-large-v3" -F "response_format=json"
   c) Clean up: rm -f /tmp/ri_audio.*
   If yt-dlp fails (cookie file missing or expired), do NOT try to curl Instagram. It will not work. Go straight to the extraction-failed handler.`;
  } else if (source === 'Twitter') {
    extractStep = `This is a Twitter/X post. Fetch the content:
   a) Try: curl -s -L -H "User-Agent: Mozilla/5.0" "${url}" | head -2000
   b) Extract the tweet text from meta tags (og:description or similar).
   If content is blocked, note what you can determine from the URL.`;
  } else {
    extractStep = `This is a web URL. Fetch readable content:
   a) Try: curl -s -L -H "User-Agent: Mozilla/5.0" "${url}" | head -3000
   b) Extract the main text content.`;
  }

  return `RESEARCH INBOX PROCESSING

${USER_NAME} sent a URL. Extract the content, figure out how to implement it to upgrade ${ASSISTANT_NAME} (the Claude Code assistant), and save an implementation brief to Notion. No conversation. Process and confirm.

NOT a bookmark system. Every entry = a playbook to read and act on.

WRITING RULES (apply to ALL Notion content):
- Short sentences. No filler. Every word earns its place.
- Bullet points over paragraphs. Always.
- Bold key terms and tool names inline.
- One idea per bullet. Never stack multiple thoughts in one line.
- No "this video discusses" or "the creator explains." Write as if YOU know the topic.
- Target: scannable in 30 seconds, actionable in 2 minutes.

URL: ${url}
Source: ${source}
${note ? `${USER_NAME}'s note: ${note}` : ''}

STEPS:

1. EXTRACT CONTENT:
   ${extractStep}

   IF EXTRACTION FAILS (login wall, blocked, etc.):
   a) Set Status to "Queued" (not "Ready")
   b) Summary = what failed + "needs manual review"
   c) Do NOT write fake sections from metadata
   d) Telegram: "Could not extract content (login wall). Saved as Queued. Open desktop and say 'process [title]'."
   e) STOP. Do not continue to step 2.

2. TITLE: Under 60 chars. Name the technique or tool, not the creator.

3. TL;DR: One line. What it IS and what it does for ${ASSISTANT_NAME}.

4. WHAT THEY SHOWED: 3-5 bullets. Each bullet = one specific technique, tool, or config. Concrete.

5. FIND RESOURCES: Before writing the implementation section, search for any tools, repos, packages, or links mentioned in the content.
   - Use WebSearch to find GitHub repos, npm packages, official docs, or download pages
   - Search for: "[tool name] github", "[repo name] github", "[creator name] [project name]"
   - Collect all found URLs. These go into the "Resources" section and inline in implementation steps.
   - If a resource cannot be found, note it as "Could not find link. Search for [specific query]."

6. HOW WE USE THIS (main section):
   For each technique, one sub-group with:
   - What it upgrades (name the skill, file, or workflow)
   - Steps to implement (install X, configure Y, add Z to file W)
   - Prompt to use (if applicable, write the actual prompt)
   - Effort: quick (<30 min) | medium (1-2 hrs) | project (needs session)

7. KICKOFF PROMPT: The exact prompt to paste into Claude Code to start. Or: "Needs a working session" + one line why.

8. QUICK TAKE: One line. Now, later, or skip. If now, name the first step.

9. AUTO-TAG with 1-3 from: MCP, Claude Feature, Prompt Engineering, Agentic Workflow, Tool Use, Automation, Coding, AI Strategy

10. DEDUP CHECK: If NOTION_DATASOURCE_ID is configured in .env, query it and filter URL = "${url}". If match: "Already in your Research Inbox: [title]" and stop.

11. SAVE TO NOTION using mcp__notion__API-post-page:
   parent: { database_id: NOTION_DATABASE_ID from .env }
   properties:
     Name: { title: [{ text: { content: "TITLE" } }] }
     Status: { select: { name: "Ready" } }
     Source: { select: { name: "${source}" } }
     Date Saved: { date: { start: "${today}" } }
     Summary: { rich_text: [{ text: { content: "TL;DR one-liner" } }] }
     Topic Tags: { multi_select: [{ name: "TAG" }] }
     URL: { url: "${url}" }

   PAGE BODY (children array) -- use these Notion block types for clean formatting:

   a) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "TL;DR" } }] } }
      + 1 paragraph block with the one-liner

   b) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "What They Showed" } }] } }
      + bulleted_list_item blocks (one per technique, bold the key term)

   c) { "type": "divider", "divider": {} }

   d) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "How We Use This" } }] } }
      For each technique:
      + 1 paragraph with bold technique name as sub-header
      + bulleted_list_item blocks for: what it upgrades, steps, prompt, resources, effort
      + { "type": "divider", "divider": {} } between techniques if more than one

   e) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "Resources" } }] } }
      + bulleted_list_item blocks, one per resource found. Each bullet = bold name + URL as a link.
      + Use link format: { "type": "text", "text": { "content": "link text", "link": { "url": "https://..." } } }
      + If no resources found, one bullet: "No external resources identified."

   f) { "type": "divider", "divider": {} }

   g) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "Kickoff Prompt" } }] } }
      + 1 paragraph block with the prompt text (or "Needs a working session" + reason)

   h) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "Quick Take" } }] } }
      + 1 paragraph block, one line

   i) { "type": "heading_2", "heading_2": { "rich_text": [{ "type": "text", "text": { "content": "Transcript" } }] } }
      + paragraph blocks with raw transcript (reference only)

   To bold text inside rich_text: { "type": "text", "text": { "content": "term" }, "annotations": { "bold": true } }

12. RESPOND (Telegram, no markdown, max 5 lines):
   Saved to Research Inbox: [title]
   Tags: [tags]
   [one-line on what it upgrades and whether to act now]
`;
}

// -- Bot ---------------------------------------------------------------------

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log(`${ASSISTANT_NAME} bot running. Dir: ${ATHENA_DIR}`);

// Start reminder checker
setInterval(() => checkReminders(bot), REMINDER_CHECK_MS);

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text?.trim();

  if (userId !== ALLOWED_USER_ID) return;
  if (!text) return;

  if (text === '/clear') {
    sessions.delete(chatId);
    saveSessions();
    await bot.sendMessage(chatId, 'Session cleared. Fresh start.');
    return;
  }

  if (text === '/health') {
    const reminders = loadReminders();
    await bot.sendMessage(chatId, `Bot alive. Active: ${activeClaude}/${MAX_CONCURRENT}. Queued: ${messageQueue.length}. Reminders: ${reminders.length}. Uptime: ${Math.floor(process.uptime() / 60)} min.`);
    return;
  }

  // -- Reminder interception (bot handles directly, not Claude) --
  const reminder = parseReminder(text);
  if (reminder) {
    const success = createReminder(reminder);
    if (success) {
      const timeStr = formatReminderTime(reminder.time);
      addToSession(chatId, 'user', text);
      addToSession(chatId, 'assistant', `Reminder set: "${reminder.message}" in ${timeStr}.`);
      await bot.sendMessage(chatId, `Reminder set: "${reminder.message}" in ${timeStr}.`);
    } else {
      await bot.sendMessage(chatId, 'Reminder failed to save. Try again.');
      console.error('Reminder write verification failed:', reminder);
    }
    return;
  }

  const researchInbox = checkResearchInbox(text);
  if (researchInbox) {
    addToSession(chatId, 'user', `[Research Inbox] ${researchInbox.url}`);

    bot.sendChatAction(chatId, 'typing');
    const typingInterval = setInterval(() => bot.sendChatAction(chatId, 'typing'), 4000);

    try {
      const prompt = buildResearchInboxPrompt(researchInbox.url, researchInbox.source, researchInbox.note);
      const response = await withClaudeLimit(() => askClaude(prompt));
      clearInterval(typingInterval);
      addToSession(chatId, 'assistant', response);
      for (const chunk of chunkText(response, 4096)) {
        await bot.sendMessage(chatId, chunk);
      }
    } catch (err) {
      clearInterval(typingInterval);
      console.error('Research inbox error:', err.message);
      await bot.sendMessage(chatId, `Research inbox failed: ${err.message}`);
    }
    return;
  }

  const prompt = buildPrompt(chatId, text);
  addToSession(chatId, 'user', text);

  bot.sendChatAction(chatId, 'typing');
  const typingInterval = setInterval(() => bot.sendChatAction(chatId, 'typing'), 4000);

  try {
    const response = await withClaudeLimit(() => askClaude(prompt));
    clearInterval(typingInterval);

    addToSession(chatId, 'assistant', response);

    for (const chunk of chunkText(response, 4096)) {
      await bot.sendMessage(chatId, chunk);
    }
  } catch (err) {
    clearInterval(typingInterval);
    console.error('Claude error:', err.message);
    await bot.sendMessage(chatId, `Something went wrong:\n${err.message}`);
  }
});

bot.on('voice', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== ALLOWED_USER_ID) return;

  if (!groq) {
    await bot.sendMessage(chatId, 'Voice not set up. GROQ_API_KEY missing.');
    return;
  }

  bot.sendChatAction(chatId, 'typing');
  const typingInterval = setInterval(() => bot.sendChatAction(chatId, 'typing'), 4000);

  try {
    const fileId = msg.voice.file_id;
    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    const tmpPath = path.join(os.tmpdir(), `voice_${Date.now()}.ogg`);
    await downloadFile(fileUrl, tmpPath);

    const { createReadStream } = require('fs');
    const transcription = await groq.audio.transcriptions.create({
      file: createReadStream(tmpPath),
      model: 'whisper-large-v3',
      response_format: 'json',
    });

    unlink(tmpPath, () => {});

    const text = transcription.text?.trim();
    if (!text) {
      clearInterval(typingInterval);
      await bot.sendMessage(chatId, "Couldn't catch that. Try again?");
      return;
    }

    const prompt = buildPrompt(chatId, text);
    addToSession(chatId, 'user', text);

    const response = await withClaudeLimit(() => askClaude(prompt));
    clearInterval(typingInterval);

    addToSession(chatId, 'assistant', response);

    for (const chunk of chunkText(response, 4096)) {
      await bot.sendMessage(chatId, chunk);
    }
  } catch (err) {
    clearInterval(typingInterval);
    console.error('Voice error:', err.message);
    await bot.sendMessage(chatId, `Voice failed: ${err.message}`);
  }
});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== ALLOWED_USER_ID) return;

  const caption = msg.caption?.trim() || '';

  bot.sendChatAction(chatId, 'typing');
  const typingInterval = setInterval(() => bot.sendChatAction(chatId, 'typing'), 4000);

  try {
    const photo = msg.photo[msg.photo.length - 1];
    const fileInfo = await bot.getFile(photo.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    const ext = path.extname(fileInfo.file_path) || '.jpg';
    const localFilename = `photo_${Date.now()}${ext}`;
    const localPath = path.join(IMAGES_DIR, localFilename);

    await downloadFile(fileUrl, localPath);

    const imageInstruction = caption
      ? `${USER_NAME} sent a photo with this caption: "${caption}"\n\nThe image is saved at: ${localPath}\nRead the image file and respond based on what you see and the caption.`
      : `${USER_NAME} sent a photo.\n\nThe image is saved at: ${localPath}\nRead the image file and respond based on what you see.`;

    const prompt = buildPrompt(chatId, imageInstruction);
    addToSession(chatId, 'user', caption || '[photo]');

    const response = await withClaudeLimit(() => askClaude(prompt));
    clearInterval(typingInterval);

    addToSession(chatId, 'assistant', response);

    for (const chunk of chunkText(response, 4096)) {
      await bot.sendMessage(chatId, chunk);
    }

    unlink(localPath, () => {});
  } catch (err) {
    clearInterval(typingInterval);
    console.error('Photo error:', err.message);
    await bot.sendMessage(chatId, `Photo processing failed: ${err.message}`);
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (userId !== ALLOWED_USER_ID) return;

  const caption = msg.caption?.trim() || '';
  const fileName = msg.document.file_name || 'document';

  bot.sendChatAction(chatId, 'typing');
  const typingInterval = setInterval(() => bot.sendChatAction(chatId, 'typing'), 4000);

  try {
    const fileInfo = await bot.getFile(msg.document.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileInfo.file_path}`;

    const localPath = path.join(os.tmpdir(), `doc_${Date.now()}_${fileName}`);
    await downloadFile(fileUrl, localPath);

    const docInstruction = caption
      ? `${USER_NAME} sent a document: "${fileName}" with caption: "${caption}"\n\nThe file is saved at: ${localPath}\nRead the file and respond based on the content and caption.`
      : `${USER_NAME} sent a document: "${fileName}"\n\nThe file is saved at: ${localPath}\nRead the file and respond based on the content.`;

    const prompt = buildPrompt(chatId, docInstruction);
    addToSession(chatId, 'user', caption || `[document: ${fileName}]`);

    const response = await withClaudeLimit(() => askClaude(prompt));
    clearInterval(typingInterval);

    addToSession(chatId, 'assistant', response);

    for (const chunk of chunkText(response, 4096)) {
      await bot.sendMessage(chatId, chunk);
    }

    unlink(localPath, () => {});
  } catch (err) {
    clearInterval(typingInterval);
    console.error('Document error:', err.message);
    await bot.sendMessage(chatId, `Document processing failed: ${err.message}`);
  }
});

bot.on('polling_error', (err) => {
  console.error('Telegram polling error:', err.message);
});

// -- Graceful shutdown -------------------------------------------------------

function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  saveSessions();
  bot.stopPolling();
  const deadline = Date.now() + 30000;
  const check = setInterval(() => {
    if (activeClaude === 0 || Date.now() > deadline) {
      clearInterval(check);
      console.log(`${ASSISTANT_NAME} bot stopped.`);
      process.exit(0);
    }
  }, 500);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// -- Claude ------------------------------------------------------------------

function askClaude(prompt, retries = 1) {
  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_CMD, [
      '--print',
      '--dangerously-skip-permissions',
      '--output-format', 'json',
      '--no-session-persistence',
    ], {
      cwd: ATHENA_DIR,
      shell: IS_WIN,
      env: { ...process.env, CLAUDECODE: undefined },
    });

    proc.stdin.write(prompt);
    proc.stdin.end();

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        const errMsg = stderr.trim() || `claude exited with code ${code}`;

        if (retries > 0 && !errMsg.includes('auth')) {
          console.log(`Claude failed (${errMsg}). Retrying in ${RETRY_DELAY_MS / 1000}s...`);
          setTimeout(() => {
            askClaude(prompt, retries - 1).then(resolve).catch(reject);
          }, RETRY_DELAY_MS);
          return;
        }

        return reject(new Error(errMsg));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed.result || stdout.trim());
      } catch {
        resolve(stdout.trim());
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start claude: ${err.message}`));
    });
  });
}

// -- Helpers -----------------------------------------------------------------

function chunkText(text, maxLen) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    let splitAt = remaining.lastIndexOf('\n\n', maxLen);
    if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf('. ', maxLen);
    if (splitAt < maxLen * 0.3) splitAt = remaining.lastIndexOf(' ', maxLen);
    if (splitAt < maxLen * 0.3) splitAt = maxLen;

    chunks.push(remaining.slice(0, splitAt + 1).trimEnd());
    remaining = remaining.slice(splitAt + 1).trimStart();
  }

  if (remaining.length > 0) chunks.push(remaining);
  return chunks;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      unlink(dest, () => {});
      reject(err);
    });
  });
}
