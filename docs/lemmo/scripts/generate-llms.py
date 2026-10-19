#!/usr/bin/env python3
"""
generate-llms.py — Generates llms.txt index from markdown documentation metadata.
Complies with https://llmstxt.org standard format.
"""

import os
import re
from pathlib import Path

DOCS_DIR = Path(__file__).resolve().parent.parent
OUTPUT_FILE = DOCS_DIR / "llms.txt"

CATEGORY_TITLES = {
    "architecture": "Architecture & Core System Rules",
    "design-system": "Design System & Tokens",
    "branding": "Brand Identity & Visual Guidelines",
    "frontend": "Frontend Engineering",
    "backend": "Backend & API Specifications",
    "devops": "DevOps, CI/CD & Infrastructure",
    "roadmap": "Project Roadmap & Milestone Audits",
    "modules": "Feature Modules & Components",
    "other": "General Documentation & Guidelines"
}

CATEGORY_ORDER = [
    "architecture",
    "design-system",
    "branding",
    "frontend",
    "backend",
    "devops",
    "modules",
    "roadmap",
    "other"
]

def parse_metadata(file_path: Path):
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return None

    rel_path = file_path.relative_to(DOCS_DIR).as_posix()
    meta = {
        "file_path": rel_path,
        "title_en": None,
        "title_fa": None,
        "category": None,
        "summary_en": None,
        "tags": []
    }

    # Extract fields from Markdown table (ignoring code blocks)
    in_code_block = False
    for line in content.splitlines():
        if line.strip().startswith("```"):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        # Match table rows: | **Field** | Value |
        if "|" in line:
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 3:
                key = parts[1].replace("*", "").strip().lower()
                val = parts[2].strip()

                if "title (en)" in key:
                    meta["title_en"] = val
                elif "title (fa)" in key:
                    meta["title_fa"] = val
                elif "category" in key:
                    meta["category"] = val.replace("`", "").strip().lower()
                elif "summary (en)" in key:
                    meta["summary_en"] = val
                elif "tags" in key:
                    meta["tags"] = [t.strip().replace("`", "") for t in val.split(",") if t.strip()]

    # Fallback title if missing
    if not meta["title_en"]:
        # Try to find first H1
        for line in content.splitlines():
            if line.startswith("# "):
                meta["title_en"] = line[2:].strip()
                break
        if not meta["title_en"]:
            meta["title_en"] = file_path.stem.replace("-", " ").title()

    if not meta["category"] or meta["category"] not in CATEGORY_TITLES:
        meta["category"] = "other"

    return meta

def main():
    if not DOCS_DIR.exists():
        print(f"Error: Docs directory {DOCS_DIR} does not exist.")
        return

    documents_by_category = {cat: [] for cat in CATEGORY_ORDER}

    for md_file in DOCS_DIR.rglob("*.md"):
        # Ignore templates or scripts
        if "_template.md" in md_file.name:
            continue

        meta = parse_metadata(md_file)
        if meta:
            cat = meta["category"]
            documents_by_category[cat].append(meta)

    # Sort files within categories by English title
    for cat in documents_by_category:
        documents_by_category[cat].sort(key=lambda x: x["title_en"])

    output_lines = [
        "# Lemmo Project Documentation Index",
        "> This document indexes architecture, specifications, and governance documents for Lemmo.",
        "",
        "## Core Concepts",
        "- [Documentation Guidelines & Single Source of Truth](index.md): Central index, folder governance, and SSOT guidelines.",
        ""
    ]

    for cat in CATEGORY_ORDER:
        docs = documents_by_category[cat]
        if not docs:
            continue

        title = CATEGORY_TITLES.get(cat, cat.title())
        output_lines.append(f"## {title}")

        for doc in docs:
            # Skip root index.md since it's in core concepts
            if doc["file_path"] == "index.md":
                continue

            summary = doc["summary_en"] or doc["title_fa"] or "Documentation file."
            # Clean summary of markdown links or backticks if necessary
            summary = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", summary)

            line = f"- [{doc['title_en']}]({doc['file_path']}): {summary}"
            output_lines.append(line)

        output_lines.append("")

    OUTPUT_FILE.write_text("\n".join(output_lines).strip() + "\n", encoding="utf-8")
    total_docs = sum(len(d) for d in documents_by_category.values())
    print(f"✓ Generated {OUTPUT_FILE} with {total_docs} indexed documents.")

if __name__ == "__main__":
    main()
