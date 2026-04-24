#!/usr/bin/env node

/**
 * CLI for managing scheduled tasks.
 * Usage: node dist/schedule-cli.js <command> [args]
 *
 * Commands:
 *   create "<prompt>" "<cron>" <chat_id>  — Create a new scheduled task
 *   list                                   — List all tasks
 *   delete <id>                            — Delete a task
 *   pause <id>                             — Pause a task
 *   resume <id>                            — Resume a paused task
 */

import { initDatabase, createTask, getAllTasks, deleteTask, pauseTask, resumeTask } from './db.js'
import { computeNextRun } from './scheduler.js'

function usage(): void {
  console.log(`
Schedule CLI — Manage scheduled tasks

Commands:
  create "<prompt>" "<cron>" <chat_id>  Create a new task
  list                                   List all tasks
  delete <id>                            Delete a task
  pause <id>                             Pause a task
  resume <id>                            Resume a paused task

Examples:
  node dist/schedule-cli.js create "Summarize my emails" "0 9 * * *" 123456789
  node dist/schedule-cli.js list
  node dist/schedule-cli.js pause task_1234567890
`.trim())
}

function main(): void {
  initDatabase()

  const args = process.argv.slice(2)
  const command = args[0]

  if (!command || command === 'help' || command === '--help') {
    usage()
    return
  }

  switch (command) {
    case 'create': {
      const prompt = args[1]
      const cron = args[2]
      const chatId = args[3]

      if (!prompt || !cron || !chatId) {
        console.error('Usage: create "<prompt>" "<cron>" <chat_id>')
        process.exit(1)
      }

      try {
        const nextRun = computeNextRun(cron)
        const id = `task_${Date.now()}`
        createTask(id, chatId, prompt, cron, nextRun)
        console.log(`Created: ${id}`)
        console.log(`  Prompt: ${prompt}`)
        console.log(`  Cron:   ${cron}`)
        console.log(`  Next:   ${new Date(nextRun * 1000).toLocaleString()}`)
      } catch (err) {
        console.error(`Invalid cron expression: ${err instanceof Error ? err.message : err}`)
        process.exit(1)
      }
      break
    }

    case 'list': {
      const tasks = getAllTasks()
      if (tasks.length === 0) {
        console.log('No scheduled tasks.')
        return
      }

      console.log(`\n${'ID'.padEnd(25)} ${'Status'.padEnd(8)} ${'Schedule'.padEnd(15)} ${'Next Run'.padEnd(22)} Prompt`)
      console.log('-'.repeat(100))

      for (const t of tasks) {
        const next = new Date(t.next_run * 1000).toLocaleString()
        const prompt = t.prompt.length > 40 ? t.prompt.slice(0, 37) + '...' : t.prompt
        console.log(`${t.id.padEnd(25)} ${t.status.padEnd(8)} ${t.schedule.padEnd(15)} ${next.padEnd(22)} ${prompt}`)
      }
      console.log()
      break
    }

    case 'delete': {
      const id = args[1]
      if (!id) {
        console.error('Usage: delete <id>')
        process.exit(1)
      }
      console.log(deleteTask(id) ? `Deleted: ${id}` : 'Task not found.')
      break
    }

    case 'pause': {
      const id = args[1]
      if (!id) {
        console.error('Usage: pause <id>')
        process.exit(1)
      }
      console.log(pauseTask(id) ? `Paused: ${id}` : 'Task not found.')
      break
    }

    case 'resume': {
      const id = args[1]
      if (!id) {
        console.error('Usage: resume <id>')
        process.exit(1)
      }
      console.log(resumeTask(id) ? `Resumed: ${id}` : 'Task not found.')
      break
    }

    default:
      console.error(`Unknown command: ${command}`)
      usage()
      process.exit(1)
  }
}

main()
