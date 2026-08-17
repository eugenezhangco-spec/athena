# The wiki — what you actually know

This is the second of Athena's two memories, and confusing it with the first is the
single most expensive mistake you can make with a system like this.

| | Recall | Synthesis |
|---|---|---|
| Holds | what was said, verbatim, when, by whom | what it means |
| Answers | "what did Sarah say in June" | "what do I know about pricing" |
| Built by | storing and searching | reading and rewriting |
| Lives in | MemPalace | **here** |

A recall system will never produce understanding, however much you put in it. That is
not a defect, it is the design — MemPalace's own documentation says plainly that it does
not summarise, extract, or paraphrase. Expecting compounding insight from it is like
expecting a filing cabinet to write you a briefing.

So sources land in `raw/`, and then somebody has to actually read them and rewrite what
changed. That rewriting is the whole point. **A wiki that only accumulates is a folder.**

---

## Structure

```
knowledge/
  raw/         immutable sources, never edited after capture
  wiki/        topic pages, rewritten on every ingest
  questions/   things you noticed you do not know
  digests/     periodic roll-ups
  _hot.md      the ~500-token cache. Read this first, always
  _index.md    generated. Do not hand-edit
  _log.md      append-only record of every operation
```

**Read `_hot.md` before anything larger.** It is a few hundred tokens and answers most
questions about where things stand. Crawling the whole wiki to answer "what am I working
on" is the expensive mistake this file exists to prevent.

## The protocol, when a source comes in

1. **Save it raw.** `raw/YYYY-MM-DD-<slug>.md` with the URL, the date, and who made it.
   Never edit a raw file afterwards. It is the record of what was actually said, and you
   will want it when a page turns out to be wrong.

2. **Find the pages it touches.** Check `_index.md` first. A source about pricing goes
   into the existing pricing page.

3. **Rewrite those pages.** Not append. Rewrite. If the source refines a claim, the claim
   changes. If it contradicts one, both sides get stated (below). Appending is what turns
   a wiki into a pile of undigested quotes.

4. **Never create a second page for a subject that already has one.** This is the failure
   mode. Two pages on the same thing means neither is trusted and both go stale. Extend
   the existing page.

5. **Park what you cannot resolve.** A real disagreement between two credible sources is
   a question, not a page. `questions/YYYY-MM-DD-<slug>.md`.

6. **Log it.** One line in `_log.md`, then `python3 scripts/wiki.py all`.

## Contradictions get stated, not resolved

When two sources genuinely disagree and you cannot tell who is right, say so in both
pages:

```markdown
> CONTESTED: Source A says X (2026-03, link). Source B says the opposite (2026-07,
> link). Unresolved. Nothing here is measured, which is the actual finding.
```

Quietly picking a side is how a wiki becomes confidently wrong. Naming the disagreement
is more useful than a false answer, and it tells future-you exactly what to test.

## Page format

```markdown
---
topic: <one word>
updated: YYYY-MM-DD
sources: <count>
---

# Page title

The claim, up front. What is true and why it matters. Prose, not bullets — bullets let
you dodge the work of connecting two ideas.

## Connections
- [Other page](./other-page.md) — what the relationship actually is, not just "related"

## Sources
- [Author, "Title", date](../raw/YYYY-MM-DD-slug.md) — why this source is worth trusting
```

The `Connections` section is what makes this a wiki rather than a folder of notes. Say
what the relationship *is*. "Related" is not a connection.

## Keeping it honest

```bash
python3 scripts/wiki.py hot     # rebuild the cache
python3 scripts/wiki.py index   # regenerate the index
python3 scripts/wiki.py lint    # health check, exits 1 on findings
python3 scripts/wiki.py all     # all three
```

The lint catches broken cross-references, orphan pages nobody links to, citations that
no longer resolve, and pages nobody has touched in months. It is mechanical — it cannot
tell you two pages contradict each other. That is what the CONTESTED convention and an
actual read are for.

Same principle as `scripts/memory-lint.py`, pointed at a different store: **nothing will
ever prompt you to look.** A wiki does not crash when it rots.

## Boundaries

- **`raw/` is immutable.** Capture it, never edit it.
- **One page per subject.** Always extend, never duplicate.
- **A source read but not written up did not happen.** The reading is not the work.
- **Delete a page that duplicates a live file elsewhere.** Do not lint it harder. A clean
  check on the wrong artefact is worse than a dirty one.
