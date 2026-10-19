#!/usr/bin/env python3
"""
ADR-024 unified documentation conformance runner — Dotdive Repository (D-21 / REV-6).

Single authoritative command that a reviewer/PM can run independently, from the
repository root or clone root, without reading any report:

  1. check_doc_refs.py        (strict, deterministic section/anchor resolution)
  2. check_md_sync.py         (all-column Markdown/YAML parity)
  3. negative_tests.py        (mutation-rejection self-test)

Usage:
    python3 dotdive/scripts/adr024/check_all.py
    # or inside standalone clone of dotdive:
    python3 scripts/adr024/check_all.py

Exit code: 0 only if EVERY gate passes. Output is deterministic for any
PYTHONHASHSEED.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOTDIVE_ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))

GATES = [
    ("check_doc_refs.py", "strict document reference resolution"),
    ("check_md_sync.py", "all-column Markdown/YAML parity"),
    ("negative_tests.py", "mutation-rejection self-test"),
]


def main():
    print("=" * 65)
    print("DOTDIVE ADR-024 DOCUMENTATION CONFORMANCE RUNNER (D-21)")
    print("=" * 65)
    print("Dotdive root: %s" % DOTDIVE_ROOT)

    failed = []
    for script, label in GATES:
        print("\n>>> Running: %s (%s) ..." % (script, label))
        res = subprocess.run(
            [sys.executable, os.path.join(HERE, script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=DOTDIVE_ROOT,
        )
        out = res.stdout.rstrip("\n")
        err = res.stderr.rstrip("\n")
        if out:
            print(out)
        if err:
            print(err, file=sys.stderr)
        if res.returncode != 0:
            print("FAILED: %s exited with code %d" % (script, res.returncode), file=sys.stderr)
            failed.append(script)

    print("\n" + "=" * 65)
    if failed:
        print("RESULT: %d/%d GATES FAILED (%s)" % (len(failed), len(GATES), ", ".join(failed)), file=sys.stderr)
        print("=" * 65, file=sys.stderr)
        return 1
    print("RESULT: ALL %d DOTDIVE ADR-024 GATES PASSED (including negative tests)" % len(GATES))
    print("=" * 65)
    return 0


if __name__ == "__main__":
    sys.exit(main())
