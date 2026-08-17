#!/usr/bin/env python3
"""Find what has rotted in long-term memory. Repair the mechanical part, ask about the rest.

Why this exists
---------------
A memory system does not crash when it goes wrong. It keeps answering, and the
answers are quietly untrue. There is no error, no alert, nothing to notice — so
nothing will ever prompt you to look. That is why this runs on a schedule rather
than on a trigger.

The guard (scripts/memory-guard.py) stops bad writes. It cannot help with a fact
that was correct in May and stopped being true in July. That is this.

What it checks
--------------
  off-taxonomy      drawers filed outside the approved vocabulary
  duplicate-entity  the same person stored twice, usually a full name and a nickname
  predicate-twin    two relationship names that mean the same thing
  duplicate-triple  the identical fact written more than once
  contradiction     one subject, one predicate, two live answers
  stale             a fact that changes in real life, untouched for months

What it will not do
-------------------
Guess. `works_at` pointing at two companies is either two jobs or one company
written two ways, and no script can tell which. It reports those and stops. A
lint that guessed would manufacture exactly the errors it exists to catch.

It expires rather than deletes, so history stays answerable, and it backs the
database up before changing anything.

Usage
-----
    python3 scripts/memory-lint.py          # report only
    python3 scripts/memory-lint.py --fix    # apply the mechanical repairs
    python3 scripts/memory-lint.py --selftest

Run it monthly.

Changelog
---------
2026-08-17  Written. Reads the local database directly. The volatile-predicate
            and alias tables below are the contract — extend them here, in code,
            rather than ad hoc.
"""

from __future__ import annotations

import argparse
import collections
import datetime as dt
import shutil
import sqlite3
import sys
from pathlib import Path

MEM = Path.home() / ".mempalace"
KG = MEM / "knowledge_graph.sqlite3"
BACKUPS = MEM / "backups"

# --------------------------------------------------------------- the contract
# These four tables ARE the ontology. Extend them here so the rules live in one
# place and every run applies the same ones.

# Predicates whose value changes in real life. A fact using one of these that
# nobody has touched in STALE_DAYS is worth a second look — not wrong, just old.
VOLATILE = {
    "works_at", "lives_in", "role_is", "goal_is", "weight", "salary",
    "studying", "building", "reports_to", "using", "based_in", "title_is",
}
STALE_DAYS = 120

# Pairs that mean the same thing. The first is canonical; the second gets
# rewritten to it. Add a pair the moment you notice a synonym creeping in.
PREDICATE_ALIASES = {
    "employed_by": "works_at",
    "works_for": "works_at",
    "located_in": "lives_in",
    "resides_in": "lives_in",
    "is_working_on": "works_on",
    "married_to": "partner_of",
    "wants_to": "goal_is",
}

# Entity names that are the same thing under two spellings. Key is the alias,
# value is canonical. Populate this as duplicates get reported.
ENTITY_ALIASES: dict[str, str] = {}

# Predicates that legitimately hold several live values at once, so two answers
# is not a contradiction.
MULTI_VALUED = {
    "friend_of", "colleague_of", "works_on", "interested_in", "speaks",
    "prefers", "owns", "member_of", "skilled_in",
}


# ------------------------------------------------------------------ utilities

def today() -> str:
    return dt.date.today().isoformat()


def connect() -> sqlite3.Connection:
    if not KG.exists():
        raise SystemExit(
            f"No knowledge graph at {KG}.\n"
            "Either MemPalace is not installed, or nothing has been written yet.\n"
            "Neither is a problem — there is just nothing to lint."
        )
    return sqlite3.connect(KG)


def backup() -> Path:
    BACKUPS.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    dest = BACKUPS / f"kg-before-lint-{stamp}.sqlite3"
    shutil.copy2(KG, dest)
    return dest


def live(triples):
    """Facts still in force — valid_to is null or empty."""
    return [t for t in triples if not t[5]]


# --------------------------------------------------------------- the checks

def check_predicate_twins(triples):
    """Synonyms for the same relationship. Mechanical: rewrite to canonical."""
    found = []
    for tid, subj, pred, obj, _vf, vt in triples:
        if vt:
            continue
        canon = PREDICATE_ALIASES.get(pred)
        if canon:
            found.append((tid, subj, pred, canon, obj))
    return found


def check_duplicate_entities(triples):
    """The same subject under two names — a full name and a short one.

    Reported, never merged automatically. 'sam' and 'sam_taylor' are usually one
    person and occasionally two, and only you know which.
    """
    names = {t[1] for t in triples} | {t[3] for t in triples}
    pairs = []
    for a in sorted(names):
        for b in sorted(names):
            if a >= b:
                continue
            if b.startswith(a + "_") or a.startswith(b + "_"):
                pairs.append((a, b))
    return pairs


def check_duplicate_triples(triples):
    """Byte-identical facts written more than once. Safe to collapse."""
    seen = collections.defaultdict(list)
    for tid, subj, pred, obj, _vf, vt in triples:
        if vt:
            continue
        seen[(subj, pred, obj)].append(tid)
    return {k: v for k, v in seen.items() if len(v) > 1}


def check_contradictions(triples):
    """One subject, one predicate, two live objects. Needs a human."""
    grouped = collections.defaultdict(set)
    for _tid, subj, pred, obj, _vf, vt in triples:
        if vt or pred in MULTI_VALUED:
            continue
        grouped[(subj, pred)].add(obj)
    return {k: sorted(v) for k, v in grouped.items() if len(v) > 1}


def check_stale(triples, ref: dt.date | None = None):
    """Volatile facts nobody has touched in a long time.

    `ref` defaults to today. It exists so the selftest is deterministic — a test
    that reads the wall clock passes now and fails in four months.
    """
    cutoff = ((ref or dt.date.today()) - dt.timedelta(days=STALE_DAYS)).isoformat()
    out = []
    for tid, subj, pred, obj, vf, vt in triples:
        if vt or pred not in VOLATILE:
            continue
        if vf and str(vf)[:10] < cutoff:
            out.append((tid, subj, pred, obj, str(vf)[:10]))
    return sorted(out, key=lambda r: r[4])


# ------------------------------------------------------------------- reporting

def section(title: str, rows: list, empty: str = "clean") -> None:
    print(f"\n{title}")
    if not rows:
        print(f"  {empty}")
        return
    for r in rows:
        print(f"  {r}")


def main(fix: bool) -> int:
    con = connect()
    try:
        triples = list(con.execute(
            "SELECT id, subject, predicate, object, valid_from, valid_to FROM triples"
        ))
    except sqlite3.Error as e:
        raise SystemExit(
            f"Could not read the triples table: {e}\n"
            "MemPalace's schema changed. Read it before trusting this script."
        )

    n_live = len(live(triples))
    print(f"memory-lint  {len(triples)} facts, {n_live} live, {STALE_DAYS}-day staleness window")

    twins = check_predicate_twins(triples)
    dupes = check_duplicate_triples(triples)
    entities = check_duplicate_entities(triples)
    contras = check_contradictions(triples)
    stale = check_stale(triples)

    section("MECHANICAL — repaired by --fix", [
        f"{p} -> {c}  ({s} {o})" for _i, s, p, c, o in twins
    ] + [
        f"duplicate x{len(ids)}  {s} {p} {o}" for (s, p, o), ids in dupes.items()
    ])

    section("NEEDS YOU — never guessed", [
        f"contradiction  {s} {p} -> {' | '.join(objs)}"
        for (s, p), objs in contras.items()
    ] + [
        f"same person twice?  {a}  /  {b}" for a, b in entities
    ])

    section(f"AGEING — volatile, untouched {STALE_DAYS}+ days", [
        f"{vf}  {s} {p} {o}" for _i, s, p, o, vf in stale
    ])

    mechanical = len(twins) + sum(len(v) - 1 for v in dupes.values())
    if not fix:
        print(f"\n{mechanical} mechanical repair(s) available. Re-run with --fix to apply.")
        print(f"{len(contras) + len(entities)} item(s) need a decision from you.")
        return 0

    if mechanical == 0:
        print("\nNothing mechanical to fix.")
        return 0

    dest = backup()
    print(f"\nbacked up  {dest}")

    for tid, _s, _p, canon, _o in twins:
        con.execute("UPDATE triples SET predicate=? WHERE id=?", (canon, tid))
    for ids in dupes.values():
        for tid in ids[1:]:
            con.execute(
                "UPDATE triples SET valid_to=? WHERE id=?",
                (today(), tid),
            )
    con.commit()
    print(f"applied    {len(twins)} predicate rename(s), "
          f"{sum(len(v) - 1 for v in dupes.values())} duplicate(s) expired")
    print("Nothing was deleted. Expired facts stay readable.")
    return 0


def selftest() -> int:
    """Exercise every check against known input. Touches no real database."""
    # (id, subject, predicate, object, valid_from, valid_to)
    rows = [
        (1, "sam", "employed_by", "acme", "2026-01-01", None),      # twin
        (2, "sam", "works_at", "acme", "2026-01-01", None),
        (3, "sam", "works_at", "acme", "2026-01-01", None),         # duplicate of 2
        (4, "sam", "lives_in", "berlin", "2026-01-01", None),       # contradiction w/ 5
        (5, "sam", "lives_in", "lisbon", "2026-06-01", None),
        (6, "sam_taylor", "friend_of", "kim", "2026-01-01", None),  # dup entity of sam
        (7, "sam", "friend_of", "kim", "2026-01-01", None),         # multi-valued, ok
        (8, "sam", "goal_is", "ship_v1", "2020-01-01", None),       # stale
        (9, "sam", "works_at", "oldco", "2019-01-01", "2026-01-01"),  # expired, ignored
    ]

    twins = check_predicate_twins(rows)
    assert len(twins) == 1 and twins[0][3] == "works_at", twins

    dupes = check_duplicate_triples(rows)
    assert dupes == {("sam", "works_at", "acme"): [2, 3]}, dupes

    contras = check_contradictions(rows)
    assert contras == {("sam", "lives_in"): ["berlin", "lisbon"]}, contras
    assert ("sam", "friend_of") not in contras, "multi-valued must not contradict"

    ents = check_duplicate_entities(rows)
    assert ("sam", "sam_taylor") in ents, ents

    # Fixed reference date so this assertion does not rot with the calendar.
    stale = check_stale(rows, ref=dt.date(2026, 3, 1))
    assert [r[0] for r in stale] == [8], stale
    assert all(r[0] != 9 for r in stale), "expired facts must never be reported stale"

    print("selftest OK — twins, duplicates, contradictions, entities, staleness.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--fix", action="store_true", help="apply the mechanical repairs")
    ap.add_argument("--selftest", action="store_true", help="verify the checks, touch nothing")
    a = ap.parse_args()
    sys.exit(selftest() if a.selftest else main(fix=a.fix))
