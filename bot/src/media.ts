import { mkdirSync, readdirSync, statSync, unlinkSync, createWriteStream } from 'fs'
import { join, extname } from 'path'
import https from 'https'
import { UPLOADS_DIR, TELEGRAM_BOT_TOKEN } from './config.js'
import { logger } from './logger.js'

// Ensure uploads dir exists on import
mkdirSync(UPLOADS_DIR, { recursive: true })

// -- Download media from Telegram ---------------------------------------------

export async function downloadMedia(
  fileId: string,
  originalFilename?: string
): Promise<string> {
  // Step 1: Get file path from Telegram
  const fileInfo = await telegramApiCall<{ result: { file_path: string } }>(
    `getFile?file_id=${fileId}`
  )
  const remotePath = fileInfo.result.file_path

  // Step 2: Download the file
  const ext = extname(remotePath) || extname(originalFilename ?? '') || ''
  const sanitized = (originalFilename ?? 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 100)
  const localName = `${Date.now()}_${sanitized}${ext ? '' : ''}${ext && !sanitized.endsWith(ext) ? ext : ''}`
  const localPath = join(UPLOADS_DIR, localName)

  await downloadFile(
    `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${remotePath}`,
    localPath
  )

  logger.debug({ localPath, fileId }, 'Media downloaded')
  return localPath
}

// -- Build context messages for Claude ----------------------------------------

export function buildPhotoMessage(localPath: string, caption?: string): string {
  const parts = [`[Photo received. File saved at: ${localPath}]`]
  parts.push('Analyze this image and respond to any questions about it.')
  if (caption) parts.push(`Caption: ${caption}`)
  return parts.join('\n')
}

export function buildDocumentMessage(
  localPath: string,
  filename: string,
  caption?: string
): string {
  const parts = [`[Document received: ${filename}. File saved at: ${localPath}]`]
  parts.push('Read and process this document.')
  if (caption) parts.push(`Caption: ${caption}`)
  return parts.join('\n')
}

export function buildVideoMessage(localPath: string, caption?: string): string {
  const parts = [`[Video received. File saved at: ${localPath}]`]
  parts.push(
    'Analyze this video. If you have access to the Gemini API via GOOGLE_API_KEY in .env, use it for video analysis.'
  )
  if (caption) parts.push(`Caption: ${caption}`)
  return parts.join('\n')
}

// -- Cleanup old uploads ------------------------------------------------------

export function cleanupOldUploads(maxAgeMs = 24 * 60 * 60 * 1000): number {
  let cleaned = 0
  const cutoff = Date.now() - maxAgeMs

  try {
    const files = readdirSync(UPLOADS_DIR)
    for (const file of files) {
      const filePath = join(UPLOADS_DIR, file)
      try {
        const stat = statSync(filePath)
        if (stat.mtimeMs < cutoff) {
          unlinkSync(filePath)
          cleaned++
        }
      } catch {
        // Skip files we can't stat
      }
    }
  } catch {
    // Uploads dir may not exist yet
  }

  if (cleaned > 0) {
    logger.info({ cleaned }, 'Old uploads cleaned up')
  }

  return cleaned
}

// -- Helpers ------------------------------------------------------------------

function telegramApiCall<T>(method: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString()) as T
            resolve(json)
          } catch (err) {
            reject(new Error(`Telegram API parse error: ${err}`))
          }
        })
      }
    ).on('error', reject)
  })
}

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath)
    https.get(url, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location
        if (redirectUrl) {
          file.close()
          downloadFile(redirectUrl, destPath).then(resolve).catch(reject)
          return
        }
      }

      res.pipe(file)
      file.on('finish', () => {
        file.close()
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      reject(err)
    })
  })
}
