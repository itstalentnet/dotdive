#!/usr/bin/env python3
"""
Validates that every manifest.* path used in applies_when expressions exists in the service-manifest schema.
Exit code: 0 on success, non-zero on failure.
"""
import sys
import os
import re
import yaml

ALLOWED_MANIFEST_PATHS = {
    "manifest.storage.postgres",
    "manifest.storage.redis",
    "manifest.storage.object_storage",
    "manifest.contracts.proto",
    "manifest.contracts.openapi_domain",
    "manifest.networking.inbound_grpc_port",
    "manifest.networking.inbound_http_port",
    "manifest.networking.external_outbound",
    "manifest.events.published",
    "manifest.events.consumed",
    "manifest.billable",
    "manifest.capabilities.idempotency",
    "manifest.capabilities.outbox",
    "manifest.capabilities.auth_interceptor",
    "manifest.capabilities.graceful_shutdown",
    "manifest.capabilities.dynamic_payload",
    "manifest.capabilities.reference_data",
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, "../../../../.."))
    catalog_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml")

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    rules = sorted(catalog.get("rules", []), key=lambda r: r["id"])
    failures = []
    checked_paths = set()

    for r in rules:
        expr = r.get("applies_when", "")
        if expr == "always":
            continue
        found = re.findall(r"manifest\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*", expr)
        for p in found:
            clean_p = p[:-5] if p.endswith(".size") else p
            checked_paths.add(clean_p)
            if clean_p not in ALLOWED_MANIFEST_PATHS:
                failures.append((r["id"], p, clean_p))

    print("=================================================================")
    print("ADR-024 MANIFEST PATHS CONFORMANCE REPORT (REV-5)")
    print("=================================================================")
    print(f"Total Rules Analyzed: {len(rules)}")
    print(f"Unique Manifest Paths Checked: {len(checked_paths)}")
    for cp in sorted(checked_paths):
        print(f"  [VALID] {cp}")
    print("-----------------------------------------------------------------")

    if failures:
        print(f"FAILED: {len(failures)} undefined manifest path references found!", file=sys.stderr)
        for rid, raw_p, clean_p in failures:
            print(f"  {rid}: {raw_p} (resolved: {clean_p}) is not in service-manifest schema!", file=sys.stderr)
        sys.exit(1)
    else:
        print("SUCCESS: 100% of CEL applies_when paths are strictly defined in manifest schema!")
        print("=================================================================")

if __name__ == "__main__":
    main()
