#!/usr/bin/env python3
"""
Compiles ADR-024-service-blueprint-and-conformance.md from ADR-024.rules.yaml.
Ensures zero drift between machine-readable YAML catalog and Markdown documentation.
"""
import sys
import os
import yaml

def format_rule_table(rule_subset):
    header = "| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |\n"
    header += "| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n"
    rows = []
    for r in rule_subset:
        rid = f"`{r['id']}`"
        name = f"**{r['name']}**"
        req = r['requirement']
        cond = f"`{r['applies_when']}`"
        auto = f"`{r['automation']}`"
        status = f"`{r['implementation_status']}`"
        eval_mech = f"`{r['evaluation_mechanism']}`"
        gate_stage = f"{r['gate']} (M{r['roadmap_stage']})"
        enforced = f"`{r['enforced_by']}`"
        doc_stat = {"approved": "مصوب", "draft_source": "پیش‌نویس", "gap": "شکاف سند"}.get(r['doc_status'], r['doc_status'])
        
        # Format doc_ref nicely as relative Markdown links
        refs = [x.strip() for x in r['doc_ref'].split(",")]
        formatted_refs = []
        for ref in refs:
            parts = ref.split(" ")
            doc_file = parts[0]
            sec = " ".join(parts[1:]) if len(parts) > 1 else ""
            base_name = os.path.basename(doc_file)
            if doc_file.startswith("dotdive/docs/lemmo/01-architecture/decisions/"):
                rel_path = f"./{base_name}"
            elif doc_file.startswith("dotdive/docs/lemmo/01-architecture/"):
                rel_path = f"../{base_name}"
            elif doc_file.startswith("dotdive/docs/lemmo/03-backend/"):
                rel_path = f"../../03-backend/{base_name}"
            elif doc_file.startswith("dotdive/docs/lemmo/07-devops/"):
                rel_path = f"../../07-devops/{base_name}"
            elif doc_file.startswith("dotdive/docs/lemmo/09-governance/"):
                rel_path = f"../../09-governance/{base_name}"
            else:
                rel_path = doc_file
            
            clean_name = base_name.replace(".md", "")
            if sec:
                formatted_refs.append(f"[{clean_name} {sec}]({rel_path})")
            else:
                formatted_refs.append(f"[{clean_name}]({rel_path})")
        doc_ref_str = "، ".join(formatted_refs)
        rows.append(f"| {rid} | {name} | {req} | {cond} | {auto} | {status} | {eval_mech} | {gate_stage} | {enforced} | {doc_stat} | {doc_ref_str} |")
    return header + "\n".join(rows)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.normpath(os.path.join(script_dir, "../../../../.."))
    catalog_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024.rules.yaml")
    output_md_path = os.path.join(repo_root, "dotdive/docs/lemmo/01-architecture/decisions/ADR-024-service-blueprint-and-conformance.md")

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = yaml.safe_load(f)

    rules = catalog.get("rules", [])
    rule_map = {r["id"]: r for r in rules}

    dir_rules = [rule_map[k] for k in ["SB-DIR-01", "SB-DIR-02", "SB-DIR-03", "SB-DIR-04", "SB-DOC-01", "SB-MAN-01"]]
    cfg_rules = [rule_map[k] for k in ["SB-CFG-01", "SB-CFG-02", "SB-CFG-03", "SB-CFG-04"]]
    dep_rules = [rule_map[k] for k in ["SB-DEP-01", "SB-DEP-02", "SB-DEP-03", "SB-DEP-04", "SB-VER-01", "SB-VER-02", "SB-IMG-01", "SB-HDR-01"]]
    ctr_rules = [rule_map[k] for k in ["SB-CTR-01", "SB-CTR-02", "SB-CTR-03", "SB-CTR-04", "SB-CTR-05", "SB-CTR-06", "SB-CTR-07", "SB-CTR-08"]]
    evt_sec_rules = [rule_map[k] for k in ["SB-EVT-01", "SB-EVT-02", "SB-EVT-03", "SB-EVT-04", "SB-SEC-01", "SB-RES-01", "SB-RES-02", "SB-LOG-01", "SB-LOG-02", "SB-TRC-01", "SB-ERR-01", "SB-TST-01"]]
    cnd_rules = [rule_map[k] for k in ["SB-CND-JSON", "SB-CND-SSRF", "SB-CND-TENANT", "SB-CND-RATE", "SB-CND-REF"]]
    rt_rules = [rule_map[k] for k in ["SB-RT-01", "SB-RT-02", "SB-RT-03", "SB-RT-04", "SB-RT-05", "SB-RT-06", "SB-RT-07"]]

    doc_content = f"""| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Microservice Standard Blueprint, Reference Scaffolding, Service Manifest, and Conformance Engine (`ADR-024`) |
| **Title (FA)** | الگوی استاندارد میکروسرویس، اسکلت مرجع، مانیفست سرویس و موتور اعتبارسنجی انطباق مبتنی بر `lemmo-cli` |
| **ID** | ADR-024 |
| **Category** | `architecture` |
| **Status** | `Draft` |
| **Owner** | Platform Architecture & Tech Lead |
| **Last Updated** | 2026-10-18 |
| **Summary (EN)** | Authoritative specification for Lemmo microservice blueprint, 50 canonical conformance rules codified in machine-readable ADR-024.rules.yaml, service manifest schema, contracts and OpenAPI governance, static AST verification via lemmo-cli, and live runtime probes aggregated into make doctor. |
| **Summary (FA)** | سند رسمی الگوی استاندارد میکروسرویس‌های لیمو، کاتالوگ ۵۰ گانه قواعد انطباق ماشین‌خوان در ADR-024.rules.yaml، مانیفست سرویس، حاکمیت قراردادها و OpenAPI، اعتبارسنجی ایستا با lemmo-cli و آزمون‌های زنده متصل به make doctor. |
| **Tags** | `adr`, `blueprint`, `conformance`, `lemmo-cli`, `manifest`, `contracts`, `openapi`, `make-doctor`, `zero-diff` |

---

# ADR-024: الگوی استاندارد میکروسرویس، اسکلت مرجع، مانیفست سرویس و اعتبارسنج انطباق

> 📖 **منبع یگانه حقیقت قواعد (SSOT):**  
> کاتالوگ جامع و رسمی کلیه قواعد این سند در فایل داده‌ای ماشین‌خوان [`ADR-024.rules.yaml`](./ADR-024.rules.yaml) (منطبق بر اسکیمای [`rules-catalog.schema.json`](./rules-catalog.schema.json)) تعریف شده است. ابزار `lemmo-cli` مستقیماً این فایل را مصرف خواهد کرد و به عنوان مجری استانداردهای مستند عمل می‌نماید (تولید سند از کد ملغی است). این سند در وضعیت **پیش‌نویس (Draft)** قرار دارد و تا زمان تصویب رسمی توسط مالک محصول، به عنوان مرجع طراحی معماری عمل می‌کند.

---

## ۱. زمینه و انگیزه تصمیم (Context)

در پی بازبینی‌های فنی و دستور مالک محصول مورخ ۲۰۲۶-۱۰-۱۸، مقرر گردید پیش از آغاز توسعه سرویس‌های جدید فاز ۲ (نظیر Access/Promo تحت ADR-025)، تمامی سرویس‌های پلتفرم از یک معماری استاندارد، زیرساخت یکپارچه، قراردادهای معتبر (Proto / OpenAPI)، مانیفست هویتی ماشین‌خوان و سازوکار ارزیابی ماشینی پیروی کنند.

### اصل حاکم بر حقیقت (Authoritative Baseline Invariant):
> **هیچ سرویس پیاده‌سازی‌شده‌ای مرجع حقیقت نیست.** استانداردهای الگو و آزمون‌های انطباق منحصراً از اسناد معماری، تصمیمات مصوب بالادستی ([ADR-007](./ADR-007-backend-contracts-and-tooling-standards.md)، [ADR-008](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-009](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [ADR-012](./ADR-012-reference-data-registry-and-client-cache.md)، [ADR-013](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md)، [ADR-016](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-018](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md)، [ADR-022](./ADR-022-platform-reliability-and-observability.md)، [ADR-023](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md)) و راهنماهای مرجع استخراج می‌گردند.

---

## ۲. متن تصمیم پیشنهادی (Proposed Decision)

استاندارد میکروسرویس‌های پلتفرم لیمو مشتمل بر **۵۰ قاعده اعتبارسنجی** (۴۳ قاعده ایستا/شرطی شامل ۳۸ قاعده عمومی و ۵ قاعده شرطی در `lemmo-cli check`، و ۷ آزمون ران‌تایم زنده در `make verify-live`) و **مانیفست ماشین‌خوان سرویس** به شرح زیر پیشنهاد می‌گردد:

### ۲.۱. قواعد ایستای ساختار، لایه‌ها و پکیج‌ها (Directory & Packaging)

{format_rule_table(dir_rules)}

### ۲.۲. قواعد پیکربندی، سکرت‌ها و انضباط کد (Configuration & Secrets)

{format_rule_table(cfg_rules)}

### ۲.۳. قواعد استقرار سرویس‌محور و داکر (Deployment & Docker Hygiene)

{format_rule_table(dep_rules)}

### ۲.۴. قراردادها، OpenAPI و کلاینت SDK (Contracts & OpenAPI)

{format_rule_table(ctr_rules)}

### ۲.۵. رویدادها، امنیت، تاب‌آوری و مشاهده‌پذیری (Events, Security & Observability)

{format_rule_table(evt_sec_rules)}

### ۲.۶. قواعد شرطی بر مبنای نوع و قابلیت‌های سرویس (Conditional Rules)

{format_rule_table(cnd_rules)}

### ۲.۷. مشخصات آزمون زنده ران‌تایم (`make verify-live` / `make doctor`)

{format_rule_table(rt_rules)}

---

### ۲.۸. انتصاب زبان بیان مشترک (CEL - Common Expression Language) و دلایل انتخاب

جهت فرموله‌سازی شرایط اعمال قواعد (`applies_when`)، زبان استاندارد **CEL (Common Expression Language)** انتخاب شده است. دلایل فنی این تصمیم عبارتند از:
1. **سرعت بسیار بالا و سربار نزدیک به صفر:** کامپایل و ارزیابی عبارات CEL در زمان بسیار کوتاه (میکروثانیه) انجام می‌شود و مناسب گیت‌های پرسرعت CI است.
2. **ایمنی حافظه و قطعیت اجرایی (Deterministic & Sandboxed):** CEL فاقد قابلیت اجرای کد دلخواه یا لوپ‌های بی‌پایان (Turing Incomplete by design) است و هیچ‌گونه Side-Effect امنیتی در محیط CI ایجاد نمی‌کند.
3. **استاندارد صنعتی ابری:** CEL زبان رسمی اعتبارسنجی در Kubernetes Admission Controllers، Envoy Gateway و ابزارهای مانیتورینگ مدرن است.
4. **پشتیبانی بومی در اکوسیستم Go:** کتابخانه رسمی `github.com/google/cel-go` به سادگی در ابزار `lemmo-cli` ادغام می‌گردد.
5. **ساختار صریح و یکپارچه:** امکان بررسی وجود فیلدها و توابع سایز بدون نیاز به مفسرهای سنگین اسکریپتی (مانند `manifest.networking.inbound_http_port != null` یا `manifest.events.published.size() > 0`).

---

### ۲.۹. تفکیک مفهومی سطح خودکاری (`automation`) از وضعیت پیاده‌سازی (`implementation_status`)

پیرو تصمیم مدیریت پروژه (REV-4 / REV-5)، دو مفهوم خودکاری و پیاده‌سازی با دو فیلد کاملاً تفکیک‌شده تعریف می‌شوند:
- **`automation: full | partial | manual` (طراحی):** بیانگر ماهیت ذاتی قاعده است که تا چه اندازه قابل اتوماسیون قطعی ماشینی است. قواعدی نظیر `SB-CFG-04`، `SB-CTR-05`، `SB-CTR-06`، `SB-EVT-02`، `SB-RES-02`، `SB-LOG-02`، `SB-CND-SSRF`، `SB-CND-RATE` و `SB-CND-REF` به دلیل ماهیت ترکیبی معنایی، به عنوان `partial` (نیازمند AST جزئی + بازبینی دستی یا تست قراردادی) اعلام شده‌اند. سایر ۴۱ قاعده دارای اتوماسیون کامل (`full`) هستند.
- **`implementation_status: not_started | implemented` (واقعیت کد):** بیانگر وجود واقعی مجری قاعده در کد فعلی است. در زمان تدوین این پیش‌نویس، از آنجا که دستورات `lemmo-cli check`، تارگت `make verify-live` و پایپ‌لاین‌های `ci:*` هنوز در فاز اجرایی پیاده‌سازی نشده‌اند، **تمامی ۵۰ قاعده در وضعیت `not_started` ثبت شده‌اند.** گیت zero-diff در آینده وضعیت این فیلد را همگام با کدهای پیاده‌شده به روز خواهد کرد.

---

### ۲.۱۰. اصل پیشگیری از خودمعافی قواعد امنیتی و تاب‌آوری (Security Self-Exemption Ban)

> **قانون قطعی:** هیچ قاعده امنیتی، احراز هویت یا تاب‌آوری نباید با پرچم قابلیتی که خودش الزام می‌کند فعال گردد.  
یک مقدار `false` در مانیفست نباید آزمون‌های حیاتی احراز هویت، گارد IDOR، هرزپذیری (Idempotency) یا خروج تمیز (Graceful Shutdown) را دور بزند.

- **قواعد امنیتی (`SB-SEC-01`, `SB-RT-06`):** بر مبنای واقعیت شبکه (وجود پورت ورودی HTTP یا gRPC در مانیفست) فعال می‌شوند. اگر سرویسی پورت ورودی باز کند، ملزم به احراز هویت و بررسی ایزولاسیون ورک‌اسپیس است.
- **قواعد قرارداد OpenAPI و هرزپذیری (`SB-CTR-02`, `SB-CTR-06`):** بر مبنای وجود پورت ورودی HTTP (`manifest.networking.inbound_http_port != null`) فعال می‌گردند تا هیچ سرویسی نتواند با تنظیم `openapi_domain: null` از الزامات قرارداد یا Idempotency شانه خالی کند.
- **قاعده توقف تمیز (`SB-RES-02`):** برای تمامی سرویس‌ها بدون استثناء به صورت `always` فعال است.
- هرگونه معافیت استثنایی صرفاً از طریق بخش `not_applicable` با ارائه دلیل مکتوب و امضای رسمی مالک/ناظر پروژه در بازبینی PR امکان‌پذیر است.

---

## ۳. طراحی جامع مانیفست استاندارد سرویس (Service Manifest)

### ۳.۱. اصل حاکم بر مانیفست
> **اصل:** ADR-024 مرجع استاندارد است (چه قواعدی وجود دارند). مانیفست مرجع هویت سرویس است (کدام قواعد شامل این سرویس می‌شوند). خروجی `check` و `verify-live` اثبات است. **مانیفست ادعاست، نه اثبات.**

### ۳.۲. اسکیمای مانیفست (`contracts/schemas/service-manifest.json`)
```yaml
# نمونه مانیفست کامل پیش‌فرض: services/<name>/service.manifest.yaml
schema_version: "1.0.0"
name: "image-service"
kind: "go-service" # go-service | packaged-engine | planned-stub
owner: "Platform / Image Team"
tier: "tier-1"

contracts:
  proto:
    - "contracts/lemmo/v1/image.proto"
  openapi_domain: "image"

storage:
  postgres: true
  redis: true
  object_storage: true

events:
  published:
    - "image.generation.requested.v1"
    - "image.generation.completed.v1"
  consumed:
    - "workflow.step.dispatched.v1"

networking:
  inbound_grpc_port: 50051
  inbound_http_port: 8080
  external_outbound: true # نیازمند کلاینت SSRF-Safe

billable: true # نیازمند اتصال به Rate-Card سهمیه

capabilities:
  idempotency: true
  outbox: true
  auth_interceptor: true
  graceful_shutdown: true
  dynamic_payload: false # پشتیبانی از اعتبارسنجی اسکیمای JSON پویا (SB-CND-JSON)
  reference_data: false # تبعیت از رجیستری داده‌های مرجع استاتیک (SB-CND-REF)

not_applicable: []
```

### ۳.۳. اعتبارسنجی چهارجانبه (Four-Way Conformance Verification)
هرگونه ناهمخوانی میان منابع چهارگانه زیر منجر به شکست (`FAIL`) قطعی در گیت CI می‌شود:
1. **مانیفست ↔ سورس‌کد (`lemmo-cli check`):** ادعای عدم دیتابیس در حالی که پکیج `adapters/postgres` وجود دارد، یا استفاده از `core/outbox` در غیاب ثبت رویداد در مانیفست.
2. **مانیفست ↔ سرویس در حال اجرا (`make verify-live`):** گزارش آمادگی دیتابیس یا وابستگی در `/readyz` که در مانیفست اظهار نشده است.
3. **مانیفست ↔ پلتفرم:** مسیر بدون روت Kong یا روت ثبت‌نشده در رجیستری رویدادها.
4. **مانیفست ↔ مستندات معماری (همگامی خودکار):** مانیفست سرویس منبع یگانه حقیقت (SSOT) برای متادیتای سرویس‌هاست. جدول مشخصات فنی سرویس‌ها در سند جامع کاتالوگ ([DOC-BE-002](../../03-backend/services.md)) به صورت خودکار توسط دستور `lemmo-cli doc-sync` از روی مانیفست‌ها تولید می‌شود و هرگونه انحراف یا ویرایش دستی در مستندات در گیت Zero-Diff مسدود خواهد شد.

### ۳.۴. قواعد حاکمیتی مانیفست (Manifest Governance)
- **سکوت مساوی با شکست (Silence = Failure):** کلیه کلیدهای قابلیت در مانیفست الزامی هستند. مقدار پیش‌فرض کلیدها در اسکافولد جدید `null` (= تصمیم‌گرفته‌نشده) است؛ `lemmo-cli check` سرویس را تا زمان تنظیم مقدار `true` یا `false` با دلیل صریح متوقف می‌کند.
- **تغییرات نیازمند بازبینی:** افزودن هر مورد به `not_applicable` یا تغییر سطح دسترسی نیازمند بازبینی و امضای ناظر/مالک پروژه است (با قاعده CODEOWNERS).
- **فرمان ارتقای مانیفست:** افزودن قواعد جدید به ADR-024 از طریق دستور `lemmo-cli manifest upgrade` کلیدهای جدید را با مقدار `null` به مانیفست سرویس‌ها تزریق می‌کند تا سرویس‌ها به صورت هدایت‌شده وضعیت خود را تعیین کنند.

### ۳.۵. مانیفست به عنوان مرجع یگانه حقیقت متادیتای سرویس‌ها (تصمیم مصوب مالک پروژه، R4-10 / R5-5)
پیرو تصمیم رسمی مالک پروژه مورخ ۲۰۲۶-۱۰-۱۸:
> **مانیفست سرویس مرجع یگانه حقیقت (SSOT) متادیتای سرویس‌هاست.**  
> بخش متادیتای سرویس در جدول جامع مستندات [`services.md` (DOC-BE-002)](../../03-backend/services.md) (شامل نوع، مرزها، پورت‌ها و فاز استقرار) منحصراً از روی مانیفست‌های معتبر سرویس‌ها به وسیله فرمان `lemmo-cli doc-sync` تولید می‌گردد و در خط بیلد تحت گیت Zero-Diff محافظت می‌شود. ویرایش دستی این بخش در مستندات ممنوع است.  
> متن روایی و تشریحی سند معماری (چرایی مرزبندی سرویس و مسئولیت‌های دامنه) به صورت دستی توسط تیم معماری نگهداری و توسعه می‌یابد.

---

## ۴. استراتژی گیت‌های خط بیلد (CI Gates) و قاعده Ratchet

### ۴.۱. تعاریف گیت‌های ارزیابی (`gate`)
- **`gate: new_service` (الزام سرویس‌های جدید):**  
  تمامی قواعد دارای این برچسب (۲۷ قاعده شامل ۲۰ قاعده مصوب مرحله ۱، ۶ قاعده شرطی مرحله ۲ و ۱ پروب زنده لبه مرحله ۵) برای هر سرویس جدیدی که به مخزن افزوده می‌شود از روز نخست الزامی بوده و تخطی از آن‌ها موجب شکست قطعی بیلد (`FAIL`) می‌گردد. قواعد با منبع پیش‌نویس (draft_source) یا با شکاف سند (gap) حق انتصاب به new_service در مرحله ۱ را ندارند.
- **`gate: ratchet` (سیاست کاهش تدریجی سرویس‌های موجود):**  
  برای ۲۳ قاعده مرحله ۱ در سرویس‌های پیاده‌سازی‌شده موجود، انحرافات شناخته‌شده در فایل خط مبنا ثبت گردیده و در هر چرخه کاری، تعداد این انحرافات منحصراً می‌تواند کاهش یابد (سیاست کاهش یک‌طرفه - Monotonic Reduction).

### ۴.۲. ساختار و جایگاه فایل خط مبنا (`api/conformance/ratchet.yaml` — R4-9 / R5-3)
پیرو دستور مدیر پروژه، فایل خط مبنای Ratchet درون مخزن کد `api/` مستقر می‌گردد:
- **مسیر رسمی:** `api/conformance/ratchet.yaml`
- **حاکمیت دسترسی:** محافظت‌شده توسط CODEOWNERS منحصراً با امضای `@tech-lead` یا معمار پلتفرم.
- **قانون قطعی کاهش یک‌طرفه:** خط بیلد اجازه افزایش هیچ انحرافی را نسبت به مقدار ثبت‌شده در این فایل نمی‌دهد. هر PR که انحرافی را برطرف کند، موظف به کاهش مقدار خط مبنا در همان PR است.

```yaml
# نمونه قالب رسمی فایل خط مبنا: api/conformance/ratchet.yaml
version: "1.0.0"
description: "Baseline ratchet registry for Lemmo microservices existing non-conformances."
last_updated: "2026-10-18"
governance:
  policy: "monotonic_reduction_only"
  codeowners:
    - "@tech-lead"
    - "@platform-lead"

services:
  quota-service:
    SB-DIR-04:
      status: "conforming"
      measurement: "test -d services/quota-service/migrations"
    SB-VER-01:
      status: "violation"
      measurement: "test -f services/quota-service/CHANGELOG.md"
      rationale: "Pending monorepo changelog aggregator adoption (Track B)"
    SB-VER-02:
      status: "violation"
      measurement: "git tag -l 'services/quota-service/v*'"
      rationale: "Pending multi-module tagging release"
```

### ۴.۳. سرویس‌های استاب فریز‌شده (`token-service` و `notification-service`)
پیرو تایید مالک محصول، این دو سرویس با وضعیت `Status: Planned` فریز شده و در رجیستری ratchet از گیت‌های جاری معاف می‌گردند تا در فاز اختصاصی‌شان با آخرین نسخه اسکلت و الگوهای ADR-024 اسکافولد شوند.

### ۴.۴. وضعیت پیشنهادی مجری‌های پلتفرمی (`enforced_by`)
قواعدی که در سطح کل پلتفرم یا خط بیلد تعریف شده‌اند (مانند `ci:oasdiff (proposed)`، `ci:gateway-route-conformance (proposed)`، `ci:frontend-sdk-zero-diff (proposed)`، `ci:event-registry-lint (proposed)` و `ci:edge-gateway-probe (proposed)`) صرفاً به عنوان پیشنهاد معماری در این پیش‌نویس ثبت شده‌اند. مالکیت نهایی، طراحی دقیق اسکریپت‌ها و ادغام آن‌ها در پایپ‌لاین CI منوط به تصمیم و تایید مسئولین محترم هر بخش و مدیر زیرساخت خواهد بود. پروب‌های آمادگی برای وابستگی‌های زیرساختی مشترک نظیر درگاه Kong و Ory Kratos صریحاً خارج از دامنه پروب‌های اختصاصی تک‌سرویس‌ها تعریف می‌شوند.
"""

    with open(output_md_path, "w", encoding="utf-8") as f:
        f.write(doc_content)

    print(f"Generated {output_md_path} successfully.")

if __name__ == "__main__":
    main()
