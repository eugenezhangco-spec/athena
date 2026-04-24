import { join } from 'path'
import { readEnvFile, PROJECT_ROOT } from './env.js'

const env = readEnvFile()

// -- Required -----------------------------------------------------------------

export const TELEGRAM_BOT_TOKEN = env['TELEGRAM_BOT_TOKEN'] ?? ''
export const ALLOWED_CHAT_ID = env['ALLOWED_CHAT_ID'] ?? ''
export const ATHENA_DIR = env['ATHENA_DIR'] ?? PROJECT_ROOT

// -- Identity -----------------------------------------------------------------

export const USER_NAME = env['USER_NAME'] ?? 'User'
export const ASSISTANT_NAME = env['ASSISTANT_NAME'] ?? 'Athena'

// -- Voice: STT ---------------------------------------------------------------

export const GROQ_API_KEY = env['GROQ_API_KEY'] ?? ''
export const OPENAI_API_KEY = env['OPENAI_API_KEY'] ?? ''

// -- Voice: TTS ---------------------------------------------------------------

export const ELEVENLABS_API_KEY = env['ELEVENLABS_API_KEY'] ?? ''
export const ELEVENLABS_VOICE_ID = env['ELEVENLABS_VOICE_ID'] ?? ''

// -- Video --------------------------------------------------------------------

export const GOOGLE_API_KEY = env['GOOGLE_API_KEY'] ?? ''

// -- WhatsApp -----------------------------------------------------------------

export const WHATSAPP_ENABLED = env['WHATSAPP_ENABLED'] === 'true'

// -- Multi-user ---------------------------------------------------------------

export const ADDITIONAL_CHAT_IDS = (env['ADDITIONAL_CHAT_IDS'] ?? '')
  .split(',')
  .map(id => id.trim())
  .filter(Boolean)

// -- Paths --------------------------------------------------------------------

export const STORE_DIR = join(PROJECT_ROOT, 'store')
export const UPLOADS_DIR = join(PROJECT_ROOT, 'workspace', 'uploads')

// -- Constants ----------------------------------------------------------------

export const MAX_MESSAGE_LENGTH = 4096
export const TYPING_REFRESH_MS = 4000
export const MAX_CONCURRENT = 2
export const REMINDER_CHECK_MS = 30 * 1000

// -- Feature flags (derived from config presence) -----------------------------

export const HAS_STT = Boolean(GROQ_API_KEY || OPENAI_API_KEY)
export const HAS_TTS = Boolean(ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID)
export const HAS_VIDEO = Boolean(GOOGLE_API_KEY)

export { PROJECT_ROOT }
