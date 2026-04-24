/**
 * MemPalace Bridge — connects the Telegram bot's local memory to long-term MemPalace storage.
 *
 * Architecture:
 * - Local SQLite = fast cache. Handles real-time message context. Decays old memories.
 * - MemPalace = permanent record. Handles long-term recall across sessions. Never decays.
 *
 * The bridge writes semantic user memories to MemPalace (best-effort, non-blocking)
 * and reads from MemPalace when local search doesn't have enough context.
 *
 * If MemPalace is not installed, everything degrades gracefully to local-only.
 */

import { execFile } from 'child_process'
import { promisify } from 'util'
import { logger } from './logger.js'

const execFileAsync = promisify(execFile)

export interface MemPalaceResult {
  content: string
  source_tag: string
  similarity: number
}

/** Whether MemPalace CLI is available on this machine */
let mempalaceAvailable: boolean | null = null

async function checkMemPalace(): Promise<boolean> {
  if (mempalaceAvailable !== null) return mempalaceAvailable
  try {
    await execFileAsync('mempalace-mcp', ['--help'], { timeout: 5000 })
    mempalaceAvailable = true
  } catch {
    // Try Python module fallback
    try {
      await execFileAsync('python3', ['-c', 'import mempalace'], { timeout: 5000 })
      mempalaceAvailable = true
    } catch {
      mempalaceAvailable = false
      logger.info('MemPalace not installed — running with local memory only')
    }
  }
  return mempalaceAvailable
}

/**
 * Queue a memory write to MemPalace.
 * Non-blocking, best-effort. If MemPalace is unavailable, silently skips.
 * Uses the mempalace Python API to add a drawer with source tagging.
 */
export async function queueMemPalaceWrite(
  content: string,
  sourceTag: 'user_statement' | 'system_inference' | 'onboarding' | 'debrief' | 'coaching'
): Promise<void> {
  if (!(await checkMemPalace())) return

  try {
    const script = `
import mempalace
from mempalace.searcher import MemPalaceSearcher
searcher = MemPalaceSearcher()
searcher.add_drawer(
  content=${JSON.stringify(content)},
  wing="athena_user",
  metadata={"source_tag": ${JSON.stringify(sourceTag)}, "origin": "telegram_bot"}
)
`
    await execFileAsync('python3', ['-c', script], { timeout: 10000 })
    logger.debug({ sourceTag }, 'Written to MemPalace')
  } catch (err) {
    logger.warn({ err }, 'MemPalace write failed (non-fatal)')
  }
}

/**
 * Search MemPalace for long-term memories relevant to a query.
 * Returns results with content and source tags.
 * If MemPalace is unavailable, returns empty array.
 */
export async function searchMemPalace(
  query: string,
  limit = 3
): Promise<MemPalaceResult[]> {
  if (!(await checkMemPalace())) return []

  try {
    const script = `
import json
from mempalace.searcher import MemPalaceSearcher
searcher = MemPalaceSearcher()
results = searcher.search(${JSON.stringify(query)}, n_results=${limit}, wing="athena_user")
output = []
for doc, meta, dist in zip(results.get("documents", [[]])[0], results.get("metadatas", [[]])[0], results.get("distances", [[]])[0]):
    output.append({
        "content": doc,
        "source_tag": meta.get("source_tag", "unknown"),
        "similarity": round(1 - dist, 3)
    })
print(json.dumps(output))
`
    const { stdout } = await execFileAsync('python3', ['-c', script], { timeout: 10000 })
    return JSON.parse(stdout.trim()) as MemPalaceResult[]
  } catch (err) {
    logger.warn({ err }, 'MemPalace search failed (non-fatal)')
    return []
  }
}
