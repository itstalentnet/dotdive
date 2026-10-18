| فیلد / Field | مقدار / Value |
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

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-DIR-01` | **Clean Architecture Layering Standard** | وجود پوشه‌های مجزای internal/domain (موجودیت‌های ناب دامنه)، internal/app (یوزکیس‌ها و سرویس‌های کاربردی)، internal/ports (اینترفیس‌های ورودی و خروجی) و internal/adapters (پیاده‌سازی آداپتورهای HTTP، gRPC و پایگاه داده). | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۳](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §3](../../03-backend/style-guide.md) |
| `SB-DIR-02` | **Thin Entrypoint Pattern** | وجود فایل تک‌منظوره cmd/main.go صرفاً جهت سیم‌کشی وابستگی‌ها و فراخوانی لایف‌سایکل بوت‌استرپ مشترک؛ منع پیاده‌سازی لاجیک بیزینسی، هندلرهای مستقیم یا محاسبات دامنه در این فایل. | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-008-internal-tooling-and-versioning-governance §۲.۱](./ADR-008-internal-tooling-and-versioning-governance.md)، [style-guide §3](../../03-backend/style-guide.md) |
| `SB-DIR-03` | **Independent Go Module Isolation** | وجود فایل معتبر go.mod در ریشه سرویس با ماژول مستقل و پیشوند رسمی github.com/lemmo-lab/api/services/<name> بدون وابستگی مستقیم به کدهای داخلی سایر سرویس‌ها. | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [architecture §۱](../../03-backend/architecture.md)، [style-guide §3](../../03-backend/style-guide.md) |
| `SB-DIR-04` | **Database Migrations Parity** | وجود پوشه migrations/ حاوی فایل‌های مهاجرت با نام‌گذاری ترتیبی صفرپرشده عددی ۶رقمی زوج (up.sql و down.sql) یا وجود نشانگر صریح migrations/.no_migration در غیاب دیتابیس. | `manifest.storage.postgres == true` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۳](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §6](../../03-backend/style-guide.md) |
| `SB-DOC-01` | **Service Architectural Identity File** | وجود فایل service.md در ریشه سرویس جهت شرح معماری، اهداف، مسئولیت‌های دامنه و مرزها؛ متادیتای فنی ماشین‌خوان منحصراً از مانیفست سرویس استخراج می‌شود. | `always` | `full` | `not_started` | `frontmatter_parse` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۳](./ADR-007-backend-contracts-and-tooling-standards.md)، [services](../../03-backend/services.md) |
| `SB-MAN-01` | **Machine-Readable Service Manifest** | وجود فایل مانیفست معتبر service.manifest.yaml در ریشه سرویس منطبق بر اسکیمای استاندارد مانیفست به عنوان مرجع حقیقت (SSOT) متادیتای ماشینی سرویس و برقراری انطباق چهارجانبه. | `always` | `full` | `not_started` | `json_schema` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-024-service-blueprint-and-conformance §۳](./ADR-024-service-blueprint-and-conformance.md) |

### ۲.۲. قواعد پیکربندی، سکرت‌ها و انضباط کد (Configuration & Secrets)

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-CFG-01` | **Versioned Configuration Default File** | وجود فایل config/default.yaml در ریشه سرویس برای نگه‌داری پیش‌فرض‌های غیرحساس و تغییرپذیر و بارگذاری انحصاری کانفیگ از طریق پکیج متمرکز core/config. | `always` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §۱.۲](../configuration-and-secrets.md) |
| `SB-CFG-02` | **Startup Fail-Fast Validation** | پیاده‌سازی اینترفیس config.Validator بر روی ساختار پیکربندی سرویس جهت توقف فوری فرآیند استارت سرویس با ثبت لاگ ساختاریافته خطا و کد خروج ۱ در صورت کانفیگ نامعتبر. | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §۲](../configuration-and-secrets.md) |
| `SB-CFG-03` | **Secret Hardcoding Fallback Ban** | ممنوعیت مطلق قرار دادن مقادیر پیش‌فرض یا fallback در سورس‌کد برای سکرت‌های حساس (رمز دیتابیس، کلید S3، توکن JWT و API Keyها) و الزام توقف فوری سرویس در غیاب آن‌ها. | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §۲](../configuration-and-secrets.md)، [configuration-and-secrets §۳](../configuration-and-secrets.md) |
| `SB-CFG-04` | **Network Literal Constants Ban** | ممنوعیت استفاده از پورت‌ها یا آدرس‌های هاست هاردکدشده لیترال در فراخوانی‌های Listen و Dial در سورس‌کد؛ مقادیر متغیر محیطی باید از ساختار تایپ‌شده کانفیگ خوانده شوند. | `always` | `partial` | `not_started` | `ast_and_manual_review` | ratchet (M1) | `lemmo-cli check` | مصوب | [configuration-and-secrets §۳](../configuration-and-secrets.md)، [ADR-009-service-owned-deployment-and-financial-ledger §۲.۴](./ADR-009-service-owned-deployment-and-financial-ledger.md) |

### ۲.۳. قواعد استقرار سرویس‌محور و داکر (Deployment & Docker Hygiene)

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-DEP-01` | **Service-Owned Deployment Composition** | وجود مانیفست deploy/compose.yaml و پوشه تنظیمات deploy/config/ در ریشه سرویس جهت ادغام اختصاصی در کامپوز ریشه پروژه از طریق دستور بومی include:. | `always` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-009-service-owned-deployment-and-financial-ledger §۲.۱](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [docker-spec §۳.۳](../../07-devops/docker-spec.md) |
| `SB-DEP-02` | **Single Multi-Stage Dockerfile** | وجود دقیقاً یک فایل با نام Dockerfile در ریشه سرویس بر پایه الگوی چندمرحله‌ای (Multi-Stage) جهت تضمین ایمیج نهایی مینیمال و امن؛ منع داکرفایلهای موازی مانند dev. | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [docker-spec §۴](../../07-devops/docker-spec.md) |
| `SB-DEP-03` | **Role-Based Container Naming** | تنظیم صریح container_name با الگوی الزامی lemmo-svc-<name> در deploy/compose.yaml؛ ممنوعیت کاربرد نام ابزارها، برندهای ثالث یا نام‌های تجاری در نام کانتینر. | `always` | `full` | `not_started` | `compose_lint` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-009-service-owned-deployment-and-financial-ledger §۲.۳](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [docker-spec §۳.۲](../../07-devops/docker-spec.md) |
| `SB-DEP-04` | **Build Provenance Startup Logging** | تزریق آرگومان‌های ARG GIT_COMMIT و ARG BUILD_TIME در زمان بیلد داکر و ثبت الزامی شناسه کامیت و زمان بیلد در اولین خط لاگ خروجی استارت سرویس در main.go. | `always` | `full` | `not_started` | `content_match` | ratchet (M1) | `lemmo-cli check` | مصوب | [docker-spec §۴](../../07-devops/docker-spec.md) |
| `SB-VER-01` | **Authoritative Human Changelog** | وجود فایل CHANGELOG.md در ریشه هر سرویس بر مبنای استاندارد Keep a Changelog همراه با دسته‌بندی‌های رسمی مجاز (Added, Changed, Deprecated, Removed, Fixed, Security). | `always` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-008-internal-tooling-and-versioning-governance §۲.۶](./ADR-008-internal-tooling-and-versioning-governance.md) |
| `SB-VER-02` | **Semantic Versioning & Multi-Module Git Tag** | تبعیت نسخه سرویس از SemVer 2.0.0 و انطباق سیستم تگ‌گذاری گیت با الگوی چندماژوله services/<name>/vX.Y.Z جهت تفکیک چرخه‌های انتشار مستقل در مونوریپو. | `always` | `full` | `not_started` | `git_tags` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-008-internal-tooling-and-versioning-governance §۲.۳](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §۲.۱](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| `SB-IMG-01` | **Version-Derived Docker Image Tagging** | استخراج تگ ایمیج داکر از نسخه سرویس با فرمت lemmo/svc-<name>:vX.Y.Z و اعمال سیاست نگه‌داری ۳ نسخه آخر و هرس ایمیج‌های آویزان (Dangling Images Pruning). | `always` | `full` | `not_started` | `compose_lint` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §۲.۵](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| `SB-HDR-01` | **Generated File Provenance Header** | درج هدر چهارگانه غیرقابل‌ویرایش در کلیه فایل‌های تولیدی توسط ژنراتورها (ابزار تولیدکننده، نسخه، دستور و اخطار منع ویرایش دستی) و اعمال گیت تازگی Zero-Diff در خط بیلد. | `always` | `full` | `not_started` | `content_match` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §۲.۳](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |

### ۲.۴. قراردادها، OpenAPI و کلاینت SDK (Contracts & OpenAPI)

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-CTR-01` | **Protobuf Contracts Centralization & Buf Lint** | تمرکز قراردادهای Protobuf در contracts/lemmo/v1/ و ارجاع در مانیفست سرویس؛ ممنوعیت فایل proto محلی در سرویس و برقراری گیت‌های buf lint و buf breaking. | `manifest.networking.inbound_grpc_port != null` | `full` | `not_started` | `buf_lint_and_breaking` | new_service (M1) | `lemmo-cli check` | مصوب | [contracts §۱](../../03-backend/contracts.md)، [ADR-007-backend-contracts-and-tooling-standards §۲](./ADR-007-backend-contracts-and-tooling-standards.md) |
| `SB-CTR-02` | **Domain OpenAPI Specification Single Ownership** | الزام وجود دقیقاً یک قرارداد contracts/openapi/<domain>/v1/openapi.yaml با مالکیت صریح برای هر سرویس دارای پورت ورودی HTTP؛ منع دور زدن قرارداد با تنظیم openapi_domain به null. | `manifest.networking.inbound_http_port != null` | `full` | `not_started` | `filesystem` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-016-request-context-governance-and-workspace-policy §۲.۱۴](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling §۲.۶](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md) |
| `SB-CTR-03` | **OpenAPI Operations Standards** | الزام تعیین operationId یکتا در سطح کل سیستم و متادیتای صریح حاکمیت دسترسی x-lemmo-workspace-policy (یکی از مقادیر required, optional, none) برای هر عملیات در OpenAPI. | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `openapi_lint` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-016-request-context-governance-and-workspace-policy §۲.۲](./ADR-016-request-context-governance-and-workspace-policy.md) |
| `SB-CTR-04` | **OpenAPI Breaking Changes Gate** | ممنوعیت اعمال هرگونه تغییر شکست‌دهنده یا ناسازگار در اندپوینت‌های عمومی OpenAPI بدون معرفی نسخه جدید API و ارزیابی خودکار تغییرات در خط بیلد با باینری oasdiff. | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `oasdiff` | ratchet (M1) | `ci:oasdiff (proposed)` | مصوب | [contracts §۴](../../03-backend/contracts.md)، [ADR-008-internal-tooling-and-versioning-governance §۲.۳](./ADR-008-internal-tooling-and-versioning-governance.md) |
| `SB-CTR-05` | **HTTP Error Envelope Conformance & Mapping Ownership** | پاسخ‌های خطای HTTP باید به contracts/openapi/shared/errors.yaml (AIP-193 ErrorInfo / RFC 7807 + reason + help_key) ارجاع دهند؛ مالکیت انحصاری ترجمه خطای gRPC به HTTP در اختیار پکیج api/core/transport/http و پلاگین درگاه لبه Kong است. | `manifest.networking.inbound_http_port != null` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M1) | `lemmo-cli check` | مصوب | [style-guide §4](../../03-backend/style-guide.md)، [contracts §۵](../../03-backend/contracts.md) |
| `SB-CTR-06` | **Idempotency-Key Header Enforcement** | کلیه عملیات‌های تغییردهنده وضعیت (POST/PUT/PATCH) در سرویس دارای پورت ورودی HTTP موظف به اعلام هدر Idempotency-Key در قرارداد و سیم‌کشی میدل‌ور متمرکز core/idempotency هستند. | `manifest.networking.inbound_http_port != null` | `partial` | `not_started` | `ast_and_contract_test` | ratchet (M1) | `lemmo-cli check` | مصوب | [ADR-016-request-context-governance-and-workspace-policy §۲.۱۰](./ADR-016-request-context-governance-and-workspace-policy.md) |
| `SB-CTR-07` | **Two-Way Gateway-Contract Route Conformance** | انطباق دوطرفه روت‌های شبکه درگاه ورودی Kong با قراردادهای OpenAPI سرویس‌ها: هیچ روت گیت‌وی بدون قرارداد معتبر و هیچ قرارداد عمومی بدون روت متناظر در Kong مجاز نیست. | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `contract_lint` | ratchet (M1) | `ci:gateway-route-conformance (proposed)` | مصوب | [ADR-013-three-tier-edge-gateway-and-bff-architecture §۲.۱](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md) |
| `SB-CTR-08` | **Frontend SDK Client Freshness Zero-Diff Gate** | کدهای کلاینت تایپ‌اسکریپت تولیدی با Orval در مسیر app/src/sdk/generated/ نسبت به قراردادهای OpenAPI باید ۱۰۰٪ بدون تغییر و انحراف باشند و در CI گیت Zero-Diff اجرا شود. | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `zero_diff` | ratchet (M1) | `ci:frontend-sdk-zero-diff (proposed)` | پیش‌نویس | [ADR-016-request-context-governance-and-workspace-policy §۲.۱۴](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §۲.۴](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |

### ۲.۵. رویدادها، امنیت، تاب‌آوری و مشاهده‌پذیری (Events, Security & Observability)

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-EVT-01` | **Transactional Outbox Pattern Mandate** | انتشار رویدادهای دامنه منحصراً از طریق پکیج core/outbox با درج اتمیک در دیتابیس محلی سرویس در همان تراکنش؛ ممنوعیت ارسال مستقیم پیام به بروکر در هندلرهای وب. | `manifest.events.published.size() > 0` | `full` | `not_started` | `ast` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [architecture §۳](../../03-backend/architecture.md)، [ADR-022-platform-reliability-and-observability §بند ۲](./ADR-022-platform-reliability-and-observability.md) |
| `SB-EVT-02` | **Standard EventEnvelope Packing** | بسته‌بندی پیام‌های رویداد درون پاکت استاندارد platform.v1.EventEnvelope همراه با نام‌گذاری سه‌بخشی نسخه‌دار و فیلدهای شناسه، منبع، زمان و پی‌لود ساختاریافته. | `manifest.events.published.size() > 0` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M1) | `lemmo-cli check` | مصوب | [contracts §۲](../../03-backend/contracts.md) |
| `SB-EVT-03` | **Traceparent Context Propagation in Events (F-7)** | تزریق الزامی هدر استاندارد W3C traceparent در فیلد متادیتای هدر پیام‌های Outbox و استخراج مجدد آن در کانسومرها جهت حفظ زنجیره رهگیری در مرزهای ناهمگام (F-7). | `manifest.events.published.size() > 0 || manifest.events.consumed.size() > 0` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [current-path#f-7](../../09-governance/current-path.md#f-7)، [ADR-022-platform-reliability-and-observability §بند ۲](./ADR-022-platform-reliability-and-observability.md) |
| `SB-EVT-04` | **Central Event Registry Registration** | کلیه نام‌های رویداد اعلام‌شده در لیست رویدادهای منتشره باید در contracts/lemmo/v1/events.proto و کاتالوگ متمرکز رویدادهای پلتفرم ثبت و اعتبارسنجی شده باشند. | `manifest.events.published.size() > 0` | `full` | `not_started` | `contract_lint` | ratchet (M1) | `ci:event-registry-lint (proposed)` | مصوب | [contracts §۲.۱](../../03-backend/contracts.md) |
| `SB-SEC-01` | **Inbound Server Identity & Principal Context Interceptor** | ثبت اینترسپتور احراز هویت در بوت‌استرپ سرور ورودی، استخراج متادیتای هویت کلاینت و انتشار امن اطلاعات احرازشده به عنوان Principal در کانتکست درخواست‌های داخلی. | `manifest.networking.inbound_http_port != null || manifest.networking.inbound_grpc_port != null` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [iam-service-spec §1.3](../../03-backend/iam-service-spec.md)، [secure-system-design §الگوی ۱](../secure-system-design.md) |
| `SB-RES-01` | **Client Call Resilience & Non-Blocking Dial** | تنظیم صریح مهلت زمانی (Timeout)، بودجه تلاش مجدد و بریکر در فایل کانفیگ نسخه‌دار؛ ممنوعیت قطعی فراخوانی Dial مسدودکننده بدون کانتکست و زمان انقضا. | `always` | `full` | `not_started` | `ast` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-022-platform-reliability-and-observability §بند ۵](./ADR-022-platform-reliability-and-observability.md) |
| `SB-RES-02` | **Graceful Shutdown Protocol** | هندلینگ سیگنال‌های SIGTERM/SIGINT، تخلیه درخواست‌های فعال در بازه مهلت کانفیگ (Grace Period پیش‌فرض ۱۵ ثانیه) و بستن امن اتصالات دیتابیس و صف پیام. | `always` | `partial` | `not_started` | `ast_and_runtime_probe` | ratchet (M1) | `lemmo-cli check` | پیش‌نویس | [ADR-022-platform-reliability-and-observability §بند ۹](./ADR-022-platform-reliability-and-observability.md) |
| `SB-LOG-01` | **Standard Structured JSON Logging** | صدور کلیه لاگ‌ها روی stdout در قالب استاندارد ساختاریافته JSON از طریق پکیج متمرکز core/bootstrap یا slog؛ منع قطعی استفاده از fmt.Print یا لاگ متنی غیرساختاریافته. | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [mvp-operational-readiness §۱۱.۱](../../03-backend/mvp-operational-readiness.md)، [ADR-022-platform-reliability-and-observability §بند ۲](./ADR-022-platform-reliability-and-observability.md) |
| `SB-LOG-02` | **Contextual Tracing Logging & PII Sanitization** | درج فیلدهای الزامی request_id، hop، user_id و workspace_id در لاگ‌های بازمینه و منع اکید ثبت اطلاعات هویتی و حساس (PII: پسورد، توکن، کوکی، پرامپت خام). | `always` | `partial` | `not_started` | `ast_and_manual_review` | ratchet (M1) | `lemmo-cli check` | مصوب | [mvp-operational-readiness §۱۱.۱](../../03-backend/mvp-operational-readiness.md)، [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md)، [secure-system-design §الگوی ۱](../secure-system-design.md) |
| `SB-TRC-01` | **W3C Traceparent Ingress & Egress Propagation** | سیم‌کشی میدل‌ور core/middleware.TraceInterceptor جهت استخراج، اعتبارسنجی و بازتاب هدر استاندارد W3C traceparent در ارتباطات ورودی و خروجی شبکه. | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md)، [ADR-022-platform-reliability-and-observability §بند ۲](./ADR-022-platform-reliability-and-observability.md) |
| `SB-ERR-01` | **Canonical AIP-193 Error Envelope Conformance** | بازگرداندن خطاهای سرویس در قالب استاندارد google.rpc.Status حاوی ErrorInfo دامنه‌ای متصل به کاتالوگ متمرکز خطاهای پلتفرم با فیلدهای reason و domain. | `always` | `full` | `not_started` | `ast` | new_service (M1) | `lemmo-cli check` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۱](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §4.1](../../03-backend/style-guide.md) |
| `SB-TST-01` | **Testing Hygiene & Makefile Targets Standard** | قرارگیری آزمون‌های زنده اختصاصی در tests/live/ و وجود تارگت‌های استاندارد test و verify-live در Makefile ریشه سرویس جهت اجرای بررسی‌های یکپارچه. | `always` | `full` | `not_started` | `filesystem` | new_service (M1) | `lemmo-cli check` | مصوب | [style-guide §3](../../03-backend/style-guide.md) |

### ۲.۶. قواعد شرطی بر مبنای نوع و قابلیت‌های سرویس (Conditional Rules)

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-CND-JSON` | **Dynamic Payload JSON Schema Conformance** | اعتبارسنجی ورودی‌های دارای ساختار منعطف یا داینامیک بر مبنای اسکیماهای JSON نسخه ۲ در contracts/schemas/ برای سرویس‌های فعال‌کننده قابلیت dynamic_payload. | `manifest.capabilities.dynamic_payload == true` | `full` | `not_started` | `json_schema` | new_service (M2) | `lemmo-cli check` | مصوب | [contracts §۳](../../03-backend/contracts.md) |
| `SB-CND-SSRF` | **External Outbound SSRF-Safe HTTP Client** | استفاده اجباری از کلاینت HTTP امن با بلک‌لیست IPهای خصوصی/لوکال و DNS Pinning جهت پیشگیری از حملات جعل درخواست سمت سرور (SSRF) برای سرویس‌های دارای خروجی وب. | `manifest.networking.external_outbound == true` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M2) | `lemmo-cli check` | مصوب | [secure-system-design §الگوی ۴](../secure-system-design.md)، [style-guide §8](../../03-backend/style-guide.md) |
| `SB-CND-TENANT` | **Multi-Tenant Object Storage Path Scoping** | الزام آغاز کلیه کلیدهای اشیاء چندمستأجری در MinIO/S3 با پیشوند رسمی tenants/{workspaceID}/* و بررسی تطابق مالکیت دیتابیسی پیش از صدور Presigned URL. | `manifest.storage.object_storage == true` | `full` | `not_started` | `ast` | new_service (M2) | `lemmo-cli check` | مصوب | [secure-system-design §الگوی ۳](../secure-system-design.md)، [style-guide §8](../../03-backend/style-guide.md) |
| `SB-CND-RATE` | **Billable Service Rate-Card Integration** | گزارش‌گیری دقیق میزان مصرف منابع و اتصال به Rate-Card رسمی جهت اعتبارسنجی سهمیه و کسر اعتبار برای سرویس‌های علامت‌خورده با billable: true. | `manifest.billable == true` | `partial` | `not_started` | `ast_and_contract_test` | new_service (M2) | `lemmo-cli check` | مصوب | [credit-and-ledger §1](../../03-backend/credit-and-ledger.md) |
| `SB-CND-REF` | **Static Catalog Reference Data Registry Conformance** | تبعیت داده‌های استاتیک کاتالوگ از رجیستری مرکزی داده‌های مرجع و کش دو سطحی کلاینت؛ ممنوعیت هاردکد کردن اطلاعات کاتالوگ در سورس‌کد سرویس. | `manifest.capabilities.reference_data == true` | `partial` | `not_started` | `ast_and_manual_review` | new_service (M2) | `lemmo-cli check` | مصوب | [ADR-012-reference-data-registry-and-client-cache §2](./ADR-012-reference-data-registry-and-client-cache.md) |

### ۲.۷. مشخصات آزمون زنده ران‌تایم (`make verify-live` / `make doctor`)

| شناسه | نام قاعده | شرح الزام فنی | شرط اعمال (CEL) | خودکاری | وضعیت کد | ارزیابی | گیت / مرحله | مجری | منبع | مرجع سندی مصوب |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `SB-RT-01` | **Live Honest Readiness Dependency Probe** | پینگ ران‌تایم و واقعی وابستگی‌های حیاتی در اندپوینت /readyz؛ منع بازگرداندن پاسخ کاذب UP در صورت قطع اتصال یا عدم سلامت پایگاه داده و ردیس. | `always` | `full` | `not_started` | `network_probe` | new_service (M1) | `make verify-live` | مصوب | [mvp-operational-readiness §۴](../../03-backend/mvp-operational-readiness.md)، [ADR-022-platform-reliability-and-observability §بند ۳](./ADR-022-platform-reliability-and-observability.md) |
| `SB-RT-02` | **Live Running Version & Provenance Audit Probe** | استعلام نسخه ران‌تایم، هش کامیت گیت و دایجست ایمیج داکر از پروب زنده سرویس و تطبیق ریاضی با متادیتای بیلد و تگ گیت سورس‌کد. | `always` | `full` | `not_started` | `network_probe` | ratchet (M1) | `make verify-live` | پیش‌نویس | [ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance §۲.۱-§۲.۵](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| `SB-RT-03` | **Live Traceparent Header Reflection Probe** | ارسال درخواست آزمایشی با هدر traceparent؛ اعتبارسنجی بازگشت همان TraceID در هدر پاسخ شبکه و ثبت لاگ همگام بر روی خروجی stdout. | `always` | `full` | `not_started` | `network_probe` | new_service (M1) | `make verify-live` | مصوب | [mvp-operational-readiness §۱۱.۲](../../03-backend/mvp-operational-readiness.md)، [ADR-022-platform-reliability-and-observability §بند ۲](./ADR-022-platform-reliability-and-observability.md) |
| `SB-RT-04` | **Live Outbox Health & Broker Connectivity Probe** | استعلام وضعیت پیام‌های معلق و شکست‌خورده Outbox و اتصال بروکر پیام از طریق متادیتای اندپوینت آمادگی خود سرویس بدون اتصال مستقیم کوئری SQL به دیتابیس. | `manifest.events.published.size() > 0` | `full` | `not_started` | `network_probe` | ratchet (M1) | `make verify-live` | مصوب | [mvp-operational-readiness §۴](../../03-backend/mvp-operational-readiness.md)، [mvp-operational-readiness §۱۱.۴](../../03-backend/mvp-operational-readiness.md) |
| `SB-RT-05` | **Live AIP-193 Error Handling Conformance Probe** | ارسال درخواست خواندنی با شناسه نامعتبر؛ اعتبارسنجی پاسخ بر مبنای انولوپ استاندارد خطا و کدهای AIP-193 بدون ایجاد اثر جانبی مالی یا داده‌ای. | `always` | `full` | `not_started` | `network_probe` | new_service (M1) | `make verify-live` | مصوب | [ADR-007-backend-contracts-and-tooling-standards §۱](./ADR-007-backend-contracts-and-tooling-standards.md)، [style-guide §4.1](../../03-backend/style-guide.md) |
| `SB-RT-06` | **Live Anti-IDOR Workspace Isolation Probe** | ارسال درخواست آزمایشی بدون توکن (انتظار کد ۴۰۱) و با توکن به منبع ورک‌اسپیس بیگانه (انتظار رفتار Fail-Closed و کدهای ۴۰۳/۴۰۴ بدون نشت داده). | `manifest.networking.inbound_http_port != null || manifest.networking.inbound_grpc_port != null` | `full` | `not_started` | `network_probe` | new_service (M2) | `make verify-live` | مصوب | [secure-system-design §الگوی ۲](../secure-system-design.md)، [style-guide §9.4](../../03-backend/style-guide.md) |
| `SB-RT-07` | **Live Edge Gateway Route Availability Probe** | آزمون سرتاسری و لایو دسترسی به روت‌های عمومی سرویس از طریق درگاه خارجی Kong Edge Gateway و تایید صحت مسیریابی ترافیک بیرونی. | `manifest.contracts.openapi_domain != null` | `full` | `not_started` | `network_probe` | new_service (M5) | `ci:edge-gateway-probe (proposed)` | مصوب | [ADR-013-three-tier-edge-gateway-and-bff-architecture §۲.۱](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md) |

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
  تمامی قواعد دارای این برچسب (۲۷ قاعده شامل ۲۰ قاعده مصوب مرحله ۱، ۵ قاعده شرطی مرحله ۲ و پروب زنده لبه مرحله ۵) برای هر سرویس جدیدی که به مخزن افزوده می‌شود از روز نخست الزامی بوده و تخطی از آن‌ها موجب شکست قطعی بیلد (`FAIL`) می‌گردد. قواعد با منبع پیش‌نویس (draft_source) حق انتصاب به new_service در مرحله ۱ را ندارند.
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
