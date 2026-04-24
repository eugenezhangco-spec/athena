/**
 * WhatsApp Bridge — Puppeteer-based via whatsapp-web.js
 *
 * Runs as part of the main process (not a separate daemon).
 * Bridges WhatsApp messages to/from Telegram via SQLite queues.
 *
 * Flow:
 *   Incoming WA message → saved to wa_messages → notification sent to Telegram
 *   User sends /wa in Telegram → reads wa_messages → shows recent chats
 *   User replies via Telegram → queued in wa_outbox → daemon sends via WA
 *
 * Requires: WHATSAPP_ENABLED=true in .env
 * First run: scan QR code in terminal to link WhatsApp Web session.
 */

import { WHATSAPP_ENABLED } from './config.js'
import { saveWaMessage, queueWaMessage, getPendingWaMessages, markWaSent, getWaMessages } from './db.js'
import { logger } from './logger.js'

type NotifySender = (text: string) => Promise<void>

// WhatsApp client state
let waClient: WaClient | null = null
let notifySend: NotifySender | null = null
let outboxInterval: ReturnType<typeof setInterval> | undefined

// Minimal interface for whatsapp-web.js Client
// Avoids hard dependency — only imported when WHATSAPP_ENABLED=true
interface WaClient {
  on: (event: string, handler: (...args: unknown[]) => void) => void
  initialize: () => Promise<void>
  sendMessage: (chatId: string, content: string) => Promise<void>
  getChats: () => Promise<Array<{ id: { _serialized: string }; name: string; isGroup: boolean }>>
  destroy: () => Promise<void>
}

interface WaMessage {
  id: { id: string }
  from: string
  body: string
  timestamp: number
  fromMe: boolean
  getContact: () => Promise<{ pushname: string; number: string }>
}

/**
 * Initialize WhatsApp bridge.
 * Dynamically imports whatsapp-web.js to avoid requiring it when disabled.
 */
export async function initWhatsApp(onNotify: NotifySender): Promise<void> {
  if (!WHATSAPP_ENABLED) {
    logger.debug('WhatsApp bridge disabled')
    return
  }

  notifySend = onNotify

  try {
    // Dynamic import — whatsapp-web.js is only needed when enabled
    const { Client, LocalAuth } = await import('whatsapp-web.js' as string) as {
      Client: new (opts: { authStrategy: unknown; puppeteer: { args: string[] } }) => WaClient
      LocalAuth: new () => unknown
    }

    waClient = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    })

    waClient.on('qr', (qr: unknown) => {
      logger.info('WhatsApp QR code received. Scan with your phone:')
      // Try to display QR in terminal
      displayQr(qr as string).catch(() => {
        logger.info({ qr }, 'QR code (paste into a QR viewer)')
      })
    })

    waClient.on('ready', () => {
      logger.info('WhatsApp client ready')
      startOutboxProcessor()
    })

    waClient.on('message', async (msg: unknown) => {
      const waMsg = msg as WaMessage
      if (waMsg.fromMe) return

      try {
        const contact = await waMsg.getContact()
        const sender = contact.pushname || contact.number || waMsg.from

        // Save to DB
        saveWaMessage(waMsg.id.id, waMsg.from, sender, waMsg.body, waMsg.timestamp)

        // Notify on Telegram
        if (notifySend) {
          const preview = waMsg.body.length > 100
            ? waMsg.body.slice(0, 97) + '...'
            : waMsg.body
          await notifySend(`WhatsApp from ${sender}:\n${preview}`)
        }

        logger.debug({ from: sender }, 'WhatsApp message received')
      } catch (err) {
        logger.error({ err }, 'Error processing WhatsApp message')
      }
    })

    waClient.on('disconnected', (reason: unknown) => {
      logger.warn({ reason }, 'WhatsApp disconnected')
    })

    await waClient.initialize()
  } catch (err) {
    logger.error({ err }, 'WhatsApp initialization failed. Is whatsapp-web.js installed?')
    logger.info('Install with: npm install whatsapp-web.js qrcode-terminal')
  }
}

/**
 * Get recent WhatsApp chats for display in Telegram.
 */
export async function getRecentChats(): Promise<Array<{ jid: string; name: string; isGroup: boolean }>> {
  if (!waClient) return []

  try {
    const chats = await waClient.getChats()
    return chats.slice(0, 20).map(c => ({
      jid: c.id._serialized,
      name: c.name,
      isGroup: c.isGroup,
    }))
  } catch (err) {
    logger.error({ err }, 'Failed to get WhatsApp chats')
    return []
  }
}

/**
 * Get recent messages from a specific WhatsApp chat.
 */
export function getChatMessages(chatJid: string, limit = 20): Array<{
  sender: string
  content: string
  timestamp: number
}> {
  return getWaMessages(chatJid, limit)
}

/**
 * Queue a message to be sent via WhatsApp.
 * The outbox processor picks it up and sends it.
 */
export function queueReply(chatJid: string, content: string): void {
  queueWaMessage(chatJid, content)
  logger.debug({ chatJid }, 'WhatsApp reply queued')
}

/**
 * Process outbox — send pending messages via WhatsApp.
 */
async function processOutbox(): Promise<void> {
  if (!waClient) return

  const pending = getPendingWaMessages()
  for (const msg of pending) {
    try {
      await waClient.sendMessage(msg.chat_jid, msg.content)
      markWaSent(msg.id)
      logger.debug({ id: msg.id, chatJid: msg.chat_jid }, 'WhatsApp message sent')
    } catch (err) {
      logger.error({ err, id: msg.id }, 'Failed to send WhatsApp message')
    }
  }
}

function startOutboxProcessor(): void {
  // Process immediately, then every 5 seconds
  processOutbox().catch(err => logger.error({ err }, 'Initial outbox processing failed'))
  outboxInterval = setInterval(() => {
    processOutbox().catch(err => logger.error({ err }, 'Outbox processing failed'))
  }, 5000)
}

/**
 * Display QR code in terminal using qrcode-terminal if available.
 */
async function displayQr(qrData: string): Promise<void> {
  try {
    const qrTerminal = await import('qrcode-terminal' as string) as {
      generate: (data: string, opts: { small: boolean }, cb: (code: string) => void) => void
    }
    qrTerminal.generate(qrData, { small: true }, (code: string) => {
      console.log(code)
    })
  } catch {
    // qrcode-terminal not installed — print raw
    console.log('Scan this QR code with WhatsApp:')
    console.log(qrData)
  }
}

/**
 * Graceful shutdown — destroy client and stop outbox processor.
 */
export async function stopWhatsApp(): Promise<void> {
  if (outboxInterval) {
    clearInterval(outboxInterval)
    outboxInterval = undefined
  }

  if (waClient) {
    try {
      await waClient.destroy()
      logger.info('WhatsApp client destroyed')
    } catch (err) {
      logger.error({ err }, 'Error destroying WhatsApp client')
    }
    waClient = null
  }
}
