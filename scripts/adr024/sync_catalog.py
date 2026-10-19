#!/usr/bin/env python3
"""
sync_catalog.py — Synchronizes the frozen rules catalog copy in dotdive from an api checkout.

Governance Decision D-21:
  "داده مشترک یک مرجع دارد و مخزن دیگر یک کپی ثابت‌شده با هدر شناسنامه به سبک D-18
   (مخزن مبدأ، commit مبدأ، نسخه، هشدار «ویرایش دستی ممنوع») نگه می‌دارد؛ به‌روزرسانی
   کپی یک گام صریح با اسکریپت همگام‌سازی است، نه خواندن زنده."

Usage:
    python3 dotdive/scripts/adr024/sync_catalog.py --api-dir /path/to/api
"""
import argparse
import os
import shutil
import subprocess
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
DEST_CATALOG = os.path.join(HERE, "catalog", "rules.yaml")
DEST_SCHEMA = os.path.join(HERE, "catalog", "rules-catalog.schema.json")


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
    except Exception as e:
        print("Warning: unable to get git commit from %s: %e" % (repo_dir, e), file=sys.stderr)
        return "unknown"


def main():
    ap = argparse.ArgumentParser(description="Synchronize frozen rules catalog copy from api checkout")
    ap.add_argument("--api-dir", required=True, help="Path to api repository checkout")
    args = ap.parse_args()

    api_dir = os.path.abspath(args.api_dir)
    src_catalog = os.path.join(api_dir, "conformance", "rules.yaml")
    src_schema = os.path.join(api_dir, "conformance", "schemas", "rules-catalog.schema.json")

    if not os.path.isfile(src_catalog):
        print("FATAL: source catalog not found at: %s" % src_catalog, file=sys.stderr)
        sys.exit(1)

    if not os.path.isfile(src_schema):
        print("FATAL: source schema not found at: %s" % src_schema, file=sys.stderr)
        sys.exit(1)

    with open(src_catalog, "r", encoding="utf-8") as f:
        catalog_content = f.read()

    catalog_data = yaml.safe_load(catalog_content)
    catalog_version = catalog_data.get("version", "unknown")
    commit_hash = get_git_commit(api_dir)

    header = (
        "# ==============================================================================\n"
        "# FROZEN COPY — DO NOT EDIT MANUALLY / ویرایش دستی ممنوع\n"
        "# ==============================================================================\n"
        "# Source Repository: lemmo-api (api/)\n"
        "# Source File: api/conformance/rules.yaml\n"
        "# Source Commit: %s\n"
        "# Catalog Version: %s\n"
        "# Synchronized by: dotdive/scripts/adr024/sync_catalog.py\n"
        "# Reference: Decision D-21 (Inter-Repository Independence Governance)\n"
        "# ==============================================================================\n\n"
        % (commit_hash, catalog_version)
    )

    os.makedirs(os.path.dirname(DEST_CATALOG), exist_ok=True)
    with open(DEST_CATALOG, "w", encoding="utf-8") as f:
        f.write(header + catalog_content)

    shutil.copyfile(src_schema, DEST_SCHEMA)

    print("=" * 65)
    print("DOTDIVE CATALOG SYNCHRONIZATION (DECISION D-21)")
    print("=" * 65)
    print("Source API Checkout: %s" % api_dir)
    print("Source Commit:       %s" % commit_hash)
    print("Catalog Version:     %s" % catalog_version)
    print("Destination Catalog: %s" % DEST_CATALOG)
    print("Destination Schema:  %s" % DEST_SCHEMA)
    print("RESULT: SYNC=SUCCESS")
    print("=" * 65)
    return 0


if __name__ == "__main__":
    sys.exit(main())
