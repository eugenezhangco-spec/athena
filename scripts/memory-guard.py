#!/usr/bin/env python3
"""Enforce the memory taxonomy at the write path, not in a rule file.

Why this exists
---------------
A memory system with an open vocabulary drifts. Six approved wings become
twenty-two, the same subject ends up filed in three places, and by month four
nothing is findable. The usual fix is to write the approved list into a rules
file and hope the assistant reads it.

That does not work, and the reason is specific: memories are also filed by
background hooks that never load your rules. A rule is a note on the wall. This
is a lock on the door.

What it does
------------
Patches the installed MemPalace package so `add_drawer` rejects any wing or room
outside the vocabulary in personal/memory-taxonomy.md, and returns the valid
options in the error so the caller corrects itself and retries.

Fails open by design. No taxonomy file means no contract to enforce, and filing
a memory is worth more than refusing one.

Usage
-----
    python3 scripts/memory-guard.py           # apply (idempotent)
    python3 scripts/memory-guard.py --check   # report status, change nothing
    python3 scripts/memory-guard.py --remove  # restore the original

Re-run it after any `pipx upgrade mempalace` — an upgrade replaces the file this
patches. The patch loads on the next MCP reconnect, not mid-session.

Changelog
---------
2026-08-17  Written. Local-first: finds the MemPalace install on this machine
            rather than reaching a server over SSH.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAXONOMY_DOC = ROOT / "personal" / "memory-taxonomy.md"
TAXONOMY_JSON = Path.home() / ".mempalace" / "taxonomy.json"

MARK_START = "    # --- taxonomy guard (scripts/memory-guard.py) ---"
MARK_END = "    # --- end taxonomy guard ---"

HELPERS = '''
# --- taxonomy guard (scripts/memory-guard.py) ---
import json as _tax_json
import os as _tax_os

_TAXONOMY_PATH = _tax_os.path.expanduser("~/.mempalace/taxonomy.json")
_TAXONOMY_CACHE = None


def _taxonomy():
    """Approved wing -> [rooms]. An empty dict disables the guard."""
    global _TAXONOMY_CACHE
    if _TAXONOMY_CACHE is None:
        try:
            with open(_TAXONOMY_PATH) as fh:
                _TAXONOMY_CACHE = _tax_json.load(fh)
        except Exception:
            # No vocabulary file means no contract to enforce. Filing a memory
            # is more valuable than refusing one, so fail open and stay quiet.
            _TAXONOMY_CACHE = {}
    return _TAXONOMY_CACHE


def _taxonomy_violation(wing, room):
    """Return an error string if wing/room is off-vocabulary, else None."""
    tax = _taxonomy()
    if not tax:
        return None
    if wing not in tax:
        return (
            "Wing '%s' is not in the memory taxonomy. Approved wings: %s. "
            "Pick one of those, or add the new wing to personal/memory-taxonomy.md "
            "and re-run scripts/memory-guard.py first." % (wing, ", ".join(sorted(tax)))
        )
    if room not in tax[wing]:
        return (
            "Room '%s' is not approved for wing '%s'. Approved rooms in '%s': %s."
            % (room, wing, wing, ", ".join(sorted(tax[wing])))
        )
    return None


def _taxonomy_hint():
    tax = _taxonomy()
    if not tax:
        return ""
    listing = " | ".join(
        "%s: %s" % (w, ", ".join(sorted(r))) for w, r in sorted(tax.items())
    )
    return " Wing and room MUST come from this closed list: %s" % listing
# --- end taxonomy guard ---
'''

CALL = f'''{MARK_START}
    _tax_err = _taxonomy_violation(wing, room)
    if _tax_err:
        return {{"success": False, "error": _tax_err}}
{MARK_END}
'''


# ----------------------------------------------------------------- taxonomy

def parse_taxonomy(doc: str) -> dict[str, list[str]]:
    """Pull the wing table out of the taxonomy doc.

    Rows look like:
      | **me** | You, who you are | `identity` · `preferences` · ... |
    """
    tax: dict[str, list[str]] = {}
    row = re.compile(
        r"^\|\s*\*\*([a-z][a-z0-9_-]*)\*\*\s*\|[^|]*\|\s*(.+?)\s*\|\s*$", re.M
    )
    for wing, rooms_cell in row.findall(doc):
        rooms = re.findall(r"`([a-z][a-z0-9_-]*)`", rooms_cell)
        if rooms:
            tax[wing] = sorted(set(rooms))
    if not tax:
        raise SystemExit(
            f"Could not parse any wings out of {TAXONOMY_DOC}.\n"
            "The table shape changed. Fix the table or this parser — do not guess."
        )
    return tax


# ------------------------------------------------------------ find install

def find_package() -> Path:
    """Locate the installed mempalace package on this machine.

    Checks pipx first (the recommended install), then falls back to importing
    it, which covers pip --user, a venv, and Homebrew Python alike.
    """
    pipx = Path.home() / ".local/share/pipx/venvs/mempalace/lib"
    if pipx.is_dir():
        for pyver in sorted(pipx.glob("python3.*")):
            candidate = pyver / "site-packages" / "mempalace"
            if candidate.is_dir():
                return candidate

    try:
        out = subprocess.run(
            [sys.executable, "-c",
             "import mempalace, os; print(os.path.dirname(mempalace.__file__))"],
            capture_output=True, text=True, timeout=30,
        )
        if out.returncode == 0 and out.stdout.strip():
            return Path(out.stdout.strip())
    except Exception:
        pass

    raise SystemExit(
        "Could not find the MemPalace package.\n"
        "Install it first:  pipx install mempalace\n"
        "Then re-run this script."
    )


def find_server_file(pkg: Path) -> Path:
    """The module holding add_drawer. Named differently across versions, so
    search for the function rather than trusting a filename."""
    for path in sorted(pkg.rglob("*.py")):
        try:
            if "def tool_add_drawer" in path.read_text(encoding="utf-8"):
                return path
        except (UnicodeDecodeError, OSError):
            continue
    raise SystemExit(
        f"No file under {pkg} defines tool_add_drawer.\n"
        "MemPalace's internals changed. Read the package before patching it."
    )


# ----------------------------------------------------------------- patching

def apply(check_only: bool = False) -> int:
    if not TAXONOMY_DOC.exists():
        raise SystemExit(f"No taxonomy at {TAXONOMY_DOC}. Nothing to enforce.")

    tax = parse_taxonomy(TAXONOMY_DOC.read_text(encoding="utf-8"))
    pkg = find_package()
    target = find_server_file(pkg)
    src = target.read_text(encoding="utf-8")
    patched = MARK_START in src

    print(f"taxonomy  {len(tax)} wings, {sum(len(r) for r in tax.values())} rooms")
    print(f"package   {pkg}")
    print(f"target    {target.name}")
    print(f"state     {'PATCHED' if patched else 'unpatched'}")

    if check_only:
        live = "yes" if TAXONOMY_JSON.exists() else "NO — guard is inert without it"
        print(f"vocab     {TAXONOMY_JSON} present: {live}")
        return 0

    # The vocabulary the patched code reads at runtime.
    TAXONOMY_JSON.parent.mkdir(parents=True, exist_ok=True)
    TAXONOMY_JSON.write_text(json.dumps(tax, indent=2) + "\n", encoding="utf-8")
    print(f"wrote     {TAXONOMY_JSON}")

    if patched:
        print("\nAlready patched. Vocabulary refreshed; code untouched.")
        return 0

    if "def tool_add_drawer" not in src:
        raise SystemExit("tool_add_drawer vanished between checks. Aborting.")

    backup = target.with_suffix(target.suffix + ".orig")
    if not backup.exists():
        shutil.copy2(target, backup)
        print(f"backup    {backup.name}")

    # Helpers go at module level, after the imports block.
    lines = src.split("\n")
    insert_at = 0
    for i, line in enumerate(lines[:80]):
        if line.startswith(("import ", "from ")):
            insert_at = i + 1
    lines.insert(insert_at, HELPERS)
    src = "\n".join(lines)

    # The check goes at the top of the function body, after its docstring.
    fn = re.search(
        r"(def tool_add_drawer\([^)]*\)[^:]*:\n(?:\s*(?:'''|\"\"\").*?(?:'''|\"\"\")\n)?)",
        src, re.S,
    )
    if not fn:
        target.write_text(backup.read_text(encoding="utf-8"), encoding="utf-8")
        raise SystemExit(
            "Found tool_add_drawer but could not parse its signature. "
            "Restored the original and changed nothing else."
        )
    src = src[: fn.end()] + CALL + src[fn.end():]

    target.write_text(src, encoding="utf-8")
    print("\nGuard applied. It loads on the next MCP reconnect, not mid-session.")
    print("Re-run this after any `pipx upgrade mempalace`.")
    return 0


def remove() -> int:
    pkg = find_package()
    target = find_server_file(pkg)
    backup = target.with_suffix(target.suffix + ".orig")
    if not backup.exists():
        print("No .orig backup. Nothing to restore.")
        return 1
    shutil.copy2(backup, target)
    print(f"Restored {target.name} from {backup.name}. Guard removed.")
    return 0


def selftest() -> int:
    """Exercise the parser and the runtime check without touching any install."""
    tax = parse_taxonomy(
        "| **me** | You | `identity` · `goals` |\n"
        "| **work** | Job | `clients` |\n"
    )
    assert tax == {"me": ["goals", "identity"], "work": ["clients"]}, tax

    ns: dict = {}
    exec(HELPERS, ns)
    ns["_TAXONOMY_CACHE"] = tax

    assert ns["_taxonomy_violation"]("me", "goals") is None
    assert "not in the memory taxonomy" in ns["_taxonomy_violation"]("mission", "goals")
    assert "not approved for wing" in ns["_taxonomy_violation"]("me", "clients")

    # Fail open: no vocabulary, no enforcement.
    ns["_TAXONOMY_CACHE"] = {}
    assert ns["_taxonomy_violation"]("anything", "at_all") is None

    print("selftest OK — parser, rejection, and fail-open all behave.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--check", action="store_true", help="report status, change nothing")
    ap.add_argument("--remove", action="store_true", help="restore the original file")
    ap.add_argument("--selftest", action="store_true", help="verify the logic, touch nothing")
    a = ap.parse_args()
    if a.selftest:
        sys.exit(selftest())
    sys.exit(remove() if a.remove else apply(check_only=a.check))
