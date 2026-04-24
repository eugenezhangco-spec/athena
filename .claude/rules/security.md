---
description: Security fundamentals for code, credentials, and self-modification safety.
---

# Security

## Secrets Management

- NEVER hardcode API keys, passwords, tokens, or credentials in source code.
- ALWAYS use environment variables via `.env` files.
- ALWAYS ensure `.env` is listed in `.gitignore` before any commit.
- Validate that required secrets are present at startup. Fail fast with a clear message if missing.
- If a secret may have been exposed, flag it immediately and recommend rotation.

## Input Validation

- Validate ALL user input before processing. Never trust external data.
- Use schema-based validation (Zod, JSON Schema, or equivalent) where available.
- Fail fast with clear error messages. Never silently accept malformed input.
- Sanitize outputs to prevent XSS. Never render unsanitized user content.

## API Security

- Rate limit all endpoints. No exceptions.
- Authenticate every protected route server-side. Never trust the client.
- HTTPS only. Never allow unencrypted traffic.
- Parameterize all database queries. Never concatenate user input into SQL.
- Error messages must not leak internal details. Log details server-side, show generic messages to users.

## Self-Modification Safety

Before modifying any rule, skill, or system file:

1. **Read the existing file first.** Never overwrite blind.
2. **Review for secrets.** Ensure no credentials, tokens, or sensitive data are present or exposed.
3. **Check auth logic.** Verify no permission escalation or access control weakening.
4. **Verify intent.** Confirm the modification matches the stated goal and nothing else changes.
5. **One change at a time.** Never batch unrelated modifications.

## Credential File Management

- Credential files (`.env`, `credentials.json`, service account keys) are NEVER committed to version control.
- If a credential file is detected in a commit staging area, BLOCK and warn.
- Store credential file paths in documentation, not the credentials themselves.
- Default to least-privilege access. Request only the permissions needed.
