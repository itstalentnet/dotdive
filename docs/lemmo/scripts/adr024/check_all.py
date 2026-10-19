#!/usr/bin/env python3
"""
Unified Conformance Gate Runner — Documentation Repository (D-21 revised / D-25 / DoD E4).

Executes all 3 documentation conformance gates in sequence:
  1. export_catalog.py (Markdown parsing, JSON schema validation, governance constraints)
  2. check_doc_refs.py (Exact doc_ref resolution across 50 rules)
  3. negative_tests.py (Mutation-rejection self-tests, including DoD E5 duplicate rule check)

Exit code:
  0: ALL GATES PASSED (100% GREEN)
  1: One or more gates failed
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

GATES = [
    ("export_catalog.py", "Markdown parsing, schema validation & governance constraints"),
    ("check_doc_refs.py", "Exact doc_ref resolution"),
    ("negative_tests.py", "Mutation-rejection self-tests (DoD E5)"),
]


def run_gate(script, desc):
    print(f"\n>>> Running: {script} ({desc}) ...")
    cmd = [sys.executable, os.path.join(HERE, script)]
    res = subprocess.run(cmd)
    if res.returncode != 0:
        print(f"FAILED: {script} exited with code {res.returncode}", file=sys.stderr)
        return False
    return True


def main():
    print("=" * 65)
    print("DOTDIVE ADR-024 CONFORMANCE RUNNER (D-21 revised / D-25)")
    print("=" * 65)

    failed = []
    for script, desc in GATES:
        if not run_gate(script, desc):
            failed.append(script)

    print("\n" + "=" * 65)
    if failed:
        print(f"RESULT: {len(failed)}/{len(GATES)} GATES FAILED ({', '.join(failed)})", file=sys.stderr)
        print("=" * 65, file=sys.stderr)
        sys.exit(1)

    print("RESULT: ALL 3 DOTDIVE ADR-024 GATES PASSED (including negative tests)")
    print("=" * 65)
    sys.exit(0)


if __name__ == "__main__":
    main()
