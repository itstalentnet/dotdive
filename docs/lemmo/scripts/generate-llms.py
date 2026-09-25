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

        if "| **Title (EN)**" in line:
            m = re.search(r"\|\s*\*\*Title \(EN\)\*\*\s*\|\s*([^\|]+)\|", line)
            if m:
                meta["title_en"] = m.group(1).strip()
        elif "| **Category**" in line:
            m = re.search(r"\|\s*\*\*Category\*\*\s*\|\s*([^\|]+)\|", line)
            if m:
                cat = m.group(1).strip().strip("`").lower()
                meta["category"] = cat
        elif "| **Summary (EN)**" in line:
            m = re.search(r"\|\s*\*\*Summary \(EN\)\*\*\s*\|\s*([^\|]+)\|", line)
            if m:
                meta["summary_en"] = m.group(1).strip()
        elif "| **Tags**" in line:
            m = re.search(r"\|\s*\*\*Tags\*\*\s*\|\s*([^\|]+)\|", line)
            if m:
                meta["tags"] = [t.strip().strip("`") for t in m.group(1).split(",") if t.strip()]

    # Fallback to directory name for category if not set or invalid
    if not meta["category"] or meta["category"] not in CATEGORY_TITLES:
        parts = rel_path.split("/")
        if len(parts) > 1 and parts[0] in CATEGORY_TITLES:
            meta["category"] = parts[0]
        else:
            meta["category"] = "other"

    # Fallback for title: First # heading
    if not meta["title_en"]:
        h1_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if h1_match:
            # Clean title
            raw_title = h1_match.group(1).strip()
            # Remove markdown links if present
            raw_title = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", raw_title)
            meta["title_en"] = raw_title
        else:
            meta["title_en"] = file_path.stem.replace("-", " ").title()

    # Fallback for summary: First blockquote or clean sentence
    if not meta["summary_en"]:
        quote_match = re.search(r"^>\s+(.+)$", content, re.MULTILINE)
        if quote_match:
            meta["summary_en"] = quote_match.group(1).strip()
        else:
            meta["summary_en"] = f"Documentation file for {meta['title_en']}."

    # Clean up summary
    meta["summary_en"] = meta["summary_en"].replace("\n", " ").strip()
    return meta

def main():
    docs_by_cat = {cat: [] for cat in CATEGORY_ORDER}

    for root, dirs, files in os.walk(DOCS_DIR):
        # Ignore git, templates, scripts
        dirs[:] = [d for d in dirs if d not in [".git", "templates", "scripts", "node_modules"]]
        for f in sorted(files):
            if f.endswith(".md") and f != "llms.txt":
                file_path = Path(root) / f
                # Skip templates
                if "templates" in file_path.parts:
                    continue
                meta = parse_metadata(file_path)
                if meta:
                    cat = meta["category"]
                    if cat not in docs_by_cat:
                        cat = "other"
                    docs_by_cat[cat].append(meta)

    # Build llms.txt content
    lines = [
        "# Lemmo Documentation",
        "",
        "> Lemmo is an integrated AI creative suite bridging generative AI models with an infinite interactive canvas. This index provides structured references to the system architecture, design tokens, frontend, backend, branding, and DevOps standards.",
        ""
    ]

    for cat in CATEGORY_ORDER:
        items = docs_by_cat[cat]
        if not items:
            continue
        cat_title = CATEGORY_TITLES.get(cat, cat.title())
        lines.append(f"## {cat_title}")
        lines.append("")
        for item in sorted(items, key=lambda x: x["title_en"]):
            # Format: - [Title](path): Summary
            link = f"- [{item['title_en']}]({item['file_path']}): {item['summary_en']}"
            lines.append(link)
        lines.append("")

    lines.append("## Optional Files & External Resources")
    lines.append("")
    lines.append("- [Documentation Guidelines](README.md): Comprehensive guide on contributing and documenting in the Lemmo ecosystem.")
    lines.append("- [Standard Document Template](templates/DOCUMENT_TEMPLATE.md): Template with mandatory bilingual metadata table header.")
    lines.append("")

    output_content = "\n".join(lines).strip() + "\n"
    OUTPUT_FILE.write_text(output_content, encoding="utf-8")
    print(f"✓ Generated {OUTPUT_FILE} with {sum(len(v) for v in docs_by_cat.values())} indexed documents.")

if __name__ == "__main__":
    main()
