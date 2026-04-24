import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { mkdirSync, rmSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEST_STORE = resolve(__dirname, '..', 'store-test')

// We test db functions by setting up a temporary store directory.
// The db module reads STORE_DIR from config, so we test the SQL logic directly.

describe('database schema and queries', () => {
  let db: Database.Database

  beforeEach(() => {
    mkdirSync(TEST_STORE, { recursive: true })
    db = new Database(':memory:')
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // Create all tables matching src/db.ts
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        chat_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

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
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        message TEXT NOT NULL,
        remind_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `)
  })

  afterEach(() => {
    db.close()
    if (existsSync(TEST_STORE)) rmSync(TEST_STORE, { recursive: true })
  })

  // -- Sessions ---------------------------------------------------------------

  describe('sessions', () => {
    it('inserts and retrieves a session', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO sessions (chat_id, session_id, updated_at) VALUES (?, ?, ?)').run('123', 'sess_abc', now)

      const row = db.prepare('SELECT session_id FROM sessions WHERE chat_id = ?').get('123') as { session_id: string }
      expect(row.session_id).toBe('sess_abc')
    })

    it('upserts a session', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare(`
        INSERT INTO sessions (chat_id, session_id, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET session_id = ?, updated_at = ?
      `).run('123', 'sess_1', now, 'sess_1', now)

      db.prepare(`
        INSERT INTO sessions (chat_id, session_id, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET session_id = ?, updated_at = ?
      `).run('123', 'sess_2', now + 1, 'sess_2', now + 1)

      const row = db.prepare('SELECT session_id FROM sessions WHERE chat_id = ?').get('123') as { session_id: string }
      expect(row.session_id).toBe('sess_2')
    })

    it('clears a session', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO sessions (chat_id, session_id, updated_at) VALUES (?, ?, ?)').run('123', 'sess_abc', now)
      db.prepare('DELETE FROM sessions WHERE chat_id = ?').run('123')

      const row = db.prepare('SELECT session_id FROM sessions WHERE chat_id = ?').get('123')
      expect(row).toBeUndefined()
    })
  })

  // -- Memories ---------------------------------------------------------------

  describe('memories', () => {
    it('inserts and retrieves memories', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare(`
        INSERT INTO memories (chat_id, topic_key, content, sector, salience, created_at, accessed_at)
        VALUES (?, ?, ?, ?, 1.0, ?, ?)
      `).run('123', null, 'I like coffee', 'semantic', now, now)

      const rows = db.prepare('SELECT * FROM memories WHERE chat_id = ?').all('123')
      expect(rows).toHaveLength(1)
      expect((rows[0] as { content: string }).content).toBe('I like coffee')
    })

    it('enforces sector constraint', () => {
      const now = Math.floor(Date.now() / 1000)
      expect(() => {
        db.prepare(`
          INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at)
          VALUES (?, ?, ?, 1.0, ?, ?)
        `).run('123', 'test', 'invalid_sector', now, now)
      }).toThrow()
    })

    it('touches memory (updates accessed_at and salience)', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare(`
        INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at)
        VALUES (?, ?, ?, 1.0, ?, ?)
      `).run('123', 'test memory', 'episodic', now, now)

      const row = db.prepare('SELECT id FROM memories WHERE chat_id = ?').get('123') as { id: number }

      db.prepare('UPDATE memories SET accessed_at = ?, salience = MIN(salience + 0.1, 5.0) WHERE id = ?')
        .run(now + 100, row.id)

      const updated = db.prepare('SELECT salience, accessed_at FROM memories WHERE id = ?').get(row.id) as { salience: number; accessed_at: number }
      expect(updated.salience).toBeCloseTo(1.1)
      expect(updated.accessed_at).toBe(now + 100)
    })

    it('decays old memories', () => {
      const old = Math.floor(Date.now() / 1000) - 100000
      db.prepare(`
        INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at)
        VALUES (?, ?, ?, 0.05, ?, ?)
      `).run('123', 'will be deleted', 'episodic', old, old)

      db.prepare(`
        INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at)
        VALUES (?, ?, ?, 1.0, ?, ?)
      `).run('123', 'will survive', 'semantic', old, old)

      // Run decay
      const oneDayAgo = Math.floor(Date.now() / 1000) - 86400
      db.prepare('UPDATE memories SET salience = salience * 0.98 WHERE created_at < ?').run(oneDayAgo)
      db.prepare('DELETE FROM memories WHERE salience < 0.1').run()

      const remaining = db.prepare('SELECT * FROM memories WHERE chat_id = ?').all('123')
      expect(remaining).toHaveLength(1)
      expect((remaining[0] as { content: string }).content).toBe('will survive')
    })

    it('deletes all memories for a chat', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at) VALUES (?, ?, ?, 1.0, ?, ?)').run('123', 'a', 'semantic', now, now)
      db.prepare('INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at) VALUES (?, ?, ?, 1.0, ?, ?)').run('123', 'b', 'episodic', now, now)
      db.prepare('INSERT INTO memories (chat_id, content, sector, salience, created_at, accessed_at) VALUES (?, ?, ?, 1.0, ?, ?)').run('456', 'c', 'semantic', now, now)

      const result = db.prepare('DELETE FROM memories WHERE chat_id = ?').run('123')
      expect(result.changes).toBe(2)

      const remaining = db.prepare('SELECT * FROM memories').all()
      expect(remaining).toHaveLength(1)
    })
  })

  // -- Scheduled Tasks --------------------------------------------------------

  describe('scheduled tasks', () => {
    it('creates and retrieves tasks', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare(`
        INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('task_1', '123', 'Daily briefing', '0 9 * * *', now + 3600, now)

      const tasks = db.prepare('SELECT * FROM scheduled_tasks WHERE chat_id = ?').all('123')
      expect(tasks).toHaveLength(1)
      expect((tasks[0] as { prompt: string }).prompt).toBe('Daily briefing')
    })

    it('gets due tasks', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('task_due', '123', 'due', '* * * * *', now - 60, now)
      db.prepare('INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('task_future', '123', 'future', '* * * * *', now + 3600, now)
      db.prepare('INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('task_paused', '123', 'paused', '* * * * *', now - 60, 'paused', now)

      const due = db.prepare("SELECT * FROM scheduled_tasks WHERE status = 'active' AND next_run <= ?").all(now)
      expect(due).toHaveLength(1)
      expect((due[0] as { id: string }).id).toBe('task_due')
    })

    it('pauses and resumes tasks', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('task_1', '123', 'test', '* * * * *', now, now)

      db.prepare("UPDATE scheduled_tasks SET status = 'paused' WHERE id = ?").run('task_1')
      let row = db.prepare('SELECT status FROM scheduled_tasks WHERE id = ?').get('task_1') as { status: string }
      expect(row.status).toBe('paused')

      db.prepare("UPDATE scheduled_tasks SET status = 'active' WHERE id = ?").run('task_1')
      row = db.prepare('SELECT status FROM scheduled_tasks WHERE id = ?').get('task_1') as { status: string }
      expect(row.status).toBe('active')
    })

    it('deletes tasks', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO scheduled_tasks (id, chat_id, prompt, schedule, next_run, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('task_1', '123', 'test', '* * * * *', now, now)

      const result = db.prepare('DELETE FROM scheduled_tasks WHERE id = ?').run('task_1')
      expect(result.changes).toBe(1)
    })
  })

  // -- Reminders --------------------------------------------------------------

  describe('reminders', () => {
    it('creates and retrieves reminders', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO reminders (chat_id, message, remind_at, created_at) VALUES (?, ?, ?, ?)').run('123', 'Call dentist', now + 3600, now)

      const rows = db.prepare('SELECT * FROM reminders WHERE chat_id = ?').all('123')
      expect(rows).toHaveLength(1)
      expect((rows[0] as { message: string }).message).toBe('Call dentist')
    })

    it('gets due reminders', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO reminders (chat_id, message, remind_at, created_at) VALUES (?, ?, ?, ?)').run('123', 'due', now - 60, now)
      db.prepare('INSERT INTO reminders (chat_id, message, remind_at, created_at) VALUES (?, ?, ?, ?)').run('123', 'future', now + 3600, now)

      const due = db.prepare('SELECT * FROM reminders WHERE remind_at <= ?').all(now)
      expect(due).toHaveLength(1)
      expect((due[0] as { message: string }).message).toBe('due')
    })

    it('deletes due reminders', () => {
      const now = Math.floor(Date.now() / 1000)
      db.prepare('INSERT INTO reminders (chat_id, message, remind_at, created_at) VALUES (?, ?, ?, ?)').run('123', 'due', now - 60, now)
      db.prepare('INSERT INTO reminders (chat_id, message, remind_at, created_at) VALUES (?, ?, ?, ?)').run('123', 'future', now + 3600, now)

      db.prepare('DELETE FROM reminders WHERE remind_at <= ?').run(now)

      const remaining = db.prepare('SELECT * FROM reminders').all()
      expect(remaining).toHaveLength(1)
      expect((remaining[0] as { message: string }).message).toBe('future')
    })
  })
})
