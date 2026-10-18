#!/usr/bin/env python3
"""
ADR-024 Markdown/YAML parity gate (REV-6).

Compares EVERY column of the ADR-024 Markdown rule tables against the machine
catalog ADR-024.rules.yaml and detects both missing rules and extra rows.

Compared columns (REV-6 §A-3):
  id, name, requirement, applies_when, automation, implementation_status,
  evaluation_mechanism, gate/roadmap_stage, enforced_by, doc_status, doc_ref.

Deterministic output. Exit code: 0 on parity, 1 otherwise.

Usage:
    python3 docs/lemmo/scripts/adr024/check_md_sync.py [--catalog PATH] [--doc PATH]
"""
import argparse
import os
import re
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DECISIONS = "dotdive/docs/lemmo/01-architecture/decisions"
DEFAULT_CATALOG = os.path.join(REPO_ROOT, DECISIONS, "ADR-024.rules.yaml")
DEFAULT_DOC = os.path.join(REPO_ROOT, DECISIONS, "ADR-024-service-blueprint-and-conformance.md")

DOC_STATUS_LABEL = {"approved": "مصوب", "draft_source": "پیش‌نویس", "gap": "شکاف سند"}

ROW_RE = re.compile(
    r"^\|\s*`(?P<id>[A-Z0-9-]+)`\s*\|\s*\*\*(?P<name>[^*]+)\*\*\s*\|(?P<rest>.+)$"
)


def md_doc_ref_to_catalog(cell, md_dir):
    """Reverse the generator's link rendering back into `path §spec, path §spec`."""
    refs = []
    for label, target in re.findall(r"\[([^\]]+)\]\(([^)]+)\)", cell):
        abspath = os.path.normpath(os.path.join(md_dir, target.strip()))
        rel = os.path.relpath(abspath, REPO_ROOT)
        base = os.path.basename(rel)
        clean = base[:-3] if base.endswith(".md") else base
        spec = label.strip()[len(clean):].strip()
        refs.append((rel + " " + spec).strip() if spec else rel)
    return ", ".join(refs)


def parse_md(md_content, md_dir):
    rows = {}
    extra = []
    for line in md_content.split("\n"):
        m = ROW_RE.match(line)
        if not m:
            continue
        rest = m.group("rest").rstrip()
        if rest.endswith("|"):
            rest = rest[:-1]
        # Split on table separators only (a bare `|`), never on the logical OR `||`
        # that appears inside CEL expressions such as `... > 0 || ... > 0`.
        cols = [c.strip() for c in re.split(r"(?<!\|)\|(?!\|)", rest)]
        if len(cols) != 9:
            extra.append(m.group("id"))
            continue
        rows[m.group("id")] = {
            "name": m.group("name").strip(),
            "requirement": cols[0],
            "applies_when": cols[1].strip("`"),
            "automation": cols[2].strip("`"),
            "implementation_status": cols[3].strip("`"),
            "evaluation_mechanism": cols[4].strip("`"),
            "gate_stage": cols[5],
            "enforced_by": cols[6].strip("`"),
            "doc_status": cols[7],
            "doc_ref": md_doc_ref_to_catalog(cols[8], md_dir),
        }
    return rows, extra


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=DEFAULT_CATALOG)
    ap.add_argument("--doc", default=DEFAULT_DOC)
    ap.add_argument(
        "--md-dir",
        default=None,
        help="Directory used to resolve the relative links inside the Markdown doc. "
        "Defaults to the directory of --doc. Pass the real decisions/ folder when "
        "--doc is a copy in a temporary directory (REV-7 R7-1).",
    )
    args = ap.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)
    with open(args.doc, "r", encoding="utf-8") as f:
        md_content = f.read()

    rules = sorted(catalog.get("rules", []), key=lambda r: r["id"])
    md_dir = args.md_dir if args.md_dir else os.path.dirname(args.doc)
    md_rows, malformed = parse_md(md_content, md_dir)

    mismatches = []
    for rid in sorted(malformed):
        mismatches.append("Rule %s: malformed markdown row" % rid)

    for r in rules:
        rid = r["id"]
        if rid not in md_rows:
            mismatches.append("Rule %s not found in Markdown tables" % rid)
            continue
        md = md_rows[rid]
        checks = [
            ("name", r["name"]),
            ("requirement", r["requirement"]),
            ("applies_when", r["applies_when"]),
            ("automation", r["automation"]),
            ("implementation_status", r["implementation_status"]),
            ("evaluation_mechanism", r["evaluation_mechanism"]),
            ("gate_stage", "%s (M%d)" % (r["gate"], r["roadmap_stage"])),
            ("enforced_by", r["enforced_by"]),
            ("doc_status", DOC_STATUS_LABEL.get(r["doc_status"], r["doc_status"])),
            ("doc_ref", r["doc_ref"]),
        ]
        for col, expected in checks:
            if md[col] != expected:
                mismatches.append("Rule %s %s mismatch: MD=%r YAML=%r" % (rid, col, md[col], expected))

    yaml_ids = {r["id"] for r in rules}
    for rid in sorted(set(md_rows) - yaml_ids):
        mismatches.append("Extra Markdown row not present in YAML: %s" % rid)

    print("=" * 65)
    print("ADR-024 MARKDOWN-YAML SYNCHRONIZATION REPORT (REV-6)")
    print("=" * 65)
    print("Catalog Rules: %d" % len(rules))
    print("Markdown Table Rules Found: %d" % len(md_rows))
    print("Columns Compared per Rule: 10 (all columns)")
    print("-" * 65)

    if mismatches:
        print("FAILED: %d discrepancy(ies) found between MD and YAML:" % len(mismatches), file=sys.stderr)
        for mis in sorted(mismatches):
            print("  %s" % mis, file=sys.stderr)
        print("RESULT: MD_SYNC=FAIL", file=sys.stderr)
        return 1

    print("All 10 columns of all %d rules are in zero-diff parity." % len(rules))
    print("RESULT: MD_SYNC=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
