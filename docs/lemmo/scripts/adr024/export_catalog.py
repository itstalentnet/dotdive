#!/usr/bin/env python3
"""
ADR-024 Rules Catalog Exporter & Validator (D-21 revised / D-25).

Parses the canonical Markdown rules catalog:
  docs/lemmo/01-architecture/decisions/ADR-024-rules-catalog.md
Validates it against the JSON Schema (Draft-07):
  docs/lemmo/scripts/adr024/rules-catalog.schema.json
And outputs the validated catalog to stdout or writes a frozen copy with
the D-18 provenance header to an explicit api checkout path.

Exit codes:
  0: Success
  1: Validation or parsing error
  2: Missing mandatory dependencies
"""
import sys
import os
import re
import argparse
import subprocess

try:
    import yaml
except ImportError:
    print("FATAL: PyYAML is required. Run: pip install pyyaml", file=sys.stderr)
    sys.exit(2)

try:
    import jsonschema
except ImportError:
    print("FATAL: jsonschema is required. Run: pip install jsonschema", file=sys.stderr)
    sys.exit(2)

HERE = os.path.dirname(os.path.abspath(__file__))
# Note: HERE is dotdive/docs/lemmo/scripts/adr024
LEMMO_DOCS = os.path.normpath(os.path.join(HERE, "..", ".."))
DEFAULT_DOC = os.path.join(LEMMO_DOCS, "01-architecture", "decisions", "ADR-024-rules-catalog.md")
DEFAULT_SCHEMA = os.path.join(HERE, "rules-catalog.schema.json")
DOTDIVE_ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", ".."))


def parse_catalog_md(text):
    catalog = {}
    v_m = re.search(r'-\s+\*\*نسخه کاتالوگ / Version:\*\*\s+`([^`]+)`', text)
    adr_m = re.search(r'-\s+\*\*سند تصمیم / ADR:\*\*\s+`([^`]+)`', text)
    lu_m = re.search(r'-\s+\*\*تاریخ آخرین بازنگری / Last Updated:\*\*\s+`([^`]+)`', text)
    tr_m = re.search(r'-\s+\*\*تعداد کل قواعد / Total Rules:\*\*\s+`(\d+)`', text)
    
    if not (v_m and adr_m and lu_m and tr_m):
        raise ValueError("Missing catalog header metadata (Version, ADR, Last Updated, Total Rules)")
        
    catalog["version"] = v_m.group(1).strip()
    catalog["adr"] = adr_m.group(1).strip()
    catalog["last_updated"] = lu_m.group(1).strip()
    catalog["total_rules"] = int(tr_m.group(1).strip())

    rules = []
    seen_ids = set()
    rule_sections = re.findall(r'###\s+([A-Z0-9_-]+):\s+(.+?)(?=\n###|\Z)', text, flags=re.DOTALL)
    if not rule_sections:
        raise ValueError("No rule sections found starting with '### <ID>: <Name>'")

    for rid, rbody in rule_sections:
        # Check duplicate rule ID (tested by DoD E5)
        if rid in seen_ids:
            raise ValueError(f"Duplicate rule ID found: {rid}")
        seen_ids.add(rid)

        def extract_field(pat, is_code=True):
            if is_code:
                m = re.search(r'-\s+\*\*' + pat + r':\*\*\s+`([^`]+)`', rbody)
            else:
                m = re.search(r'-\s+\*\*' + pat + r':\*\*\s+(.+)', rbody)
            if not m:
                raise ValueError(f"{rid}: field {pat} not found")
            return m.group(1).strip()

        applies_to_raw = extract_field("Applies To")
        applies_to = [x.strip() for x in applies_to_raw.strip("[]").split(",") if x.strip()]

        rule = {
            "id": rid,
            "name": extract_field("Name", is_code=False),
            "requirement": extract_field("Requirement", is_code=False),
            "check": extract_field("Check"),
            "scope": extract_field("Scope"),
            "applies_to": applies_to,
            "applies_when": extract_field("Applies When"),
            "automation": extract_field("Automation"),
            "implementation_status": extract_field("Implementation Status"),
            "evaluation_mechanism": extract_field("Evaluation Mechanism"),
            "roadmap_stage": int(extract_field("Roadmap Stage")),
            "gate": extract_field("Gate"),
            "enforced_by": extract_field("Enforced By"),
            "doc_status": extract_field("Doc Status"),
            "doc_ref": extract_field("Doc Ref", is_code=False),
        }
        rules.append(rule)

    catalog["rules"] = rules
    return catalog


def validate_catalog(catalog, schema_path):
    if not os.path.isfile(schema_path):
        raise FileNotFoundError(f"Schema not found: {schema_path}")

    # Architectural constraint: total_rules == len(rules)
    if catalog.get("total_rules") != len(catalog.get("rules", [])):
        raise ValueError(
            f"total_rules={catalog.get('total_rules')} does not equal len(rules)={len(catalog.get('rules', []))}"
        )

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = yaml.safe_load(f)

    # Draft-07 JSON Schema validation
    jsonschema.validate(instance=catalog, schema=schema)

    # Architectural constraint: draft_source / gap gate assignment
    for r in catalog.get("rules", []):
        rid = r.get("id")
        doc_status = r.get("doc_status")
        stage = r.get("roadmap_stage")
        gate = r.get("gate")

        if stage == 1 and gate == "new_service" and doc_status in ("draft_source", "gap"):
            raise ValueError(
                f"{rid}: doc_status='{doc_status}' but gate=new_service at Stage 1 (must be ratchet)"
            )


def get_git_commit(repo_dir):
    try:
        res = subprocess.run(
            ["git", "-C", repo_dir, "rev-parse", "HEAD"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        return res.stdout.strip()
    except Exception:
        return "HEAD"


def format_d18_header(source_repo, source_file, commit, version):
    return (
        "# ==============================================================================\n"
        "# FROZEN COPY — DO NOT EDIT MANUALLY / ویرایش دستی ممنوع\n"
        "# ==============================================================================\n"
        f"# Source Repository: {source_repo}\n"
        f"# Source File: {source_file}\n"
        f"# Source Commit: {commit}\n"
        f"# Catalog Version: {version}\n"
        f"# Exported by: dotdive/docs/lemmo/scripts/adr024/export_catalog.py\n"
        "# Reference: Decision D-21 (revised) / D-25\n"
        "# ==============================================================================\n"
        "\n"
    )


def main():
    parser = argparse.ArgumentParser(description="Export and validate ADR-024 rules catalog from Markdown.")
    parser.add_argument("--doc", default=DEFAULT_DOC, help="Path to ADR-024-rules-catalog.md")
    parser.add_argument("--schema", default=DEFAULT_SCHEMA, help="Path to rules-catalog.schema.json")
    parser.add_argument("--stdout", action="store_true", help="Print exported YAML to stdout")
    parser.add_argument("--api-dir", help="Path to api repository to write frozen copies")
    parser.add_argument("--source-commit", help="Explicit commit hash to record in D-18 provenance header")
    args = parser.parse_args()

    if not os.path.isfile(args.doc):
        print(f"ERROR: Catalog markdown file not found: {args.doc}", file=sys.stderr)
        sys.exit(1)

    with open(args.doc, "r", encoding="utf-8") as f:
        md_text = f.read()

    try:
        catalog = parse_catalog_md(md_text)
    except Exception as e:
        print(f"ERROR: Failed parsing markdown catalog: {e}", file=sys.stderr)
        sys.exit(1)

    try:
        validate_catalog(catalog, args.schema)
    except Exception as e:
        print(f"ERROR: Validation failed: {e}", file=sys.stderr)
        sys.exit(1)

    yaml_text = yaml.safe_dump(catalog, sort_keys=False, allow_unicode=True, width=100000)

    if args.stdout:
        sys.stdout.write(yaml_text)
        return

    if args.api_dir:
        api_dir = os.path.abspath(args.api_dir)
        conformance_dir = os.path.join(api_dir, "conformance")
        schemas_dir = os.path.join(conformance_dir, "schemas")
        os.makedirs(schemas_dir, exist_ok=True)

        commit = args.source_commit or get_git_commit(DOTDIVE_ROOT)
        header = format_d18_header(
            source_repo="dotdive (dotdive/)",
            source_file="docs/lemmo/01-architecture/decisions/ADR-024-rules-catalog.md",
            commit=commit,
            version=catalog.get("version", "7.0.0"),
        )

        rules_dest = os.path.join(conformance_dir, "rules.yaml")
        with open(rules_dest, "w", encoding="utf-8") as f:
            f.write(header + yaml_text)
        print(f"✓ Wrote frozen rules copy to: {rules_dest}")

        # Copy schema
        schema_dest = os.path.join(schemas_dir, "rules-catalog.schema.json")
        with open(args.schema, "r", encoding="utf-8") as sf, open(schema_dest, "w", encoding="utf-8") as df:
            df.write(sf.read())
        print(f"✓ Wrote schema copy to: {schema_dest}")

    print("=================================================================")
    print("ADR-024 RULES CATALOG EXPORT & VALIDATION REPORT (DOTDIVE / D-21)")
    print("=================================================================")
    print(f"Source Markdown: {args.doc}")
    print(f"Schema Path:     {args.schema}")
    print(f"Catalog Version: {catalog.get('version')}")
    print(f"Total Rules:     {catalog.get('total_rules')}")
    print("-----------------------------------------------------------------")
    print("All JSON Schema (Draft-07) and Architectural Constraints: PASSED")
    print("RESULT: CATALOG_EXPORT_VALIDATION=PASS")


if __name__ == "__main__":
    main()
