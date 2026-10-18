#!/usr/bin/env python3
"""
Checks that every doc_ref in ADR-024.rules.yaml points to an existing file and valid section/heading.
Deterministic output (sorted by rule ID), no reliance on hash/dict order.
Exit code: 0 on success, non-zero on failure.
"""
import sys
import os
import re
import yaml

FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
EN_DIGITS = "0123456789"
fa_to_en = str.maketrans(FA_DIGITS, EN_DIGITS)
en_to_fa = str.maketrans(EN_DIGITS, FA_DIGITS)

def digit_variants(s):
    v = {s, s.translate(fa_to_en), s.translate(en_to_fa)}
    return list(v)

def verify_single_ref(ref_str, repo_root):
    if "#" in ref_str:
        doc_path, anchor = ref_str.split("#", 1)
        anchor = anchor.split(" ")[0]
    else:
        parts = ref_str.split(" ")
        doc_path = parts[0]
        anchor = " ".join(parts[1:]) if len(parts) > 1 else ""

    resolved_path = doc_path
    if not os.path.exists(resolved_path):
        alt = os.path.join(repo_root, doc_path)
        if os.path.exists(alt):
            resolved_path = alt

    if not os.path.exists(resolved_path):
        return {"ref": ref_str, "file_exists": False, "section_found": False, "error": f"File not found: {doc_path}"}

    with open(resolved_path, "r", encoding="utf-8") as f:
        content = f.read()

    if not anchor:
        return {"ref": ref_str, "file_exists": True, "section_found": True, "match": "File-level ref"}

    found = False
    matched_str = ""

    # Case 1: HTML or markdown anchor
    if re.search(r'id=["\']' + re.escape(anchor) + r'["\']', content, re.IGNORECASE) or \
       re.search(r'name=["\']' + re.escape(anchor) + r'["\']', content, re.IGNORECASE) or \
       re.search(r'#' + re.escape(anchor) + r'\b', content, re.IGNORECASE) or \
       re.search(r'\*\*' + re.escape(anchor) + r'\*\*', content, re.IGNORECASE):
        found = True
        matched_str = f"Anchor #{anchor}"

    # Case 2: Section marker §
    if not found and "§" in anchor:
        sec_term = anchor.replace("§", "").strip()
        if "-" in sec_term:
            sec_term = sec_term.split("-")[0].replace("§", "").strip()

        search_terms = []
        for v in digit_variants(sec_term):
            search_terms.append(v)
            if "(" in v:
                search_terms.append(v.split("(")[0].strip())
                search_terms.append(v.split("(")[1].replace(")", "").strip())
            if v.startswith("بند "):
                band_num = v.replace("بند ", "").strip()
                search_terms.extend(digit_variants(band_num))

        for st in search_terms:
            if not st:
                continue
            pattern = r"^#+\s+.*(?:\b|[^\w])" + re.escape(st) + r"(?:[\.\s:]|[^\w]|$).*$"
            matches = re.findall(pattern, content, re.MULTILINE)
            if matches:
                found = True
                matched_str = matches[0].strip()
                break

            num_match = re.search(r"^\s*" + re.escape(st) + r"[\.\s].*$", content, re.MULTILINE)
            if num_match:
                found = True
                matched_str = num_match.group(0).strip()
                break

            pattern_loose = r"^#+\s+.*" + re.escape(st) + r".*$"
            matches_loose = re.findall(pattern_loose, content, re.MULTILINE)
            if matches_loose:
                found = True
                matched_str = matches_loose[0].strip()
                break

            # Hierarchical search for X.Y (linear line-by-line scanner, zero regex backtracking)
            if "." in st:
                parts_xy = st.split(".")
                if len(parts_xy) == 2 and parts_xy[0].isdigit() and parts_xy[1].isdigit():
                    x_variants = digit_variants(parts_xy[0])
                    y_variants = digit_variants(parts_xy[1])
                    in_sec_x = False
                    for line in content.splitlines():
                        if line.startswith("#"):
                            is_sec_x = any(re.search(r"^#+\s+.*(?:\b|[^\w])" + re.escape(xv) + r"(?:[\.\s:]|[^\w])", line) for xv in x_variants)
                            if is_sec_x:
                                in_sec_x = True
                                continue
                            elif in_sec_x and re.match(r"^##\s+", line):
                                # Hit another level-2 heading, stop section X
                                break
                        if in_sec_x:
                            is_item_y = any(re.search(r"^#+\s+.*(?:\b|[^\w])" + re.escape(yv) + r"(?:[\.\s:]|[^\w]|$)", line) or re.search(r"^\s*" + re.escape(yv) + r"[\.\s]", line) for yv in y_variants)
                            if is_item_y:
                                found = True
                                matched_str = line.strip()
                                break
            if found:
                break

    # Case 3: Heading text search
    if not found:
        clean_term = anchor.replace("(", "").replace(")", "").strip()
        for v in digit_variants(clean_term):
            pattern = r"^#+\s+.*" + re.escape(v) + r".*$"
            matches = re.findall(pattern, content, re.MULTILINE | re.IGNORECASE)
            if matches:
                found = True
                matched_str = matches[0].strip()
                break

    return {
        "ref": ref_str,
        "file_exists": True,
        "section_found": found,
        "match": matched_str if found else "NOT FOUND"
    }

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, "../../../../.."))
    catalog_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml")

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    rules = sorted(catalog.get("rules", []), key=lambda r: r["id"])
    failures = []
    
    print("=================================================================")
    print("ADR-024 DOCUMENT REFERENCES VERIFICATION REPORT (REV-5)")
    print("=================================================================")
    print(f"Total Rules Verified: {len(rules)} (sorted deterministically)")
    print("-----------------------------------------------------------------")

    for r in rules:
        refs = [x.strip() for x in r["doc_ref"].split(",")]
        rule_passed = True
        matched_details = []
        for ref in refs:
            res = verify_single_ref(ref, repo_root)
            if not res["file_exists"] or not res["section_found"]:
                rule_passed = False
                failures.append((r["id"], res))
            else:
                matched_details.append(res["match"])
        status = "PASS" if rule_passed else "FAIL"
        summary_match = " | ".join(matched_details[:2])
        print(f"[{status}] {r['id']:<14} -> {summary_match}")

    print("-----------------------------------------------------------------")
    if failures:
        print(f"FAILED: {len(failures)} reference checks failed!", file=sys.stderr)
        for rid, fail in failures:
            print(f"  {rid}: {fail}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"SUCCESS: 100% of doc_refs across all {len(rules)} rules verified successfully!")
        print("=================================================================")

if __name__ == "__main__":
    main()
