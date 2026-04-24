import {
  insertMemory,
  searchMemories,
  getRecentMemories,
  touchMemory,
  decayMemories,
  type MemoryRow,
} from './db.js'
import { logger } from './logger.js'
import { queueMemPalaceWrite, searchMemPalace, type MemPalaceResult } from './mempalace-bridge.js'

const SEMANTIC_SIGNALS =
  /\b(my|i am|i'm|i prefer|remember|always|never|i like|i hate|i need|i want|i use|my name|i work|i live)\b/i

const MIN_MESSAGE_LENGTH = 20

/**
 * Build memory context to inject before the user's message.
 * Searches both local SQLite (fast) and MemPalace (deep) for relevant memories.
 * Deduplicates and touches accessed memories (reinforces salience).
 */
export async function buildMemoryContext(chatId: string, userMessage: string): Promise<string> {
  const ftsResults = searchMemories(chatId, userMessage, 3)
  const recentResults = getRecentMemories(chatId, 5)

  // Deduplicate by id
  const seen = new Set<number>()
  const combined: MemoryRow[] = []

  for (const row of [...ftsResults, ...recentResults]) {
    if (!seen.has(row.id)) {
      seen.add(row.id)
      combined.push(row)
    }
  }

  // Touch each accessed memory (reinforces salience)
  for (const row of combined) {
    touchMemory(row.id)
  }

  const localLines = combined.map(
    r => `- ${r.content} (${r.sector})`
  )

  // Also search MemPalace for long-term memories (non-blocking, best-effort)
  let palaceLines: string[] = []
  try {
    const palaceResults = await searchMemPalace(userMessage, 3)
    palaceLines = palaceResults.map(
      r => `- ${r.content} (long-term, ${r.source_tag})`
    )
  } catch {
    // MemPalace unavailable — degrade gracefully, local memory still works
  }

  const allLines = [...localLines, ...palaceLines]
  if (allLines.length === 0) return ''

  return `[Memory context]\n${allLines.join('\n')}`
}

/**
 * Save a conversation turn to the memory system.
 * Writes to local SQLite (fast, always) AND queues to MemPalace (deep, best-effort).
 * Source tagging: user messages are tagged 'user_statement', bot responses are 'system_inference'.
 */
export function saveConversationTurn(
  chatId: string,
  userMessage: string,
  assistantMessage: string
): void {
  // Skip very short messages and commands
  if (userMessage.length <= MIN_MESSAGE_LENGTH) return
  if (userMessage.startsWith('/')) return

  const isSemanticUser = SEMANTIC_SIGNALS.test(userMessage)

  // Save user message to local SQLite
  if (isSemanticUser) {
    insertMemory(chatId, userMessage, 'semantic')
    logger.debug({ chatId }, 'Saved semantic memory from user message')

    // Queue semantic user messages to MemPalace (these are the valuable long-term ones)
    queueMemPalaceWrite(userMessage, 'user_statement').catch(() => {
      // Best-effort — don't crash the bot if MemPalace is unavailable
    })
  } else {
    insertMemory(chatId, userMessage, 'episodic')
  }

  // Save assistant response (always episodic — user facts are semantic, bot answers are episodic)
  if (assistantMessage.length > MIN_MESSAGE_LENGTH) {
    insertMemory(chatId, assistantMessage, 'episodic')
  }
}

/**
 * Run the daily decay sweep.
 * Decays all memories older than 24h by 2%.
 * Deletes memories with salience below 0.1.
 * Note: MemPalace memories do NOT decay — only local SQLite memories do.
 * MemPalace is the permanent record; SQLite is the fast cache.
 */
export function runDecaySweep(): void {
  const { decayed, deleted } = decayMemories()
  if (decayed > 0 || deleted > 0) {
    logger.info({ decayed, deleted }, 'Memory decay sweep complete')
  }
}
