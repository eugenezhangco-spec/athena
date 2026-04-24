#!/usr/bin/env tsx
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { promises as fs } from 'fs'
import { realpath } from 'fs/promises'
import path from 'path'
import { readEnvFile } from '../env.js'

// -- Allowlist ---------------------------------------------------------------

const env = readEnvFile()
const rawAllowed = env['ATHENA_FS_ALLOWED'] ?? ''
if (!rawAllowed) {
  console.error('ATHENA_FS_ALLOWED not set in bot/.env — refusing to start')
  process.exit(1)
}

const allowedDirs: string[] = await Promise.all(
  rawAllowed
    .split(':')
    .map((p) => p.trim())
    .filter(Boolean)
    .map(async (p) => {
      const absolute = path.resolve(p)
      try {
        return await realpath(absolute)
      } catch {
        console.error(`Allowed dir does not exist, skipping: ${p}`)
        return ''
      }
    })
).then((dirs) => dirs.filter(Boolean))

if (allowedDirs.length === 0) {
  console.error('No valid allowed directories. Exiting.')
  process.exit(1)
}

async function resolveInsideAllowlist(requestedPath: string): Promise<string> {
  const absolute = path.resolve(requestedPath)
  let real: string
  try {
    real = await realpath(absolute)
  } catch {
    // Path doesn't exist yet — use absolute for write scenarios
    real = absolute
  }
  for (const allowed of allowedDirs) {
    if (real === allowed || real.startsWith(allowed + path.sep)) {
      return real
    }
  }
  throw new Error(`Access denied: ${requestedPath} is outside allowed directories`)
}

// -- Server ------------------------------------------------------------------

const server = new Server(
  { name: 'athena-filesystem', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_allowed_directories',
      description: 'Return the list of directories this server may access.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'list_directory',
      description: 'List entries in a directory (files and subdirectories).',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'read_file',
      description: 'Read the contents of a text file.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
    {
      name: 'write_file',
      description: 'Write (overwrite) text content to a file.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'get_file_info',
      description: 'Get stat info for a file or directory.',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  try {
    switch (name) {
      case 'list_allowed_directories':
        return {
          content: [{ type: 'text', text: allowedDirs.join('\n') }],
        }

      case 'list_directory': {
        const p = await resolveInsideAllowlist(String(args?.['path'] ?? ''))
        const entries = await fs.readdir(p, { withFileTypes: true })
        const formatted = entries
          .map((e) => (e.isDirectory() ? `[DIR]  ${e.name}` : `[FILE] ${e.name}`))
          .join('\n')
        return { content: [{ type: 'text', text: formatted || '(empty)' }] }
      }

      case 'read_file': {
        const p = await resolveInsideAllowlist(String(args?.['path'] ?? ''))
        const content = await fs.readFile(p, 'utf-8')
        return { content: [{ type: 'text', text: content }] }
      }

      case 'write_file': {
        const p = await resolveInsideAllowlist(String(args?.['path'] ?? ''))
        const content = String(args?.['content'] ?? '')
        await fs.writeFile(p, content, 'utf-8')
        return {
          content: [{ type: 'text', text: `Wrote ${content.length} bytes to ${p}` }],
        }
      }

      case 'get_file_info': {
        const p = await resolveInsideAllowlist(String(args?.['path'] ?? ''))
        const stat = await fs.stat(p)
        const info = {
          path: p,
          size: stat.size,
          isFile: stat.isFile(),
          isDirectory: stat.isDirectory(),
          modified: stat.mtime.toISOString(),
          created: stat.birthtime.toISOString(),
        }
        return { content: [{ type: 'text', text: JSON.stringify(info, null, 2) }] }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    }
  }
})

// -- Main --------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`athena-filesystem MCP running. Allowed: ${allowedDirs.join(', ')}`)
