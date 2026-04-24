import { CronExpressionParser } from 'cron-parser'
import { getDueTasks, updateTaskAfterRun, getDueReminders, deleteDueReminders, getAllTasks, createTask } from './db.js'
import { runAutonomousAgent } from './agent.js'
import { logger } from './logger.js'

const TASK_POLL_MS = 60 * 1000    // check scheduled tasks every 60s
const REMINDER_POLL_MS = 30 * 1000 // check reminders every 30s

type Sender = (chatId: string, text: string) => Promise<void>

let taskInterval: ReturnType<typeof setInterval> | undefined
let reminderInterval: ReturnType<typeof setInterval> | undefined

/**
 * Compute the next run time (unix seconds) for a cron expression.
 */
export function computeNextRun(cronExpression: string): number {
  const expr = CronExpressionParser.parse(cronExpression)
  return Math.floor(expr.next().getTime() / 1000)
}

/**
 * Run all due scheduled tasks.
 * For each: execute the prompt autonomously, send the result, compute next run.
 */
async function runDueTasks(send: Sender): Promise<void> {
  const tasks = getDueTasks()
  if (tasks.length === 0) return

  for (const task of tasks) {
    logger.info({ taskId: task.id, prompt: task.prompt.slice(0, 50) }, 'Running scheduled task')

    try {
      const result = await runAutonomousAgent(task.prompt)
      const resultText = result ?? 'Task completed (no output).'

      // Send result
      await send(task.chat_id, resultText)

      // Compute next run and update
      const nextRun = computeNextRun(task.schedule)
      updateTaskAfterRun(task.id, nextRun, resultText.slice(0, 500))

      logger.info({ taskId: task.id, nextRun }, 'Scheduled task completed')
    } catch (err) {
      logger.error({ err, taskId: task.id }, 'Scheduled task failed')
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      await send(task.chat_id, `Scheduled task "${task.prompt.slice(0, 40)}" failed: ${errMsg}`).catch(() => {})

      // Still advance next_run so we don't retry failed tasks in a loop
      try {
        const nextRun = computeNextRun(task.schedule)
        updateTaskAfterRun(task.id, nextRun, `ERROR: ${errMsg}`)
      } catch {
        // If cron parse fails too, skip
      }
    }
  }
}

/**
 * Check and send due reminders.
 */
async function checkReminders(send: Sender): Promise<void> {
  const due = getDueReminders()
  if (due.length === 0) return

  for (const r of due) {
    try {
      await send(r.chat_id, `Reminder: ${r.message}`)
      logger.info({ reminderId: r.id, chatId: r.chat_id }, 'Reminder sent')
    } catch (err) {
      logger.error({ err, reminderId: r.id }, 'Failed to send reminder')
    }
  }

  // Delete all due reminders after sending
  deleteDueReminders()
}

/**
 * Start the scheduler loops.
 * Call this once after database is initialized.
 */
export function initScheduler(send: Sender): void {
  // Run immediately on start
  runDueTasks(send).catch(err => logger.error({ err }, 'Initial task poll failed'))
  checkReminders(send).catch(err => logger.error({ err }, 'Initial reminder poll failed'))

  // Set up polling intervals
  taskInterval = setInterval(() => {
    runDueTasks(send).catch(err => logger.error({ err }, 'Task poll failed'))
  }, TASK_POLL_MS)

  reminderInterval = setInterval(() => {
    checkReminders(send).catch(err => logger.error({ err }, 'Reminder poll failed'))
  }, REMINDER_POLL_MS)

  logger.info('Scheduler started (tasks: 60s, reminders: 30s)')
}

/**
 * Default recurring tasks the user can opt into. Keyed on stable labels so
 * createDefaultSchedules can dedup by schedule + label.
 */
export const DEFAULT_SCHEDULES = [
  {
    label: 'Morning briefing',
    schedule: '0 7 * * *',
    prompt: `Run the morning briefing for the user. Output plain text suitable for Telegram (no markdown, no headers, no bullets beyond hyphens).

Gather in parallel:
1. Today's events from Google Calendar (user's timezone). Sort chronologically.
2. Gmail messages received since 6pm yesterday (user's local time). Bucket as Urgent / Important / Noise. For urgent items, draft a 2-sentence reply the user can send with minor edits.
3. Unfinished todos from yesterday's entry in personal/day-ledger.md (use mcp__filesystem__read_file if outside the project cwd).

Format the reply as, with blank lines between sections:

GOOD MORNING - [date]

CALENDAR TODAY
[HH:MM] [event] ([attendees if relevant])
...

EMAIL SINCE 6PM YESTERDAY
Urgent ([N]):
- From [sender]: [subject] - [why it's urgent]
  Draft: "[2-sentence reply]"
Important ([N]):
- From [sender]: [subject] - [one-line summary]
Noise: [N] newsletters/automated.

CARRIED FORWARD FROM YESTERDAY
- [task] - [status]

If a section is empty, say "Nothing." instead of omitting it. Keep the total under 30 lines.`,
  },
  {
    label: 'Evening debrief nudge',
    schedule: '0 21 * * *',
    prompt: `Send a short Telegram nudge that it is time to debrief the day. Plain text, 2-3 lines max, no markdown. Something like:

"Wrap time. Ready to debrief? Reply /debrief in Claude Code when you are."

Do NOT run the debrief flow itself. Just the nudge.`,
  },
  {
    label: 'Weekly review nudge',
    schedule: '0 17 * * 0',
    prompt: `Send a Telegram nudge that it is time for the weekly review. Plain text, 2-3 lines max, no markdown. Something like:

"Week is closing. Run /weekly-review in Claude Code to audit the week, clean memory, and reset priorities for next week."

Do NOT run the review itself.`,
  },
] as const

/**
 * Create the default recurring tasks for a chat. Idempotent — skips any
 * default whose label already appears in an existing task's prompt for this
 * chat (stable across prompt tweaks since we match by the "// label:" prefix
 * we inject below).
 *
 * Returns which defaults were created and which were already present.
 */
export function createDefaultSchedules(chatId: string): {
  created: string[]
  skipped: string[]
} {
  const existing = getAllTasks(chatId)
  const created: string[] = []
  const skipped: string[] = []

  for (const def of DEFAULT_SCHEDULES) {
    const marker = `[default:${def.label}]`
    const alreadyExists = existing.some((t) => t.prompt.includes(marker))
    if (alreadyExists) {
      skipped.push(def.label)
      continue
    }

    const taggedPrompt = `${marker}\n\n${def.prompt}`
    const id = `task_default_${def.label.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
    const nextRun = computeNextRun(def.schedule)
    createTask(id, chatId, taggedPrompt, def.schedule, nextRun)
    created.push(def.label)
    logger.info({ label: def.label, cron: def.schedule, nextRun }, 'Created default scheduled task')
  }

  return { created, skipped }
}

/**
 * Stop the scheduler loops. Called during graceful shutdown.
 */
export function stopScheduler(): void {
  if (taskInterval) {
    clearInterval(taskInterval)
    taskInterval = undefined
  }
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = undefined
  }
  logger.info('Scheduler stopped')
}
