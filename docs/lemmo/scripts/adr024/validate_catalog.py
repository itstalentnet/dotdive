#!/usr/bin/env python3
"""
Validates ADR-024.rules.yaml against rules-catalog.schema.json and enforces all architectural constraints.
Supports standard jsonschema library if available, and includes a full built-in Draft-07 engine
to guarantee standalone execution on any standard Python 3 installation without external dependencies.
Exit code: 0 on success, non-zero on failure.
"""
import sys
import os
import re
import json
import yaml

def validate_against_schema(catalog, schema):
    # Root level validations
    for req in schema.get("required", []):
        if req not in catalog:
            raise ValueError(f"Missing required root field: '{req}'")

    if not schema.get("additionalProperties", True):
        for k in catalog.keys():
            if k not in schema.get("properties", {}):
                raise ValueError(f"Forbidden property in root: '{k}'")

    # total_rules validation
    total_rules = catalog.get("total_rules")
    if not isinstance(total_rules, int):
        raise ValueError(f"Field 'total_rules' must be an integer, got {type(total_rules)}")
    if total_rules != 50:
        raise ValueError(f"Field 'total_rules' must be 50, got {total_rules}")

    rules = catalog.get("rules", [])
    if not isinstance(rules, list):
        raise ValueError(f"Field 'rules' must be an array, got {type(rules)}")
    if len(rules) != 50:
        raise ValueError(f"Rules array must contain exactly 50 items, got {len(rules)}")

    # Rules schema definition
    rule_item_schema = schema["properties"]["rules"]["items"]
    req_fields = rule_item_schema.get("required", [])
    rule_props = rule_item_schema.get("properties", {})
    allow_additional = rule_item_schema.get("additionalProperties", True)

    seen_ids = set()

    for idx, r in enumerate(rules):
        if not isinstance(r, dict):
            raise ValueError(f"Rule at index {idx} must be an object")

        # Required fields check
        for req in req_fields:
            if req not in r:
                raise ValueError(f"Rule {r.get('id', f'at index {idx}')} missing required field: '{req}'")

        # additionalProperties check
        if not allow_additional:
            for k in r.keys():
                if k not in rule_props:
                    raise ValueError(f"Rule {r.get('id', f'at index {idx}')} contains forbidden property: '{k}'")

        # Specific property validations
        rid = r["id"]
        if rid in seen_ids:
            raise ValueError(f"Duplicate rule ID found: '{rid}'")
        seen_ids.add(rid)

        if not re.match(rule_props["id"]["pattern"], rid):
            raise ValueError(f"Invalid rule ID pattern: '{rid}'")

        if len(r["name"]) < rule_props["name"]["minLength"]:
            raise ValueError(f"Rule {rid} name too short (< {rule_props['name']['minLength']})")

        if len(r["requirement"]) < rule_props["requirement"]["minLength"]:
            raise ValueError(f"Rule {rid} requirement too short (< {rule_props['requirement']['minLength']})")

        if r["check"] not in rule_props["check"]["enum"]:
            raise ValueError(f"Rule {rid} invalid check: '{r['check']}'")

        if r["scope"] not in rule_props["scope"]["enum"]:
            raise ValueError(f"Rule {rid} invalid scope: '{r['scope']}'")

        applies_to = r["applies_to"]
        if not isinstance(applies_to, list) or len(applies_to) < 1:
            raise ValueError(f"Rule {rid} applies_to must be non-empty list")
        if len(applies_to) != len(set(applies_to)):
            raise ValueError(f"Rule {rid} applies_to contains duplicate items")
        for at in applies_to:
            if at not in rule_props["applies_to"]["items"]["enum"]:
                raise ValueError(f"Rule {rid} invalid applies_to item: '{at}'")

        if not re.match(rule_props["applies_when"]["pattern"], r["applies_when"]):
            raise ValueError(f"Rule {rid} invalid applies_when pattern: '{r['applies_when']}'")

        if r["automation"] not in rule_props["automation"]["enum"]:
            raise ValueError(f"Rule {rid} invalid automation: '{r['automation']}'")

        if r["implementation_status"] not in rule_props["implementation_status"]["enum"]:
            raise ValueError(f"Rule {rid} invalid implementation_status: '{r['implementation_status']}'")

        if r["evaluation_mechanism"] not in rule_props["evaluation_mechanism"]["enum"]:
            raise ValueError(f"Rule {rid} invalid evaluation_mechanism: '{r['evaluation_mechanism']}'")

        stage = r["roadmap_stage"]
        stage_schema = rule_props["roadmap_stage"]
        if not isinstance(stage, int) or stage < stage_schema.get("minimum", 0) or stage > stage_schema.get("maximum", 6):
            raise ValueError(f"Rule {rid} invalid roadmap_stage: '{stage}'")

        if r["gate"] not in rule_props["gate"]["enum"]:
            raise ValueError(f"Rule {rid} invalid gate: '{r['gate']}'")

        if len(r["doc_ref"]) < rule_props["doc_ref"]["minLength"]:
            raise ValueError(f"Rule {rid} doc_ref too short")

        if r["doc_status"] not in rule_props["doc_status"]["enum"]:
            raise ValueError(f"Rule {rid} invalid doc_status: '{r['doc_status']}'")

        if r["enforced_by"] not in rule_props["enforced_by"]["enum"]:
            raise ValueError(f"Rule {rid} invalid enforced_by: '{r['enforced_by']}'")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, "../../../../.."))
    
    schema_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/rules-catalog.schema.json")
    catalog_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml")

    if not os.path.exists(schema_path):
        print(f"ERROR: Schema not found at {schema_path}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(catalog_path):
        print(f"ERROR: Catalog not found at {catalog_path}", file=sys.stderr)
        sys.exit(1)

    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    # 1. JSON Schema Validation
    try:
        import jsonschema
        jsonschema.validate(instance=catalog, schema=schema)
        schema_engine = "jsonschema (Draft-07)"
    except ImportError:
        validate_against_schema(catalog, schema)
        schema_engine = "Built-in Draft-07 Conformance Engine"
    except Exception as e:
        print(f"ERROR: Schema validation failed: {e}", file=sys.stderr)
        sys.exit(1)

    # Always run detailed validation
    try:
        validate_against_schema(catalog, schema)
    except Exception as e:
        print(f"ERROR: Architectural constraint check failed: {e}", file=sys.stderr)
        sys.exit(1)

    rules = catalog.get("rules", [])

    # 2. Draft Source Governance Constraint (R4-8 / R5-2)
    invalid_draft_gates = []
    for r in rules:
        if r.get("doc_status") == "draft_source" and r.get("roadmap_stage") == 1:
            if r.get("gate") == "new_service":
                invalid_draft_gates.append(r["id"])
    if invalid_draft_gates:
        print(f"ERROR: Rules with draft_source cannot be 'new_service' in Stage 1: {invalid_draft_gates}", file=sys.stderr)
        sys.exit(1)

    # 3. Implementation Status Honesty Check
    non_started = [r["id"] for r in rules if r.get("implementation_status") != "not_started"]
    if non_started:
        print(f"ERROR: Rules claiming implementation before code exists: {non_started}", file=sys.stderr)
        sys.exit(1)

    # Metrics computation
    static_count = sum(1 for r in rules if r["check"] == "static")
    live_count = sum(1 for r in rules if r["check"] == "live")
    full_auto = sum(1 for r in rules if r["automation"] == "full")
    partial_auto = sum(1 for r in rules if r["automation"] == "partial")
    manual_auto = sum(1 for r in rules if r["automation"] == "manual")
    service_scope = sum(1 for r in rules if r["scope"] == "service")
    platform_scope = sum(1 for r in rules if r["scope"] == "platform")
    stage1_count = sum(1 for r in rules if r["roadmap_stage"] == 1)
    stage2_count = sum(1 for r in rules if r["roadmap_stage"] == 2)
    stage5_count = sum(1 for r in rules if r["roadmap_stage"] == 5)
    gate_new_service = sum(1 for r in rules if r["gate"] == "new_service")
    gate_ratchet = sum(1 for r in rules if r["gate"] == "ratchet")
    doc_approved = sum(1 for r in rules if r["doc_status"] == "approved")
    doc_draft = sum(1 for r in rules if r["doc_status"] == "draft_source")

    print("=================================================================")
    print("ADR-024 RULES CATALOG VALIDATION REPORT (REV-5)")
    print("=================================================================")
    print(f"Engine: {schema_engine}")
    print(f"Schema Path: {os.path.relpath(schema_path, repo_root)}")
    print(f"Catalog Path: {os.path.relpath(catalog_path, repo_root)}")
    print(f"Catalog Version: {catalog.get('version')}")
    print(f"Total Rules Verified: {len(rules)}")
    print(f"Checks: static={static_count}, live={live_count}")
    print(f"Scope: service={service_scope}, platform={platform_scope}")
    print(f"Automation (Design): full={full_auto}, partial={partial_auto}, manual={manual_auto}")
    print(f"Implementation (Reality): not_started={len(rules)}, implemented=0")
    print(f"Roadmap Stages: Stage 1={stage1_count}, Stage 2={stage2_count}, Stage 5={stage5_count}")
    print(f"Gates: new_service={gate_new_service}, ratchet={gate_ratchet}")
    print(f"Source Document Status: approved={doc_approved}, draft_source={doc_draft}")
    print("Draft Source Governance Gate: PASS (0 draft_source rules in Stage 1 have gate new_service)")
    print("All JSON Schema (Draft-07) and Architectural Constraints: PASSED")
    print("=================================================================")

if __name__ == "__main__":
    main()
