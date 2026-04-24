import { describe, it, expect } from 'vitest'

// We replicate the formatting logic here to test it in isolation,
// since importing bot.ts pulls in grammy + SDK + config (side effects).

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatForTelegram(text: string): string {
  const codeBlocks: string[] = []
  let processed = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length
    const escaped = escapeHtml(code.trimEnd())
    codeBlocks.push(lang ? `<pre><code class="language-${lang}">${escaped}</code></pre>` : `<pre>${escaped}</pre>`)
    return `\x00CODEBLOCK_${idx}\x00`
  })

  const inlineCode: string[] = []
  processed = processed.replace(/`([^`]+)`/g, (_match, code) => {
    const idx = inlineCode.length
    inlineCode.push(`<code>${escapeHtml(code)}</code>`)
    return `\x00INLINE_${idx}\x00`
  })

  processed = escapeHtml(processed)

  processed = processed.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>')
  processed = processed.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  processed = processed.replace(/__(.+?)__/g, '<b>$1</b>')
  processed = processed.replace(/(?<!\w)\*([^*]+?)\*(?!\w)/g, '<i>$1</i>')
  processed = processed.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, '<i>$1</i>')
  processed = processed.replace(/~~(.+?)~~/g, '<s>$1</s>')
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  processed = processed.replace(/^- \[ \]/gm, '\u2610')
  processed = processed.replace(/^- \[x\]/gm, '\u2611')
  processed = processed.replace(/^---+$/gm, '')
  processed = processed.replace(/^\*\*\*+$/gm, '')

  for (let i = 0; i < codeBlocks.length; i++) {
    processed = processed.replace(`\x00CODEBLOCK_${i}\x00`, codeBlocks[i])
  }
  for (let i = 0; i < inlineCode.length; i++) {
    processed = processed.replace(`\x00INLINE_${i}\x00`, inlineCode[i])
  }

  processed = processed.replace(/\n{3,}/g, '\n\n').trim()
  return processed
}

function splitMessage(text: string, limit = 4096): string[] {
  if (text.length <= limit) return [text]

  const chunks: string[] = []
  let remaining = text

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf('\n\n', limit)
    if (splitAt < limit * 0.3) splitAt = remaining.lastIndexOf('\n', limit)
    if (splitAt < limit * 0.3) splitAt = remaining.lastIndexOf('. ', limit)
    if (splitAt < limit * 0.3) splitAt = remaining.lastIndexOf(' ', limit)
    if (splitAt < limit * 0.3) splitAt = limit

    chunks.push(remaining.slice(0, splitAt + 1).trimEnd())
    remaining = remaining.slice(splitAt + 1).trimStart()
  }

  if (remaining.length > 0) chunks.push(remaining)
  return chunks
}

// -- Reminder parser (replicated from bot.ts) ---------------------------------

const REMINDER_PATTERNS = [
  // Time-before-message
  /remind\s+me\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)/i,
  /remind\s+me\s+at\s+(\d{1,2})[:\.](\d{2})\s*(?:to\s+)?(.+)/i,
  /remind\s+me\s+tomorrow\s+(?:to\s+)?(.+)/i,
  /set\s+(?:a\s+)?reminder\s+(?:for\s+)?(?:in\s+)?(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s+(?:to\s+)?(.+)/i,
  // Message-before-time
  /remind\s+me\s+to\s+(.+?)\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s*$/i,
  /remind\s+me\s+to\s+(.+?)\s+at\s+(\d{1,2})[:\.](\d{2})\s*$/i,
  /remind\s+me\s+to\s+(.+?)\s+tomorrow\s*$/i,
  /set\s+(?:a\s+)?reminder\s+to\s+(.+?)\s+in\s+(\d+)\s*(min(?:ute)?s?|hours?|hrs?|days?)\s*$/i,
]

function parseReminder(text: string): { remindAt: number; message: string } | null {
  const relativeMatch = text.match(REMINDER_PATTERNS[0]) ?? text.match(REMINDER_PATTERNS[3])
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1], 10)
    const unit = relativeMatch[2].toLowerCase()
    const message = relativeMatch[3].trim()
    let ms: number
    if (unit.startsWith('min')) ms = amount * 60 * 1000
    else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000
    else if (unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000
    else return null
    return { remindAt: Math.floor((Date.now() + ms) / 1000), message }
  }

  const atMatch = text.match(REMINDER_PATTERNS[1])
  if (atMatch) {
    const hours = parseInt(atMatch[1], 10)
    const minutes = parseInt(atMatch[2], 10)
    const message = atMatch[3].trim()
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1)
    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  const tomorrowMatch = text.match(REMINDER_PATTERNS[2])
  if (tomorrowMatch) {
    const message = tomorrowMatch[1].trim()
    const target = new Date()
    target.setDate(target.getDate() + 1)
    target.setHours(9, 0, 0, 0)
    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  // "remind me to [message] in X [unit]" or "set a reminder to [message] in X [unit]"
  const reverseRelativeMatch = text.match(REMINDER_PATTERNS[4]) ?? text.match(REMINDER_PATTERNS[7])
  if (reverseRelativeMatch) {
    const message = reverseRelativeMatch[1].trim()
    const amount = parseInt(reverseRelativeMatch[2], 10)
    const unit = reverseRelativeMatch[3].toLowerCase()
    let ms: number
    if (unit.startsWith('min')) ms = amount * 60 * 1000
    else if (unit.startsWith('h')) ms = amount * 60 * 60 * 1000
    else if (unit.startsWith('d')) ms = amount * 24 * 60 * 60 * 1000
    else return null
    return { remindAt: Math.floor((Date.now() + ms) / 1000), message }
  }

  // "remind me to [message] at HH:MM"
  const reverseAtMatch = text.match(REMINDER_PATTERNS[5])
  if (reverseAtMatch) {
    const message = reverseAtMatch[1].trim()
    const hours = parseInt(reverseAtMatch[2], 10)
    const minutes = parseInt(reverseAtMatch[3], 10)
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    if (target.getTime() <= Date.now()) target.setDate(target.getDate() + 1)
    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  // "remind me to [message] tomorrow"
  const reverseTomorrowMatch = text.match(REMINDER_PATTERNS[6])
  if (reverseTomorrowMatch) {
    const message = reverseTomorrowMatch[1].trim()
    const target = new Date()
    target.setDate(target.getDate() + 1)
    target.setHours(9, 0, 0, 0)
    return { remindAt: Math.floor(target.getTime() / 1000), message }
  }

  return null
}

// =============================================================================
// Tests
// =============================================================================

describe('formatForTelegram', () => {
  it('converts bold markdown to HTML', () => {
    expect(formatForTelegram('**hello**')).toBe('<b>hello</b>')
    expect(formatForTelegram('__hello__')).toBe('<b>hello</b>')
  })

  it('converts italic markdown to HTML', () => {
    expect(formatForTelegram('*hello*')).toBe('<i>hello</i>')
    expect(formatForTelegram('_hello_')).toBe('<i>hello</i>')
  })

  it('converts strikethrough', () => {
    expect(formatForTelegram('~~deleted~~')).toBe('<s>deleted</s>')
  })

  it('converts inline code', () => {
    expect(formatForTelegram('use `npm install`')).toBe('use <code>npm install</code>')
  })

  it('converts code blocks', () => {
    const input = '```js\nconsole.log("hi")\n```'
    const result = formatForTelegram(input)
    expect(result).toContain('<pre>')
    expect(result).toContain('console.log')
    expect(result).toContain('language-js')
  })

  it('converts headings to bold', () => {
    expect(formatForTelegram('# Title')).toBe('<b>Title</b>')
    expect(formatForTelegram('## Section')).toBe('<b>Section</b>')
    expect(formatForTelegram('### Subsection')).toBe('<b>Subsection</b>')
  })

  it('converts links', () => {
    expect(formatForTelegram('[click](https://example.com)')).toBe('<a href="https://example.com">click</a>')
  })

  it('converts checkboxes', () => {
    expect(formatForTelegram('- [ ] todo')).toContain('\u2610')
    expect(formatForTelegram('- [x] done')).toContain('\u2611')
  })

  it('strips horizontal rules', () => {
    expect(formatForTelegram('---')).toBe('')
    expect(formatForTelegram('***')).toBe('')
  })

  it('escapes HTML entities in text', () => {
    const result = formatForTelegram('a < b & c > d')
    expect(result).toContain('&lt;')
    expect(result).toContain('&amp;')
    expect(result).toContain('&gt;')
  })

  it('does not double-escape HTML inside code blocks', () => {
    const input = '```\n<div>hello</div>\n```'
    const result = formatForTelegram(input)
    expect(result).toContain('&lt;div&gt;')
    expect(result).toContain('<pre>')
  })

  it('handles mixed formatting', () => {
    const input = '# Title\n\n**Bold** and *italic* with `code`'
    const result = formatForTelegram(input)
    expect(result).toContain('<b>Title</b>')
    expect(result).toContain('<b>Bold</b>')
    expect(result).toContain('<i>italic</i>')
    expect(result).toContain('<code>code</code>')
  })

  it('collapses excessive blank lines', () => {
    const input = 'line1\n\n\n\n\nline2'
    const result = formatForTelegram(input)
    expect(result).toBe('line1\n\nline2')
  })

  it('handles empty input', () => {
    expect(formatForTelegram('')).toBe('')
  })

  it('handles plain text without markdown', () => {
    expect(formatForTelegram('just plain text')).toBe('just plain text')
  })
})

describe('splitMessage', () => {
  it('returns single chunk for short messages', () => {
    const result = splitMessage('hello', 4096)
    expect(result).toEqual(['hello'])
  })

  it('splits on double newline when possible', () => {
    const block1 = 'a'.repeat(2000)
    const block2 = 'b'.repeat(2000)
    const input = `${block1}\n\n${block2}`
    const result = splitMessage(input, 2500)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(block1)
    expect(result[1]).toBe(block2)
  })

  it('splits on single newline as fallback', () => {
    const line1 = 'a'.repeat(2000)
    const line2 = 'b'.repeat(2000)
    const input = `${line1}\n${line2}`
    const result = splitMessage(input, 2500)
    expect(result).toHaveLength(2)
  })

  it('handles messages exactly at limit', () => {
    const input = 'x'.repeat(4096)
    const result = splitMessage(input, 4096)
    expect(result).toEqual([input])
  })

  it('never produces empty chunks', () => {
    const input = 'a'.repeat(100) + '\n\n' + 'b'.repeat(100)
    const result = splitMessage(input, 5000)
    for (const chunk of result) {
      expect(chunk.length).toBeGreaterThan(0)
    }
  })
})

describe('parseReminder', () => {
  it('parses "remind me in X minutes"', () => {
    const result = parseReminder('remind me in 30 minutes to call the dentist')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('call the dentist')
    const expectedMin = Math.floor(Date.now() / 1000) + 29 * 60
    const expectedMax = Math.floor(Date.now() / 1000) + 31 * 60
    expect(result!.remindAt).toBeGreaterThan(expectedMin)
    expect(result!.remindAt).toBeLessThan(expectedMax)
  })

  it('parses "remind me in X hours"', () => {
    const result = parseReminder('remind me in 2 hours to eat lunch')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('eat lunch')
  })

  it('parses "remind me tomorrow"', () => {
    const result = parseReminder('remind me tomorrow to file taxes')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('file taxes')
  })

  it('parses "set a reminder for X days"', () => {
    const result = parseReminder('set a reminder for in 3 days to review proposal')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('review proposal')
  })

  it('parses "remind me to [message] in X minutes" (message-before-time)', () => {
    const result = parseReminder('remind me to call Sarah in 10 minutes')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('call Sarah')
    const expectedMin = Math.floor(Date.now() / 1000) + 9 * 60
    const expectedMax = Math.floor(Date.now() / 1000) + 11 * 60
    expect(result!.remindAt).toBeGreaterThan(expectedMin)
    expect(result!.remindAt).toBeLessThan(expectedMax)
  })

  it('parses "remind me to [message] in X hours" (message-before-time)', () => {
    const result = parseReminder('remind me to check the oven in 1 hour')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('check the oven')
  })

  it('parses "remind me to [message] tomorrow" (message-before-time)', () => {
    const result = parseReminder('remind me to buy groceries tomorrow')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('buy groceries')
  })

  it('parses "set a reminder to [message] in X days" (message-before-time)', () => {
    const result = parseReminder('set a reminder to review proposal in 3 days')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('review proposal')
  })

  it('handles "in" within the message body correctly', () => {
    const result = parseReminder('remind me to buy things in bulk in 30 minutes')
    expect(result).not.toBeNull()
    expect(result!.message).toBe('buy things in bulk')
  })

  it('returns null for non-reminder text', () => {
    expect(parseReminder('what is the weather today')).toBeNull()
    expect(parseReminder('hello there')).toBeNull()
    expect(parseReminder('send me the report')).toBeNull()
  })
})

// -- extractReminderTags (regex-only test, no DB) -------------------------------

function extractReminderTagsTest(text: string): {
  cleanedText: string
  reminders: Array<{ minutes: number; message: string }>
} {
  const TAG_REGEX = /<set_reminder\s+minutes="(\d+)">([\s\S]*?)<\/set_reminder>/g
  const reminders: Array<{ minutes: number; message: string }> = []
  const cleanedText = text.replace(TAG_REGEX, (_match, minutesStr, message) => {
    reminders.push({ minutes: parseInt(minutesStr, 10), message: message.trim() })
    return ''
  })
  return { cleanedText: cleanedText.replace(/\n{3,}/g, '\n\n').trim(), reminders }
}

describe('extractReminderTags', () => {
  it('extracts a single reminder tag and strips it', () => {
    const input = '<set_reminder minutes="10">call Sarah</set_reminder>'
    const result = extractReminderTagsTest(input)
    expect(result.reminders).toHaveLength(1)
    expect(result.reminders[0]).toEqual({ minutes: 10, message: 'call Sarah' })
    expect(result.cleanedText).toBe('')
  })

  it('extracts tag from mixed text and returns cleaned response', () => {
    const input = 'Got it, will remind you in 10 minutes. <set_reminder minutes="10">call Sarah</set_reminder>'
    const result = extractReminderTagsTest(input)
    expect(result.reminders).toHaveLength(1)
    expect(result.reminders[0]).toEqual({ minutes: 10, message: 'call Sarah' })
    expect(result.cleanedText).toBe('Got it, will remind you in 10 minutes.')
  })

  it('extracts multiple reminder tags', () => {
    const input = 'Setting both. <set_reminder minutes="10">call Sarah</set_reminder> <set_reminder minutes="60">check email</set_reminder>'
    const result = extractReminderTagsTest(input)
    expect(result.reminders).toHaveLength(2)
    expect(result.reminders[0].message).toBe('call Sarah')
    expect(result.reminders[1].message).toBe('check email')
  })

  it('returns empty reminders array for text without tags', () => {
    const input = 'Just a normal response with no reminders.'
    const result = extractReminderTagsTest(input)
    expect(result.reminders).toHaveLength(0)
    expect(result.cleanedText).toBe(input)
  })

  it('handles multiline message inside tag', () => {
    const input = '<set_reminder minutes="30">check on\nthe build</set_reminder>'
    const result = extractReminderTagsTest(input)
    expect(result.reminders).toHaveLength(1)
    expect(result.reminders[0].message).toBe('check on\nthe build')
  })
})
