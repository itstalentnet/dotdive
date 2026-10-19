#!/usr/bin/env python3
"""
ADR-024 Markdown/YAML parity gate — Documentation Repository (D-21 / REV-6).

Compares EVERY column of the ADR-024 Markdown rule tables against the machine
catalog catalog/rules.yaml and detects both missing rules and extra rows.

Compared columns (REV-6 §A-3):
  id, name, requirement, applies_when, automation, implementation_status,
  evaluation_mechanism, gate/roadmap_stage, enforced_by, doc_status, doc_ref.

Deterministic output. Exit code: 0 on parity, 1 otherwise.

Usage:
    python3 dotdive/scripts/adr024/check_md_sync.py [--catalog PATH] [--doc PATH]
"""
import argparse
import os
import re
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
DOTDIVE_ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
DECISIONS = os.path.join(DOTDIVE_ROOT, "docs", "lemmo", "01-architecture", "decisions")
DEFAULT_CATALOG = os.path.join(HERE, "catalog", "rules.yaml")
DEFAULT_DOC = os.path.join(DECISIONS, "ADR-024-service-blueprint-and-conformance.md")

DOC_STATUS_LABEL = {"approved": "مصوب", "draft_source": "پیش‌نویس", "gap": "شکاف سند"}

ROW_RE = re.compile(
    r"^\|\s*`(?P<id>[A-Z0-9-]+)`\s*\|\s*\*\*(?P<name>[^*]+)\*\*\s*\|(?P<rest>.+)$"
)


def md_doc_ref_to_catalog(cell, md_dir):
    """Reverse the generator's link rendering back into `path §spec, path §spec`."""
    refs = []
    for label, target in re.findall(r"\[([^\]]+)\]\(([^)]+)\)", cell):
        abspath = os.path.normpath(os.path.join(md_dir, target.strip()))
        # In catalog, paths start with dotdive/docs/lemmo/...
        rel = os.path.relpath(abspath, DOTDIVE_ROOT)
        if not rel.startswith("dotdive/"):
            rel = "dotdive/" + rel
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
        cells = [c.strip() for c in re.split(r"(?<!\|)\|(?!\|)", rest)]
        if len(cells) != 9:
            extra.append((m.group("id"), "malformed row: expected 9 trailing cells, got %d" % len(cells)))
            continue
        req, cond, auto, status, eval_mech, gate_stage, enforced, doc_stat, doc_ref = cells
        rows[m.group("id")] = {
            "id": m.group("id"),
            "name": m.group("name").strip(),
            "requirement": req,
            "applies_when": cond.strip("`"),
            "automation": auto.strip("`"),
            "implementation_status": status.strip("`"),
            "evaluation_mechanism": eval_mech.strip("`"),
            "gate_stage": gate_stage,
            "enforced_by": enforced.strip("`"),
            "doc_status_label": doc_stat,
            "doc_ref": md_doc_ref_to_catalog(doc_ref, md_dir),
        }
    return rows, extra


def norm_ws(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


def check_sync(catalog_path=DEFAULT_CATALOG, doc_path=DEFAULT_DOC, md_dir=DECISIONS):
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    with open(doc_path, "r", encoding="utf-8") as f:
        doc_content = f.read()

    md_rows, malformed = parse_md(doc_content, md_dir)
    cat_rules = {r["id"]: r for r in catalog.get("rules", [])}

    print("=" * 65)
    print("ADR-024 MARKDOWN-YAML SYNCHRONIZATION REPORT (DOTDIVE / D-21)")
    print("=" * 65)
    print("Catalog Rules: %d" % len(cat_rules))
    print("Markdown Table Rules Found: %d" % len(md_rows))
    print("-" * 65)

    errors = []
    for rid, reason in malformed:
        errors.append("Markdown row %s is malformed: %s" % (rid, reason))

    # Detect extra markdown rows not in YAML
    for rid in sorted(md_rows.keys()):
        if rid not in cat_rules:
            errors.append("Extra Markdown row not present in YAML: %s" % rid)

    # Detect missing rules and per-column parity
    for rid in sorted(cat_rules.keys()):
        if rid not in md_rows:
            errors.append("Rule %s not found in Markdown tables" % rid)
            continue
        c = cat_rules[rid]
        m = md_rows[rid]

        if norm_ws(c.get("name")) != norm_ws(m.get("name")):
            errors.append("Rule %s name mismatch: YAML=%r, MD=%r" % (rid, c.get("name"), m.get("name")))

        if norm_ws(c.get("requirement")) != norm_ws(m.get("requirement")):
            errors.append("Rule %s requirement mismatch: YAML=%r, MD=%r" % (rid, c.get("requirement"), m.get("requirement")))

        if norm_ws(c.get("applies_when")) != norm_ws(m.get("applies_when")):
            errors.append("Rule %s applies_when mismatch: YAML=%r, MD=%r" % (rid, c.get("applies_when"), m.get("applies_when")))

        if norm_ws(c.get("automation")) != norm_ws(m.get("automation")):
            errors.append("Rule %s automation mismatch: YAML=%r, MD=%r" % (rid, c.get("automation"), m.get("automation")))

        if norm_ws(c.get("implementation_status")) != norm_ws(m.get("implementation_status")):
            errors.append("Rule %s implementation_status mismatch: YAML=%r, MD=%r" % (rid, c.get("implementation_status"), m.get("implementation_status")))

        if norm_ws(c.get("evaluation_mechanism")) != norm_ws(m.get("evaluation_mechanism")):
            errors.append("Rule %s evaluation_mechanism mismatch: YAML=%r, MD=%r" % (rid, c.get("evaluation_mechanism"), m.get("evaluation_mechanism")))

        expected_gate_stage = "%s (M%s)" % (c.get("gate"), c.get("roadmap_stage"))
        if expected_gate_stage != m.get("gate_stage"):
            errors.append("Rule %s gate/stage mismatch: expected %r, MD=%r" % (rid, expected_gate_stage, m.get("gate_stage")))

        if norm_ws(c.get("enforced_by")) != norm_ws(m.get("enforced_by")):
            errors.append("Rule %s enforced_by mismatch: YAML=%r, MD=%r" % (rid, c.get("enforced_by"), m.get("enforced_by")))

        expected_doc_status = DOC_STATUS_LABEL.get(c.get("doc_status"), c.get("doc_status"))
        if expected_doc_status != m.get("doc_status_label"):
            errors.append("Rule %s doc_status mismatch: expected %r, MD=%r" % (rid, expected_doc_status, m.get("doc_status_label")))

        expected_doc_ref = norm_ws(c.get("doc_ref"))
        actual_doc_ref = norm_ws(m.get("doc_ref"))
        if expected_doc_ref != actual_doc_ref:
            errors.append("Rule %s doc_ref mismatch: expected %r, MD=%r" % (rid, expected_doc_ref, actual_doc_ref))

    if errors:
        print("FAILED: %d parity error(s) detected:" % len(errors), file=sys.stderr)
        for err in errors:
            print("  * %s" % err, file=sys.stderr)
        print("RESULT: MD_SYNC=FAIL", file=sys.stderr)
        return 1

    print("SUCCESS: 100% zero-diff synchronization between Markdown and YAML verified!")
    print("RESULT: MD_SYNC=PASS")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=DEFAULT_CATALOG)
    ap.add_argument("--doc", default=DEFAULT_DOC)
    ap.add_argument("--md-dir", default=DECISIONS)
    args = ap.parse_args()

    sys.exit(check_sync(args.catalog, args.doc, args.md_dir))


if __name__ == "__main__":
    main()
