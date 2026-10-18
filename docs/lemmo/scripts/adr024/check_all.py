#!/usr/bin/env python3
"""
Single authoritative runner that executes all ADR-024 conformance checkers:
  1. validate_catalog.py (JSON Schema Draft-07, count equality, draft_source gate constraints)
  2. check_doc_refs.py (Exact heading/band/anchor verification across all 50 rules)
  3. check_manifest_paths.py (CEL path validation against service-manifest schema)
  4. check_md_sync.py (Zero-diff parity between ADR-024.rules.yaml and ADR-024 Markdown tables)

Exit code: 0 if ALL pass, non-zero if ANY fails.
"""
import sys
import os
import subprocess

def run_script(script_path):
    print(f"\n>>> Running: {os.path.basename(script_path)} ...")
    res = subprocess.run([sys.executable, script_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.stdout:
        print(res.stdout.strip())
    if res.returncode != 0:
        if res.stderr:
            print(res.stderr.strip(), file=sys.stderr)
        print(f"FAILED: {os.path.basename(script_path)} exited with code {res.returncode}", file=sys.stderr)
        return False
    return True

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    scripts = [
        os.path.join(script_dir, "validate_catalog.py"),
        os.path.join(script_dir, "check_doc_refs.py"),
        os.path.join(script_dir, "check_manifest_paths.py"),
        os.path.join(script_dir, "check_md_sync.py"),
    ]

    print("=================================================================")
    print("LEMMO ADR-024 UNIFIED CONFORMANCE RUNNER (REV-5)")
    print("=================================================================")

    all_passed = True
    for s in scripts:
        if not os.path.exists(s):
            print(f"ERROR: Missing script {s}", file=sys.stderr)
            sys.exit(1)
        if not run_script(s):
            all_passed = False
            break

    print("\n=================================================================")
    if all_passed:
        print("RESULT: ALL 4 ADR-024 VERIFICATION GATES PASSED (100% GREEN)")
        print("=================================================================")
        sys.exit(0)
    else:
        print("RESULT: CONFORMANCE SUITE FAILED", file=sys.stderr)
        print("=================================================================")
        sys.exit(1)

if __name__ == "__main__":
    main()
