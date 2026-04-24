#!/usr/bin/env tsx

/**
 * Athena Bot — Interactive Setup Wizard
 *
 * Collects config, writes .env, optionally installs as background service.
 * Run: npm run setup
 */

import { createInterface } from 'readline'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { execSync, spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

// -- ANSI colors --------------------------------------------------------------

const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED = '\x1b[31m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const ok = (msg: string) => console.log(`  ${GREEN}✓${RESET} ${msg}`)
const warn = (msg: string) => console.log(`  ${YELLOW}⚠${RESET} ${msg}`)
const fail = (msg: string) => console.log(`  ${RED}✗${RESET} ${msg}`)
const heading = (msg: string) => console.log(`\n${BOLD}${msg}${RESET}\n`)
const dim = (msg: string) => `${DIM}${msg}${RESET}`

// -- Readline helper ----------------------------------------------------------

const rl = createInterface({ input: process.stdin, output: process.stdout })

function ask(question: string, defaultValue = ''): Promise<string> {
  const suffix = defaultValue ? ` ${dim(`[${defaultValue}]`)}` : ''
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultValue)
    })
  })
}

function confirm(question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N'
  return new Promise((resolve) => {
    rl.question(`  ${question} (${hint}): `, (answer) => {
      const a = answer.trim().toLowerCase()
      if (!a) return resolve(defaultYes)
      resolve(a === 'y' || a === 'yes')
    })
  })
}

// -- Requirement checks -------------------------------------------------------

function checkNode(): boolean {
  const version = process.version
  const major = parseInt(version.slice(1).split('.')[0], 10)
  if (major >= 20) {
    ok(`Node.js ${version}`)
    return true
  }
  fail(`Node.js ${version} — need 20+`)
  return false
}

function checkClaude(): boolean {
  try {
    const result = spawnSync('claude', ['--version'], {
      encoding: 'utf8',
      timeout: 5000,
    })
    if (result.status === 0) {
      ok(`Claude CLI: ${result.stdout.trim()}`)
      return true
    }
  } catch {
    // fall through
  }
  fail('Claude CLI not found. Install: https://docs.anthropic.com/en/docs/claude-code')
  return false
}

function checkBuild(): boolean {
  heading('Building project...')
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 30000,
    stdio: 'pipe',
  })

  if (result.status === 0) {
    ok('TypeScript build successful')
    return true
  }

  fail('Build failed:')
  if (result.stderr) console.log(result.stderr)
  return false
}

// -- Config collection --------------------------------------------------------

interface Config {
  TELEGRAM_BOT_TOKEN: string
  ALLOWED_CHAT_ID: string
  ATHENA_DIR: string
  USER_NAME: string
  ASSISTANT_NAME: string
  GROQ_API_KEY: string
  OPENAI_API_KEY: string
  ELEVENLABS_API_KEY: string
  ELEVENLABS_VOICE_ID: string
  GOOGLE_API_KEY: string
  WHATSAPP_ENABLED: string
  ADDITIONAL_CHAT_IDS: string
  LOG_LEVEL: string
}

async function collectConfig(): Promise<Config> {
  const config: Config = {
    TELEGRAM_BOT_TOKEN: '',
    ALLOWED_CHAT_ID: '',
    ATHENA_DIR: '',
    USER_NAME: '',
    ASSISTANT_NAME: 'Athena',
    GROQ_API_KEY: '',
    OPENAI_API_KEY: '',
    ELEVENLABS_API_KEY: '',
    ELEVENLABS_VOICE_ID: '',
    GOOGLE_API_KEY: '',
    WHATSAPP_ENABLED: 'false',
    ADDITIONAL_CHAT_IDS: '',
    LOG_LEVEL: 'info',
  }

  // Load existing .env if present
  const envPath = resolve(PROJECT_ROOT, '.env')
  if (existsSync(envPath)) {
    const existing = readFileSync(envPath, 'utf8')
    for (const line of existing.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim() as keyof Config
      let value = trimmed.slice(eqIndex + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (key in config) {
        config[key] = value
      }
    }
    warn('Found existing .env — pre-filling values. Press Enter to keep current values.')
  }

  // Required
  heading('Required Configuration')

  config.TELEGRAM_BOT_TOKEN = await ask(
    'Telegram bot token (from @BotFather)',
    config.TELEGRAM_BOT_TOKEN
  )

  config.USER_NAME = await ask('Your name', config.USER_NAME)
  config.ASSISTANT_NAME = await ask('Assistant name', config.ASSISTANT_NAME)

  // Detect Athena dir
  const parentDir = resolve(PROJECT_ROOT, '..')
  const defaultAthenaDir = existsSync(resolve(parentDir, 'CLAUDE.md'))
    ? parentDir
    : config.ATHENA_DIR || PROJECT_ROOT

  config.ATHENA_DIR = await ask('Athena project directory', defaultAthenaDir)

  // Voice
  heading('Voice Features')
  console.log('  Speech-to-text lets you send voice messages.')
  console.log('  Text-to-speech lets the bot reply with audio.\n')

  const wantSTT = await confirm('Enable voice transcription (STT)?')
  if (wantSTT) {
    const provider = await ask('STT provider: groq (free) or openai (paid)', 'groq')
    if (provider === 'openai') {
      config.OPENAI_API_KEY = await ask('OpenAI API key', config.OPENAI_API_KEY)
    } else {
      config.GROQ_API_KEY = await ask('Groq API key (console.groq.com)', config.GROQ_API_KEY)
    }
  }

  const wantTTS = await confirm('Enable voice replies (TTS)?', false)
  if (wantTTS) {
    config.ELEVENLABS_API_KEY = await ask('ElevenLabs API key', config.ELEVENLABS_API_KEY)
    config.ELEVENLABS_VOICE_ID = await ask('ElevenLabs Voice ID', config.ELEVENLABS_VOICE_ID)
  }

  // Video
  heading('Video Analysis')
  const wantVideo = await confirm('Enable video analysis (Gemini)?', false)
  if (wantVideo) {
    config.GOOGLE_API_KEY = await ask('Google API key (aistudio.google.com)', config.GOOGLE_API_KEY)
  }

  // WhatsApp
  heading('WhatsApp Bridge')
  const wantWA = await confirm('Enable WhatsApp bridge?', false)
  if (wantWA) {
    config.WHATSAPP_ENABLED = 'true'
  }

  return config
}

// -- Write .env ---------------------------------------------------------------

function writeEnvFile(config: Config): void {
  const lines: string[] = [
    '# Athena Bot — Environment Configuration',
    '# Generated by setup wizard',
    '',
    '# -- Required ------------------------------------------------',
    `TELEGRAM_BOT_TOKEN=${config.TELEGRAM_BOT_TOKEN}`,
    `ALLOWED_CHAT_ID=${config.ALLOWED_CHAT_ID}`,
    `ATHENA_DIR=${config.ATHENA_DIR}`,
    `USER_NAME=${config.USER_NAME}`,
    `ASSISTANT_NAME=${config.ASSISTANT_NAME}`,
    '',
    '# -- Voice: STT ----------------------------------------------',
    `GROQ_API_KEY=${config.GROQ_API_KEY}`,
    `OPENAI_API_KEY=${config.OPENAI_API_KEY}`,
    '',
    '# -- Voice: TTS ----------------------------------------------',
    `ELEVENLABS_API_KEY=${config.ELEVENLABS_API_KEY}`,
    `ELEVENLABS_VOICE_ID=${config.ELEVENLABS_VOICE_ID}`,
    '',
    '# -- Video ---------------------------------------------------',
    `GOOGLE_API_KEY=${config.GOOGLE_API_KEY}`,
    '',
    '# -- WhatsApp ------------------------------------------------',
    `WHATSAPP_ENABLED=${config.WHATSAPP_ENABLED}`,
    '',
    '# -- Multi-user ----------------------------------------------',
    `ADDITIONAL_CHAT_IDS=${config.ADDITIONAL_CHAT_IDS}`,
    '',
    '# -- Logging -------------------------------------------------',
    `LOG_LEVEL=${config.LOG_LEVEL}`,
    '',
  ]

  const envPath = resolve(PROJECT_ROOT, '.env')
  writeFileSync(envPath, lines.join('\n'))
  ok(`Wrote ${envPath}`)
}

// -- Background service installation ------------------------------------------

function installLaunchd(config: Config): void {
  const label = 'com.athena.bot'
  const plistPath = resolve(process.env.HOME ?? '~', 'Library', 'LaunchAgents', `${label}.plist`)
  const logPath = '/tmp/athena-bot.log'

  const nodePath = process.execPath
  const entryPoint = resolve(PROJECT_ROOT, 'dist', 'index.js')

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${entryPoint}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${PROJECT_ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${process.env.PATH}</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ThrottleInterval</key>
  <integer>5</integer>
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
</dict>
</plist>`

  mkdirSync(dirname(plistPath), { recursive: true })
  writeFileSync(plistPath, plist)

  // Unload if already loaded
  try {
    execSync(`launchctl unload "${plistPath}" 2>/dev/null`, { encoding: 'utf8' })
  } catch {
    // Not loaded yet
  }

  execSync(`launchctl load "${plistPath}"`, { encoding: 'utf8' })
  ok(`Installed launchd service: ${label}`)
  ok(`Logs: ${logPath}`)
}

function installSystemd(config: Config): void {
  const serviceName = 'athena-bot'
  const unitDir = resolve(process.env.HOME ?? '~', '.config', 'systemd', 'user')
  const unitPath = resolve(unitDir, `${serviceName}.service`)

  const nodePath = process.execPath
  const entryPoint = resolve(PROJECT_ROOT, 'dist', 'index.js')

  const unit = `[Unit]
Description=Athena Telegram Bot
After=network.target

[Service]
Type=simple
ExecStart=${nodePath} ${entryPoint}
WorkingDirectory=${PROJECT_ROOT}
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
`

  mkdirSync(unitDir, { recursive: true })
  writeFileSync(unitPath, unit)

  execSync(`systemctl --user daemon-reload`, { encoding: 'utf8' })
  execSync(`systemctl --user enable ${serviceName}`, { encoding: 'utf8' })
  execSync(`systemctl --user start ${serviceName}`, { encoding: 'utf8' })

  ok(`Installed systemd user service: ${serviceName}`)
  ok(`Check: systemctl --user status ${serviceName}`)
}

// -- Chat ID detection --------------------------------------------------------

async function getChatId(config: Config): Promise<string> {
  heading('Getting Your Chat ID')
  console.log('  Open Telegram, find your bot, and send: /chatid')
  console.log('  The bot will reply with your chat ID.\n')

  if (config.ALLOWED_CHAT_ID) {
    const keep = await confirm(
      `Current chat ID: ${config.ALLOWED_CHAT_ID}. Keep it?`,
      true
    )
    if (keep) return config.ALLOWED_CHAT_ID
  }

  const chatId = await ask('Paste your chat ID here')
  return chatId
}

// -- Main setup flow ----------------------------------------------------------

async function main(): Promise<void> {
  console.log(`
${BOLD}
   ╔═══════════════════════════════════════╗
   ║         ATHENA BOT SETUP             ║
   ╚═══════════════════════════════════════╝
${RESET}`)

  // Check requirements
  heading('Checking Requirements')
  const nodeOk = checkNode()
  const claudeOk = checkClaude()

  if (!nodeOk) {
    fail('Node.js 20+ required. Aborting.')
    rl.close()
    process.exit(1)
  }

  if (!claudeOk) {
    warn('Claude CLI not found. Bot will not function without it.')
    const proceed = await confirm('Continue anyway?', false)
    if (!proceed) {
      rl.close()
      process.exit(1)
    }
  }

  // Collect config
  heading('Configuration')
  const config = await collectConfig()

  // Build
  const buildOk = checkBuild()
  if (!buildOk) {
    warn('Build failed. You can fix errors and run npm run build manually.')
  }

  // Write .env
  heading('Writing Configuration')
  writeEnvFile(config)

  // Open CLAUDE.md for personalization
  const claudeMdPath = resolve(config.ATHENA_DIR || PROJECT_ROOT, 'CLAUDE.md')
  if (existsSync(claudeMdPath)) {
    heading('Personalize Your Assistant')
    console.log('  CLAUDE.md is the personality and system prompt for your assistant.')
    console.log('  Opening it in your editor so you can fill in the details.\n')

    const editor = process.env.EDITOR || process.env.VISUAL || 'nano'
    const openEditor = await confirm(`Open CLAUDE.md in ${editor}?`)
    if (openEditor) {
      try {
        spawnSync(editor, [claudeMdPath], { stdio: 'inherit' })
        ok('CLAUDE.md updated')
      } catch {
        warn(`Could not open editor. Edit manually: ${claudeMdPath}`)
      }
    }
  }

  // Chat ID
  config.ALLOWED_CHAT_ID = await getChatId(config)
  if (config.ALLOWED_CHAT_ID) {
    writeEnvFile(config) // Re-write with chat ID
  }

  // Background service
  heading('Background Service')
  const wantService = await confirm('Install as background service (starts on boot)?')

  if (wantService) {
    const platform = process.platform
    if (platform === 'darwin') {
      installLaunchd(config)
    } else if (platform === 'linux') {
      installSystemd(config)
    } else {
      warn('Windows detected. Install PM2 globally:')
      console.log('  npm install -g pm2')
      console.log(`  pm2 start ${resolve(PROJECT_ROOT, 'dist', 'index.js')} --name athena-bot`)
      console.log('  pm2 save && pm2 startup')
    }
  }

  // Done
  heading('Setup Complete')
  ok(`${config.ASSISTANT_NAME} is configured.`)
  console.log('')

  if (!wantService) {
    console.log(`  Start manually:`)
    console.log(`    cd ${PROJECT_ROOT}`)
    console.log(`    npm start        ${dim('(production)')}`)
    console.log(`    npm run dev      ${dim('(development, auto-reload)')}`)
  }

  console.log('')
  console.log(`  Other commands:`)
  console.log(`    npm run status   ${dim('health check')}`)
  console.log(`    npm test         ${dim('run tests')}`)
  console.log('')

  rl.close()
}

main().catch((err) => {
  console.error('Setup failed:', err)
  rl.close()
  process.exit(1)
})
