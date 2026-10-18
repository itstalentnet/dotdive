#!/usr/bin/env python3
"""
Validates 100% synchronization and zero-diff between ADR-024.rules.yaml and ADR-024-service-blueprint-and-conformance.md.
Exit code: 0 on success, non-zero on failure.
"""
import sys
import os
import re
import yaml

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, "../../../../.."))
    catalog_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml")
    doc_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024-service-blueprint-and-conformance.md")

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    with open(doc_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    rules = catalog.get("rules", [])
    mismatches = []
    found_rules = set()

    # Match rows like: | `SB-DIR-01` | **Clean Architecture Layering Standard** | ... |
    row_pattern = r"^\|\s*`([A-Z0-9-]+)`\s*\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|"

    matches = re.findall(row_pattern, md_content, re.MULTILINE)
    md_rule_map = {}
    for m in matches:
        rid = m[0].strip()
        md_rule_map[rid] = {
            "name": m[1].strip(),
            "requirement": m[2].strip(),
            "applies_when": m[3].strip(),
            "automation": m[4].strip(),
            "implementation_status": m[5].strip(),
            "evaluation_mechanism": m[6].strip(),
            "gate_stage": m[7].strip(),
            "enforced_by": m[8].strip(),
            "doc_status": m[9].strip(),
            "doc_ref": m[10].strip(),
        }

    for r in rules:
        rid = r["id"]
        if rid not in md_rule_map:
            mismatches.append(f"Rule {rid} not found in Markdown tables!")
            continue

        md_r = md_rule_map[rid]
        if md_r["name"] != r["name"]:
            mismatches.append(f"Rule {rid} name mismatch: MD='{md_r['name']}', YAML='{r['name']}'")

        if md_r["requirement"] != r["requirement"]:
            mismatches.append(f"Rule {rid} requirement mismatch!")

        if md_r["applies_when"] != r["applies_when"]:
            mismatches.append(f"Rule {rid} applies_when mismatch: MD='{md_r['applies_when']}', YAML='{r['applies_when']}'")

        if md_r["automation"] != r["automation"]:
            mismatches.append(f"Rule {rid} automation mismatch: MD='{md_r['automation']}', YAML='{r['automation']}'")

        if md_r["implementation_status"] != r["implementation_status"]:
            mismatches.append(f"Rule {rid} implementation_status mismatch: MD='{md_r['implementation_status']}', YAML='{r['implementation_status']}'")

        if md_r["enforced_by"] != r["enforced_by"]:
            mismatches.append(f"Rule {rid} enforced_by mismatch: MD='{md_r['enforced_by']}', YAML='{r['enforced_by']}'")

        expected_gate_stage = f"{r['gate']} (M{r['roadmap_stage']})"
        if md_r["gate_stage"] != expected_gate_stage:
            mismatches.append(f"Rule {rid} gate_stage mismatch: MD='{md_r['gate_stage']}', YAML='{expected_gate_stage}'")

        found_rules.add(rid)

    print("=================================================================")
    print("ADR-024 MARKDOWN-YAML SYNCHRONIZATION REPORT (REV-5)")
    print("=================================================================")
    print(f"Catalog Rules: {len(rules)}")
    print(f"Markdown Table Rules Found: {len(found_rules)}")
    print("-----------------------------------------------------------------")

    if mismatches or len(found_rules) != len(rules):
        print(f"FAILED: {len(mismatches)} discrepancies found between MD and YAML!", file=sys.stderr)
        for mis in mismatches:
            print(f"  {mis}", file=sys.stderr)
        sys.exit(1)
    else:
        print("SUCCESS: 100% zero-diff synchronization between Markdown and YAML verified!")
        print("=================================================================")

if __name__ == "__main__":
    main()
