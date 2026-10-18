#!/usr/bin/env python3
"""
ADR-024 doc_ref gate (REV-6).

Deterministic, strict verification that every `doc_ref` in ADR-024.rules.yaml
points to an EXISTING file and an EXISTING, exactly-numbered section/heading,
explicit anchor, or (ADR-022 decision text) numbered clause.

Guarantees required by REV-6 §A-1:
  * 100% deterministic output (no set()/dict-order dependence; identical for any
    PYTHONHASHSEED).
  * Exact section matching: the heading/paragraph number must be equal to the
    requested spec (not merely "a digit appears somewhere in a heading").
  * `#anchor` is accepted only when a real HTML anchor (`id=`/`name=`) or a real
    GitHub heading slug exists in the target file.
  * All paths are resolved relative to the repository root, never the cwd.

Exit code: 0 if every reference resolves, 1 otherwise.

Usage:
    python3 docs/lemmo/scripts/adr024/check_doc_refs.py
    python3 docs/lemmo/scripts/adr024/check_doc_refs.py --dump   # quotes for report
"""
import sys
import os
import re
import yaml

NUM = r"[۰-۹0-9]+(?:\.[۰-۹0-9]+)*"
FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
EN_DIGITS = "0123456789"
_TRANS = str.maketrans(FA_DIGITS, EN_DIGITS)


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


def github_slug(text):
    s = text.strip().lower()
    s = re.sub(r"[^0-9a-z\u0600-\u06FF\- ]+", "", s)
    s = s.replace(" ", "-")
    return s


def resolve(lines, headings, spec):
    """Resolve a single section spec. Returns (ok, lineno, literal, kind)."""
    s = spec.strip()
    if s == "":
        return True, None, "(file-level reference)", "file"
    if s.startswith("#"):
        anchor = s[1:].strip().lower()
        for i, line in enumerate(lines, start=1):
            if re.search(r'(?:id|name)=["\']' + re.escape(anchor) + r'["\']', line, re.IGNORECASE):
                return True, i, line.strip(), "anchor"
        for (i, _lvl, text, _num) in headings:
            if github_slug(text) == anchor:
                return True, i, text, "slug"
        return False, None, "anchor '%s' not found" % anchor, "anchor-miss"
    if not s.startswith("§"):
        return False, None, "spec '%s' has no '§' or '#' prefix" % s, "bad-spec"
    body = s[1:].strip()

    # ADR decision-text clause: "§بند N" (decision-list items of ADR-022/ADR-023)
    if body.startswith("بند"):
        n = norm(body.replace("بند", "").strip())
        has_decision = any("متن تصمیم" in (h[2] or "") for h in headings)
        if not has_decision:
            return False, None, "no 'متن تصمیم' section to host 'بند %s'" % n, "band-nohost"
        for i, line in enumerate(lines, start=1):
            if re.match(r"^\s*" + re.escape(n) + r"[.)]\s", norm(line)):
                return True, i, line.strip(), "band"
        return False, None, "'بند %s' clause not found" % n, "band-miss"

    m = re.match(r"^الگوی\s+([۰-۹0-9]+)$", body)
    if m:
        key = "الگوی " + norm(m.group(1))
        for (i, _lvl, text, num) in headings:
            if num == key:
                return True, i, text, "heading"
        return False, None, "heading '%s' not found" % key, "heading-miss"

    n = norm(body)
    if not re.match(r"^[0-9]+(?:\.[0-9]+)*$", n):
        return False, None, "invalid numeric spec '%s'" % body, "bad-spec"

    for (i, _lvl, text, num) in headings:
        if num == n:
            return True, i, text, "heading"

    # Sub-item reference "§X.Y" -> list item Y inside heading X (e.g. iam-service-spec §1.3)
    if "." in n:
        x, y = n.rsplit(".", 1)
        for idx, (i, _lvl, _text, num) in enumerate(headings):
            if num == x:
                start, end = section_bounds(lines, headings, idx)
                for ln in range(start, end + 1):
                    if re.match(r"^\s*" + re.escape(y) + r"[.)]\s", lines[ln - 1]):
                        return True, ln, lines[ln - 1].strip(), "subitem"
        return False, None, "no heading/item for '%s'" % n, "item-miss"

    return False, None, "heading '%s' not found" % n, "heading-miss"


DEFAULT_CATALOG = "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml"


def load_catalog(repo_root, catalog_path):
    path = catalog_path if os.path.isabs(catalog_path) else os.path.join(repo_root, catalog_path)
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def check(repo_root, dump=False, catalog_path=DEFAULT_CATALOG):
    catalog = load_catalog(repo_root, catalog_path)
    rules = sorted(catalog.get("rules", []), key=lambda r: r["id"])
    cache = {}
    failures = []
    quoted = []

    if not dump:
        print("=" * 65)
        print("ADR-024 DOCUMENT REFERENCE GATE (REV-6 — strict/deterministic)")
        print("=" * 65)
        print("Rules: %d" % len(rules))
        print("-" * 65)

    for r in rules:
        refs = [x.strip() for x in r["doc_ref"].split(",") if x.strip()]
        rule_failed = False
        for ref in refs:
            parts = ref.split(" ")
            doc_path = parts[0]
            spec = " ".join(parts[1:])
            if "#" in doc_path:  # "path#anchor" form
                doc_path, anchor = doc_path.split("#", 1)
                spec = ("#" + anchor).strip()
            abspath = os.path.join(repo_root, doc_path)
            if doc_path not in cache:
                if os.path.isfile(abspath):
                    lines = read_lines(abspath)
                    cache[doc_path] = (lines, parse_headings(lines))
                else:
                    cache[doc_path] = None
            cached = cache[doc_path]
            if cached is None:
                failures.append((r["id"], ref, "file not found"))
                rule_failed = True
                if not dump:
                    print("[FAIL] %-14s file not found: %s" % (r["id"], doc_path))
                continue
            lines, headings = cached
            ok, lineno, literal, kind = resolve(lines, headings, spec)
            if not ok:
                failures.append((r["id"], ref, literal))
                rule_failed = True
                if not dump:
                    print("[FAIL] %-14s %s  ->  %s" % (r["id"], spec or "(none)", literal))
            else:
                shown = doc_path if lineno is None else "%s:%d" % (doc_path, lineno)
                quoted.append((r["id"], ref, shown, literal))
                if not dump:
                    print("[PASS] %-14s %-28s -> %s" % (r["id"], spec or "(file)", shown))
        if dump and rule_failed:
            pass

    if dump:
        for (rid, ref, shown, literal) in quoted:
            line = "%s\t%s\t%s" % (rid, shown, literal)
            print(line)
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
    catalog_path = DEFAULT_CATALOG
    if "--catalog" in argv:
        catalog_path = argv[argv.index("--catalog") + 1]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, "..", "..", "..", "..", ".."))
    sys.exit(check(repo_root, dump=dump, catalog_path=catalog_path))


if __name__ == "__main__":
    main()
