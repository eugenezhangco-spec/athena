#!/usr/bin/env tsx

/**
 * Athena Bot — Health Check
 *
 * Checks Node, Claude CLI, bot token, DB, service status.
 * Run: npm run status
 */

import { existsSync, readFileSync, statSync } from 'fs'
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const ok = (label: string, detail = '') => console.log(`  ${GREEN}✓${RESET} ${label}${detail ? `  ${DIM}${detail}${RESET}` : ''}`)
const warn = (label: string, detail = '') => console.log(`  ${YELLOW}⚠${RESET} ${label}${detail ? `  ${DIM}${detail}${RESET}` : ''}`)
const fail = (label: string, detail = '') => console.log(`  ${RED}✗${RESET} ${label}${detail ? `  ${DIM}${detail}${RESET}` : ''}`)

// -- Checks -------------------------------------------------------------------

function checkNode(): void {
  const major = parseInt(process.version.slice(1).split('.')[0], 10)
  if (major >= 20) {
    ok('Node.js', process.version)
  } else {
    fail('Node.js', `${process.version} — need 20+`)
  }
}

function checkClaude(): void {
  try {
    const result = spawnSync('claude', ['--version'], { encoding: 'utf8', timeout: 5000 })
    if (result.status === 0) {
      ok('Claude CLI', result.stdout.trim())
    } else {
      fail('Claude CLI', 'not working')
    }
  } catch {
    fail('Claude CLI', 'not found')
  }
}

async function validateBotToken(token: string): Promise<void> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`)
    if (res.ok) {
      const data = (await res.json()) as { result?: { username?: string } }
      ok('Bot token', `valid — @${data.result?.username ?? 'unknown'}`)
    } else {
      fail('Bot token', `invalid — Telegram returned ${res.status}`)
    }
  } catch (err) {
    warn('Bot token', `configured but could not reach Telegram API`)
  }
}

async function checkEnv(): Promise<Record<string, string>> {
  const envPath = resolve(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) {
    fail('.env file', 'not found — run npm run setup')
    return {}
  }

  const env: Record<string, string> = {}
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }

  // Required keys
  if (env.TELEGRAM_BOT_TOKEN) {
    await validateBotToken(env.TELEGRAM_BOT_TOKEN)
  } else {
    fail('Bot token', 'missing')
  }

  if (env.ALLOWED_CHAT_ID) {
    ok('Chat ID', env.ALLOWED_CHAT_ID)
  } else {
    warn('Chat ID', 'not set — bot will accept all chats (first-run mode)')
  }

  // Optional features
  if (env.GROQ_API_KEY) ok('STT (Groq)', 'configured')
  else if (env.OPENAI_API_KEY) ok('STT (OpenAI)', 'configured')
  else warn('STT', 'not configured')

  if (env.ELEVENLABS_API_KEY && env.ELEVENLABS_VOICE_ID) ok('TTS (ElevenLabs)', 'configured')
  else warn('TTS', 'not configured')

  if (env.GOOGLE_API_KEY) ok('Video (Gemini)', 'configured')
  else warn('Video', 'not configured')

  if (env.WHATSAPP_ENABLED === 'true') ok('WhatsApp', 'enabled')

  return env
}

function checkDatabase(): void {
  const dbPath = resolve(PROJECT_ROOT, 'store', 'athena.db')
  if (!existsSync(dbPath)) {
    warn('Database', 'not created yet (starts on first run)')
    return
  }

  try {
    const stat = statSync(dbPath)
    const sizeMb = (stat.size / 1024 / 1024).toFixed(2)

    const db = new Database(dbPath, { readonly: true })

    const memCount = (db.prepare('SELECT COUNT(*) as c FROM memories').get() as { c: number }).c
    const sessionCount = (db.prepare('SELECT COUNT(*) as c FROM sessions').get() as { c: number }).c
    const taskCount = (db.prepare('SELECT COUNT(*) as c FROM scheduled_tasks').get() as { c: number }).c
    const reminderCount = (db.prepare('SELECT COUNT(*) as c FROM reminders').get() as { c: number }).c

    db.close()

    ok('Database', `${sizeMb} MB`)
    ok('  Memories', String(memCount))
    ok('  Sessions', String(sessionCount))
    ok('  Scheduled tasks', String(taskCount))
    ok('  Reminders', String(reminderCount))
  } catch (err) {
    fail('Database', err instanceof Error ? err.message : 'read error')
  }
}

function checkService(): void {
  const platform = process.platform

  if (platform === 'darwin') {
    const result = spawnSync('launchctl', ['list', 'com.athena.bot'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    if (result.status === 0) {
      ok('Service (launchd)', 'loaded')
    } else {
      warn('Service (launchd)', 'not loaded')
    }
  } else if (platform === 'linux') {
    const result = spawnSync('systemctl', ['--user', 'is-active', 'athena-bot'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    const status = result.stdout.trim()
    if (status === 'active') {
      ok('Service (systemd)', 'active')
    } else {
      warn('Service (systemd)', status || 'not installed')
    }
  }

  // Check PID file
  const pidPath = resolve(PROJECT_ROOT, 'store', 'athena.pid')
  if (existsSync(pidPath)) {
    const pid = parseInt(readFileSync(pidPath, 'utf8').trim(), 10)
    try {
      process.kill(pid, 0)
      ok('Bot process', `running (PID ${pid})`)
    } catch {
      warn('Bot process', `stale PID file (${pid} not running)`)
    }
  } else {
    warn('Bot process', 'not running')
  }
}

function checkBuild(): void {
  const distIndex = resolve(PROJECT_ROOT, 'dist', 'index.js')
  if (existsSync(distIndex)) {
    const stat = statSync(distIndex)
    const age = Math.floor((Date.now() - stat.mtimeMs) / 60000)
    ok('Build', `dist/index.js (${age} min ago)`)
  } else {
    fail('Build', 'dist/index.js not found — run npm run build')
  }
}

// -- Main ---------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\n${BOLD}  ATHENA BOT — Health Check${RESET}\n`)

  console.log(`${BOLD}  System${RESET}`)
  checkNode()
  checkClaude()

  console.log(`\n${BOLD}  Configuration${RESET}`)
  await checkEnv()

  console.log(`\n${BOLD}  Build${RESET}`)
  checkBuild()

  console.log(`\n${BOLD}  Database${RESET}`)
  checkDatabase()

  console.log(`\n${BOLD}  Service${RESET}`)
  checkService()

  console.log('')
}

main()
