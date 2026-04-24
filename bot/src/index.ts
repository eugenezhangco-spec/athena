import { writeFileSync, readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { initDatabase, closeDatabase } from './db.js'
import { createBot, createSendFn } from './bot.js'
import { initScheduler, stopScheduler } from './scheduler.js'
import { initWhatsApp, stopWhatsApp } from './whatsapp.js'
import { runDecaySweep } from './memory.js'
import { cleanupOldUploads } from './media.js'
import { TELEGRAM_BOT_TOKEN, STORE_DIR, ASSISTANT_NAME, WHATSAPP_ENABLED } from './config.js'
import { logger } from './logger.js'

// -- PID lock -----------------------------------------------------------------

const PID_FILE = join(STORE_DIR, 'athena.pid')

function acquireLock(): void {
  mkdirSync(STORE_DIR, { recursive: true })

  if (existsSync(PID_FILE)) {
    const oldPid = parseInt(readFileSync(PID_FILE, 'utf8').trim(), 10)
    if (oldPid && !isNaN(oldPid)) {
      try {
        process.kill(oldPid, 0) // check if alive
        logger.warn({ oldPid }, 'Killing stale process')
        process.kill(oldPid, 'SIGTERM')
      } catch {
        // Process not running — stale PID file
      }
    }
  }

  writeFileSync(PID_FILE, String(process.pid))
  logger.debug({ pid: process.pid }, 'PID lock acquired')
}

function releaseLock(): void {
  try {
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE)
    }
  } catch {
    // Best effort
  }
}

// -- Main ---------------------------------------------------------------------

async function main(): Promise<void> {
  // Banner
  console.log(`\n  ${ASSISTANT_NAME.toUpperCase()} — Telegram Bot\n`)

  // Validate required config
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN not set. Add it to bot/.env or run: npm run setup')
    process.exit(1)
  }

  // Acquire PID lock
  acquireLock()

  // Initialize database
  initDatabase()

  // Run startup maintenance
  runDecaySweep()
  cleanupOldUploads()

  // Set up daily memory decay
  const decayInterval = setInterval(runDecaySweep, 24 * 60 * 60 * 1000)

  // Create bot
  const bot = createBot()
  const send = createSendFn(bot)

  // Start scheduler (tasks + reminders)
  initScheduler(send)

  // Start WhatsApp bridge if enabled
  if (WHATSAPP_ENABLED) {
    await initWhatsApp(async (text) => {
      const chatId = (await import('./config.js')).ALLOWED_CHAT_ID
      if (chatId) await send(chatId, text)
    })
  }

  // Graceful shutdown
  let shuttingDown = false

  function shutdown(signal: string): void {
    if (shuttingDown) return
    shuttingDown = true

    logger.info({ signal }, 'Shutting down')

    stopScheduler()
    stopWhatsApp().catch(() => {})
    clearInterval(decayInterval)
    bot.stop()
    closeDatabase()
    releaseLock()

    logger.info('Shutdown complete')
    process.exit(0)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Start polling
  try {
    await bot.start({
      onStart: () => {
        logger.info(`${ASSISTANT_NAME} is running. Waiting for messages.`)
      },
    })
  } catch (err) {
    logger.fatal({ err }, 'Bot failed to start')
    releaseLock()
    process.exit(1)
  }
}

main().catch((err) => {
  logger.fatal({ err }, 'Unhandled error in main')
  releaseLock()
  process.exit(1)
})
