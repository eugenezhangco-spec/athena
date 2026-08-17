# Memory taxonomy

**This file is the contract for what goes into long-term memory.** Athena's memory
(MemPalace) organises facts into *wings* and *rooms*. A wing is a broad area of your
life. A room is a subject inside it.

Left alone, that vocabulary grows on its own. Six wings become twenty-two, "work" and
"career" and "job" all end up meaning the same thing, and by month four you cannot find
anything because you do not know which of three places it was filed under.

So the list below is **closed**. Only these wings and rooms are allowed, and the rule is
enforced in the code rather than left as a note — run `python3 scripts/memory-guard.py`
once and anything off this list is rejected at the moment of writing, with the valid
options handed back so the assistant corrects itself.

**Edit this file to fit your life, then re-run the guard.** These are a starting point,
not a prescription.

---

## The wings

| Wing | What belongs here | Rooms |
|---|---|---|
| **me** | You. Who you are, what you want, how you work | `identity` · `preferences` · `health` · `faith` · `goals` · `patterns` |
| **people** | Everyone else. One room per relationship type | `family` · `friends` · `colleagues` · `network` |
| **work** | What you do for money, whoever you do it for | `role` · `projects` · `clients` · `finances` |
| **learning** | What you are studying and what you concluded | `notes` · `sources` · `skills` |
| **decisions** | Choices made, with the reasoning, so future-you can audit past-you | `log` |

Five wings. If you need a sixth, add it here and re-run the guard. What you must not do
is invent one in passing, which is exactly what the guard prevents.

---

## How to write a good memory

**One fact per memory.** "Sarah runs the Berlin office and prefers morning calls" is two
memories. Split it, and each one can be corrected or expired without touching the other.

**Say who said it.** Every memory carries a source tag. `user_statement` means you said
it and it wins every conflict. `system_inference` means the assistant worked it out and
may be wrong. Getting this wrong is how a guess hardens into a fact.

**Date anything that can change.** A job, a city, a goal, a weight. Facts like these are
true on a date, not forever, and the lint below uses that date to ask whether they still
hold.

## Facts expire, they do not get deleted

When something stops being true, it is marked expired with a reason and a date. The old
fact stays readable.

That matters more than it sounds. Deleting "worked at Acme" makes the last three years
of your own history unanswerable. Expiring it means you can still ask what was true in
March, and the assistant will not tell you that you still work there.

## Keeping it honest

```bash
python3 scripts/memory-lint.py          # report what has rotted
python3 scripts/memory-lint.py --fix    # repair the mechanical stuff
```

The lint catches what the guard cannot: a fact that was true in May, the same person
stored twice under a full name and a nickname, two relationship types that mean the same
thing, values that quietly contradict each other.

It **backs the graph up before touching anything**, and it expires rather than deletes.
Where the answer is genuinely ambiguous it asks you rather than guessing, because a lint
that guessed would manufacture the exact errors it exists to catch.

Run it monthly. Nothing will ever prompt you to — that is the whole problem it solves.
A memory system does not crash when it goes wrong. It keeps answering, confidently, and
the answers are just quietly untrue.
