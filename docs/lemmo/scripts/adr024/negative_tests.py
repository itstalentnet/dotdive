#!/usr/bin/env python3
"""
ADR-024 negative tests — Documentation Repository (D-21 revised / D-25 / DoD E5).

Every case mutates a temporary copy of the canonical Markdown catalog
(docs/lemmo/01-architecture/decisions/ADR-024-rules-catalog.md) and asserts that
the corresponding gate:
  1. exits non-zero, AND
  2. prints the scenario's OWN, specific rejection message.

A POSITIVE CONTROL runs first on an untouched copy and must PASS.

Exit code: 0 only if positive controls pass and every mutation is rejected with
its expected message.

Usage:
    python3 dotdive/docs/lemmo/scripts/adr024/negative_tests.py
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
# HERE is dotdive/docs/lemmo/scripts/adr024
LEMMO_DOCS = os.path.normpath(os.path.join(HERE, "..", ".."))
DOC = os.path.join(LEMMO_DOCS, "01-architecture", "decisions", "ADR-024-rules-catalog.md")
SCHEMA = os.path.join(HERE, "rules-catalog.schema.json")


def run(script, extra):
    """Return (returncode, combined stdout+stderr) for one gate invocation."""
    cmd = [sys.executable, os.path.join(HERE, script)] + extra
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.returncode, res.stdout + res.stderr


def mutated_doc(tmpdir, tag, fn):
    """Write a doc copy mutated by fn(text); return its path."""
    with open(DOC, "r", encoding="utf-8") as f:
        text = f.read()
    path = os.path.join(tmpdir, "doc-%s.md" % tag)
    with open(path, "w", encoding="utf-8") as f:
        f.write(fn(text))
    return path


DUPLICATE_RULE_SECTION = (
    "\n### SB-DIR-01: Duplicate Injected Rule\n\n"
    "- **ID:** `SB-DIR-01`\n"
    "- **Name:** Duplicate Injected Rule\n"
    "- **Requirement:** Test duplicate rejection\n"
    "- **Check:** `static`\n"
    "- **Scope:** `service`\n"
    "- **Applies To:** `[go-service]`\n"
    "- **Applies When:** `always`\n"
    "- **Automation:** `full`\n"
    "- **Implementation Status:** `not_started`\n"
    "- **Evaluation Mechanism:** `filesystem`\n"
    "- **Roadmap Stage:** `1`\n"
    "- **Gate:** `new_service`\n"
    "- **Enforced By:** `lemmo-cli check`\n"
    "- **Doc Status:** `approved`\n"
    "- **Doc Ref:** dotdive/docs/lemmo/01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md §۳\n"
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
        # Positive control 1: untouched Markdown catalog parses and validates
        pos_doc = mutated_doc(tmpdir, "positive-export", lambda t: t)
        expect_accept(
            "positive control: untouched Markdown catalog exports & validates",
            "export_catalog.py",
            ["--doc", pos_doc, "--schema", SCHEMA],
            "RESULT: CATALOG_EXPORT_VALIDATION=PASS",
        )

        # Positive control 2: untouched doc_refs resolve
        expect_accept(
            "positive control: untouched catalog doc_refs resolve",
            "check_doc_refs.py",
            ["--doc", pos_doc],
            "RESULT: DOC_REF_GATE=PASS",
        )

        # E5 Mutation: export_catalog parser must reject duplicate rule ID
        pdoc = mutated_doc(tmpdir, "dup-id", lambda t: t + DUPLICATE_RULE_SECTION)
        expect_reject(
            "export_catalog rejects duplicate rule ID (DoD E5)",
            "export_catalog.py",
            ["--doc", pdoc, "--schema", SCHEMA],
            "Duplicate rule ID found: SB-DIR-01",
        )

        # Mutation: export_catalog rejects total_rules count mismatch (drop a rule)
        def drop_first_rule(text):
            return re.sub(r"###\s+SB-DIR-01:[^\n]*\n.*?(?=\n###|\Z)", "", text, flags=re.DOTALL)

        pdoc = mutated_doc(tmpdir, "total-rules-mismatch", drop_first_rule)
        expect_reject(
            "export_catalog rejects total_rules != len(rules)",
            "export_catalog.py",
            ["--doc", pdoc, "--schema", SCHEMA],
            "total_rules=50 does not equal len(rules)=49",
        )

        # Mutation: export_catalog rejects draft_source at Stage 1 with new_service gate
        def inject_draft_source_m1(text):
            return text.replace(
                "- **ID:** `SB-DIR-01`\n- **Name:** Clean Architecture Layering Standard\n- **Requirement:** وجود پوشه‌های مجزای internal/domain (موجودیت‌های ناب دامنه)، internal/app (یوزکیس‌ها و سرویس‌های کاربردی)، internal/ports (اینترفیس‌های ورودی و خروجی) و internal/adapters (پیاده‌سازی آداپتورهای HTTP، gRPC و پایگاه داده).\n- **Check:** `static`\n- **Scope:** `service`\n- **Applies To:** `[go-service]`\n- **Applies When:** `always`\n- **Automation:** `full`\n- **Implementation Status:** `not_started`\n- **Evaluation Mechanism:** `filesystem`\n- **Roadmap Stage:** `1`\n- **Gate:** `new_service`\n- **Enforced By:** `lemmo-cli check`\n- **Doc Status:** `approved`",
                "- **ID:** `SB-DIR-01`\n- **Name:** Clean Architecture Layering Standard\n- **Requirement:** وجود پوشه‌های مجزای internal/domain (موجودیت‌های ناب دامنه)، internal/app (یوزکیس‌ها و سرویس‌های کاربردی)، internal/ports (اینترفیس‌های ورودی و خروجی) و internal/adapters (پیاده‌سازی آداپتورهای HTTP، gRPC و پایگاه داده).\n- **Check:** `static`\n- **Scope:** `service`\n- **Applies To:** `[go-service]`\n- **Applies When:** `always`\n- **Automation:** `full`\n- **Implementation Status:** `not_started`\n- **Evaluation Mechanism:** `filesystem`\n- **Roadmap Stage:** `1`\n- **Gate:** `new_service`\n- **Enforced By:** `lemmo-cli check`\n- **Doc Status:** `draft_source`",
            )

        pdoc = mutated_doc(tmpdir, "draft-source-m1", inject_draft_source_m1)
        expect_reject(
            "export_catalog rejects draft_source + Stage-1 new_service",
            "export_catalog.py",
            ["--doc", pdoc, "--schema", SCHEMA],
            "SB-DIR-01: doc_status='draft_source' but gate=new_service at Stage 1",
        )

        # Mutation: export_catalog rejects missing required field
        pdoc = mutated_doc(tmpdir, "missing-field", lambda t: t.replace("- **Applies When:** `always`\n", ""))
        expect_reject(
            "export_catalog rejects missing required field",
            "export_catalog.py",
            ["--doc", pdoc, "--schema", SCHEMA],
            "field Applies When not found",
        )

        # Mutation: doc_refs rejects non-existent heading in contracts.md
        pdoc = mutated_doc(
            tmpdir,
            "heading-miss",
            lambda t: t.replace(
                "dotdive/docs/lemmo/03-backend/contracts.md §۱",
                "dotdive/docs/lemmo/03-backend/contracts.md §۹۹",
            ),
        )
        expect_reject(
            "doc_refs rejects contracts.md §۹۹ (no such heading)",
            "check_doc_refs.py",
            ["--doc", pdoc],
            "heading '99' not found",
        )

        # Mutation: doc_refs rejects non-existent anchor in current-path.md
        pdoc = mutated_doc(
            tmpdir,
            "anchor-miss",
            lambda t: t.replace(
                "dotdive/docs/lemmo/09-governance/current-path.md#f-7",
                "dotdive/docs/lemmo/09-governance/current-path.md#mvp",
            ),
        )
        expect_reject(
            "doc_refs rejects current-path.md#mvp (no such anchor)",
            "check_doc_refs.py",
            ["--doc", pdoc],
            "anchor 'mvp' not found",
        )

        # Mutation: doc_refs rejects decision clause when no decision section exists
        pdoc = mutated_doc(
            tmpdir,
            "clause-no-section",
            lambda t: t.replace(
                "dotdive/docs/lemmo/03-backend/architecture.md §۱",
                "dotdive/docs/lemmo/03-backend/architecture.md §بند ۷",
            ),
        )
        expect_reject(
            "doc_refs rejects architecture.md §بند ۷ (no decision section)",
            "check_doc_refs.py",
            ["--doc", pdoc],
            "no 'متن تصمیم' section to host 'بند 7'",
        )

        # Mutation: doc_refs rejects missing subitem under heading
        pdoc = mutated_doc(
            tmpdir,
            "subitem-miss",
            lambda t: t.replace(
                "dotdive/docs/lemmo/03-backend/iam-service-spec.md §1.2",
                "dotdive/docs/lemmo/03-backend/iam-service-spec.md §۶.۹",
            ),
        )
        expect_reject(
            "doc_refs rejects iam-service-spec.md §۶.۹ (no such item)",
            "check_doc_refs.py",
            ["--doc", pdoc],
            "no heading/item for '6.9'",
        )
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    print("=" * 65)
    print("DOTDIVE ADR-024 NEGATIVE TESTS (D-21 revised / DoD E5)")
    print("=" * 65)
    ok = True
    for label, passed, detail in results:
        print("  [%s] %s" % ("PASS" if passed else "FAIL", label))
        print("         %s" % detail)
        if not passed:
            ok = False
    print("-" * 65)
    if not ok:
        print("RESULT: NEGATIVE_TESTS=FAIL (a gate failed to reject a mutation, or a positive control failed)", file=sys.stderr)
        return 1
    print("All %d documentation test cases behaved as specified." % len(results))
    print("RESULT: NEGATIVE_TESTS=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
