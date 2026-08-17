# Security

## What this project handles

Athena is a personal assistant, so the honest summary is that it touches almost
everything sensitive you have: your calendar, your email, your messages, your
goals, your health, the people in your life.

Nearly all of that risk is in **your** configuration rather than in this code.
This document is mostly about what you should know before pointing it at your
actual life.

## Where your data lives

**On your machine.** There is no server belonging to this project, no telemetry,
no analytics, and no account to create. Nobody involved in writing this can see
anything you do with it.

| What | Where |
|---|---|
| Everything you tell Athena | `personal/`, on your disk |
| Long-term memory | `~/.mempalace/`, on your disk |
| Your knowledge base | `knowledge/`, on your disk |
| Credentials | `.env` and `.mcp.json`, both gitignored |

If you run the optional Telegram bot on a server, that server holds a copy. It is
yours, and securing it is on you.

Your conversations do go to Anthropic, because Claude runs there. That is covered
by your own Claude subscription and its terms, and it is the same for any tool
built on Claude Code.

## Before you push anything

`personal/` is where your life ends up, and much of it is gitignored for that
reason. **If you fork this and push it, read `.gitignore` first and check what
you are about to publish.** A public repo containing `personal/me.md` is the most
likely way this bites someone.

Never commit:

- `.env` in any form
- `.mcp.json` — it holds API tokens
- Anything under `personal/` beyond the templates
- `knowledge/` content

## The optional Telegram bot

This is the highest-risk component, so it ships disabled and is deliberately kept
out of first-run setup.

- The bot answers **one** Telegram user ID, set in `ALLOWED_CHAT_ID`. Verify it.
  Getting it wrong hands a stranger an assistant with access to your life.
- It runs Claude with tool access **on your server**. Treat that server as
  compromised-if-exposed: keys only, no password login, firewall the rest.
- The Claude token in `bot/.env` is a live credential. Rotate it if it leaks.

## MCP servers

Each MCP server you connect is third-party code with access to whatever you
authorise. Calendar, email, notes.

**Read a server before you install it.** An MCP server ships executable code and
a tool surface, not just configuration, and popularity is not review — stars
measure usefulness, and a repo can change between the version somebody reviewed
and the version you install.

Grant the narrowest scope that works. Read-only where read-only will do.

## What Athena will not do on its own

These are behavioural guardrails in `.claude/rules/`, not enforced permissions.
They hold because the model follows them, and you should understand the
difference.

- Never sends an email, message, or post without you explicitly saying so
- Never deletes files
- Never makes a payment
- Never contacts anyone on your behalf

If you modify the rules, you are modifying the guardrails.

## Reporting a vulnerability

Open a GitHub issue for anything low-risk.

For something that could expose people's data, **do not open a public issue.**
Use GitHub's private vulnerability reporting on this repository instead, and
allow a reasonable window for a fix before disclosing.

Useful things to include: what you did, what happened, and what an attacker
would get out of it.
