/**
 * Message router — classifies incoming messages by complexity signals
 * and selects the right model + thinking budget.
 *
 * Design principle: heuristic-based, not pattern-matching. The router
 * reads signals from the message (length, structure, question type,
 * media presence) to infer complexity. It does NOT try to enumerate
 * every possible phrasing.
 *
 * Default is STANDARD (Sonnet). Light only triggers for messages that
 * are clearly trivial. Heavy triggers for messages with depth signals.
 * When in doubt, standard. Better to overspend slightly on a simple
 * message than to underspend on a complex one.
 *
 * Three tiers:
 *   light    → Haiku   (trivial: greetings, acks, one-word replies)
 *   standard → Sonnet  (default: tool use, questions, moderate reasoning)
 *   heavy    → Sonnet  (deep reasoning, long context, coaching, strategy)
 */

export type MessageTier = 'light' | 'standard' | 'heavy'

export interface TierConfig {
  model: string
  maxThinkingTokens: number
}

const TIER_MAP: Record<MessageTier, TierConfig> = {
  light: {
    model: 'claude-haiku-4-5-20251001',
    maxThinkingTokens: 1024,
  },
  standard: {
    model: 'claude-sonnet-4-5-20250929',
    maxThinkingTokens: 8000,
  },
  heavy: {
    model: 'claude-sonnet-4-5-20250929',
    maxThinkingTokens: 16000,
  },
}

/**
 * Classify a user message into a routing tier using complexity signals.
 * Called BEFORE sending to Claude — must be fast (no LLM call).
 *
 * The classifier scores the message on multiple dimensions and picks
 * the tier based on the total signal, not any single pattern.
 */
export function classifyMessage(text: string, hasMedia = false): MessageTier {
  const trimmed = text.trim()
  const lower = trimmed.toLowerCase()
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length

  // -- Media always requires Sonnet (images, docs, voice need multimodal) -----
  if (hasMedia) {
    return wordCount > 30 ? 'heavy' : 'standard'
  }

  // -- Trivial messages: very short, no substance -----------------------------
  // Light tier is ONLY for messages that clearly need zero reasoning.
  // If there is any doubt, it falls through to standard.

  if (wordCount <= 4 && trimmed.length < 30) {
    // Check if it is purely a greeting, ack, or social filler
    if (isTrivial(lower)) {
      return 'light'
    }
  }

  // -- Score the message for complexity signals -------------------------------
  let heavyScore = 0

  // Length signals: longer messages carry more context and need more reasoning
  if (wordCount > 80) heavyScore += 3
  else if (wordCount > 40) heavyScore += 2
  else if (wordCount > 20) heavyScore += 1

  // Multi-sentence: multiple thoughts usually means complex reasoning
  const sentenceCount = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  if (sentenceCount >= 4) heavyScore += 2
  else if (sentenceCount >= 2) heavyScore += 1

  // Deep question signals: "should I", "help me", "what do you think"
  if (/\bshould\s+I\b/i.test(lower)) heavyScore += 2
  if (/\bhelp\s+me\s+(think|decide|figure|plan|understand|prioriti)/i.test(lower)) heavyScore += 2
  if (/\bwhat\s+do\s+you\s+think/i.test(lower)) heavyScore += 2
  if (/\bwhat\s+would\s+you\s+(do|suggest|recommend)/i.test(lower)) heavyScore += 2
  if (/\bhow\s+should\s+I/i.test(lower)) heavyScore += 2

  // Coaching and strategy language: abstract thinking, tradeoffs, decisions
  if (/\b(pros?\s+and\s+cons?|tradeoff|trade-off|weighing|torn\s+between)/i.test(lower)) heavyScore += 2
  if (/\b(strateg|negotiat|restructur|repositio|pivot)/i.test(lower)) heavyScore += 2
  if (/\b(business\s+model|revenue\s+model|pricing|go-to-market|gtm)\b/i.test(lower)) heavyScore += 2

  // Planning and review signals
  if (/\b(plan\s+my|review\s+my|debrief|weekly\s+review|morning\s+briefing)/i.test(lower)) heavyScore += 2

  // Writing with depth (not just "send this email")
  if (/\b(write|draft|compose)\s+.*(post|article|blog|pitch|proposal|deck|brief)/i.test(lower)) heavyScore += 2
  if (/\bcontent\s+session/i.test(lower)) heavyScore += 2

  // Emotional or reflective tone signals depth
  if (/\b(frustrated|overwhelmed|confused|stuck|lost|anxious|stressed|excited\s+about)/i.test(lower)) heavyScore += 1
  if (/\b(I('ve|\s+have)\s+been\s+(thinking|wondering|struggling|trying))/i.test(lower)) heavyScore += 1

  // Multi-part requests (lists, "and also", "plus")
  if (/\b(first|second|third|also|plus|additionally|another\s+thing)/i.test(lower)) heavyScore += 1

  // Narrative: user telling a story or explaining a situation
  if (/\b(so\s+basically|here'?s\s+what\s+happened|long\s+story|let\s+me\s+explain)/i.test(lower)) heavyScore += 2

  // -- Decision ---------------------------------------------------------------

  if (heavyScore >= 2) return 'heavy'
  return 'standard'
}

/**
 * Check if a short message is purely trivial (greeting, ack, filler).
 * This is intentionally narrow. Anything uncertain returns false.
 */
function isTrivial(lower: string): boolean {
  // Greetings
  if (/^(hi|hello|hey|yo|sup|hola|morning|gm|good\s*(morning|evening|night|afternoon))[\s!.]*$/.test(lower)) return true

  // Acknowledgements
  if (/^(ok(ay)?|sure|got\s*it|cool|nice|yep|yup|yes|no|nah|nope|k|ty|thx|thanks?|thank\s*you|sounds?\s*good|perfect|great|alright|right|bet|word|copy|noted)[\s!.]*$/.test(lower)) return true

  // Social closers
  if (/^(bye|goodbye|good\s*night|gn|ttyl|later|see\s*you|cheers|peace)[\s!.]*$/.test(lower)) return true

  return false
}

/**
 * Classify and return config in one call.
 */
export function routeMessage(text: string, hasMedia = false): TierConfig & { tier: MessageTier } {
  const tier = classifyMessage(text, hasMedia)
  return { tier, ...TIER_MAP[tier] }
}
