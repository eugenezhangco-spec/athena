# Contributing

Thanks for looking. A few things that will make this go smoothly.

## What this project is

A personal AI assistant that runs inside Claude Code. Most of it is markdown —
rules that shape behaviour, skills that trigger on demand, and a small
TypeScript bot for the optional Telegram layer.

Which means **you do not need to be a developer to contribute**. A rule that
reads better, a skill that handles a case it currently misses, or a setup step
that confused you are all real contributions.

## The bar

**One change per pull request.** A PR that fixes a bug and also renames three
files is hard to review and harder to revert.

**Explain the why, not the what.** The diff shows what changed. The description
should say what was wrong before.

**Leave a runnable check behind anything non-trivial.** Every script here has a
`--selftest`. Add to one, or add another. A check with no self-test is a claim.

## Working on rules and skills

Rules in `.claude/rules/` load on every session, so a line added there is paid
for on every message forever. Before adding one, ask whether it belongs in a
skill instead — skills cost nothing until they trigger.

If a rule only matters in one area, give it `paths:` frontmatter so it loads
only when that area is touched.

Write in the imperative. Say what not to do as clearly as what to do — the
negative boundaries are usually the load-bearing half.

## Working on the bot

```bash
cd bot
npm install
npm run typecheck
npm test
```

Both must pass. There are 103 tests; if your change breaks one, that is the
test doing its job.

## What will not be merged

- Anything that sends, posts, pays, or deletes without explicit human approval.
  That boundary is the whole trust model.
- Telemetry, analytics, or any phone-home.
- A dependency added for something a few lines would do.
- Anything requiring an API key where a Claude subscription currently suffices.

## Reporting a bug

Include what you expected, what happened, and your OS. If a script failed, the
last few lines of output are worth more than a description of them.

Security issues do not go in public issues. See [SECURITY.md](SECURITY.md).
