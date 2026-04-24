import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

/**
 * Parse a .env file without polluting process.env.
 * Handles quoted values, comments, and blank lines.
 * Returns an empty object if the file doesn't exist.
 */
export function readEnvFile(keys?: string[]): Record<string, string> {
  const envPath = resolve(PROJECT_ROOT, '.env')

  let raw: string
  try {
    raw = readFileSync(envPath, 'utf8')
  } catch {
    return {}
  }

  const result: Record<string, string> = {}

  for (const line of raw.split('\n')) {
    const trimmed = line.trim()

    if (trimmed === '' || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    // Strip surrounding quotes (single or double)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (keys && !keys.includes(key)) continue

    result[key] = value
  }

  return result
}

export { PROJECT_ROOT }
