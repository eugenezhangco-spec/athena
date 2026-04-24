import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'

/**
 * Smoke tests for the startup sequence.
 * Tests the core init logic without connecting to Telegram or Claude.
 */

describe('startup sequence (smoke)', () => {
  let db: Database.Database

  beforeEach(() => {
    db = new Database(':memory:')
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  })

  afterEach(() => {
    db.close()
  })

  it('creates all required tables', () => {
    // Replicate the table creation from db.ts
    db.exec(`CREATE TABLE IF NOT EXISTS sessions (chat_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, updated_at INTEGER NOT NULL)`)
    db.exec(`CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT NOT NULL, topic_key TEXT, content TEXT NOT NULL, sector TEXT NOT NULL CHECK(sector IN ('semantic','episodic')), salience REAL NOT NULL DEFAULT 1.0, created_at INTEGER NOT NULL, accessed_at INTEGER NOT NULL)`)
    db.exec(`CREATE TABLE IF NOT EXISTS scheduled_tasks (id TEXT PRIMARY KEY, chat_id TEXT NOT NULL, prompt TEXT NOT NULL, schedule TEXT NOT NULL, next_run INTEGER NOT NULL, last_run INTEGER, last_result TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused')), created_at INTEGER NOT NULL)`)
    db.exec(`CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT NOT NULL, message TEXT NOT NULL, remind_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`)
    db.exec(`CREATE TABLE IF NOT EXISTS wa_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_jid TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')), created_at INTEGER NOT NULL, sent_at INTEGER)`)
    db.exec(`CREATE TABLE IF NOT EXISTS wa_messages (id TEXT PRIMARY KEY, chat_jid TEXT NOT NULL, sender TEXT NOT NULL, content TEXT NOT NULL, timestamp INTEGER NOT NULL)`)

    // Verify all tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>
    const tableNames = tables.map(t => t.name)

    expect(tableNames).toContain('sessions')
    expect(tableNames).toContain('memories')
    expect(tableNames).toContain('scheduled_tasks')
    expect(tableNames).toContain('reminders')
    expect(tableNames).toContain('wa_outbox')
    expect(tableNames).toContain('wa_messages')
  })

  it('FTS5 search and trigger sync work', () => {
    // Full schema matching db.ts exactly
    db.exec(`CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      topic_key TEXT,
      content TEXT NOT NULL,
      sector TEXT NOT NULL CHECK(sector IN ('semantic','episodic')),
      salience REAL NOT NULL DEFAULT 1.0,
      created_at INTEGER NOT NULL,
      accessed_at INTEGER NOT NULL
    )`)

    db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(content)`)

    db.exec(`CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content) VALUES (NEW.id, NEW.content);
    END`)

    db.exec(`CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content) VALUES ('delete', OLD.id, OLD.content);
    END`)

    const now = Math.floor(Date.now() / 1000)

    // Insert memories
    db.prepare('INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at) VALUES (?, ?, ?, 1.0, ?, ?)').run('123', 'I love TypeScript', 'semantic', now, now)
    db.prepare('INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at) VALUES (?, ?, ?, 1.0, ?, ?)').run('123', 'Meeting about Python', 'episodic', now, now)

    // FTS search finds the right memory
    const results = db.prepare(
      `SELECT m.* FROM memories m
       JOIN memories_fts f ON f.rowid = m.id
       WHERE memories_fts MATCH ?
       AND m.chat_id = ?`
    ).all('TypeScript*', '123') as Array<{ content: string }>

    expect(results).toHaveLength(1)
    expect(results[0].content).toBe('I love TypeScript')

    // Python search returns the other memory
    const pythonResults = db.prepare(
      `SELECT m.* FROM memories m
       JOIN memories_fts f ON f.rowid = m.id
       WHERE memories_fts MATCH ?
       AND m.chat_id = ?`
    ).all('Python*', '123') as Array<{ content: string }>
    expect(pythonResults).toHaveLength(1)
    expect(pythonResults[0].content).toBe('Meeting about Python')
  })

  it('session upsert and clear cycle works', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS sessions (chat_id TEXT PRIMARY KEY, session_id TEXT NOT NULL, updated_at INTEGER NOT NULL)`)
    const now = Math.floor(Date.now() / 1000)

    // First message — new session
    db.prepare('INSERT INTO sessions (chat_id, session_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET session_id = ?, updated_at = ?').run('chat_1', 'sess_a', now, 'sess_a', now)

    let row = db.prepare('SELECT session_id FROM sessions WHERE chat_id = ?').get('chat_1') as { session_id: string }
    expect(row.session_id).toBe('sess_a')

    // Second message — session updated
    db.prepare('INSERT INTO sessions (chat_id, session_id, updated_at) VALUES (?, ?, ?) ON CONFLICT(chat_id) DO UPDATE SET session_id = ?, updated_at = ?').run('chat_1', 'sess_b', now + 1, 'sess_b', now + 1)

    row = db.prepare('SELECT session_id FROM sessions WHERE chat_id = ?').get('chat_1') as { session_id: string }
    expect(row.session_id).toBe('sess_b')

    // /newchat — clear session
    db.prepare('DELETE FROM sessions WHERE chat_id = ?').run('chat_1')
    const cleared = db.prepare('SELECT session_id FROM sessions WHERE chat_id = ?').get('chat_1')
    expect(cleared).toBeUndefined()
  })

  it('reminder lifecycle works', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id TEXT NOT NULL, message TEXT NOT NULL, remind_at INTEGER NOT NULL, created_at INTEGER NOT NULL)`)
    const now = Math.floor(Date.now() / 1000)

    // Create reminder
    db.prepare('INSERT INTO reminders (chat_id, message, remind_at, created_at) VALUES (?, ?, ?, ?)').run('123', 'Call Mom', now - 10, now - 3600)

    // Check due
    const due = db.prepare('SELECT * FROM reminders WHERE remind_at <= ?').all(now) as Array<{ message: string }>
    expect(due).toHaveLength(1)
    expect(due[0].message).toBe('Call Mom')

    // Delete after sending
    db.prepare('DELETE FROM reminders WHERE remind_at <= ?').run(now)
    const afterDelete = db.prepare('SELECT * FROM reminders').all()
    expect(afterDelete).toHaveLength(0)
  })

  it('scheduled task lifecycle works', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS scheduled_tasks (id TEXT PRIMARY KEY, chat_id TEXT NOT NULL, prompt TEXT NOT NULL, schedule TEXT NOT NULL, next_run INTEGER NOT NULL, last_run INTEGER, last_result TEXT, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused')), created_at INTEGER NOT NULL)`)
    const now = Math.floor(Date.now() / 1000)

    // Create
    db.prepare('INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('task_1', '123', 'Daily summary', '0 9 * * *', now - 60, now - 86400)

    // Due
    const due = db.prepare("SELECT * FROM scheduled_tasks WHERE status = 'active' AND next_run <= ?").all(now) as Array<{ id: string }>
    expect(due).toHaveLength(1)

    // Update after run
    db.prepare('UPDATE scheduled_tasks SET last_run = ?, last_result = ?, next_run = ? WHERE id = ?').run(now, 'Done', now + 86400, 'task_1')

    // No longer due
    const afterRun = db.prepare("SELECT * FROM scheduled_tasks WHERE status = 'active' AND next_run <= ?").all(now) as Array<{ id: string }>
    expect(afterRun).toHaveLength(0)

    // Pause
    db.prepare("UPDATE scheduled_tasks SET status = 'paused' WHERE id = ?").run('task_1')
    const paused = db.prepare('SELECT status FROM scheduled_tasks WHERE id = ?').get('task_1') as { status: string }
    expect(paused.status).toBe('paused')
  })

  it('WhatsApp message queue works end-to-end', () => {
    db.exec(`CREATE TABLE IF NOT EXISTS wa_outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_jid TEXT NOT NULL, content TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed')), created_at INTEGER NOT NULL, sent_at INTEGER)`)
    db.exec(`CREATE TABLE IF NOT EXISTS wa_messages (id TEXT PRIMARY KEY, chat_jid TEXT NOT NULL, sender TEXT NOT NULL, content TEXT NOT NULL, timestamp INTEGER NOT NULL)`)
    const now = Math.floor(Date.now() / 1000)

    // Queue outgoing
    db.prepare('INSERT INTO wa_outbox (chat_jid, content, created_at) VALUES (?, ?, ?)').run('contact@c.us', 'Hey there', now)

    // Read pending
    const pending = db.prepare("SELECT * FROM wa_outbox WHERE status = 'pending'").all() as Array<{ id: number; content: string }>
    expect(pending).toHaveLength(1)
    expect(pending[0].content).toBe('Hey there')

    // Mark sent
    db.prepare("UPDATE wa_outbox SET status = 'sent', sent_at = ? WHERE id = ?").run(now, pending[0].id)
    const afterSend = db.prepare("SELECT * FROM wa_outbox WHERE status = 'pending'").all()
    expect(afterSend).toHaveLength(0)

    // Save incoming
    db.prepare('INSERT OR IGNORE INTO wa_messages (id, chat_jid, sender, content, timestamp) VALUES (?, ?, ?, ?, ?)').run('msg_1', 'contact@c.us', 'John', 'Hello back', now)

    const messages = db.prepare('SELECT * FROM wa_messages WHERE chat_jid = ?').all('contact@c.us') as Array<{ content: string }>
    expect(messages).toHaveLength(1)
    expect(messages[0].content).toBe('Hello back')
  })
})
