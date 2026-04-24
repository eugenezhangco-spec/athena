import Database from 'better-sqlite3'
import { mkdirSync } from 'fs'
import { join } from 'path'
import { STORE_DIR } from './config.js'
import { logger } from './logger.js'

let db: Database.Database

// -- Initialization -----------------------------------------------------------

export function initDatabase(): Database.Database {
  mkdirSync(STORE_DIR, { recursive: true })

  const dbPath = join(STORE_DIR, 'athena.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables()

  logger.info({ dbPath }, 'Database initialized')
  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

function createTables(): void {
  // -- Sessions ---------------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      chat_id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  // -- Memories (dual-sector with salience) -----------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      topic_key TEXT,
      content TEXT NOT NULL,
      sector TEXT NOT NULL CHECK(sector IN ('semantic', 'episodic')),
      salience REAL NOT NULL DEFAULT 1.0,
      created_at INTEGER NOT NULL,
      accessed_at INTEGER NOT NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_memories_chat_id
    ON memories(chat_id)
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_memories_sector
    ON memories(chat_id, sector)
  `)

  // -- FTS5 virtual table for memory search -----------------------------------
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts
    USING fts5(content, content_rowid='id')
  `)

  // Triggers to keep FTS in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content) VALUES (NEW.id, NEW.content);
    END
  `)

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content) VALUES ('delete', OLD.id, OLD.content);
    END
  `)

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE OF content ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content) VALUES ('delete', OLD.id, OLD.content);
      INSERT INTO memories_fts(rowid, content) VALUES (NEW.id, NEW.content);
    END
  `)

  // -- Scheduled tasks --------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      schedule TEXT NOT NULL,
      next_run INTEGER NOT NULL,
      last_run INTEGER,
      last_result TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused')),
      created_at INTEGER NOT NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_due
    ON scheduled_tasks(status, next_run)
  `)

  // -- WhatsApp outbox --------------------------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS wa_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_jid TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
      created_at INTEGER NOT NULL,
      sent_at INTEGER
    )
  `)

  // -- WhatsApp messages (incoming cache) -------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS wa_messages (
      id TEXT PRIMARY KEY,
      chat_jid TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wa_messages_chat
    ON wa_messages(chat_jid, timestamp)
  `)

  // -- WhatsApp message map (Telegram msg ID <-> WA msg ID) -------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS wa_message_map (
      telegram_msg_id TEXT NOT NULL,
      wa_msg_id TEXT NOT NULL,
      chat_jid TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (telegram_msg_id, wa_msg_id)
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wa_message_map_wa
    ON wa_message_map(wa_msg_id)
  `)

  // -- Reminders (migrated from JSON) -----------------------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      message TEXT NOT NULL,
      remind_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reminders_due
    ON reminders(remind_at)
  `)
}

// -- Session CRUD -------------------------------------------------------------

export function getSession(chatId: string): string | null {
  const row = getDb()
    .prepare('SELECT session_id FROM sessions WHERE chat_id = ?')
    .get(chatId) as { session_id: string } | undefined
  return row?.session_id ?? null
}

export function setSession(chatId: string, sessionId: string): void {
  getDb()
    .prepare(
      `INSERT INTO sessions (chat_id, session_id, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(chat_id) DO UPDATE SET session_id = ?, updated_at = ?`
    )
    .run(chatId, sessionId, now(), sessionId, now())
}

export function clearSession(chatId: string): void {
  getDb().prepare('DELETE FROM sessions WHERE chat_id = ?').run(chatId)
}

// -- Memory CRUD --------------------------------------------------------------

export interface MemoryRow {
  id: number
  chat_id: string
  topic_key: string | null
  content: string
  sector: 'semantic' | 'episodic'
  salience: number
  created_at: number
  accessed_at: number
}

export function insertMemory(
  chatId: string,
  content: string,
  sector: 'semantic' | 'episodic',
  topicKey?: string
): void {
  const ts = now()
  getDb()
    .prepare(
      `INSERT INTO memories (chat_id, topic_key, content, sector, salience, created_at, accessed_at)
       VALUES (?, ?, ?, ?, 1.0, ?, ?)`
    )
    .run(chatId, topicKey ?? null, content, sector, ts, ts)
}

export function searchMemories(chatId: string, query: string, limit = 3): MemoryRow[] {
  const sanitized = query.replace(/[^\w\s]/g, '').trim()
  if (!sanitized) return []

  const ftsQuery = sanitized
    .split(/\s+/)
    .filter(Boolean)
    .map(w => `${w}*`)
    .join(' ')

  try {
    return getDb()
      .prepare(
        `SELECT m.* FROM memories m
         JOIN memories_fts f ON f.rowid = m.id
         WHERE memories_fts MATCH ? AND m.chat_id = ?
         ORDER BY rank
         LIMIT ?`
      )
      .all(ftsQuery, chatId, limit) as MemoryRow[]
  } catch {
    return []
  }
}

export function getRecentMemories(chatId: string, limit = 5): MemoryRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM memories
       WHERE chat_id = ?
       ORDER BY accessed_at DESC
       LIMIT ?`
    )
    .all(chatId, limit) as MemoryRow[]
}

export function touchMemory(id: number): void {
  getDb()
    .prepare(
      `UPDATE memories
       SET accessed_at = ?, salience = MIN(salience + 0.1, 5.0)
       WHERE id = ?`
    )
    .run(now(), id)
}

export function decayMemories(): { decayed: number; deleted: number } {
  const oneDayAgo = now() - 86400

  const decayResult = getDb()
    .prepare(
      `UPDATE memories SET salience = salience * 0.98
       WHERE created_at < ?`
    )
    .run(oneDayAgo)

  const deleteResult = getDb()
    .prepare('DELETE FROM memories WHERE salience < 0.1')
    .run()

  return {
    decayed: decayResult.changes,
    deleted: deleteResult.changes,
  }
}

export function getAllMemories(chatId: string): MemoryRow[] {
  return getDb()
    .prepare('SELECT * FROM memories WHERE chat_id = ? ORDER BY accessed_at DESC')
    .all(chatId) as MemoryRow[]
}

export function deleteAllMemories(chatId: string): number {
  const result = getDb()
    .prepare('DELETE FROM memories WHERE chat_id = ?')
    .run(chatId)
  return result.changes
}

// -- Scheduled Tasks CRUD -----------------------------------------------------

export interface TaskRow {
  id: string
  chat_id: string
  prompt: string
  schedule: string
  next_run: number
  last_run: number | null
  last_result: string | null
  status: 'active' | 'paused'
  created_at: number
}

export function createTask(
  id: string,
  chatId: string,
  prompt: string,
  schedule: string,
  nextRun: number
): void {
  getDb()
    .prepare(
      `INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, chatId, prompt, schedule, nextRun, now())
}

export function getDueTasks(): TaskRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM scheduled_tasks
       WHERE status = 'active' AND next_run <= ?`
    )
    .all(now()) as TaskRow[]
}

export function updateTaskAfterRun(id: string, nextRun: number, result: string): void {
  getDb()
    .prepare(
      `UPDATE scheduled_tasks
       SET last_run = ?, last_result = ?, next_run = ?
       WHERE id = ?`
    )
    .run(now(), result, nextRun, id)
}

export function getAllTasks(chatId?: string): TaskRow[] {
  if (chatId) {
    return getDb()
      .prepare('SELECT * FROM scheduled_tasks WHERE chat_id = ? ORDER BY next_run')
      .all(chatId) as TaskRow[]
  }
  return getDb()
    .prepare('SELECT * FROM scheduled_tasks ORDER BY next_run')
    .all() as TaskRow[]
}

export function deleteTask(id: string): boolean {
  const result = getDb()
    .prepare('DELETE FROM scheduled_tasks WHERE id = ?')
    .run(id)
  return result.changes > 0
}

export function pauseTask(id: string): boolean {
  const result = getDb()
    .prepare("UPDATE scheduled_tasks SET status = 'paused' WHERE id = ?")
    .run(id)
  return result.changes > 0
}

export function resumeTask(id: string): boolean {
  const result = getDb()
    .prepare("UPDATE scheduled_tasks SET status = 'active' WHERE id = ?")
    .run(id)
  return result.changes > 0
}

// -- Reminders CRUD -----------------------------------------------------------

export interface ReminderRow {
  id: number
  chat_id: string
  message: string
  remind_at: number
  created_at: number
}

export function createReminder(chatId: string, message: string, remindAt: number): void {
  getDb()
    .prepare(
      `INSERT INTO reminders (chat_id, message, remind_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(chatId, message, remindAt, now())
}

export function getDueReminders(): ReminderRow[] {
  return getDb()
    .prepare('SELECT * FROM reminders WHERE remind_at <= ?')
    .all(now()) as ReminderRow[]
}

export function deleteDueReminders(): number {
  const result = getDb()
    .prepare('DELETE FROM reminders WHERE remind_at <= ?')
    .run(now())
  return result.changes
}

export function getAllReminders(chatId: string): ReminderRow[] {
  return getDb()
    .prepare('SELECT * FROM reminders WHERE chat_id = ? ORDER BY remind_at')
    .all(chatId) as ReminderRow[]
}

// -- WhatsApp CRUD ------------------------------------------------------------

export function queueWaMessage(chatJid: string, content: string): void {
  getDb()
    .prepare(
      `INSERT INTO wa_outbox (chat_jid, content, created_at)
       VALUES (?, ?, ?)`
    )
    .run(chatJid, content, now())
}

export function getPendingWaMessages(): Array<{ id: number; chat_jid: string; content: string }> {
  return getDb()
    .prepare("SELECT id, chat_jid, content FROM wa_outbox WHERE status = 'pending' ORDER BY created_at")
    .all() as Array<{ id: number; chat_jid: string; content: string }>
}

export function markWaSent(id: number): void {
  getDb()
    .prepare("UPDATE wa_outbox SET status = 'sent', sent_at = ? WHERE id = ?")
    .run(now(), id)
}

export function saveWaMessage(
  id: string,
  chatJid: string,
  sender: string,
  content: string,
  timestamp: number
): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO wa_messages (id, chat_jid, sender, content, timestamp)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, chatJid, sender, content, timestamp)
}

export function getWaMessages(chatJid: string, limit = 20): Array<{
  sender: string
  content: string
  timestamp: number
}> {
  return getDb()
    .prepare(
      `SELECT sender, content, timestamp FROM wa_messages
       WHERE chat_jid = ?
       ORDER BY timestamp DESC LIMIT ?`
    )
    .all(chatJid, limit) as Array<{ sender: string; content: string; timestamp: number }>
}

// -- WhatsApp Message Map CRUD ------------------------------------------------

export function mapWaMessage(telegramMsgId: string, waMsgId: string, chatJid: string): void {
  getDb()
    .prepare(
      `INSERT OR IGNORE INTO wa_message_map (telegram_msg_id, wa_msg_id, chat_jid, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(telegramMsgId, waMsgId, chatJid, now())
}

export function getWaMsgByTelegramId(telegramMsgId: string): { wa_msg_id: string; chat_jid: string } | undefined {
  return getDb()
    .prepare('SELECT wa_msg_id, chat_jid FROM wa_message_map WHERE telegram_msg_id = ?')
    .get(telegramMsgId) as { wa_msg_id: string; chat_jid: string } | undefined
}

export function getTelegramMsgByWaId(waMsgId: string): { telegram_msg_id: string; chat_jid: string } | undefined {
  return getDb()
    .prepare('SELECT telegram_msg_id, chat_jid FROM wa_message_map WHERE wa_msg_id = ?')
    .get(waMsgId) as { telegram_msg_id: string; chat_jid: string } | undefined
}

// -- Helpers ------------------------------------------------------------------

function now(): number {
  return Math.floor(Date.now() / 1000)
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    logger.info('Database closed')
  }
}
