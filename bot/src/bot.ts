import { Bot, InputFile, type Context } from 'grammy'
import { readFileSync } from 'fs'
import { join } from 'path'
import { runAgent } from './agent.js'
import { buildMemoryContext, saveConversationTurn } from './memory.js'
import { downloadMedia, buildPhotoMessage, buildDocumentMessage, buildVideoMessage, cleanupOldUploads } from './media.js'
import { transcribeAudio, synthesizeSpeech, voiceCapabilities } from './voice.js'
import {
  getSession, setSession, clearSession,
  getAllMemories, deleteAllMemories,
  createReminder, getAllReminders,
  getDueTasks, getAllTasks, createTask, deleteTask, pauseTask, resumeTask,
} from './db.js'
import {
  TELEGRAM_BOT_TOKEN, ALLOWED_CHAT_ID, ADDITIONAL_CHAT_IDS,
  ATHENA_DIR, USER_NAME, ASSISTANT_NAME,
  MAX_MESSAGE_LENGTH, TYPING_REFRESH_MS, MAX_CONCURRENT,
  HAS_STT, HAS_TTS, HAS_VIDEO, WHATSAPP_ENABLED,
} from './config.js'
import { getRecentChats, getChatMessages, queueReply } from './whatsapp.js'
import { logger } from './logger.js'

// -- Telegram context prefix --------------------------------------------------

function loadTelegramPrefix(): string {
  try {
    const ctxPath = join(ATHENA_DIR, '.claude', 'telegram-context.md')
    return readFileSync(ctxPath, 'utf8')
  } catch {
    return `You are ${ASSISTANT_NAME}, responding via Telegram. Keep replies short (3-5 lines). No markdown. Lead with the answer.`
  }
}

// -- Formatting: Markdown -> Telegram HTML ------------------------------------

export function formatForTelegram(text: string): string {
  // Step 1: Extract and protect code blocks
  const codeBlocks: string[] = []
  let processed = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length
    const escaped = escapeHtml(code.trimEnd())
    codeBlocks.push(lang ? `<pre><code class="language-${lang}">${escaped}</code></pre>` : `<pre>${escaped}</pre>`)
    return `\x00CODEBLOCK_${idx}\x00`
  })

  // Step 2: Extract and protect inline code
  const inlineCode: string[] = []
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
    const idx = inlineCode.length
    inlineCode.push(`<code>${escapeHtml(code)}</code>`)
    return `\x00INLINE_${idx}\x00`
  })

  // Step 3: Escape HTML in remaining text
  processed = escapeHtml(processed)

  // Step 4: Convert markdown to HTML
  // Headings -> bold
  processed = processed.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>')

  // Bold: **text** or __text__
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  processed = processed.replace(/__(.+?)__/g, '<b>$1</b>')

  // Italic: *text* or _text_ (but not inside words with underscores)
  processed = processed.replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, '<i>$1</i>')
  processed = processed.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, '<i>$1</i>')

  // Strikethrough: ~~text~~
  processed = processed.replace(/~~(.+?)~~/g, '<s>$1</s>')

  // Links: [text](url)
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // Checkboxes
  processed = processed.replace(/^- \[ \]/gm, '\u2610')
  processed = processed.replace(/^- \[x\]/gm, '\u2611')

  // Strip horizontal rules
  processed = processed.replace(/^---+$/gm, '')
  processed = processed.replace(/^\*\*\*+$/gm, '')

  // Step 5: Restore code blocks and inline code
  for (let i = 0; i < codeBlocks.length; i++) {
    processed = processed.replace(`\x00CODEBLOCK_${i}\x00`, codeBlocks[i])
  }
  for (let i = 0; i < inlineCode.length; i++) {
    processed = processed.replace(`\x00INLINE_${i}\x00`, inlineCode[i])
  }

  // Clean up excessive blank lines
  processed = processed.replace(/\n{3,}/g, '\n\n').trim()

  return processed
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// -- Message splitting --------------------------------------------------------

export function splitMessage(text: string, limit = MAX_MESSAGE_LENGTH): string[] {
  if (text.length <= limit) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf('\n\n', limit)
    if (splitAt < limit * 0.3) splitAt = remaining.lastIndexOf('\n', limit)
    if (splitAt < limit * 0.3) splitAt = remaining.lastIndexOf('. ', limit)
    if (splitAt < limit * 0.3) splitAt = remaining.lastIndexOf(' ', limit)
    if (splitAt < limit * 0.3) splitAt = limit

    chunks.push(remaining.slice(0, splitAt + 1).trimEnd())
    remaining = remaining.slice(splitAt + 1).trimStart()
  }

  if (remaining.length > 0) chunks.push(remaining)
  return chunks
}

// -- Auth ---------------------------------------------------------------------

function isAuthorised(chatId: number): boolean {
  const id = String(chatId)
  if (!ALLOWED_CHAT_ID) return true // first-run mode
  if (id === ALLOWED_CHAT_ID) return true
  if (ADDITIONAL_CHAT_IDS.includes(id)) return true
  return false
}

// -- Concurrency limiter with FIFO queue --------------------------------------

let activeClaude = 0
const messageQueue: Array<{
  fn: () => Promise<void>
  resolve: (value: void) => void
  reject: (reason: unknown) => void
}> = []

async function withClaudeLimit(fn: () => Promise<void>): Promise<void> {
  if (activeClaude >= MAX_CONCURRENT) {
    return new Promise((resolve, reject) => {
      messageQueue.push({ fn, resolve, reject })
    })
  }
  return runWithLimit(fn)
}

async function runWithLimit(fn: () => Promise<void>): Promise<void> {
  activeClaude++
  try {
    await fn()
  } finally {
    activeClaude--
    if (messageQueue.length > 0) {
      const next = messageQueue.shift()!
      runWithLimit(next.fn).then(next.resolve).catch(next.reject)
    }
  }
}

export function getQueueStatus(): { active: number; queued: number } {
  return { active: activeClaude, queued: messageQueue.length }
}

// -- Research Inbox -----------------------------------------------------------

const URL_REGEX = /https?:\/\/[^\s]+/i
const EXCLUDED_DOMAINS = [
  'notion.so', 'google.com', 'google.co', 'github.com', 'anthropic.com',
  'claude.ai', 'localhost', 'clicktime.com', 'linear.app',
  'telegram.org', 'api.telegram.org',
]

function detectSource(url: string): string {
  if (/instagram\.com|instagr\.am/i.test(url)) return 'Instagram'
  if (/twitter\.com|x\.com|t\.co/i.test(url)) return 'Twitter'
  return 'Other'
}

interface ResearchInboxMatch {
  url: string
  source: string
  note: string
}

export function checkResearchInbox(text: string): ResearchInboxMatch | null {
  const urlMatch = text.match(URL_REGEX)
  if (!urlMatch) return null

  const url = urlMatch[0]
  if (EXCLUDED_DOMAINS.some(d => url.includes(d))) return null

  const source = detectSource(url)
  const note = text.replace(URL_REGEX, '').trim()

  if ((source === 'Instagram' || source === 'Twitter') && note.length < 150) {
    return { url, source, note }
  }

  if (note.length < 50) {
    return { url, source, note }
  }

  return null
}

function buildResearchInboxPrompt(url: string, source: string, note: string): string {
  const today = new Date().toISOString().split('T')[0]

  let extractStep: string
  if (source === 'Instagram') {
    extractStep = `This is an Instagram reel. Extract audio and transcribe:
   a) Download audio: yt-dlp -x --audio-format mp3 --no-playlist --cookies /tmp/cookies/instagram.txt -o "/tmp/ri_audio.%(ext)s" "${url}"
   b) Transcribe: curl -s -X POST "https://api.groq.com/openai/v1/audio/transcriptions" -H "Authorization: Bearer $GROQ_API_KEY" -H "Content-Type: multipart/form-data" -F "file=@/tmp/ri_audio.mp3" -F "model=whisper-large-v3" -F "response_format=json"
   c) Clean up: rm -f /tmp/ri_audio.*
   If yt-dlp fails (cookie file missing or expired), do NOT try to curl Instagram. It will not work. Go straight to the extraction-failed handler.`
  } else if (source === 'Twitter') {
    extractStep = `This is a Twitter/X post. Fetch the content:
   a) Try: curl -s -L -H "User-Agent: Mozilla/5.0" "${url}" | head -2000
   b) Extract the tweet text from meta tags (og:description or similar).
   If content is blocked, note what you can determine from the URL.`
  } else {
    extractStep = `This is a web URL. Fetch readable content:
   a) Try: curl -s -L -H "User-Agent: Mozilla/5.0" "${url}" | head -3000
   b) Extract the main text content.`
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

10. DEDUP CHECK: If NOTION_DATASOURCE_ID is configured, query it and filter URL = "${url}". If match: "Already in your Research Inbox: [title]" and stop.

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

   a) heading_2: "TL;DR" + 1 paragraph block with the one-liner
   b) heading_2: "What They Showed" + bulleted_list_item blocks (one per technique, bold the key term)
   c) divider
   d) heading_2: "How We Use This" + technique sub-groups with bulleted implementation steps
   e) heading_2: "Resources" + bulleted_list_item blocks with bold name + URL link
   f) divider
   g) heading_2: "Kickoff Prompt" + 1 paragraph block
   h) heading_2: "Quick Take" + 1 paragraph block
   i) heading_2: "Transcript" + paragraph blocks with raw transcript

12. RESPOND (Telegram, no markdown, max 5 lines):
   Saved to Research Inbox: [title]
   Tags: [tags]
   [one-line on what it upgrades and whether to act now]
`
}

// -- Reminder parsing ---------------------------------------------------------

const REMINDER_PATTERNS = [
  // Time-before-message: "remind me in 10 minutes to call X"
  /remind\s+me\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)/i,
  /remind\s+me\s+at\s+(\d{1,2})[:\.](\d{2})\s*(?:to\s+)?(.+)/i,
  /remind\s+me\s+tomorrow\s+(?:to\s+)?(.+)/i,
  /set\s+(?:a\s+)?reminder\s+(?:for\s+)?(?:in\s+)?(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)/i,
  // Message-before-time: "remind me to call X in 10 minutes"
  /remind\s+me\s+to\s+(.+?)\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s*$/i,
  /remind\s+me\s+to\s+(.+?)\s+at\s+(\d{1,2})[:\.](\d{2})\s*$/i,
  /remind\s+me\s+to\s+(.+?)\s+tomorrow\s*$/i,
  /set\s+(?:a\s+)?reminder\s+to\s+(.+?)\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s*$/i,
]

interface ParsedReminder {
  remindAt: number // unix seconds
  message: string
}

export function parseReminder(text: string): ParsedReminder | null {
  // "remind me in X [unit] to [message]"
  const relativeMatch = text.match(REMINDER_PATTERNS[0]) ?? text.match(REMINDER_PATTERNS[3])
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10)
    const unit = relativeMatch[2].toLowerCase()
    const message = relativeMatch[3].trim()

    let ms: number
    if (unit.startsWith('min')) ms = amount * 60 * 1000
    else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000
    else if (unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000
    else return null

    return { remindAt: Math.floor((Date.now() + ms) / 1000), message }
  }

  // "remind me at HH:MM to [message]"
  const atMatch = text.match(REMINDER_PATTERNS[1])
  if (atMatch) {
    const hours = parseInt(atMatch[1], 10)
    const minutes = parseInt(atMatch[2], 10)
    const message = atMatch[3].trim()

    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1)

    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  // "remind me tomorrow to [message]"
  const tomorrowMatch = text.match(REMINDER_PATTERNS[2])
  if (tomorrowMatch) {
    const message = tomorrowMatch[1].trim()
    const target = new Date()
    target.setDate(target.getDate() + 1)
    target.setHours(9, 0, 0, 0)

    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  // "remind me to [message] in X [unit]" or "set a reminder to [message] in X [unit]"
  const reverseRelativeMatch = text.match(REMINDER_PATTERNS[4]) ?? text.match(REMINDER_PATTERNS[7])
  if (reverseRelativeMatch) {
    const message = reverseRelativeMatch[1].trim()
    const amount = parseInt(reverseRelativeMatch[2], 10)
    const unit = reverseRelativeMatch[3].toLowerCase()

    let ms: number
    if (unit.startsWith('min')) ms = amount * 60 * 1000
    else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000
    else if (unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000
    else return null

    return { remindAt: Math.floor((Date.now() + ms) / 1000), message }
  }

  // "remind me to [message] at HH:MM"
  const reverseAtMatch = text.match(REMINDER_PATTERNS[5])
  if (reverseAtMatch) {
    const message = reverseAtMatch[1].trim()
    const hours = parseInt(reverseAtMatch[2], 10)
    const minutes = parseInt(reverseAtMatch[3], 10)

    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1)

    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  // "remind me to [message] tomorrow"
  const reverseTomorrowMatch = text.match(REMINDER_PATTERNS[6])
  if (reverseTomorrowMatch) {
    const message = reverseTomorrowMatch[1].trim()
    const target = new Date()
    target.setDate(target.getDate() + 1)
    target.setHours(9, 0, 0, 0)

    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  return null
}

function formatReminderTime(unixSeconds: number): string {
  const diffMs = unixSeconds * 1000 - Date.now()
  const diffMin = Math.round(diffMs / 60000)

  if (diffMin < 60) return `${diffMin} minutes`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''}`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? 's' : ''}`
}

// -- Claude reminder tag extraction -------------------------------------------

const REMINDER_TAG_REGEX = /<set_reminder\s+minutes="(\d+)">([\s\S]*?)<\/set_reminder>/g

export function extractReminderTags(
  text: string,
  chatId: string
): { cleanedText: string; remindersCreated: number } {
  let remindersCreated = 0
  const cleanedText = text.replace(REMINDER_TAG_REGEX, (_match, minutesStr, message) => {
    const minutes = parseInt(minutesStr, 10)
    const remindAt = Math.floor((Date.now() + minutes * 60 * 1000) / 1000)
    createReminder(chatId, message.trim(), remindAt)
    remindersCreated++
    return ''
  })
  return {
    cleanedText: cleanedText.replace(/\n{3,}/g, '\n\n').trim(),
    remindersCreated,
  }
}

// -- Claude media tag extraction ----------------------------------------------
// Claude emits <send_photo path="..." caption="..?"/> or <send_document .../> tags
// in its reply. handleMessage pulls them out and sends real Telegram media.

const SEND_PHOTO_REGEX = /<send_photo\s+path="([^"]+)"(?:\s+caption="([^"]*)")?\s*\/>/g
const SEND_DOCUMENT_REGEX = /<send_document\s+path="([^"]+)"(?:\s+caption="([^"]*)")?\s*\/>/g

export interface MediaAttachment {
  kind: 'photo' | 'document'
  path: string
  caption?: string
}

export function extractMediaTags(
  text: string
): { cleanedText: string; media: MediaAttachment[] } {
  const media: MediaAttachment[] = []

  let cleaned = text.replace(SEND_PHOTO_REGEX, (_m, path, caption) => {
    media.push({ kind: 'photo', path, caption: caption || undefined })
    return ''
  })
  cleaned = cleaned.replace(SEND_DOCUMENT_REGEX, (_m, path, caption) => {
    media.push({ kind: 'document', path, caption: caption || undefined })
    return ''
  })

  return {
    cleanedText: cleaned.replace(/\n{3,}/g, '\n\n').trim(),
    media,
  }
}

// -- Voice mode toggle (in-memory per chat) -----------------------------------

const voiceEnabledChats = new Set<string>()

// -- Core message handler -----------------------------------------------------

async function handleMessage(
  ctx: Context,
  rawText: string,
  forceVoiceReply = false,
  hasMedia = false
): Promise<void> {
  const chatId = String(ctx.chat!.id)

  // Build memory context (searches local SQLite + MemPalace)
  const memoryContext = await buildMemoryContext(chatId, rawText)

  // Telegram context goes to the system prompt slot (cacheable, stable across messages).
  // Only memory + raw message go into the user turn (fresh content per call).
  const prefix = loadTelegramPrefix()
  const userParts: string[] = []
  if (memoryContext) userParts.push(memoryContext)
  userParts.push(rawText)
  const fullPrompt = userParts.join('\n\n')

  // Get existing session
  const sessionId = getSession(chatId) ?? undefined

  // Start typing indicator
  const sendTyping = () => {
    ctx.api.sendChatAction(ctx.chat!.id, 'typing').catch(() => {})
  }
  sendTyping()
  const typingInterval = setInterval(sendTyping, TYPING_REFRESH_MS)

  try {
    const result = await runAgent(fullPrompt, sessionId, sendTyping, { hasMedia, systemPrompt: prefix })

    clearInterval(typingInterval)

    // Save session
    if (result.sessionId) {
      setSession(chatId, result.sessionId)
    }

    const responseText = result.text ?? 'No response.'

    // Extract reminder tags
    const reminderResult = extractReminderTags(responseText, chatId)
    const remindersCreated = reminderResult.remindersCreated

    // Extract media tags (photos / documents Claude wants Telegram to send)
    const { cleanedText: textAfterMedia, media } = extractMediaTags(reminderResult.cleanedText)

    const hadContent = textAfterMedia.length > 0 || media.length > 0
    const finalText = hadContent
      ? textAfterMedia
      : (remindersCreated > 0 ? 'Reminder set.' : responseText)

    // Save to memory (use cleaned text so memory doesn't leak <send_photo .../>)
    saveConversationTurn(chatId, rawText, finalText || '(media only)')

    // Send media attachments first so any trailing text reads as a caption/follow-up
    for (const item of media) {
      try {
        const file = new InputFile(item.path)
        if (item.kind === 'photo') {
          await ctx.replyWithPhoto(file, item.caption ? { caption: item.caption } : undefined)
        } else {
          await ctx.replyWithDocument(file, item.caption ? { caption: item.caption } : undefined)
        }
      } catch (err) {
        logger.error({ err, path: item.path, kind: item.kind }, 'Failed to send media')
        await ctx.reply(`Could not send ${item.kind} (${item.path}): ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }

    // If there's no text to follow up with, we're done
    if (!finalText) return

    // Voice reply path
    const shouldVoiceReply = forceVoiceReply || voiceEnabledChats.has(chatId)
    if (shouldVoiceReply && HAS_TTS) {
      try {
        const audioBuffer = await synthesizeSpeech(finalText)
        await ctx.replyWithVoice(new InputFile(audioBuffer, 'reply.mp3'))
        return
      } catch (err) {
        logger.error({ err }, 'TTS synthesis failed, falling back to text')
      }
    }

    // Text reply path
    const formatted = formatForTelegram(finalText)
    const chunks = splitMessage(formatted)
    for (const chunk of chunks) {
      await ctx.reply(chunk, { parse_mode: 'HTML' })
    }
  } catch (err) {
    clearInterval(typingInterval)
    logger.error({ err, chatId }, 'handleMessage error')
    await ctx.reply(`Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }
}

// -- Bot factory --------------------------------------------------------------

export function createBot(): Bot {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not set. Run setup or add it to .env')
  }

  const bot = new Bot(TELEGRAM_BOT_TOKEN)

  // -- Auth middleware ---------------------------------------------------------
  bot.use(async (ctx, next) => {
    const chatId = ctx.chat?.id
    if (chatId && !isAuthorised(chatId)) {
      logger.warn({ chatId }, 'Unauthorized access attempt')
      return
    }
    await next()
  })

  // -- Commands ---------------------------------------------------------------

  bot.command('start', async (ctx) => {
    await ctx.reply(
      `${ASSISTANT_NAME} here. Send me anything.\n\nCommands:\n` +
      '/newchat - fresh session\n' +
      '/memory - show recent memories\n' +
      '/voice - toggle voice replies\n' +
      '/health - bot status\n' +
      '/chatid - show your chat ID'
    )
  })

  bot.command('chatid', async (ctx) => {
    await ctx.reply(`Your chat ID: ${ctx.chat.id}`)
  })

  bot.command('newchat', async (ctx) => {
    clearSession(String(ctx.chat.id))
    await ctx.reply('Session cleared. Fresh start.')
  })

  bot.command('forget', async (ctx) => {
    const chatId = String(ctx.chat.id)
    clearSession(chatId)
    const count = deleteAllMemories(chatId)
    await ctx.reply(`Session cleared. ${count} memories wiped. Clean slate.`)
  })

  bot.command('clear', async (ctx) => {
    clearSession(String(ctx.chat.id))
    await ctx.reply('Session cleared. Fresh start.')
  })

  bot.command('memory', async (ctx) => {
    const chatId = String(ctx.chat.id)
    const memories = getAllMemories(chatId)
    if (memories.length === 0) {
      await ctx.reply('No memories stored yet.')
      return
    }

    const lines = memories.slice(0, 15).map((m, i) => {
      const age = Math.floor((Date.now() / 1000 - m.created_at) / 86400)
      return `${i + 1}. [${m.sector}] ${m.content.slice(0, 80)}${m.content.length > 80 ? '...' : ''} (${age}d ago, salience: ${m.salience.toFixed(1)})`
    })

    await ctx.reply(`Memories (${memories.length} total, showing ${lines.length}):\n\n${lines.join('\n')}`)
  })

  bot.command('wipememory', async (ctx) => {
    const chatId = String(ctx.chat.id)
    const count = deleteAllMemories(chatId)
    await ctx.reply(`Deleted ${count} memories.`)
  })

  bot.command('voice', async (ctx) => {
    const chatId = String(ctx.chat.id)
    if (!HAS_TTS) {
      await ctx.reply('Voice replies not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env')
      return
    }

    if (voiceEnabledChats.has(chatId)) {
      voiceEnabledChats.delete(chatId)
      await ctx.reply('Voice replies off.')
    } else {
      voiceEnabledChats.add(chatId)
      await ctx.reply('Voice replies on. Send a message to hear it.')
    }
  })

  bot.command('health', async (ctx) => {
    const { active, queued } = getQueueStatus()
    const { stt, tts } = voiceCapabilities()
    const reminders = getAllReminders(String(ctx.chat.id))
    const uptime = Math.floor(process.uptime() / 60)

    await ctx.reply(
      `Active: ${active}/${MAX_CONCURRENT}. Queued: ${queued}.\n` +
      `Reminders: ${reminders.length}. Uptime: ${uptime} min.\n` +
      `STT: ${stt ? 'on' : 'off'}. TTS: ${tts ? 'on' : 'off'}. Video: ${HAS_VIDEO ? 'on' : 'off'}.`
    )
  })

  bot.command('reminders', async (ctx) => {
    const chatId = String(ctx.chat.id)
    const reminders = getAllReminders(chatId)
    if (reminders.length === 0) {
      await ctx.reply('No upcoming reminders.')
      return
    }

    const lines = reminders.map((r, i) => {
      const when = formatReminderTime(r.remind_at)
      return `${i + 1}. "${r.message}" in ${when}`
    })

    await ctx.reply(`Upcoming reminders:\n\n${lines.join('\n')}`)
  })

  bot.command('schedule', async (ctx) => {
    const text = ctx.message?.text?.replace(/^\/schedule\s*/, '').trim() ?? ''
    if (!text) {
      const tasks = getAllTasks(String(ctx.chat.id))
      if (tasks.length === 0) {
        await ctx.reply('No scheduled tasks. Usage:\n/schedule defaults  (seed morning briefing, debrief nudge, weekly review nudge)\n/schedule create "prompt" "0 9 * * *"\n/schedule pause <id>\n/schedule resume <id>\n/schedule delete <id>')
        return
      }
      const lines = tasks.map(t =>
        `${t.id} [${t.status}] "${t.prompt.slice(0, 40)}${t.prompt.length > 40 ? '...' : ''}" — ${t.schedule}`
      )
      await ctx.reply(`Scheduled tasks:\n\n${lines.join('\n')}`)
      return
    }

    // /schedule defaults — seed the three opt-in recurring jobs
    if (text === 'defaults') {
      const { createDefaultSchedules } = await import('./scheduler.js')
      const { created, skipped } = createDefaultSchedules(String(ctx.chat.id))
      const lines: string[] = []
      if (created.length > 0) {
        lines.push('Created:')
        for (const label of created) lines.push(`- ${label}`)
      }
      if (skipped.length > 0) {
        if (lines.length > 0) lines.push('')
        lines.push('Already present:')
        for (const label of skipped) lines.push(`- ${label}`)
      }
      if (lines.length === 0) lines.push('No changes.')
      lines.push('')
      lines.push('Manage with /schedule pause|resume|delete <id>. See /schedule for the list.')
      await ctx.reply(lines.join('\n'))
      return
    }

    const parts = text.match(/^(create|delete|pause|resume)\s+(.+)/)
    if (!parts) {
      await ctx.reply('Usage: /schedule defaults | create|delete|pause|resume ...')
      return
    }

    const [, action, args] = parts
    const chatId = String(ctx.chat.id)

    if (action === 'create') {
      const createMatch = args.match(/"([^"]+)"\s+"([^"]+)"/)
      if (!createMatch) {
        await ctx.reply('Usage: /schedule create "prompt" "cron expression"')
        return
      }
      const [, prompt, cron] = createMatch
      try {
        const { computeNextRun } = await import('./scheduler.js')
        const nextRun = computeNextRun(cron)
        const id = `task_${Date.now()}`
        createTask(id, chatId, prompt, cron, nextRun)
        await ctx.reply(`Scheduled: ${id}\nCron: ${cron}\nNext run: ${new Date(nextRun * 1000).toLocaleString()}`)
      } catch (err) {
        await ctx.reply(`Invalid cron expression: ${err instanceof Error ? err.message : 'unknown'}`)
      }
      return
    }

    const targetId = args.trim()
    if (action === 'delete') {
      await ctx.reply(deleteTask(targetId) ? `Deleted ${targetId}` : 'Task not found.')
    } else if (action === 'pause') {
      await ctx.reply(pauseTask(targetId) ? `Paused ${targetId}` : 'Task not found.')
    } else if (action === 'resume') {
      await ctx.reply(resumeTask(targetId) ? `Resumed ${targetId}` : 'Task not found.')
    }
  })

  // -- WhatsApp commands ------------------------------------------------------

  bot.command('wa', async (ctx) => {
    if (!WHATSAPP_ENABLED) {
      await ctx.reply('WhatsApp bridge not enabled. Set WHATSAPP_ENABLED=true in .env')
      return
    }

    const args = ctx.match?.trim() ?? ''

    // /wa — list recent chats
    if (!args) {
      const chats = await getRecentChats()
      if (chats.length === 0) {
        await ctx.reply('No WhatsApp chats found. Is WhatsApp connected?')
        return
      }
      const lines = chats.map((c, i) =>
        `${i + 1}. ${c.name}${c.isGroup ? ' (group)' : ''}`
      )
      await ctx.reply(`WhatsApp chats:\n\n${lines.join('\n')}\n\nReply with /wa read <number> or /wa reply <number> <message>`)
      return
    }

    // /wa read <number> — show recent messages from a chat
    const readMatch = args.match(/^read\s+(\d+)$/)
    if (readMatch) {
      const idx = parseInt(readMatch[1], 10) - 1
      const chats = await getRecentChats()
      if (idx < 0 || idx >= chats.length) {
        await ctx.reply('Invalid chat number.')
        return
      }
      const chat = chats[idx]
      const messages = getChatMessages(chat.jid, 10)
      if (messages.length === 0) {
        await ctx.reply(`No messages from ${chat.name}.`)
        return
      }
      const lines = messages.reverse().map(m => {
        const time = new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return `[${time}] ${m.sender}: ${m.content.slice(0, 200)}`
      })
      await ctx.reply(`${chat.name}:\n\n${lines.join('\n')}`)
      return
    }

    // /wa reply <number> <message> — send a reply
    const replyMatch = args.match(/^reply\s+(\d+)\s+(.+)/s)
    if (replyMatch) {
      const idx = parseInt(replyMatch[1], 10) - 1
      const message = replyMatch[2].trim()
      const chats = await getRecentChats()
      if (idx < 0 || idx >= chats.length) {
        await ctx.reply('Invalid chat number.')
        return
      }
      const chat = chats[idx]
      queueReply(chat.jid, message)
      await ctx.reply(`Queued reply to ${chat.name}.`)
      return
    }

    await ctx.reply('Usage:\n/wa — list chats\n/wa read <number> — read messages\n/wa reply <number> <message> — send reply')
  })

  // -- Text messages ----------------------------------------------------------

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim()
    if (!text || text.startsWith('/')) return // commands already handled

    const chatId = String(ctx.chat.id)

    // -- Reminder interception (bot handles directly) --
    const reminder = parseReminder(text)
    if (reminder) {
      createReminder(chatId, reminder.message, reminder.remindAt)
      const timeStr = formatReminderTime(reminder.remindAt)
      await ctx.reply(`Reminder set: "${reminder.message}" in ${timeStr}.`)
      return
    }

    // -- Research inbox interception --
    const researchMatch = checkResearchInbox(text)
    if (researchMatch) {
      await withClaudeLimit(async () => {
        const prompt = buildResearchInboxPrompt(researchMatch.url, researchMatch.source, researchMatch.note)
        await handleMessage(ctx, prompt)
      })
      return
    }

    // -- Regular message --
    await withClaudeLimit(async () => {
      await handleMessage(ctx, text)
    })
  })

  // -- Voice messages ---------------------------------------------------------

  bot.on('message:voice', async (ctx) => {
    if (!HAS_STT) {
      await ctx.reply('Voice not configured. Set GROQ_API_KEY in .env')
      return
    }

    await withClaudeLimit(async () => {
      try {
        const fileId = ctx.message.voice.file_id
        const localPath = await downloadMedia(fileId, 'voice.oga')

        const transcript = await transcribeAudio(localPath)
        if (!transcript.trim()) {
          await ctx.reply("Couldn't catch that. Try again?")
          return
        }

        await handleMessage(ctx, `[Voice transcribed]: ${transcript}`, true)
      } catch (err) {
        logger.error({ err }, 'Voice processing error')
        await ctx.reply(`Voice failed: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    })
  })

  // -- Photo messages ---------------------------------------------------------

  bot.on('message:photo', async (ctx) => {
    await withClaudeLimit(async () => {
      try {
        const photos = ctx.message.photo
        const largest = photos[photos.length - 1]
        const localPath = await downloadMedia(largest.file_id, 'photo.jpg')
        const caption = ctx.message.caption?.trim()
        const prompt = buildPhotoMessage(localPath, caption)

        await handleMessage(ctx, prompt, false, true)
      } catch (err) {
        logger.error({ err }, 'Photo processing error')
        await ctx.reply(`Photo failed: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    })
  })

  // -- Document messages ------------------------------------------------------

  bot.on('message:document', async (ctx) => {
    await withClaudeLimit(async () => {
      try {
        const doc = ctx.message.document
        const localPath = await downloadMedia(doc.file_id, doc.file_name ?? 'document')
        const caption = ctx.message.caption?.trim()
        const prompt = buildDocumentMessage(localPath, doc.file_name ?? 'document', caption)

        await handleMessage(ctx, prompt, false, true)
      } catch (err) {
        logger.error({ err }, 'Document processing error')
        await ctx.reply(`Document failed: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    })
  })

  // -- Video messages ---------------------------------------------------------

  bot.on('message:video', async (ctx) => {
    if (!HAS_VIDEO) {
      await ctx.reply('Video analysis not configured. Set GOOGLE_API_KEY in .env')
      return
    }

    await withClaudeLimit(async () => {
      try {
        const video = ctx.message.video
        const localPath = await downloadMedia(video.file_id, 'video.mp4')
        const caption = ctx.message.caption?.trim()
        const prompt = buildVideoMessage(localPath, caption)

        await handleMessage(ctx, prompt, false, true)
      } catch (err) {
        logger.error({ err }, 'Video processing error')
        await ctx.reply(`Video failed: ${err instanceof Error ? err.message : 'unknown'}`)
      }
    })
  })

  // -- Error handler ----------------------------------------------------------

  bot.catch((err) => {
    logger.error({ err: err.error, ctx: err.ctx?.update?.update_id }, 'Bot error')
  })

  return bot
}

// -- Send function for external use (scheduler, reminders) --------------------

export function createSendFn(bot: Bot): (chatId: string, text: string) => Promise<void> {
  return async (chatId: string, text: string) => {
    const formatted = formatForTelegram(text)
    const chunks = splitMessage(formatted)
    for (const chunk of chunks) {
      try {
        await bot.api.sendMessage(chatId, chunk, { parse_mode: 'HTML' })
      } catch {
        await bot.api.sendMessage(chatId, chunk)
      }
    }
  }
}
