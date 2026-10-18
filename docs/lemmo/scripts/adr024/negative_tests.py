#!/usr/bin/env python3
"""
ADR-024 negative tests (REV-6 §A-4).

Each case mutates a temporary copy of the catalog (or Markdown) and asserts that
the corresponding gate FAILS (non-zero exit). A gate that cannot fail is not a
gate. Committed as part of the suite and invoked by check_all.py.

Exit code: 0 only if every mutation is correctly rejected.

Usage:
    python3 docs/lemmo/scripts/adr024/negative_tests.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DECISIONS = os.path.join(REPO_ROOT, "dotdive/docs/lemmo/01-architecture/decisions")
CATALOG = os.path.join(DECISIONS, "ADR-024.rules.yaml")
DOC = os.path.join(DECISIONS, "ADR-024-service-blueprint-and-conformance.md")


def run(script, extra):
    cmd = [sys.executable, os.path.join(HERE, script)] + extra
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.returncode


def write_catalog(path, data):
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False, width=100000)


def load_catalog():
    with open(CATALOG, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def mutate_doc_ref(out_path, rule_id, bad_ref):
    data = load_catalog()
    for r in data["rules"]:
        if r["id"] == rule_id:
            r["doc_ref"] = bad_ref
            break
    write_catalog(out_path, data)


def main():
    tmpdir = tempfile.mkdtemp(prefix="adr024-negative-")
    results = []
    try:
        # --- doc_ref gate must reject non-existent / unrelated sections ---
        doc_ref_cases = [
            ("SB-DIR-01", "dotdive/docs/lemmo/03-backend/contracts.md §۶", "contracts.md §۶ (no such section)"),
            ("SB-EVT-03", "dotdive/docs/lemmo/09-governance/current-path.md#mvp", "current-path.md#mvp (no such anchor)"),
            ("SB-DIR-01", "dotdive/docs/lemmo/03-backend/architecture.md §بند ۷", "architecture.md §بند ۷ (no decision clause)"),
            ("SB-SEC-01", "dotdive/docs/lemmo/03-backend/iam-service-spec.md §۶.۹", "iam-service-spec.md §۶.۹ (no such item in §۶)"),
        ]
        for rule_id, bad_ref, label in doc_ref_cases:
            p = os.path.join(tmpdir, "catalog_docref_%s.yaml" % len(results))
            mutate_doc_ref(p, rule_id, bad_ref)
            rc = run("check_doc_refs.py", ["--catalog", p])
            results.append(("doc_refs rejects %s" % label, rc != 0))

        # --- validator must reject a wrong total_rules counter ---
        p = os.path.join(tmpdir, "catalog_total.yaml")
        data = load_catalog()
        data["total_rules"] = len(data["rules"]) - 1
        write_catalog(p, data)
        results.append(("validate rejects total_rules != len(rules)", run("validate_catalog.py", ["--catalog", p]) != 0))

        # --- validator must reject an unapproved source gated for new services ---
        p = os.path.join(tmpdir, "catalog_gapgate.yaml")
        data = load_catalog()
        for r in data["rules"]:
            if r["id"] == "SB-DIR-01":
                r["doc_status"] = "gap"
                r["roadmap_stage"] = 1
                r["gate"] = "new_service"
                break
        write_catalog(p, data)
        results.append(("validate rejects gap + Stage-1 new_service", run("validate_catalog.py", ["--catalog", p]) != 0))

        # --- md sync must reject a mutated catalog value ---
        p = os.path.join(tmpdir, "catalog_md.yaml")
        data = load_catalog()
        for r in data["rules"]:
            if r["id"] == "SB-DIR-01":
                r["name"] = r["name"] + " MUTATED"
                break
        write_catalog(p, data)
        results.append(("md_sync rejects mutated rule name", run("check_md_sync.py", ["--catalog", p]) != 0))

        # --- md sync must reject an extra Markdown row ---
        pdoc = os.path.join(tmpdir, "adr024-extra.md")
        shutil.copyfile(DOC, pdoc)
        with open(pdoc, "a", encoding="utf-8") as f:
            f.write("\n| `SB-FAKE-99` | **Injected Row** | x | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | x |\n")
        results.append(("md_sync rejects extra Markdown row", run("check_md_sync.py", ["--doc", pdoc]) != 0))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    print("=" * 65)
    print("ADR-024 NEGATIVE TESTS (mutation must be rejected)")
    print("=" * 65)
    ok = True
    for label, passed in results:
        print("  [%s] %s" % ("PASS" if passed else "FAIL", label))
        ok = ok and passed
    print("-" * 65)
    if not ok:
        print("RESULT: NEGATIVE_TESTS=FAIL (a gate failed to reject a mutation)", file=sys.stderr)
        return 1
    print("All %d mutations were correctly rejected." % len(results))
    print("RESULT: NEGATIVE_TESTS=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
