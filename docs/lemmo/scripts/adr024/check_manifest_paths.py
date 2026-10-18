#!/usr/bin/env python3
"""
ADR-024 manifest path gate (REV-6).

Validates that every `manifest.*` path used in an `applies_when` expression is
declared in the service-manifest design of ADR-024 §۳.2. Deterministic output.

Exit code: 0 on success, 1 on failure.

Usage:
    python3 docs/lemmo/scripts/adr024/check_manifest_paths.py [--catalog PATH]
"""
import argparse
import os
import re
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "..", ".."))
DEFAULT_CATALOG = os.path.join(REPO_ROOT, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml")

# Declared manifest keys (ADR-024 §3.2). Kept as an explicit, sorted, auditable set.
ALLOWED_MANIFEST_PATHS = {
    "manifest.billable",
    "manifest.capabilities.auth_interceptor",
    "manifest.capabilities.dynamic_payload",
    "manifest.capabilities.graceful_shutdown",
    "manifest.capabilities.idempotency",
    "manifest.capabilities.outbox",
    "manifest.capabilities.reference_data",
    "manifest.contracts.openapi_domain",
    "manifest.contracts.proto",
    "manifest.events.consumed",
    "manifest.events.published",
    "manifest.networking.external_outbound",
    "manifest.networking.inbound_grpc_port",
    "manifest.networking.inbound_http_port",
    "manifest.storage.object_storage",
    "manifest.storage.postgres",
    "manifest.storage.redis",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=DEFAULT_CATALOG)
    args = ap.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    rules = sorted(catalog.get("rules", []), key=lambda r: r["id"])
    failures = []
    checked = []
    seen = set()

    for r in rules:
        expr = r.get("applies_when", "")
        if expr == "always":
            continue
        for raw in re.findall(r"manifest\.[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*", expr):
            clean = raw[:-5] if raw.endswith(".size") else raw
            if clean not in seen:
                seen.add(clean)
                checked.append(clean)
            if clean not in ALLOWED_MANIFEST_PATHS:
                failures.append((r["id"], raw, clean))

    print("=" * 65)
    print("ADR-024 MANIFEST PATHS CONFORMANCE REPORT (REV-6)")
    print("=" * 65)
    print("Total Rules Analyzed: %d" % len(rules))
    print("Unique Manifest Paths Checked: %d" % len(checked))
    for cp in sorted(checked):
        print("  [VALID] %s" % cp)
    print("-" * 65)

    if failures:
        print("FAILED: %d undefined manifest path reference(s):" % len(failures), file=sys.stderr)
        for rid, raw, clean in failures:
            print("  %s: %s (resolved: %s) is not in the service-manifest schema" % (rid, raw, clean), file=sys.stderr)
        print("RESULT: MANIFEST_PATHS=FAIL", file=sys.stderr)
        return 1

    print("All manifest.* paths are declared in the service-manifest schema.")
    print("RESULT: MANIFEST_PATHS=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
