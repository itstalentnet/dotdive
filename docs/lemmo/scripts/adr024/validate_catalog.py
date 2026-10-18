#!/usr/bin/env python3
"""
ADR-024 rules catalog validator (REV-6).

Validates ADR-024.rules.yaml against rules-catalog.schema.json using the real
`jsonschema` library (Draft-07) and enforces the architectural constraints.

REV-6 §A-2 requirements:
  * A missing `jsonschema` dependency is a hard failure (exit 2). The previous
    hand-written Draft-07 fallback was removed: a validator that "passes" while
    the real schema engine is unavailable proves nothing.
  * `requirements.txt` must exist next to this script.
  * `total_rules` must equal `len(rules)` (no hand-maintained counter).

Exit codes: 0 = pass, 1 = validation failure, 2 = missing dependency/setup.

Usage:
    python3 docs/lemmo/scripts/adr024/validate_catalog.py [--catalog PATH]
"""
import argparse
import collections
import json
import os
import sys

try:
    import yaml
except ImportError:  # pragma: no cover - environment guard
    print("FATAL: PyYAML is required. Install with: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(2)

try:
    import jsonschema
    from jsonschema import Draft7Validator
except ImportError:  # pragma: no cover - environment guard
    print("FATAL: jsonschema is required (no fallback engine). Install with:", file=sys.stderr)
    print("       pip install -r dotdive/docs/lemmo/scripts/adr024/requirements.txt", file=sys.stderr)
    sys.exit(2)

try:
    from importlib.metadata import version as _pkg_version

    JSONSCHEMA_VERSION = _pkg_version("jsonschema")
except Exception:  # pragma: no cover - metadata unavailable
    JSONSCHEMA_VERSION = "unknown"

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DECISIONS = "dotdive/docs/lemmo/01-architecture/decisions"
DEFAULT_CATALOG = os.path.join(REPO_ROOT, DECISIONS, "ADR-024.rules.yaml")
DEFAULT_SCHEMA = os.path.join(REPO_ROOT, DECISIONS, "rules-catalog.schema.json")


def fail(msg):
    print(msg, file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=DEFAULT_CATALOG)
    ap.add_argument("--schema", default=DEFAULT_SCHEMA)
    args = ap.parse_args()

    # REV-6 §A-2: requirements.txt must live next to this script.
    req_path = os.path.join(HERE, "requirements.txt")
    if not os.path.isfile(req_path):
        fail("FATAL: requirements.txt is missing next to validate_catalog.py")
        return 2

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)
    with open(args.schema, "r", encoding="utf-8") as f:
        schema = json.load(f)

    rules = catalog.get("rules", [])
    errors = []

    # 1) Real JSON Schema (Draft-07) validation.
    validator = Draft7Validator(schema)
    for err in sorted(validator.iter_errors(catalog), key=lambda e: list(e.absolute_path)):
        loc = "/".join(str(p) for p in err.absolute_path) or "(root)"
        errors.append("schema: %s: %s" % (loc, err.message))

    # 2) total_rules == len(rules).
    if catalog.get("total_rules") != len(rules):
        errors.append("total_rules=%r does not equal len(rules)=%d" % (catalog.get("total_rules"), len(rules)))

    # 3) Unique rule ids.
    ids = [r.get("id") for r in rules]
    dupes = sorted({i for i, c in collections.Counter(ids).items() if c > 1})
    if dupes:
        errors.append("duplicate rule ids: %s" % ", ".join(dupes))

    # 4) Governance gate: no rule may be mandatory for a new Stage-1 service
    #    unless it rests on an approved source document.
    for r in sorted(rules, key=lambda x: x.get("id", "")):
        status = r.get("doc_status")
        if status in ("draft_source", "gap") and r.get("roadmap_stage") == 1 and r.get("gate") == "new_service":
            errors.append(
                "%s: doc_status=%r but gate=new_service at Stage 1 (unapproved/absent source)" % (r.get("id"), status)
            )

    # Deterministic summary.
    def c(field):
        return collections.Counter(r.get(field) for r in rules)

    by_check = c("check")
    by_scope = c("scope")
    by_auto = c("automation")
    by_impl = c("implementation_status")
    by_doc = c("doc_status")
    by_gate = c("gate")
    by_stage = c("roadmap_stage")
    draft_stage1_new = [r["id"] for r in rules if r.get("doc_status") == "draft_source" and r.get("roadmap_stage") == 1 and r.get("gate") == "new_service"]
    gap_stage1_new = [r["id"] for r in rules if r.get("doc_status") == "gap" and r.get("roadmap_stage") == 1 and r.get("gate") == "new_service"]

    print("=" * 65)
    print("ADR-024 RULES CATALOG VALIDATION REPORT (REV-6)")
    print("=" * 65)
    print("jsonschema engine: %s (Draft-07)" % JSONSCHEMA_VERSION)
    print("Schema Path: %s" % os.path.relpath(args.schema, REPO_ROOT))
    print("Catalog Path: %s" % os.path.relpath(args.catalog, REPO_ROOT))
    print("Catalog Version: %s" % catalog.get("version"))
    print("Total Rules Verified: %d (declared total_rules=%s)" % (len(rules), catalog.get("total_rules")))
    print("Checks: static=%d, live=%d" % (by_check["static"], by_check["live"]))
    print("Scope: service=%d, platform=%d" % (by_scope["service"], by_scope["platform"]))
    print("Automation (Design): full=%d, partial=%d, manual=%d" % (by_auto["full"], by_auto["partial"], by_auto["manual"]))
    print("Implementation (Reality): not_started=%d, implemented=%d" % (by_impl["not_started"], by_impl["implemented"]))
    print("Roadmap Stages: %s" % ", ".join("Stage %s=%d" % (k, by_stage[k]) for k in sorted(by_stage)))
    print("Gates: new_service=%d, ratchet=%d" % (by_gate["new_service"], by_gate["ratchet"]))
    print("Source Document Status: approved=%d, draft_source=%d, gap=%d" % (by_doc["approved"], by_doc["draft_source"], by_doc["gap"]))
    print("Draft Source Governance Gate: %s" % ("PASS" if not draft_stage1_new else "FAIL (%s)" % ", ".join(sorted(draft_stage1_new))))
    print("Doc Gap Governance Gate: %s" % ("PASS" if not gap_stage1_new else "FAIL (%s)" % ", ".join(sorted(gap_stage1_new))))
    print("-" * 65)

    if errors:
        print("FAILED: %d validation error(s):" % len(errors), file=sys.stderr)
        for e in sorted(errors):
            print("  %s" % e, file=sys.stderr)
        print("RESULT: CATALOG_VALIDATION=FAIL", file=sys.stderr)
        return 1

    print("All JSON Schema (Draft-07) and Architectural Constraints: PASSED")
    print("RESULT: CATALOG_VALIDATION=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
