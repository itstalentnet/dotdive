#!/usr/bin/env python3
"""
ADR-024 doc_ref gate — Documentation Repository (D-21 revised / D-25).

Deterministic, strict verification that every `doc_ref` in ADR-024-rules-catalog.md
points to an EXISTING file and an EXISTING, exactly-numbered section/heading,
explicit anchor, or (ADR-022 decision text) numbered clause.

Exit code: 0 if every reference resolves, 1 otherwise.

Usage:
    python3 dotdive/docs/lemmo/scripts/adr024/check_doc_refs.py
    python3 dotdive/docs/lemmo/scripts/adr024/check_doc_refs.py --dump   # quotes for report
"""
import sys
import os
import re
import yaml

NUM = r"[۰-۹0-9]+(?:\.[۰-۹0-9]+)*"
FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
EN_DIGITS = "0123456789"
_TRANS = str.maketrans(FA_DIGITS, EN_DIGITS)

HERE = os.path.dirname(os.path.abspath(__file__))
# HERE is dotdive/docs/lemmo/scripts/adr024
LEMMO_DOCS = os.path.normpath(os.path.join(HERE, "..", ".."))
DOTDIVE_ROOT = os.path.normpath(os.path.join(LEMMO_DOCS, "..", ".."))
DEFAULT_DOC = os.path.join(LEMMO_DOCS, "01-architecture", "decisions", "ADR-024-rules-catalog.md")

sys.path.insert(0, HERE)
from export_catalog import parse_catalog_md


def norm(s):
    return s.translate(_TRANS)


def read_lines(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read().split("\n")


def parse_headings(lines):
    """Return list of (lineno, level, text, num) in file order."""
    out = []
    for i, line in enumerate(lines, start=1):
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if not m:
            continue
        level = len(m.group(1))
        text = m.group(2).strip()
        num = None
        m2 = re.match(r"^(" + NUM + r")\.?(\s|$)", text)
        if m2:
            num = norm(m2.group(1))
        else:
            m3 = re.match(r"^Blueprint\s+(" + NUM + r")\b", text)
            if m3:
                num = norm(m3.group(1))
            else:
                m4 = re.match(r"^الگوی\s+([۰-۹0-9]+)", text)
                if m4:
                    num = "الگوی " + norm(m4.group(1))
        out.append((i, level, text, num))
    return out


def section_bounds(lines, headings, idx):
    level = headings[idx][1]
    start = headings[idx][0]
    end = len(lines)
    for j in range(idx + 1, len(headings)):
        if headings[j][1] <= level:
            end = headings[j][0] - 1
            break
    return start, end


def find_anchor(lines, anchor):
    target = anchor.lstrip("#")
    pats = [
        f'id="{target}"',
        f"id='{target}'",
        f'name="{target}"',
        f"name='{target}'",
        f"<a id=\"{target}\"",
        f"<a name=\"{target}\"",
    ]
    for i, line in enumerate(lines, start=1):
        for p in pats:
            if p in line:
                return True, i, line.strip()
    return False, None, None


def resolve(lines, headings, spec):
    if not spec:
        return True, None, "(whole file)", "file"

    if spec.startswith("#"):
        ok, ln, literal = find_anchor(lines, spec)
        if ok:
            return True, ln, literal, "anchor"
        return False, None, "anchor '%s' not found" % spec[1:], "anchor-miss"

    if not spec.startswith("§"):
        return False, None, "bad spec format: '%s'" % spec, "spec-err"

    raw_num = spec[1:].strip()
    n = norm(raw_num)

    if n.startswith("بند "):
        clause = n[len("بند "):].strip()
        dec_idx = None
        for idx, (ln, lvl, txt, num) in enumerate(headings):
            if "متن تصمیم" in txt or "Decision" in txt:
                dec_idx = idx
                break
        if dec_idx is None:
            return False, None, "no 'متن تصمیم' section to host '%s'" % n, "clause-no-section"
        start, end = section_bounds(lines, headings, dec_idx)
        pats = [
            re.compile(r"^[-*]\s+\*\*بند\s+" + re.escape(clause) + r"[\s:—\-]"),
            re.compile(r"^[-*]\s+بند\s+" + re.escape(clause) + r"[\s:—\-]"),
            re.compile(r"^" + re.escape(clause) + r"\.\s+"),
            re.compile(r"###\s+بند\s+" + re.escape(clause) + r"\b"),
        ]
        for ln in range(start, end + 1):
            line_norm = norm(lines[ln - 1])
            for p in pats:
                if p.search(line_norm):
                    return True, ln, lines[ln - 1].strip(), "clause"
        return False, None, "clause '%s' not found in decision section" % clause, "clause-miss"

    target_heading = None
    for idx, (ln, lvl, txt, num) in enumerate(headings):
        if num == n:
            target_heading = (idx, ln, lvl, txt)
            break
    if target_heading:
        idx, ln, lvl, txt = target_heading
        return True, ln, txt, "heading"

    parts = n.split(".")
    if len(parts) >= 2:
        parent_num = ".".join(parts[:-1])
        item_num = parts[-1]
        for idx, (ln, lvl, txt, num) in enumerate(headings):
            if num == parent_num:
                start, end = section_bounds(lines, headings, idx)
                item_pat = re.compile(
                    r"^[-*]\s+\[Gate-" + re.escape(item_num) + r"\]|"
                    r"^[-*]\s+\[" + re.escape(item_num) + r"\]|"
                    r"^" + re.escape(item_num) + r"\.\s+|"
                    r"^[-*]\s+\*\*" + re.escape(item_num) + r"\.\*\*"
                )
                for ln in range(start, end + 1):
                    line_norm = norm(lines[ln - 1])
                    if item_pat.search(line_norm):
                        return True, ln, lines[ln - 1].strip(), "subitem"
        return False, None, "no heading/item for '%s'" % n, "item-miss"

    return False, None, "heading '%s' not found" % n, "heading-miss"


def load_catalog(path):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if path.endswith(".md"):
        return parse_catalog_md(content)
    return yaml.safe_load(content)


def find_doc_file(doc_path, repo_root):
    """Resolve doc_path in either umbrella workspace or standalone dotdive clone."""
    sub_path = doc_path[len("dotdive/"):] if doc_path.startswith("dotdive/") else doc_path
    candidates = [
        os.path.join(DOTDIVE_ROOT, sub_path),
        os.path.join(repo_root, doc_path),
        os.path.join(repo_root, sub_path),
        os.path.join(DOTDIVE_ROOT, doc_path),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def check(repo_root, dump=False, doc_path=DEFAULT_DOC):
    catalog = load_catalog(doc_path)
    rules = sorted(catalog.get("rules", []), key=lambda r: r["id"])
    cache = {}
    failures = []
    quoted = []

    if not dump:
        print("=" * 65)
        print("ADR-024 DOCUMENT REFERENCE GATE (DOTDIVE / D-21)")
        print("=" * 65)
        print("Rules: %d" % len(rules))
        print("-" * 65)

    for r in rules:
        refs = [x.strip() for x in r["doc_ref"].split(",") if x.strip()]
        for ref in refs:
            parts = ref.split(" ")
            doc_path_ref = parts[0]
            spec = " ".join(parts[1:])
            if "#" in doc_path_ref:
                doc_path_ref, anchor = doc_path_ref.split("#", 1)
                spec = ("#" + anchor).strip()

            abspath = find_doc_file(doc_path_ref, repo_root)
            if doc_path_ref not in cache:
                if abspath and os.path.isfile(abspath):
                    lines = read_lines(abspath)
                    cache[doc_path_ref] = (lines, parse_headings(lines))
                else:
                    cache[doc_path_ref] = None
            cached = cache[doc_path_ref]
            if cached is None:
                failures.append((r["id"], ref, "file not found"))
                if not dump:
                    print("[FAIL] %-14s file not found: %s" % (r["id"], doc_path_ref))
                continue
            lines, headings = cached
            ok, lineno, literal, kind = resolve(lines, headings, spec)
            if not ok:
                failures.append((r["id"], ref, literal))
                if not dump:
                    print("[FAIL] %-14s %s  ->  %s" % (r["id"], spec or "(none)", literal))
            else:
                shown = doc_path_ref if lineno is None else "%s:%d" % (doc_path_ref, lineno)
                quoted.append((r["id"], ref, shown, literal))
                if not dump:
                    print("[PASS] %-14s %-28s -> %s" % (r["id"], spec or "(file)", shown))

    if dump:
        for (rid, ref, shown, literal) in quoted:
            print("%s\t%s\t%s" % (rid, shown, literal))
        if failures:
            for f in failures:
                print("FAIL\t%s\t%s\t%s" % f, file=sys.stderr)
        return 0 if not failures else 1

    print("-" * 65)
    if failures:
        print("FAILED: %d doc_ref(s) unresolved:" % len(failures), file=sys.stderr)
        for rid, ref, why in failures:
            print("  %s: %s -> %s" % (rid, ref, why), file=sys.stderr)
        print("RESULT: DOC_REF_GATE=FAIL", file=sys.stderr)
        return 1
    print("PASSED: %d doc_refs across %d rules resolved exactly." % (len(quoted), len(rules)))
    print("RESULT: DOC_REF_GATE=PASS")
    return 0


def main():
    argv = sys.argv[1:]
    dump = "--dump" in argv
    doc_path = DEFAULT_DOC
    if "--doc" in argv:
        doc_path = argv[argv.index("--doc") + 1]
    elif "--catalog" in argv:
        doc_path = argv[argv.index("--catalog") + 1]
    repo_root = DOTDIVE_ROOT
    sys.exit(check(repo_root, dump=dump, doc_path=doc_path))


if __name__ == "__main__":
    main()
