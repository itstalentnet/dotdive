#!/usr/bin/env python3
"""
ADR-024 unified conformance runner (REV-6).

Single authoritative command that a reviewer/PM can run independently, from the
repository root, without reading any report. Executes every gate and the
committed negative tests:

  1. validate_catalog.py      (real jsonschema Draft-07 + governance gates)
  2. check_doc_refs.py        (strict, deterministic section/anchor resolution)
  3. check_manifest_paths.py  (manifest.* paths declared in the manifest schema)
  4. check_md_sync.py         (all-column parity YAML <-> Markdown)
  5. negative_tests.py        (each gate must reject a deliberate mutation)

Usage:
    python3 dotdive/docs/lemmo/scripts/adr024/check_all.py

Exit code: 0 only if EVERY gate passes. Output is deterministic for any
PYTHONHASHSEED.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))

GATES = [
    ("validate_catalog.py", "catalog schema + architectural constraints"),
    ("check_doc_refs.py", "strict document reference resolution"),
    ("check_manifest_paths.py", "manifest.* path declarations"),
    ("check_md_sync.py", "all-column Markdown/YAML parity"),
    ("negative_tests.py", "mutation-rejection self-test"),
]


def main():
    print("=" * 65)
    print("LEMMO ADR-024 UNIFIED CONFORMANCE RUNNER (REV-6)")
    print("=" * 65)
    print("Repo root: %s" % REPO_ROOT)

    failed = []
    for script, label in GATES:
        print("\n>>> Running: %s (%s) ..." % (script, label))
        res = subprocess.run(
            [sys.executable, os.path.join(HERE, script)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=REPO_ROOT,
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
    print("RESULT: ALL %d ADR-024 GATES PASSED (including negative tests)" % len(GATES))
    print("=" * 65)
    return 0


if __name__ == "__main__":
    sys.exit(main())
