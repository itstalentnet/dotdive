#!/usr/bin/env python3
"""
Documentation link-integrity gate — Dotdive Repository (D-21 / REV-6).

Verifies that every local (non-URL, non-anchor) Markdown link under
`dotdive/docs/lemmo/` resolves to an existing file. Committed so that the link
count published in any report is reproducible from the repository alone.

Deterministic output. Exit code: 0 if no broken links, 1 otherwise.

Usage:
    python3 dotdive/scripts/check_links.py
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOC_ROOT = os.path.normpath(os.path.join(HERE, "..", "docs", "lemmo"))

LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
SKIP_PREFIXES = ("http://", "https://", "mailto:", "#", "tel:", "file://")


def main():
    total = 0
    broken = []
    md_files = sorted(
        os.path.join(root, name)
        for root, _dirs, names in os.walk(DOC_ROOT)
        for name in names
        if name.endswith(".md")
    )
    for path in md_files:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        for _text, target in LINK_RE.findall(content):
            target = target.strip()
            if target.startswith(SKIP_PREFIXES):
                continue
            total += 1
            file_part = target.split("#", 1)[0]
            if not file_part:
                continue
            resolved = os.path.normpath(os.path.join(os.path.dirname(path), file_part))
            if not os.path.exists(resolved):
                broken.append((os.path.relpath(path, DOC_ROOT), target))

    print("=" * 65)
    print("LEMMO DOCUMENTATION LINK-INTEGRITY REPORT (REV-6)")
    print("=" * 65)
    print("Markdown files scanned: %d" % len(md_files))
    print("Local markdown links checked: %d" % total)
    print("Broken links found: %d" % len(broken))
    print("-" * 65)

    if broken:
        for src, target in broken:
            print("  [BROKEN] %s -> %s" % (src, target), file=sys.stderr)
        print("RESULT: LINK_INTEGRITY=FAIL", file=sys.stderr)
        return 1

    print("All local documentation links resolve.")
    print("RESULT: LINK_INTEGRITY=PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
