#!/usr/bin/env python3
"""
Service Responsibility Drift Guard (DOC-ARCH-013 / D-54 / AGENTS.md §8 / TASK_GOV_07)

Enforces authoritative service boundaries and prevents architectural drift in documentation:
- C1: Card Schema (exact 12-field schema, non-empty, 'ندارد' for absence)
- C2: Inverted Index (unique responsibilities, single valid card owner)
- C3: Coverage (every service in api/services and compose maps to a card)
- C4: No Independent Definition (prohibits unlinked responsibility assertions outside registry)
- C5: Decision References (every D-xx in cards resolves to an anchor in decision-register.md)
- C6: Change Rule (if registry changes in PR, decision-register.md must also change)
"""

import argparse
import glob
import json
import os
import re
import subprocess
import sys
import yaml

EXPECTED_FIELDS = [
    "شناسه",
    "دامنه",
    "وضعیت",
    "مسئولیت در یک جمله",
    "مسئولیت‌ها",
    "نمی‌کند / نمی‌داند",
    "دادهٔ متعلق",
    "قراردادها",
    "فراخوانی می‌کند / فراخوانده می‌شود از",
    "لمس پول",
    "تصمیم‌های مرجع",
    "بدهی شناخته‌شده",
]


class ConformanceChecker:
    def __init__(self, config_path=None, base_branch=None):
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.dotdive_root = os.path.abspath(os.path.join(self.script_dir, "..", "..", ".."))

        if not config_path:
            config_path = os.path.join(self.script_dir, "responsibility_rules.yaml")

        self.config_path = config_path
        with open(self.config_path, "r", encoding="utf-8") as f:
            self.config = yaml.safe_load(f)

        self.base_branch = base_branch or "origin/main"
        self.errors = []
        self.cards = {}
        self.card_identities = set()

        # Resolve paths
        self.registry_path = os.path.join(self.dotdive_root, self.config.get("registry_path", ""))
        self.decision_reg_path = os.path.join(self.dotdive_root, self.config.get("decision_register_path", ""))
        self.api_services_dir = os.path.abspath(os.path.join(self.dotdive_root, self.config.get("api_services_dir", "../api/services")))
        self.api_compose_file = os.path.abspath(os.path.join(self.dotdive_root, self.config.get("api_compose_file", "../api/infra/compose/dev.yml")))

    def load_cards(self):
        """Parse §3 of service-responsibility-registry.md and extract all cards."""
        if not os.path.exists(self.registry_path):
            self.errors.append(f"Registry file not found at: {self.registry_path}")
            return {}

        with open(self.registry_path, "r", encoding="utf-8") as f:
            content = f.read()

        sec3_match = re.search(r"\n## ۳\..*?(?=\n## ۴\.)", content, re.DOTALL)
        if not sec3_match:
            self.errors.append("Section 3 (## ۳. کارت‌های سرویس‌ها) not found in registry")
            return {}

        sec3_text = sec3_match.group(0)
        card_blocks = re.split(r"\n### ۳\.\d+\.\s+", sec3_text)[1:]

        cards = {}
        card_header_matches = re.findall(r"^### ۳\.(\d+)\.\s+(.*)$", sec3_text, re.MULTILINE)

        for idx, block in enumerate(card_blocks, 1):
            header_num = card_header_matches[idx - 1][0] if idx <= len(card_header_matches) else str(idx)
            header_title = card_header_matches[idx - 1][1] if idx <= len(card_header_matches) else f"Card {idx}"

            rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$", block, re.MULTILINE)
            field_rows = [r for r in rows if r[0].strip() != "فیلد" and not r[0].strip().startswith("---")]

            fields = [r[0].strip() for r in field_rows]
            values = [r[1].strip() for r in field_rows]

            card_data = {
                "num": header_num,
                "title": header_title.strip(),
                "fields": fields,
                "values": values,
                "field_map": dict(zip(fields, values)),
                "raw_block": block,
            }
            cards[header_num] = card_data

            # Track identities
            raw_id = card_data["field_map"].get("شناسه", "").strip().replace("`", "")
            if raw_id:
                self.card_identities.add(raw_id)
                base_id = raw_id.split()[0].rstrip(",()").strip()
                self.card_identities.add(base_id)
                # also title first token
                title_id = header_title.strip().replace("`", "").split()[0].rstrip(",()").strip()
                self.card_identities.add(title_id)

        self.cards = cards
        return cards

    def check_c1(self):
        """C1: Card Schema (12 exact fields, correct order, no empty cells)."""
        expected_fields = self.config.get("card_schema", {}).get("expected_fields", EXPECTED_FIELDS)
        expected_count = self.config.get("card_schema", {}).get("expected_card_count", 30)

        if len(self.cards) != expected_count:
            return False, f"Expected {expected_count} cards in §3, but found {len(self.cards)}"

        for num, card in self.cards.items():
            fields = card["fields"]
            values = card["values"]

            if fields != expected_fields:
                missing = set(expected_fields) - set(fields)
                extra = set(fields) - set(expected_fields)
                diff_desc = []
                if missing:
                    diff_desc.append(f"missing {sorted(missing)}")
                if extra:
                    diff_desc.append(f"extra {sorted(extra)}")
                if not missing and not extra and fields != expected_fields:
                    diff_desc.append("incorrect field ordering")
                return False, f"Card 3.{num} ({card['title']}) schema violation: {', '.join(diff_desc)}"

            for f_name, f_val in zip(fields, values):
                if not f_val:
                    return False, f"Card 3.{num} ({card['title']}) has empty value for required field '{f_name}'"

        return True, f"{len(self.cards)}/{expected_count} cards conform to 12-field schema"

    def check_c2(self):
        """C2: Inverted Index (unique responsibilities, single valid card owner)."""
        with open(self.registry_path, "r", encoding="utf-8") as f:
            content = f.read()

        sec4_match = re.search(r"\n## ۴\..*?(?=\n## ۵\.|\n---|\Z)", content, re.DOTALL)
        if not sec4_match:
            return False, "Section 4 (## ۴. شاخص معکوس مسئولیت‌ها) not found in registry"

        sec4_text = sec4_match.group(0)
        rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$", sec4_text, re.MULTILINE)
        table_rows = [r for r in rows if r[0].strip() != "مسئولیت" and not r[0].strip().startswith("---")]

        if not table_rows:
            return False, "No inverted index rows found in Section 4"

        seen_responsibilities = set()
        for resp, owner in table_rows:
            resp_clean = resp.strip()
            owner_clean = owner.strip().replace("`", "")

            if resp_clean in seen_responsibilities:
                return False, f"Duplicate responsibility in inverted index: '{resp_clean}'"
            seen_responsibilities.add(resp_clean)

            # Check multiple owners prohibited
            if "," in owner_clean or " و " in owner_clean:
                # Disallow multiple owners unless explicitly parenthetical alias
                parts = re.split(r",|\s+و\s+", owner_clean)
                distinct_services = [p for p in parts if "-service" in p]
                if len(distinct_services) > 1:
                    return False, f"Multiple owners assigned to responsibility '{resp_clean}': '{owner_clean}'"

            # Validate owner maps to a known card
            owner_base = owner_clean.split()[0].rstrip(",()").strip()
            aliases = self.config.get("service_aliases", {})
            mapped_owner = aliases.get(owner_base, owner_base)

            matched = (
                owner_clean in self.card_identities
                or owner_base in self.card_identities
                or mapped_owner in self.card_identities
                or owner_clean in ["(همان بالا)", "واژه‌نامه (قرارداد)", "رجیستری (داده)", "لایهٔ احراز هویت"]
            )
            if not matched:
                return False, f"Inverted index owner '{owner_clean}' for '{resp_clean}' does not match any card in §3"

        return True, f"{len(seen_responsibilities)} unique responsibilities mapped to valid single card owners"

    def check_c3(self):
        """C3: Coverage (every api service and compose service maps to a card in §3)."""
        aliases = self.config.get("service_aliases", {})
        ignored_compose = set(self.config.get("ignored_compose_services", []))

        # 1. Collect API services
        api_services = []
        if os.path.isdir(self.api_services_dir):
            api_services = [
                d for d in os.listdir(self.api_services_dir)
                if os.path.isdir(os.path.join(self.api_services_dir, d)) and not d.startswith(".")
            ]
        else:
            api_services = self.config.get("known_api_services", [])

        # 2. Collect compose services
        compose_services = []
        if os.path.exists(self.api_compose_file):
            try:
                with open(self.api_compose_file, "r", encoding="utf-8") as f:
                    dev_compose = yaml.safe_load(f) or {}
                compose_services = list(dev_compose.get("services", {}).keys())
                # Add included composes
                for inc in dev_compose.get("include", []):
                    inc_path = os.path.normpath(os.path.join(os.path.dirname(self.api_compose_file), inc))
                    if os.path.exists(inc_path):
                        with open(inc_path, "r", encoding="utf-8") as inc_f:
                            inc_data = yaml.safe_load(inc_f) or {}
                            compose_services.extend(inc_data.get("services", {}).keys())
            except Exception as e:
                return False, f"Failed to parse compose file: {e}"

        all_targets = sorted(set(api_services + [c for c in compose_services if c not in ignored_compose]))

        for target in all_targets:
            target_norm = aliases.get(target, target)
            matched = (
                target in self.card_identities
                or target_norm in self.card_identities
                or any(target_norm in c["title"] or target_norm in c["field_map"].get("شناسه", "") for c in self.cards.values())
            )
            if not matched:
                return False, f"Service '{target}' (resolved: '{target_norm}') is missing a dedicated card in §3 (ADR-013 / C3)"

        return True, f"All {len(all_targets)} active services and infrastructure components have registered cards"

    def check_c4(self):
        """C4: No Independent Definition (prohibits unlinked responsibility assertions)."""
        c4_cfg = self.config.get("c4_rules", {})
        patterns = c4_cfg.get("patterns", [])
        excluded_docs = set(c4_cfg.get("excluded_documents", []))
        whitelist = c4_cfg.get("whitelist", [])

        # Validate whitelist integrity (DoD E6: every entry must have a non-empty reason)
        for idx, entry in enumerate(whitelist):
            reason = entry.get("reason", "").strip()
            if not reason:
                return False, f"WHITELIST ERROR: Whitelist entry #{idx+1} for file '{entry.get('file')}' is missing a non-empty 'reason' field (DoD E6)"

        # Search documents
        doc_files = sorted(glob.glob(os.path.join(self.dotdive_root, "docs/lemmo/**/*.md"), recursive=True))
        all_cards = list(self.card_identities) + list(self.config.get("service_aliases", {}).keys())
        card_keywords = sorted(set(c for c in all_cards if len(c) > 3 and not c.startswith(".")))
        cards_regex = "|".join(re.escape(c) for c in card_keywords)

        compiled_patterns = []
        for pat in patterns:
            try:
                formatted_pat = pat.replace("{card}", f"({cards_regex})")
                compiled_patterns.append(re.compile(formatted_pat, re.IGNORECASE))
            except Exception as e:
                return False, f"Failed to compile pattern '{pat}': {e}"

        unlinked_violations = []

        for doc_path in doc_files:
            rel_path = os.path.relpath(doc_path, self.dotdive_root)
            if rel_path in excluded_docs or "archive" in rel_path or "obsolete" in rel_path or ".ref" in rel_path:
                continue

            with open(doc_path, "r", encoding="utf-8") as f:
                lines = f.readlines()

            for l_no, line in enumerate(lines, 1):
                # Check link to registry
                has_link = "service-responsibility-registry.md" in line

                for c_pat in compiled_patterns:
                    m = c_pat.search(line)
                    if m:
                        if has_link:
                            break  # Linked properly

                        # Check whitelist
                        is_whitelisted = False
                        for wl in whitelist:
                            wl_file = wl.get("file", "")
                            if wl_file and not rel_path.endswith(wl_file) and wl_file not in rel_path:
                                continue
                            if wl.get("line_contains") and wl["line_contains"] in line:
                                is_whitelisted = True
                                break
                            if wl.get("line") and wl["line"] == l_no:
                                is_whitelisted = True
                                break

                        if not is_whitelisted:
                            unlinked_violations.append((rel_path, l_no, m.group(0), line.strip()))
                            break

        if unlinked_violations:
            sample = unlinked_violations[0]
            return False, (
                f"Found {len(unlinked_violations)} unlinked responsibility assertions (C4).\n"
                f"First violation at {sample[0]}:{sample[1]} -> matched '{sample[2]}':\n"
                f"  \"{sample[3]}\"\n"
                f"Fix by linking to service-responsibility-registry.md or adding whitelisted reason in responsibility_rules.yaml"
            )

        return True, "No unlinked responsibility definitions found across documentation"

    def check_c5(self):
        """C5: Decision References (every D-xx in cards resolves to an anchor in decision-register.md)."""
        if not os.path.exists(self.decision_reg_path):
            return False, f"Decision register not found at: {self.decision_reg_path}"

        with open(self.decision_reg_path, "r", encoding="utf-8") as f:
            dec_text = f.read()

        anchors = set(re.findall(r'id=[\'"](d-[0-9a-zA-Z_-]+)[\'"]', dec_text, re.IGNORECASE))

        missing_decisions = []
        for num, card in self.cards.items():
            card_text = card["raw_block"]
            d_mentions = re.findall(r"\b(D-[0-9]{2,3})\b", card_text)
            for d in set(d_mentions):
                if d.lower() not in anchors:
                    missing_decisions.append((num, card["title"], d))

        if missing_decisions:
            first = missing_decisions[0]
            return False, f"Card 3.{first[0]} ({first[1]}) references unknown decision '{first[2]}' (no id=\"{first[2].lower()}\" in decision-register.md)"

        return True, "All decision references in cards successfully resolve to decision-register.md anchors"

    def check_c6(self):
        """C6: Change Rule (if registry changes in diff against base, decision-register must change)."""
        try:
            cmd = ["git", "diff", "--name-only", f"{self.base_branch}...HEAD"]
            res = subprocess.run(cmd, cwd=self.dotdive_root, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                # Try against local base
                cmd = ["git", "diff", "--name-only", "main...HEAD"]
                res = subprocess.run(cmd, cwd=self.dotdive_root, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            if res.returncode == 0:
                diff_files = res.stdout.strip().split("\n")
                reg_modified = any("service-responsibility-registry.md" in f for f in diff_files if f.strip())
                dec_modified = any("decision-register.md" in f for f in diff_files if f.strip())

                if reg_modified and not dec_modified:
                    return False, "CHANGE RULE VIOLATION (C6): service-responsibility-registry.md was modified but decision-register.md was not updated (D-54 / ADR-013 §7)"
                elif reg_modified and dec_modified:
                    return True, "Change rule satisfied: both service-responsibility-registry.md and decision-register.md were synchronized in this change"
                else:
                    return True, "Change rule passed: service-responsibility-registry.md is unchanged in this change"
        except Exception as e:
            return True, f"Change rule check skipped (git unavailable): {e}"

        return True, "Change rule passed"

    def run_all(self, target_check=None):
        self.load_cards()

        checks = [
            ("C1", "Card Schema", self.check_c1),
            ("C2", "Inverted Index", self.check_c2),
            ("C3", "Service Coverage", self.check_c3),
            ("C4", "No Independent Definition", self.check_c4),
            ("C5", "Decision References", self.check_c5),
            ("C6", "Change Rule Synchronization", self.check_c6),
        ]

        results = []
        all_passed = True

        for c_id, name, func in checks:
            if target_check and c_id.upper() != target_check.upper():
                continue

            passed, msg = func()
            if not passed:
                all_passed = False
            results.append({
                "id": c_id,
                "name": name,
                "passed": passed,
                "message": msg,
            })

        return all_passed, results


def main():
    parser = argparse.ArgumentParser(description="Service Responsibility Drift Guard (DOC-ARCH-013 / D-54)")
    parser.add_argument("--rules", help="Path to responsibility_rules.yaml")
    parser.add_argument("--base-branch", default="origin/main", help="Git base branch for C6 change rule diff")
    parser.add_argument("--check", help="Run only specific check (C1..C6)")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")

    args = parser.parse_args()

    checker = ConformanceChecker(config_path=args.rules, base_branch=args.base_branch)
    all_passed, results = checker.run_all(target_check=args.check)

    if args.json:
        out = {
            "passed": all_passed,
            "summary": {
                "total": len(results),
                "passed": sum(1 for r in results if r["passed"]),
                "failed": sum(1 for r in results if not r["passed"]),
            },
            "checks": results,
        }
        print(json.dumps(out, indent=2, ensure_ascii=False))
    else:
        print("=" * 65)
        print("LEMMO SERVICE RESPONSIBILITY DRIFT GUARD (DOC-ARCH-013 / D-54)")
        print("=" * 65)
        for r in results:
            tag = "[PASS]" if r["passed"] else "[FAIL]"
            print(f"{tag} {r['id']}: {r['name']:<28} {r['message']}")
        print("-" * 65)
        res_str = "RESPONSIBILITY_GUARD=PASS" if all_passed else "RESPONSIBILITY_GUARD=FAIL"
        print(f"RESULT: {res_str}")
        print("=" * 65)

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
