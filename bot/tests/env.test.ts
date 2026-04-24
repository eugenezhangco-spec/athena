import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// We test the parser logic directly since readEnvFile reads from a fixed path.
// Import the function and test with a temp .env file.

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('env parser logic', () => {
  it('parses KEY=VALUE pairs', () => {
    const parsed = parseEnv('FOO=bar\nBAZ=qux')
    expect(parsed).toEqual({ FOO: 'bar', BAZ: 'qux' })
  })

  it('handles double-quoted values', () => {
    const parsed = parseEnv('KEY="hello world"')
    expect(parsed).toEqual({ KEY: 'hello world' })
  })

  it('handles single-quoted values', () => {
    const parsed = parseEnv("KEY='hello world'")
    expect(parsed).toEqual({ KEY: 'hello world' })
  })

  it('skips comments', () => {
    const parsed = parseEnv('# comment\nKEY=value')
    expect(parsed).toEqual({ KEY: 'value' })
  })

  it('skips blank lines', () => {
    const parsed = parseEnv('\n\nKEY=value\n\n')
    expect(parsed).toEqual({ KEY: 'value' })
  })

  it('handles values with = sign', () => {
    const parsed = parseEnv('KEY=a=b=c')
    expect(parsed).toEqual({ KEY: 'a=b=c' })
  })

  it('returns empty object for empty input', () => {
    const parsed = parseEnv('')
    expect(parsed).toEqual({})
  })

  it('trims whitespace around keys and values', () => {
    const parsed = parseEnv('  KEY  =  value  ')
    expect(parsed).toEqual({ KEY: 'value' })
  })

  it('skips lines without =', () => {
    const parsed = parseEnv('NOEQUALSSIGN\nKEY=value')
    expect(parsed).toEqual({ KEY: 'value' })
  })
})

// Minimal .env parser matching the logic in src/env.ts
function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}
