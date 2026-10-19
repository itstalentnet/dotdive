#!/usr/bin/env python3
"""
ADR-024 negative tests — Documentation Repository (D-21 / REV-7 / DoD D4).

Every case mutates a temporary copy of the catalog or of the Markdown document and
asserts that the corresponding gate:
  1. exits non-zero, AND
  2. prints the scenario's OWN, specific rejection message.

A POSITIVE CONTROL runs first on an untouched copy and must PASS.

Exit code: 0 only if positive controls pass and every mutation is rejected with
its expected message.

Usage:
    python3 dotdive/scripts/adr024/negative_tests.py
"""
import copy
import os
import shutil
import subprocess
import sys
import tempfile

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
DOTDIVE_ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
DECISIONS = os.path.join(DOTDIVE_ROOT, "docs", "lemmo", "01-architecture", "decisions")
CATALOG = os.path.join(HERE, "catalog", "rules.yaml")
DOC = os.path.join(DECISIONS, "ADR-024-service-blueprint-and-conformance.md")


def run(script, extra):
    """Return (returncode, combined stdout+stderr) for one gate invocation."""
    cmd = [sys.executable, os.path.join(HERE, script)] + extra
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.returncode, res.stdout + res.stderr


def write_catalog(path, data):
    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, allow_unicode=True, sort_keys=False, width=100000)


def load_catalog():
    with open(CATALOG, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def set_rule(data, rule_id, **fields):
    for r in data["rules"]:
        if r["id"] == rule_id:
            r.update(fields)
            return
    raise AssertionError("rule not found: %s" % rule_id)


def mutated_catalog(tmpdir, tag, fn):
    """Write a catalog copy mutated by fn(data); return its path."""
    data = load_catalog()
    fn(data)
    path = os.path.join(tmpdir, "catalog-%s.yaml" % tag)
    write_catalog(path, data)
    return path


def mutated_doc(tmpdir, tag, fn):
    """Write a doc copy mutated by fn(text); return its path."""
    with open(DOC, "r", encoding="utf-8") as f:
        text = f.read()
    path = os.path.join(tmpdir, "doc-%s.md" % tag)
    with open(path, "w", encoding="utf-8") as f:
        f.write(fn(text))
    return path


EXTRA_ROW = (
    "\n| `SB-FAKE-99` | **Injected Row** | x | `always` | `full` | `not_started` | "
    "`filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | x |\n"
)


def main():
    tmpdir = tempfile.mkdtemp(prefix="dotdive-adr024-negative-")
    results = []  # (label, ok, detail)

    def expect_reject(label, script, extra, expect, forbid=()):
        rc, out = run(script, extra)
        if rc == 0:
            results.append((label, False, "gate exited 0 (mutation NOT rejected)"))
        elif expect not in out:
            results.append((label, False, "expected message not found: %r" % expect))
        else:
            hit = [f for f in forbid if f in out]
            if hit:
                results.append((label, False, "forbidden message present: %r" % hit))
            else:
                results.append((label, True, "exit=%d, message=%r" % (rc, expect)))

    def expect_accept(label, script, extra, marker):
        rc, out = run(script, extra)
        if rc != 0 or marker not in out:
            results.append((label, False, "positive control did not pass (exit=%d)" % rc))
        else:
            results.append((label, True, "exit=0, %r" % marker))

    try:
        # Positive control: untouched doc copy syncs
        pos_doc = mutated_doc(tmpdir, "positive", lambda t: t)
        expect_accept(
            "positive control: untouched Markdown copy syncs",
            "check_md_sync.py",
            ["--doc", pos_doc, "--md-dir", DECISIONS],
            "RESULT: MD_SYNC=PASS",
        )

        pos_catalog = mutated_catalog(tmpdir, "positive-cat", lambda d: None)
        expect_accept(
            "positive control: untouched catalog doc_refs resolve",
            "check_doc_refs.py",
            ["--catalog", pos_catalog],
            "RESULT: DOC_REF_GATE=PASS",
        )

        # doc_ref gate must reject non-existent / unrelated section specs.
        doc_ref_cases = [
            (
                "doc_refs rejects contracts.md §۶ (no such heading)",
                "SB-DIR-01",
                "dotdive/docs/lemmo/03-backend/contracts.md §۶",
                "heading '6' not found",
            ),
            (
                "doc_refs rejects current-path.md#mvp (no such anchor)",
                "SB-EVT-03",
                "dotdive/docs/lemmo/09-governance/current-path.md#mvp",
                "anchor 'mvp' not found",
            ),
            (
                "doc_refs rejects architecture.md §بند ۷ (no decision section)",
                "SB-DIR-01",
                "dotdive/docs/lemmo/03-backend/architecture.md §بند ۷",
                "no 'متن تصمیم' section to host 'بند 7'",
            ),
            (
                "doc_refs rejects iam-service-spec.md §۶.۹ (no such item)",
                "SB-SEC-01",
                "dotdive/docs/lemmo/03-backend/iam-service-spec.md §۶.۹",
                "no heading/item for '6.9'",
            ),
        ]
        for i, (label, rule_id, bad_ref, expect) in enumerate(doc_ref_cases):
            p = mutated_catalog(
                tmpdir, "docref-%d" % i, lambda d, r=rule_id, b=bad_ref: set_rule(d, r, doc_ref=b)
            )
            expect_reject(label, "check_doc_refs.py", ["--catalog", p], expect)

        # Markdown/YAML parity must reject a mutated catalog value.
        p = mutated_catalog(
            tmpdir, "mdname", lambda d: set_rule(d, "SB-DIR-01", name="Mutated Rule Name")
        )
        expect_reject(
            "md_sync rejects a mutated rule name",
            "check_md_sync.py",
            ["--catalog", p],
            "Rule SB-DIR-01 name mismatch",
        )

        p = mutated_catalog(
            tmpdir,
            "mdref",
            lambda d: set_rule(d, "SB-DIR-01", doc_ref="dotdive/docs/lemmo/03-backend/contracts.md §۱"),
        )
        expect_reject(
            "md_sync rejects a mutated doc_ref",
            "check_md_sync.py",
            ["--catalog", p],
            "Rule SB-DIR-01 doc_ref mismatch",
        )

        # Markdown/YAML parity must reject an EXTRA Markdown row (DoD D4).
        pdoc = mutated_doc(tmpdir, "extra", lambda t: t + EXTRA_ROW)
        expect_reject(
            "md_sync rejects an extra Markdown row",
            "check_md_sync.py",
            ["--doc", pdoc, "--md-dir", DECISIONS],
            "Extra Markdown row not present in YAML: SB-FAKE-99",
        )

        # Markdown/YAML parity must reject a MISSING rule row.
        def drop_first_rule_row(text):
            lines = text.split("\n")
            out = []
            dropped = False
            for line in lines:
                if not dropped and line.startswith("| `SB-DIR-01` |"):
                    dropped = True
                    continue
                out.append(line)
            assert dropped, "SB-DIR-01 row not found to drop"
            return "\n".join(out)

        pdoc = mutated_doc(tmpdir, "missing", drop_first_rule_row)
        expect_reject(
            "md_sync rejects a missing Markdown row",
            "check_md_sync.py",
            ["--doc", pdoc, "--md-dir", DECISIONS],
            "Rule SB-DIR-01 not found in Markdown tables",
        )
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    print("=" * 65)
    print("DOTDIVE ADR-024 NEGATIVE TESTS (D-21 / DoD D4)")
    print("=" * 65)
    ok = True
    for label, passed, detail in results:
        print("  [%s] %s" % ("PASS" if passed else "FAIL", label))
        print("         %s" % detail)
        ok = ok and passed
    print("-" * 65)
    if not ok:
        print(
            "RESULT: NEGATIVE_TESTS=FAIL (a gate failed to reject a mutation, or a positive control failed)",
            file=sys.stderr,
        )
        return 1
    print("All %d documentation test cases behaved as specified." % len(results))
    print("RESULT: NEGATIVE_TESTS=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
