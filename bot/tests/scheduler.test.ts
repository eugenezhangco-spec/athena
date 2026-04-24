import { describe, it, expect } from 'vitest'
import { CronExpressionParser } from 'cron-parser'

// Replicate computeNextRun to avoid importing scheduler.ts
// (which pulls in db.ts -> config.ts -> readEnvFile side effects)
function computeNextRun(cronExpression: string): number {
  const expr = CronExpressionParser.parse(cronExpression)
  return Math.floor(expr.next().getTime() / 1000)
}

describe('computeNextRun', () => {
  it('computes next run for a valid cron expression', () => {
    const nextRun = computeNextRun('0 9 * * *')
    const now = Math.floor(Date.now() / 1000)

    expect(nextRun).toBeGreaterThan(now)
    expect(nextRun).toBeLessThan(now + 86400 + 60)
  })

  it('computes next run for every-minute cron', () => {
    const nextRun = computeNextRun('* * * * *')
    const now = Math.floor(Date.now() / 1000)

    expect(nextRun).toBeGreaterThan(now)
    expect(nextRun).toBeLessThanOrEqual(now + 61)
  })

  it('computes next run for weekly cron', () => {
    const nextRun = computeNextRun('0 9 * * 1')
    const now = Math.floor(Date.now() / 1000)

    expect(nextRun).toBeGreaterThan(now)
    expect(nextRun).toBeLessThan(now + 7 * 86400 + 60)
  })

  it('computes next run for every-4-hours cron', () => {
    const nextRun = computeNextRun('0 */4 * * *')
    const now = Math.floor(Date.now() / 1000)

    expect(nextRun).toBeGreaterThan(now)
    expect(nextRun).toBeLessThan(now + 4 * 3600 + 60)
  })

  it('throws on invalid cron expression', () => {
    expect(() => computeNextRun('not a cron')).toThrow()
  })

  it('handles empty string without crashing', () => {
    // cron-parser treats empty string as "* * * * *" (every minute)
    const nextRun = computeNextRun('')
    const now = Math.floor(Date.now() / 1000)
    expect(nextRun).toBeGreaterThan(now)
  })

  it('returns unix seconds (not milliseconds)', () => {
    const nextRun = computeNextRun('* * * * *')
    expect(String(nextRun).length).toBeLessThanOrEqual(11)
  })
})
