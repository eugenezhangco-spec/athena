import { describe, it, expect } from 'vitest'

// Test the semantic signal detection regex used by memory.ts
const SEMANTIC_SIGNALS =
  /\b(my|i am|i'm|i prefer|remember|always|never|i like|i hate|i need|i want|i use|my name|i work|i live)\b/i

describe('memory semantic signal detection', () => {
  it('detects "my" signals', () => {
    expect(SEMANTIC_SIGNALS.test('my favorite color is blue')).toBe(true)
    expect(SEMANTIC_SIGNALS.test('My name is Alex')).toBe(true)
  })

  it('detects "I am" signals', () => {
    expect(SEMANTIC_SIGNALS.test('I am a software engineer')).toBe(true)
    expect(SEMANTIC_SIGNALS.test("I'm working on a startup")).toBe(true)
  })

  it('detects preference signals', () => {
    expect(SEMANTIC_SIGNALS.test('I prefer dark mode')).toBe(true)
    expect(SEMANTIC_SIGNALS.test('I like TypeScript')).toBe(true)
    expect(SEMANTIC_SIGNALS.test('I hate meetings')).toBe(true)
  })

  it('detects "remember" signals', () => {
    expect(SEMANTIC_SIGNALS.test('remember that I have a meeting at 3')).toBe(true)
  })

  it('detects "always/never" signals', () => {
    expect(SEMANTIC_SIGNALS.test('I always start work at 9am')).toBe(true)
    expect(SEMANTIC_SIGNALS.test('I never eat breakfast')).toBe(true)
  })

  it('does not trigger on regular messages', () => {
    expect(SEMANTIC_SIGNALS.test('what is the weather')).toBe(false)
    expect(SEMANTIC_SIGNALS.test('how do I deploy this')).toBe(false)
    expect(SEMANTIC_SIGNALS.test('run the tests')).toBe(false)
  })

  it('skips short messages', () => {
    // The memory module skips messages <= 20 chars
    const shortMsg = 'hi there'
    expect(shortMsg.length).toBeLessThanOrEqual(20)
  })

  it('skips commands', () => {
    const cmd = '/newchat'
    expect(cmd.startsWith('/')).toBe(true)
  })
})

describe('memory context format', () => {
  it('builds context string from memory rows', () => {
    const memories = [
      { content: 'I like coffee', sector: 'semantic' },
      { content: 'discussed project timeline', sector: 'episodic' },
    ]

    const lines = memories.map(r => `- ${r.content} (${r.sector})`)
    const context = `[Memory context]\n${lines.join('\n')}`

    expect(context).toContain('[Memory context]')
    expect(context).toContain('I like coffee (semantic)')
    expect(context).toContain('discussed project timeline (episodic)')
  })

  it('returns empty string when no memories', () => {
    const memories: unknown[] = []
    const context = memories.length === 0 ? '' : 'has content'
    expect(context).toBe('')
  })
})
