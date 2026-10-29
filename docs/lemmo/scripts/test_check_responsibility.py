#!/usr/bin/env python3
"""
Negative Mutation Tests for Service Responsibility Drift Guard (TASK_GOV_07 / DoD E2, E6)

Validates that:
- Positive control passes with exit 0.
- Each of the 6 checks (C1..C6) catches its specific mutation and exits with code 1.
- DoD E6: A whitelist entry missing a non-empty reason is rejected with exit != 0.
"""

import copy
import os
import shutil
import subprocess
import sys
import tempfile
import yaml

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHECK_SCRIPT = os.path.join(SCRIPT_DIR, "check_responsibility.py")
DEFAULT_RULES = os.path.join(SCRIPT_DIR, "responsibility_rules.yaml")
DOTDIVE_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "..", ".."))


def run_checker(rules_path=None, check=None, extra_args=None, cwd=None):
    cmd = [sys.executable, CHECK_SCRIPT]
    if rules_path:
        cmd.extend(["--rules", rules_path])
    if check:
        cmd.extend(["--check", check])
    if extra_args:
        cmd.extend(extra_args)

    res = subprocess.run(
        cmd,
        cwd=cwd or DOTDIVE_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return res.returncode, res.stdout + res.stderr


def test_positive_control():
    code, output = run_checker()
    assert code == 0, f"Positive control failed with exit {code}:\n{output}"
    assert "RESULT: RESPONSIBILITY_GUARD=PASS" in output
    print("  [PASS] Positive control: untouched docs pass all 6 checks (exit=0)")


def test_mutation_c1():
    with tempfile.TemporaryDirectory() as tmpdir:
        # Copy registry and mutate
        orig_reg = os.path.join(DOTDIVE_ROOT, "docs/lemmo/01-architecture/service-responsibility-registry.md")
        tmp_reg = os.path.join(tmpdir, "service-responsibility-registry.md")
        with open(orig_reg, "r", encoding="utf-8") as f:
            content = f.read()

        # Remove 'بدهی شناخته‌شده' row from Card 3.1
        mutated = re_replace_first(content, r"\|\s*بدهی شناخته‌شده\s*\|.*?\n", "")
        with open(tmp_reg, "w", encoding="utf-8") as f:
            f.write(mutated)

        # Mutate config
        tmp_cfg = os.path.join(tmpdir, "rules.yaml")
        with open(DEFAULT_RULES, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        cfg["registry_path"] = tmp_reg
        with open(tmp_cfg, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, allow_unicode=True)

        code, output = run_checker(rules_path=tmp_cfg, check="C1")
        assert code == 1, f"Expected C1 to fail, got {code}:\n{output}"
        assert "[FAIL] C1:" in output
        assert "schema violation" in output or "missing" in output
        print("  [PASS] Mutation C1: missing card field correctly rejected (exit=1)")


def test_mutation_c2():
    with tempfile.TemporaryDirectory() as tmpdir:
        orig_reg = os.path.join(DOTDIVE_ROOT, "docs/lemmo/01-architecture/service-responsibility-registry.md")
        tmp_reg = os.path.join(tmpdir, "service-responsibility-registry.md")
        with open(orig_reg, "r", encoding="utf-8") as f:
            content = f.read()

        # Inject duplicate responsibility in §4
        target = "| مسیریابی URL / CORS / rate limit لبه / تولید شناسهٔ رهگیری تازه لبه (D-85) | Kong |"
        duplicate_entry = target + "\n| مسیریابی URL / CORS / rate limit لبه / تولید شناسهٔ رهگیری تازه لبه (D-85) | auth-service |"
        mutated = content.replace(target, duplicate_entry, 1)

        with open(tmp_reg, "w", encoding="utf-8") as f:
            f.write(mutated)

        tmp_cfg = os.path.join(tmpdir, "rules.yaml")
        with open(DEFAULT_RULES, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        cfg["registry_path"] = tmp_reg
        with open(tmp_cfg, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, allow_unicode=True)

        code, output = run_checker(rules_path=tmp_cfg, check="C2")
        assert code == 1, f"Expected C2 to fail, got {code}:\n{output}"
        assert "[FAIL] C2:" in output
        assert "Duplicate responsibility" in output
        print("  [PASS] Mutation C2: duplicate responsibility in inverted index rejected (exit=1)")


def test_mutation_c3():
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a fake api services folder with an unmapped service
        fake_api_services = os.path.join(tmpdir, "api_services")
        os.makedirs(fake_api_services, exist_ok=True)
        os.makedirs(os.path.join(fake_api_services, "unregistered-alien-service"), exist_ok=True)

        tmp_cfg = os.path.join(tmpdir, "rules.yaml")
        with open(DEFAULT_RULES, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        cfg["api_services_dir"] = fake_api_services
        cfg["api_compose_file"] = os.path.join(tmpdir, "nonexistent-compose.yml")
        with open(tmp_cfg, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, allow_unicode=True)

        code, output = run_checker(rules_path=tmp_cfg, check="C3")
        assert code == 1, f"Expected C3 to fail, got {code}:\n{output}"
        assert "[FAIL] C3:" in output
        assert "unregistered-alien-service" in output
        print("  [PASS] Mutation C3: unregistered API service correctly rejected (exit=1)")


def test_mutation_c4():
    # Create a temporary unlinked markdown doc under docs/lemmo/
    test_doc = os.path.join(DOTDIVE_ROOT, "docs/lemmo/03-backend/temp_test_c4_violation.md")
    try:
        with open(test_doc, "w", encoding="utf-8") as f:
            f.write("# Temporary Test Doc\nسرویس auth-service مسئول احراز هویت است بدون هیچ پیوندی.\n")

        code, output = run_checker(check="C4")
        assert code == 1, f"Expected C4 to fail, got {code}:\n{output}"
        assert "[FAIL] C4:" in output
        assert "temp_test_c4_violation.md" in output
        print("  [PASS] Mutation C4: unlinked responsibility definition correctly rejected (exit=1)")
    finally:
        if os.path.exists(test_doc):
            os.remove(test_doc)


def test_mutation_c5():
    with tempfile.TemporaryDirectory() as tmpdir:
        orig_reg = os.path.join(DOTDIVE_ROOT, "docs/lemmo/01-architecture/service-responsibility-registry.md")
        tmp_reg = os.path.join(tmpdir, "service-responsibility-registry.md")
        with open(orig_reg, "r", encoding="utf-8") as f:
            content = f.read()

        # Inject unknown D-999 into Card 3.1
        mutated = content.replace("D-38", "D-999", 1)
        with open(tmp_reg, "w", encoding="utf-8") as f:
            f.write(mutated)

        tmp_cfg = os.path.join(tmpdir, "rules.yaml")
        with open(DEFAULT_RULES, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        cfg["registry_path"] = tmp_reg
        with open(tmp_cfg, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, allow_unicode=True)

        code, output = run_checker(rules_path=tmp_cfg, check="C5")
        assert code == 1, f"Expected C5 to fail, got {code}:\n{output}"
        assert "[FAIL] C5:" in output
        assert "D-999" in output
        print("  [PASS] Mutation C5: unanchored decision reference D-999 rejected (exit=1)")


def test_mutation_c6():
    # Run git diff against HEAD~1 simulating change rule
    # Create a dummy commit in a temp git repo or branch
    with tempfile.TemporaryDirectory() as tmpdir:
        # Initialize temp git repo
        subprocess.run(["git", "init"], cwd=tmpdir, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["git", "config", "user.name", "Test"], cwd=tmpdir, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=tmpdir, check=True)

        docs_arch = os.path.join(tmpdir, "docs/lemmo/01-architecture")
        docs_gov = os.path.join(tmpdir, "docs/lemmo/09-governance")
        os.makedirs(docs_arch, exist_ok=True)
        os.makedirs(docs_gov, exist_ok=True)

        reg_file = os.path.join(docs_arch, "service-responsibility-registry.md")
        dec_file = os.path.join(docs_gov, "decision-register.md")

        with open(reg_file, "w") as f:
            f.write("initial registry\n")
        with open(dec_file, "w") as f:
            f.write("initial decision\n")

        subprocess.run(["git", "add", "."], cwd=tmpdir, check=True)
        subprocess.run(["git", "commit", "-m", "initial"], cwd=tmpdir, check=True, stdout=subprocess.DEVNULL)
        subprocess.run(["git", "branch", "main"], cwd=tmpdir, check=True)

        # Mutate registry ONLY
        with open(reg_file, "a") as f:
            f.write("changed registry\n")
        subprocess.run(["git", "add", reg_file], cwd=tmpdir, check=True)
        subprocess.run(["git", "commit", "-m", "registry change only"], cwd=tmpdir, check=True, stdout=subprocess.DEVNULL)

        # Copy checker and rules into temp repo
        scripts_dir = os.path.join(tmpdir, "docs/lemmo/scripts")
        os.makedirs(scripts_dir, exist_ok=True)
        shutil.copy(CHECK_SCRIPT, os.path.join(scripts_dir, "check_responsibility.py"))

        tmp_cfg = os.path.join(scripts_dir, "responsibility_rules.yaml")
        with open(DEFAULT_RULES, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)
        with open(tmp_cfg, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, allow_unicode=True)

        cmd = [sys.executable, os.path.join(scripts_dir, "check_responsibility.py"), "--base-branch", "main", "--check", "C6"]
        res = subprocess.run(cmd, cwd=tmpdir, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        assert res.returncode == 1, f"Expected C6 to fail, got {res.returncode}:\n{res.stdout + res.stderr}"
        assert "CHANGE RULE VIOLATION (C6)" in (res.stdout + res.stderr)
        print("  [PASS] Mutation C6: registry modification without decision-register update rejected (exit=1)")


def test_mutation_e6():
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp_cfg = os.path.join(tmpdir, "rules.yaml")
        with open(DEFAULT_RULES, "r", encoding="utf-8") as f:
            cfg = yaml.safe_load(f)

        # Add invalid whitelist entry without reason
        cfg["c4_rules"]["whitelist"].append({
            "file": "some/file.md",
            "line_contains": "test string",
            "reason": "",  # Empty reason!
        })

        with open(tmp_cfg, "w", encoding="utf-8") as f:
            yaml.dump(cfg, f, allow_unicode=True)

        code, output = run_checker(rules_path=tmp_cfg, check="C4")
        assert code == 1, f"Expected E6 to fail, got {code}:\n{output}"
        assert "WHITELIST ERROR" in output
        assert "missing a non-empty 'reason' field" in output
        print("  [PASS] Mutation E6: whitelist entry missing reason rejected (exit=1)")


def re_replace_first(text, pattern, replacement):
    import re
    return re.sub(pattern, replacement, text, count=1)


def main():
    print("=" * 65)
    print("RESPONSIBILITY DRIFT GUARD NEGATIVE MUTATION SUITE (E2 / E6)")
    print("=" * 65)

    test_positive_control()
    test_mutation_c1()
    test_mutation_c2()
    test_mutation_c3()
    test_mutation_c4()
    test_mutation_c5()
    test_mutation_c6()
    test_mutation_e6()

    print("-" * 65)
    print("All 7 mutation tests passed as specified.")
    print("RESULT: NEGATIVE_TESTS=PASS")
    print("=" * 65)
    sys.exit(0)


if __name__ == "__main__":
    main()
