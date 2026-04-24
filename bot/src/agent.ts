import { query } from '@anthropic-ai/claude-agent-sdk'
import type { SDKMessage, SDKResultMessage } from '@anthropic-ai/claude-agent-sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { ATHENA_DIR } from './config.js'
import { readEnvFile } from './env.js'
import { logger } from './logger.js'
import { routeMessage, type MessageTier, type TierConfig } from './router.js'

function expandEnvVars(value: string, env: Record<string, string>): string {
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, key) => env[key] ?? process.env[key] ?? '')
}

function loadMcpServers(): Record<string, any> | undefined {
  try {
    const raw = readFileSync(join(ATHENA_DIR, '.mcp.json'), 'utf-8')
    const parsed = JSON.parse(raw)
    const servers = parsed.mcpServers
    if (!servers) return undefined

    const botEnv = readEnvFile()
    const expanded: Record<string, any> = {}
    for (const [name, cfg] of Object.entries(servers as Record<string, any>)) {
      const expandedEnv: Record<string, string> = {}
      for (const [k, v] of Object.entries(cfg.env ?? {})) {
        expandedEnv[k] = typeof v === 'string' ? expandEnvVars(v, botEnv) : String(v)
      }
      expanded[name] = { ...cfg, env: expandedEnv }
    }
    return expanded
  } catch (err) {
    logger.warn({ err }, 'Failed to load .mcp.json — MCP servers disabled')
    return undefined
  }
}

export interface AgentResult {
  text: string | null
  sessionId: string | undefined
  costUsd: number
  tier: MessageTier
}

/**
 * Run a message through Claude Code via the Agent SDK.
 * Uses real session resumption — no history replay needed.
 * Model and thinking tokens are selected by the message router.
 */
export async function runAgent(
  message: string,
  sessionId?: string,
  onTyping?: () => void,
  options?: { tierOverride?: TierConfig & { tier: MessageTier }; hasMedia?: boolean; systemPrompt?: string }
): Promise<AgentResult> {
  const route = options?.tierOverride ?? routeMessage(message, options?.hasMedia)
  logger.info({ tier: route.tier, model: route.model, thinkingTokens: route.maxThinkingTokens }, 'Routed message')

  const typingInterval = onTyping
    ? setInterval(onTyping, 4000)
    : undefined

  try {
    const queryOptions: Record<string, unknown> = {
      model: route.model,
      cwd: ATHENA_DIR,
      resume: sessionId,
      settingSources: ['project', 'user'],
      maxThinkingTokens: route.maxThinkingTokens,
      mcpServers: loadMcpServers(),
      allowedTools: [
        'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
        'mcp__mempalace__*',
        'mcp__google-calendar__*',
        'mcp__gmail__*',
        'mcp__notion__*',
        'mcp__playwright__*',
        'mcp__filesystem__*',
        'mcp__computer__*',
      ],
    }

    if (options?.systemPrompt) {
      queryOptions.appendSystemPrompt = options.systemPrompt
    }

    const conversation = query({
      prompt: message,
      options: queryOptions as never,
    })

    let resultText: string | null = null
    let newSessionId: string | undefined
    let costUsd = 0

    for await (const event of conversation) {
      const msg = event as SDKMessage

      if (msg.type === 'system' && msg.subtype === 'init') {
        newSessionId = msg.session_id
        logger.debug({ sessionId: newSessionId }, 'Session initialized')
      }

      if (msg.type === 'result') {
        const result = msg as SDKResultMessage
        if (result.subtype === 'success') {
          resultText = result.result
          newSessionId = result.session_id
          costUsd = result.total_cost_usd
        } else {
          logger.error({ errors: result.errors }, 'Agent execution error')
          resultText = result.errors?.join('\n') ?? 'Something went wrong.'
          newSessionId = result.session_id
          costUsd = result.total_cost_usd
        }
      }
    }

    return { text: resultText, sessionId: newSessionId, costUsd, tier: route.tier }
  } finally {
    if (typingInterval) clearInterval(typingInterval)
  }
}

/**
 * Run a prompt autonomously (no session, no user context).
 * Used by the scheduler for cron tasks like morning briefings.
 * Always routes to standard tier — scheduled tasks need tools and reasoning.
 */
export async function runAutonomousAgent(prompt: string): Promise<string | null> {
  const route = routeMessage(prompt)
  const result = await runAgent(prompt, undefined, undefined, { tierOverride: route })
  return result.text
}
