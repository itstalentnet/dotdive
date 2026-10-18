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
> کاتالوگ جامع و رسمی کلیه قواعد این تصمیم در فایل داده‌ای ماشین‌خوان [`ADR-024.rules.yaml`](./ADR-024.rules.yaml) (منطبق بر اسکیمای [`rules-catalog.schema.json`](./rules-catalog.schema.json)) تعریف شده است. ابزار `lemmo-cli` مستقیماً این فایل را مصرف کرده و به عنوان مجری استانداردهای مستند عمل می‌نماید (تولید سند از کد ملغی است).

---

## ۱. زمینه و انگیزه تصمیم (Context)

در پی بازبینی‌های فنی و دستور مالک محصول مورخ ۲۰۲۶-۱۰-۱۸، مقرر گردید پیش از آغاز توسعه سرویس‌های جدید فاز ۲ (نظیر Access/Promo تحت ADR-025)، تمامی سرویس‌های پلتفرم از یک معماری استاندارد، زیرساخت یکپارچه، قراردادهای معتبر (Proto / OpenAPI)، مانیفست هویتی ماشین‌خوان و سازوکار ارزیابی ماشینی پیروی کنند.

### اصل حاکم بر حقیقت (Authoritative Baseline Invariant):
> **هیچ سرویس پیاده‌سازی‌شده‌ای مرجع حقیقت نیست.** استانداردهای الگو و آزمون‌های انطباق منحصراً از اسناد معماری، تصمیمات مصوب بالادستی ([ADR-007](./ADR-007-backend-contracts-and-tooling-standards.md)، [ADR-008](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-009](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [ADR-012](./ADR-012-reference-data-registry-and-client-cache.md)، [ADR-013](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md)، [ADR-016](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-018](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md)، [ADR-022](./ADR-022-platform-reliability-and-observability.md)، [ADR-023](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md)) و راهنماهای مرجع استخراج می‌گردند.

---

## ۲. متن تصمیم مصوب (Decision)

استاندارد میکروسرویس‌های پلتفرم لیمو مشتمل بر **۵۰ قاعده اعتبارسنجی** (۴۳ قاعده ایستا/شرطی در `lemmo-cli check` و ۷ آزمون ران‌تایم زنده در `make verify-live`) و **مانیفست ماشین‌خوان سرویس** به شرح زیر تصویب می‌گردد:

### ۲.۱. قواعد ایستای ساختار، لایه‌ها و پکیج‌ها (Directory & Packaging)

| شناسه | شرح الزام فنی | نوع ارزیابی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- |
| **`SB-DIR-01`** | **لایه‌های Clean Architecture:** وجود پوشه‌های مجزای `internal/domain` (موجودیت‌های ناب)، `internal/app` (یوزکیس‌ها)، `internal/ports` (اینترفیس‌ها) و `internal/adapters` (آداپتورهای HTTP/gRPC/DB). | `filesystem` | [ADR-007 §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-004 §3](../../03-backend/style-guide.md) |
| **`SB-DIR-02`** | **نقطه ورود باریک (Thin Entrypoint):** وجود فایل تک‌منظوره `cmd/main.go` صرفاً جهت سیم‌کشی و فراخوانی لایف‌سایکل بوت‌استرپ مشترک؛ منع پیاده‌سازی لاجیک بیزینسی در این فایل. | `ast` | [ADR-008 §2.1](./ADR-008-internal-tooling-and-versioning-governance.md)، [DOC-BE-004 §3](../../03-backend/style-guide.md) |
| **`SB-DIR-03`** | **ماژول مستقل Go:** وجود فایل معتبر `go.mod` در ریشه سرویس با پیشوند رسمی `github.com/lemmo-lab/api/services/<name>`. | `filesystem` | [ADR-008 §2.2](./ADR-008-internal-tooling-and-versioning-governance.md)، [DOC-BE-001 §2](../../03-backend/architecture.md) |
| **`SB-DIR-04`** | **مایگریشن‌های دیتابیس:** وجود پوشه `migrations/` حاوی زوج‌فایل‌های SQL ۶رقمی یا نشانگر صریح `migrations/.no_migration`. | `filesystem` | [ADR-007 §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-004 §6](../../03-backend/style-guide.md) |
| **`SB-DOC-01`** | **شناسنامه انسانی سرویس (`service.md`):** وجود فایل مستندات در ریشه سرویس جهت شرح معماری، اهداف و مرزهای سرویس؛ متادیتای فنی به مانیفست سرویس (SSOT) ارجاع می‌دهد (تک‌منبعی متادیتا). | `frontmatter_parse` | [ADR-007 §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-002](../../03-backend/services.md) |
| **`SB-MAN-01`** | **مانیفست ماشین‌خوان سرویس (A15):** وجود فایل مانیفست معتبر منطبق بر اسکیمای `contracts/schemas/service-manifest.json` (طراحی در §۳) به عنوان مرجع حقیقت (SSOT) متادیتای ماشینی سرویس و برقراری انطباق چهارجانبه. | `json_schema` | [ADR-024 §۳](./ADR-024-service-blueprint-and-conformance.md) |

### ۲.۲. قواعد پیکربندی، سکرت‌ها و انضباط کد (Configuration & Secrets)

| شناسه | شرح الزام فنی | نوع ارزیابی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- |
| **`SB-CFG-01`** | **کانفیگ نسخه‌بندی‌شده:** وجود فایل `config/default.yaml` برای پیش‌فرض‌های غیرحساس و بارگذاری انحصاری از طریق `core/config`. | `filesystem` | [DOC-ARCH-009 §2](../configuration-and-secrets.md)، [RULES.md §۲.۵](../../09-governance/rules.md) |
| **`SB-CFG-02`** | **اعتبارسنجی Fail-Fast:** پیاده‌سازی اینترفیس `config.Validator` بر روی Struct پیکربندی جهت توقف استارت با کد خروج ۱ در صورت کانفیگ نامعتبر. | `ast` | [DOC-ARCH-009 §3](../configuration-and-secrets.md) |
| **`SB-CFG-03`** | **منع فال‌بک هاردکد سکرت‌ها:** ممنوعیت قطعی مقادیر پیش‌فرض برای سکرت‌ها (پسورد، JWT Secret، API Key) در سورس‌کد و توقف استارت در صورت غیاب سکرت. | `ast` | [DOC-ARCH-009 §1](../configuration-and-secrets.md)، [RULES.md §۲.۲](../../09-governance/rules.md) |
| **`SB-CFG-04`** | **منع ثوابت هاردکد شبکه:** ممنوعیت آدرس‌ها یا پورت‌های لیترال هاردکد در فراخوانی‌های listen/dial؛ سایر ثوابت متغیر تحت بازبینی دستی. | `ast` | [ADR-009 §2.4](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [DOC-ARCH-009 §1](../configuration-and-secrets.md) |

### ۲.۳. قواعد استقرار سرویس‌محور و داکر (Deployment & Docker Hygiene)

| شناسه | شرح الزام فنی | نوع ارزیابی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- |
| **`SB-DEP-01`** | **استقرار اختصاصی سرویس:** وجود مانیفست `deploy/compose.yaml` و پوشه `deploy/config/` جهت ادغام در Compose ریشه با `include:`. | `filesystem` | [ADR-009 §2.1](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [DOC-OPS-001 §3.3](../../07-devops/docker-spec.md) |
| **`SB-DEP-02`** | **داکرفایل چندمرحله‌ای واحد:** وجود دقیقاً یک فایل `Dockerfile` در ریشه سرویس به صورت Multi-Stage؛ ممنوعیت فایل‌های موازی نظیر `.dev`. | `filesystem` | [DOC-OPS-001 §4.3](../../07-devops/docker-spec.md) |
| **`SB-DEP-03`** | **نام‌گذاری کانتینر و نقش‌محوری:** تنظیم صریح `container_name: lemmo-svc-<name>` در کامپوز؛ ممنوعیت کاربرد نام ابزار یا برندهای ثالث. | `yaml_lint` | [ADR-009 §2.3](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [DOC-OPS-001 §3.1-§3.2](../../07-devops/docker-spec.md) |
| **`SB-DEP-04`** | **شناسنامه بیلد در لاگ استارت:** تزریق `ARG GIT_COMMIT` و `ARG BUILD_TIME` در داکرفایل و ثبت الزامی در اولین خط لاگ استارت در `main.go`. | `content_match` | [DOC-OPS-001 §4.5](../../07-devops/docker-spec.md) |
| **`SB-VER-01`** | **چنج‌لاگ انسان‌نویس:** وجود فایل `CHANGELOG.md` در ریشه سرویس مطابق استاندارد Keep a Changelog با دسته‌بندی‌های رسمی مجاز. | `filesystem` | [ADR-008 §2.6](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-023 §2.1](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-16) |
| **`SB-VER-02`** | **نسخه معنایی و تگ گیت چندماژوله:** پیروی از SemVer 2.0.0 و الگوی تگ‌گذاری گیت پیشونددار `services/<name>/vX.Y.Z`. | `git_tags` | [ADR-008 §2.3-§2.4](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-023 §2.1](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| **`SB-IMG-01`** | **تگ ایمیج مبتنی بر نسخه سورس:** استخراج تگ ایمیج داکر از نسخه سرویس (`lemmo/svc-<name>:vX.Y.Z`) و سیاست نگه‌داری ۳ نسخه آخر. | `compose_lint` | [ADR-023 §2.5](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-17)، [DOC-OPS-001 §4.6](../../07-devops/docker-spec.md) |
| **`SB-HDR-01`** | **هدر شناسنامه فایل خودتولید:** درج هدر ۴گانه غیرقابل‌ویرایش در فایل‌های تولیدی توسط ژنراتورها و برقراری گیت Zero-Diff در CI. | `content_match` | [ADR-023 §2.3-§2.4](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-18) |

### ۲.۴. قراردادها، OpenAPI و کلاینت SDK (Contracts & OpenAPI)

| شناسه | شرح الزام فنی | نوع ارزیابی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- |
| **`SB-CTR-01`** | **تراکم قراردادهای Protobuf و لینت با Buf:** قراردادهای proto در `contracts/lemmo/v1/` مستقر و از مانیفست سرویس (`contracts.proto`) ارجاع شوند؛ بدون proto محلی در سرویس؛ گیت `buf lint` و `buf breaking`. | `filesystem_and_buf` | [DOC-BE-003 §1, §4](../../03-backend/contracts.md)، [ADR-007 §2](./ADR-007-backend-contracts-and-tooling-standards.md) |
| **`SB-CTR-02`** | **قرارداد OpenAPI دامنه‌ای با مالکیت یگانه:** هر سرویس دارای HTTP عمومی دارای دقیقاً یک فایل `contracts/openapi/<domain>/v1/openapi.yaml` با مالک اعلام‌شده است («یک مسیر، یک قرارداد، یک مالک»). | `filesystem` | [ADR-016 §2.14](./ADR-016-request-context-governance-and-workspace-policy.md)، [ADR-018 §2.6](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md) |
| **`SB-CTR-03`** | **قواعد Operation در OpenAPI:** هر operation در OpenAPI باید دارای `operationId` یکتا و متادیتای `x-lemmo-workspace-policy` معتبر باشد. | `openapi_lint` | [ADR-016 §2.2](./ADR-016-request-context-governance-and-workspace-policy.md) |
| **`SB-CTR-04`** | **گیت تغییرات ناسازگار OpenAPI:** هرگونه شکستن سازگاری در اندپوینت‌های موجود بدون معرفی نسخه جدید API ممنوع است؛ ارزیابی با `oasdiff` در CI. | `oasdiff` | [DOC-BE-003 §3.2](../../03-backend/contracts.md)، [ADR-008 §2.3](./ADR-008-internal-tooling-and-versioning-governance.md) |
| **`SB-CTR-05`** | **انطباق انولوپ خطای HTTP و مالکیت نگاشت:** پاسخ‌های خطای HTTP باید به `contracts/openapi/shared/errors.yaml` (RFC 7807 + `reason` + `help_key`) ارجاع دهند؛ مالکیت نگاشت AIP-193 به RFC 7807 منحصراً در اختیار `api/core/transport/http` و درگاه لبه Kong است. | `openapi_lint` | [DOC-BE-004 §4.3](../../03-backend/style-guide.md)، [DOC-BE-003 §5.3](../../03-backend/contracts.md) |
| **`SB-CTR-06`** | **الزام کلید هرزپذیری (Idempotency):** کلیه عملیات تغییردهنده (POST/PUT/PATCH) هدر `Idempotency-Key` را در OpenAPI اعلام کرده و میدل‌ور `core/idempotency` را سیم‌کشی نمایند. | `openapi_and_ast` | [ADR-016 §2.10](./ADR-016-request-context-governance-and-workspace-policy.md) |
| **`SB-CTR-07`** | **انطباق دوطرفه روت‌های Kong با قرارداد:** هیچ روت گیت‌وی بدون قرارداد OpenAPI و هیچ قرارداد عمومی بدون روت در Kong وجود ندارد. | `contract_lint` | [ADR-013 §2.1](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md) |
| **`SB-CTR-08`** | **تازگی کلاینت فرانت‌اند و گیت Zero-Diff:** کدهای تولیدی کلاینت استودیو با Orval (`app/src/sdk/generated`) نسبت به قراردادهای OpenAPI بدون diff هستند. | `zero_diff` | [ADR-023 §2.4](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md)، [ADR-016 §2.14](./ADR-016-request-context-governance-and-workspace-policy.md) |

### ۲.۵. رویدادها، امنیت، تاب‌آوری و مشاهده‌پذیری (Events, Security & Observability)

| شناسه | شرح الزام فنی | نوع ارزیابی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- |
| **`SB-EVT-01`** | **الگوی Transactional Outbox:** انتشار رویدادهای دامنه منحصراً از طریق `core/outbox` و ثبت اتمیک در دیتابیس محلی؛ منع ارسال مستقیم به صف در وب. | `ast` | [DOC-BE-001 §2](../../03-backend/architecture.md)، [ADR-022 §2](./ADR-022-platform-reliability-and-observability.md) |
| **`SB-EVT-02`** | **پاکت استاندارد EventEnvelope:** قراردادن پیام‌های رویداد درون `platform.v1.EventEnvelope` همراه با نام‌گذاری سه‌بخشی نسخه‌دار. | `ast` | [DOC-BE-003 §2](../../03-backend/contracts.md) |
| **`SB-EVT-03`** | **انتقال Traceparent در رویدادها (F-7):** الزام تزریق W3C `traceparent` در هدر پیام‌های Outbox و استخراج مجدد در کانسومرها (مرحله ۱). | `ast` | [DOC-GOV-002 §F-7](../../09-governance/current-path.md#f-7)، [ADR-022 §M0-02](./ADR-022-platform-reliability-and-observability.md) |
| **`SB-EVT-04`** | **ثبت رویداد در رجیستری متمرکز:** هر نام رویداد منتشرشده در `contracts/lemmo/v1/events.proto` / رجیستری رویدادها ثبت شده باشد. | `contract_lint` | [DOC-BE-003 §2.1-§2.2](../../03-backend/contracts.md) |
| **`SB-SEC-01`** | **احراز هویت سرویس و متادیتای کانتکست:** ثبت اینترسپتور auth در بوت‌استرپ و انتشار متادیتای هویت در RPCهای داخلی. | `ast` | [DOC-BE-007 §1.3, §6](../../03-backend/iam-service-spec.md)، [DOC-ARCH-007 §الگوی ۱](../secure-system-design.md) |
| **`SB-RES-01`** | **تاب‌آوری و منع Dialهای مسدودکننده:** تنظیم مهلت و سیاست تلاش مجدد در کانفیگ نسخه‌دار؛ ممنوعیت دیال بدون timeout/context. | `ast` | [ADR-022 §5](./ADR-022-platform-reliability-and-observability.md) |
| **`SB-RES-02`** | **توقف تمیز (Graceful Shutdown):** هندلینگ سیگنال‌های SIGTERM/SIGINT، تخلیه درخواست‌های فعال با مهلت کانفیگ و بستن امن اتصالات. | `ast` | [ADR-022 §متن تصمیم پیشنهادی، بند ۹](./ADR-022-platform-reliability-and-observability.md) |
| **`SB-LOG-01`** | **لاگ استاندارد ساخت‌یافته JSON:** صدور لاگ‌ها روی stdout در فرمت JSON از طریق `core/bootstrap` / `slog`؛ منع `fmt.Print`. | `ast` | [ADR-022 §M0-03](./ADR-022-platform-reliability-and-observability.md)، [DOC-BE-005 §11.1](../../03-backend/mvp-operational-readiness.md) |
| **`SB-LOG-02`** | **لاگ با زمینه و رهگیری درخواست:** درج `request_id`، تعداد گام‌ها (`hop`) و شناسه کاربر/ورک‌اسپیس با حذف اکید PII. | `ast` | [DOC-BE-005 §11.2](../../03-backend/mvp-operational-readiness.md)، [ADR-016 §2.2](./ADR-016-request-context-governance-and-workspace-policy.md)، [DOC-ARCH-007 §الگوی ۱](../secure-system-design.md) |
| **`SB-TRC-01`** | **انتشار W3C traceparent:** سیم‌کشی `core/middleware.TraceInterceptor()` جهت استخراج و بازتاب هدر استاندارد `traceparent`. | `ast` | [ADR-022 §M0-02](./ADR-022-platform-reliability-and-observability.md) |
| **`SB-ERR-01`** | **انطباق کاتالوگ خطا با AIP-193:** بازگرداندن خطاها در قالب `google.rpc.Status` متصل به `contracts/platform/errors.proto`. | `ast` | [ADR-007 §1](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-004 §4.1](../../03-backend/style-guide.md) |
| **`SB-TST-01`** | **بهداشت تست‌ها و Makefile:** قرارگیری تست‌های زنده در `tests/live/` و وجود تارگت‌های `test` و `verify-live` در Makefile. | `filesystem` | [DOC-BE-004 §3](../../03-backend/style-guide.md) |

### ۲.۶. قواعد شرطی بر مبنای نوع و قابلیت‌های سرویس (Conditional Rules — B3)

این قواعد بر اساس فیلدهای اعلام‌شده در مانیفست سرویس (`service.manifest.yaml`) فعال می‌گردند:
1. **`SB-CND-JSON`:** اعتبارسنجی اسکیمای JSON برای سرویس‌های با پی‌لود پویا (پروژه‌ها و افزونه‌ها) در [DOC-BE-003 §3.2](../../03-backend/contracts.md).
2. **`SB-CND-SSRF`:** استفاده اجباری از کلاینت HTTP امن با بلک‌لیست IPهای داخلی و DNS Pinning برای سرویس‌های دارای فراخوانی بیرونی در [DOC-ARCH-007 §الگوی ۴](../secure-system-design.md) و [DOC-BE-004 §8.4](../../03-backend/style-guide.md).
3. **`SB-CND-TENANT`:** الزام درج پیشوند ورک‌اسپیس (`workspace_id/`) در کلیه مسیرهای ذخیره‌سازی شیء در MinIO/S3 در [ADR-016 §2.8](./ADR-016-request-context-governance-and-workspace-policy.md).
4. **`SB-CND-RATE`:** گزارش‌گیری مصرف و اتصال به Rate-Card رسمی برای سرویس‌های مشمول کسر سهمیه (Billable Services) در [DOC-BE-006 §1](../../03-backend/credit-and-ledger.md) و [ADR-018 §2.6](./ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md).
5. **`SB-CND-REF`:** تبعیت از الگوی داده مرجع ([ADR-012 §2](./ADR-012-reference-data-registry-and-client-cache.md)) برای داده‌های کاتالوگ استاتیک.

### ۲.۷. مشخصات آزمون زنده ران‌تایم (`make verify-live` / `make doctor` — D3b, B1, B2)

| شناسه | حوزه پروب زنده | مکانیزم ارزیابی | شرح آزمون ران‌تایم | مرجع سندی مصوب | مرحله |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **`SB-RT-01`** | سلامت وابستگی‌ها (Honest Readiness) | `network_probe` | پینگ لایو وابستگی‌های حیاتی در `/readyz`؛ منع Fake UP در غیاب اتصال. | [ADR-022 §3](./ADR-022-platform-reliability-and-observability.md) | **مرحله ۱** |
| **`SB-RT-02`** | تطبیق نسخه، کامیت و Digest | `network_probe` | مقایسه نسخه، کامیت و داکر ایمیج دایجست در حال اجرا با مخزن و داکر اینسپکت. | [ADR-023 §2.1-§2.5](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) | **مرحله ۱** |
| **`SB-RT-03`** | بازتاب و همگامی Traceparent | `network_probe` | ارسال درخواست با `traceparent`؛ تایید بازگشت همان TraceID در پاسخ و لاگ stdout. | [ADR-022 §M0-02](./ADR-022-platform-reliability-and-observability.md) | **مرحله ۱** |
| **`SB-RT-04`** | سلامت Outbox و اتصال بروکر | `network_probe` | استعلام وضعیت پیام‌های pending/failed و کانال بروکر از طریق پاسخ متادیتای اندپوینت آمادگی خودِ سرویس بدون اتصال مستقیم SQL به دیتابیس (F-7). | [DOC-GOV-002 §F-7](../../09-governance/current-path.md#f-7) | **مرحله ۱ (F-7)** |
| **`SB-RT-05`** | انطباق خطای کنترل‌شده AIP-193 | `network_probe` | ارسال درخواست خواندنی با شناسه نامعتبر؛ اعتبارسنجی پاسخ بر مبنای انولوپ استاندارد خطا بدون عارضه مالی یا داده‌ای. | [ADR-007 §1](./ADR-007-backend-contracts-and-tooling-standards.md) | **مرحله ۱** |
| **`SB-RT-06`** | امنیت و ایزولاسیون ورک‌اسپیس (IDOR) | `network_probe` | ارسال درخواست بدون توکن (انتظار ۴۰۱) و با توکن به منبع ورک‌اسپیس دیگر (انتظار ۴۰۴/۴۰۳ Fail-Closed). | [DOC-ARCH-007 §الگوی ۲](../secure-system-design.md)، [ADR-016 §2.2-§2.4](./ADR-016-request-context-governance-and-workspace-policy.md) | **مرحله ۲** |
| **`SB-RT-07`** | مسیریابی لبه از گیت‌وی Kong | `network_probe` | آزمون سرتاسری دسترسی به روت‌های سرویس از طریق درگاه خارجی Kong Edge Gateway. | [ADR-013 §2.1](./ADR-013-three-tier-edge-gateway-and-bff-architecture.md) | **مرحله ۵** |

---

## ۳. طراحی جامع مانیفست استاندارد سرویس (Service Manifest — A15)

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

not_applicable: []
```

### ۳.۳. اعتبارسنجی چهارجانبه (Four-Way Conformance Verification)
هرگونه ناهمخوانی میان منابع چهارگانه زیر منجر به شکست (`FAIL`) قطعی در گیت CI می‌شود:
1. **مانیفست ↔ سورس‌کد (`lemmo-cli check`):** ادعای عدم دیتابیس در حالی که پکیج `adapters/postgres` وجود دارد، یا استفاده از `core/outbox` در غیاب ثبت رویداد در مانیفست.
2. **مانیفست ↔ سرویس در حال اجرا (`make verify-live`):** گزارش آمادگی دیتابیس یا وابستگی در `/readyz` که در مانیفست اظهار نشده است.
3. **مانیفست ↔ پلتفرم:** مسیر بدون روت Kong یا روت ثبت‌نشده در رجیستری رویدادها.
4. **مانیفست ↔ اسناد معماری:** تطابق نوع، پورت‌ها و مرزها با سند جامع کاتالوگ ([DOC-BE-002](../../03-backend/services.md)). مانیفست نمی‌تواند ادعایی مغایر اسناد مصوب مطرح کند.

### ۳.۴. قواعد حاکمیتی مانیفست (Manifest Governance)
- **سکوت مساوی با شکست (Silence = Failure):** کلیه کلیدهای قابلیت در مانیفست الزامی هستند. مقدار پیش‌فرض کلیدها در اسکافولد جدید `null` (= تصمیم‌گرفته‌نشده) است؛ `lemmo-cli check` سرویس را تا زمان تنظیم مقدار `true` یا `false` با دلیل صریح متوقف می‌کند.
- **تغییرات نیازمند بازبینی:** افزودن هر مورد به `not_applicable` یا تغییر سطح دسترسی نیازمند بازبینی و امضای ناظر/مالک پروژه است (با قاعده CODEOWNERS).
- **فرمان ارتقای مانیفست:** افزودن قواعد جدید به ADR-024 از طریق دستور `lemmo-cli manifest upgrade` کلیدهای جدید را با مقدار `null` به مانیفست سرویس‌ها تزریق می‌کند تا سرویس‌ها به صورت هدایت‌شده وضعیت خود را تعیین کنند.

---

## ۴. استراتژی گیت‌های خط بیلد (CI Gates) و قاعده Ratchet

1. **گیت ورود سرویس جدید (New Service Gate):**  
   هیچ سرویس جدیدی (از جمله سرویس Access/Promo فاز ۲) مجاز به ادغام نیست مگر آنکه در خط بیلد آزمون `lemmo-cli check <service>` را با **۱۰۰٪ امتیاز سبز (Zero Exceptions)** بگذراند و مانیفست معتبر ارائه دهد.
2. **قاعده Ratchet برای سرویس‌های موجود:**  
   انحرافات سرویس‌های موجود در فایل رسمی `.task/governance/conformance-ratchet.yaml` با شناسه بدهی مستند می‌شود. فهرست استثناهای هر سرویس منحصراً می‌تواند کوچک شود (حرکت یک‌طرفه).
3. **سرویس‌های استاب فریز‌شده (`token-service` و `notification-service`):**  
   پیرو تایید مالک محصول (گزینه الف)، این دو سرویس با `Status: Planned` فریز شده و در رجیستری ratchet از گیت‌های جاری معاف می‌گردند تا در فاز اختصاصی‌شان با آخرین نسخه اسکلت اسکافولد شوند.
