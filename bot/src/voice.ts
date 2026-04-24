import { readFileSync, renameSync, existsSync } from 'fs'
import { basename, dirname, join } from 'path'
import https from 'https'
import { GROQ_API_KEY, OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } from './config.js'
import { logger } from './logger.js'

// -- Capability check ---------------------------------------------------------

export function voiceCapabilities(): { stt: boolean; tts: boolean } {
  return {
    stt: Boolean(GROQ_API_KEY || OPENAI_API_KEY),
    tts: Boolean(ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID),
  }
}

// -- Speech-to-Text: Groq Whisper ---------------------------------------------

async function transcribeGroq(filePath: string): Promise<string> {
  // Groq won't accept .oga — rename to .ogg (same format, different extension)
  let actualPath = filePath
  if (filePath.endsWith('.oga')) {
    actualPath = filePath.replace(/\.oga$/, '.ogg')
    renameSync(filePath, actualPath)
  }

  const fileBuffer = readFileSync(actualPath)
  const filename = basename(actualPath)
  const boundary = `----FormBoundary${Date.now()}`

  const bodyParts: Buffer[] = []

  // File field
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: audio/ogg\r\n\r\n`
    )
  )
  bodyParts.push(fileBuffer)
  bodyParts.push(Buffer.from('\r\n'))

  // Model field
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n`
    )
  )

  // Response format
  bodyParts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`
    )
  )

  bodyParts.push(Buffer.from(`--${boundary}--\r\n`))

  const body = Buffer.concat(bodyParts)

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.groq.com',
        path: '/openai/v1/audio/transcriptions',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString()
          try {
            const json = JSON.parse(raw) as { text?: string; error?: { message: string } }
            if (json.error) {
              reject(new Error(`Groq STT error: ${json.error.message}`))
            } else {
              resolve(json.text ?? '')
            }
          } catch {
            reject(new Error(`Groq STT: invalid response — ${raw.slice(0, 200)}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// -- Speech-to-Text: OpenAI Whisper -------------------------------------------

async function transcribeOpenAI(filePath: string): Promise<string> {
  // Dynamic import to avoid requiring openai package when not used
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const OpenAI = (await import('openai' as string)).default as new (opts: { apiKey: string }) => {
    audio: {
      transcriptions: {
        create: (opts: { model: string; file: NodeJS.ReadableStream }) => Promise<{ text: string }>
      }
    }
  }
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

  const { createReadStream } = await import('fs')
  const file = createReadStream(filePath)

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
  })

  return response.text
}

// -- Public STT ---------------------------------------------------------------

export async function transcribeAudio(filePath: string): Promise<string> {
  if (!existsSync(filePath)) {
    throw new Error(`Audio file not found: ${filePath}`)
  }

  if (GROQ_API_KEY) {
    logger.debug('Transcribing via Groq Whisper')
    return transcribeGroq(filePath)
  }

  if (OPENAI_API_KEY) {
    logger.debug('Transcribing via OpenAI Whisper')
    return transcribeOpenAI(filePath)
  }

  throw new Error('No STT provider configured. Set GROQ_API_KEY or OPENAI_API_KEY.')
}

// -- Text-to-Speech: ElevenLabs -----------------------------------------------

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    throw new Error('TTS not configured. Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID.')
  }

  const bodyJson = JSON.stringify({
    text,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.elevenlabs.io',
        path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          const chunks: Buffer[] = []
          res.on('data', (chunk: Buffer) => chunks.push(chunk))
          res.on('end', () => {
            const errBody = Buffer.concat(chunks).toString()
            reject(new Error(`ElevenLabs TTS error (${res.statusCode}): ${errBody.slice(0, 200)}`))
          })
          return
        }

        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      }
    )
    req.on('error', reject)
    req.write(bodyJson)
    req.end()
  })
}
