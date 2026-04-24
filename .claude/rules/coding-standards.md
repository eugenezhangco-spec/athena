---
description: Code quality rules for any code written or modified by the assistant. Enforces completeness, immutability, and production-readiness.
---

# Coding Standards

## Research Before Building

- Search for existing implementations before writing new code. GitHub, package registries, docs.
- Prefer battle-tested libraries over hand-rolled solutions.
- Check version-specific behavior before using any API or package.

## Complete Output — No Exceptions

- NEVER output `// TODO` or `// ...` or placeholder comments. Every code block is complete and runnable.
- If a file is too long for a single response, pause cleanly at a logical boundary and continue in the next message.
- NEVER use `/* rest of the code remains the same */` or any variation. Write the full code.

## Immutability

- ALWAYS create new objects. NEVER mutate existing ones.
- Use spread operators, `.map()`, `.filter()` over in-place mutation.
- No `var`. Use `const` by default. Use `let` only when reassignment is truly required.

## Error Handling

- Every async function gets a try/catch or `.catch()`.
- User-facing errors get friendly messages. Technical details go to logs.
- NEVER swallow errors silently. Log, handle, or rethrow.
- Validate inputs at every system boundary.

## File Organization

- One component per file. One concern per function.
- File names: kebab-case for utilities, PascalCase for components.
- Maximum 300 lines per file. Split if longer.
- Organize by feature/domain, not by type.

## Naming

- Descriptive names. `getUserById` not `getUser`. `isAuthenticated` not `check`.
- Boolean variables start with `is`, `has`, `should`, `can`.
- Functions describe their action. Nouns for data, verbs for operations.
- No abbreviations unless universally understood (`id`, `url`, `api`).

## Quality Gate

Before marking any code complete:

| Check | Standard |
|-------|----------|
| No TODOs | Zero placeholder comments. Complete code only. |
| No `any` types | Explicit types everywhere. Comment if `any` is truly unavoidable. |
| Error handling | Every async path has error handling. |
| No mutation | Immutable patterns throughout. |
| Readable | A developer unfamiliar with the codebase can understand it. |
| No hardcoded values | Use constants, config, or environment variables. |
| Functions < 50 lines | Split if longer. |
| Files < 300 lines | Split if longer. |
