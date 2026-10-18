| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | ADR-024: Microservice Standard Blueprint, Reference Skeleton, and Conformance Engine |
| **Title (FA)** | ADR-024: الگوی استاندارد میکروسرویس‌ها، اسکلت مرجع و موتور اعتبارسنجی انطباق |
| **ID** | DOC-ARCH-024 |
| **Category** | `architecture` |
| **Status** | `Draft` |
| **Owner** | Core Architecture & Platform Team |
| **Last Updated** | 2026-10-18 |
| **Summary (EN)** | Draft architectural decision establishing the canonical Microservice Blueprint (27 rules in ADR-024.rules.yaml), codified static validation via lemmo-cli check, non-destructive live verification via make verify-live aggregated into make doctor (M0-03/D-13), ratchet debt management for existing services, and a strict zero-tolerance gate for new services. |
| **Summary (FA)** | پیش‌نویس تصمیم معماری جهت تدوین الگوی رسمی میکروسرویس‌ها (۲۷ قاعده شناسه‌دار در ADR-024.rules.yaml)، اعتبارسنجی ایستای ساختار با lemmo-cli check، ارزیابی زنده بدون عارضه جانبی با make verify-live تجمیع‌شده در make doctor (مصوب M0-03/D-13)، مدیریت بدهی‌های گذشته با الگوی Ratchet و گیت ورود بدون استثنا برای سرویس‌های جدید. |
| **Tags** | `adr`, `microservices`, `blueprint`, `conformance`, `lemmo-cli`, `doctor`, `reliability`, `scaffolding` |

---

# ADR-024: الگوی استاندارد میکروسرویس‌ها، اسکلت مرجع و موتور اعتبارسنجی انطباق

> ⚠️ **وضعیت سند: پیش‌نویس حاکمیتی (`Draft`)**  
> این سند پیش‌نویس تصمیمات معماری پیرامون تدوین الگوی زیرساختی واحد برای تمامی میکروسرویس‌های پلتفرم لمو (بر اساس دستور حاکمیتی ۲۰۲۶-۱۰-۱۸) است. این سند تا زمان بازبینی کامل و تایید صریح مالک محصول در وضعیت `Draft` باقی می‌ماند و نباید به عنوان تصمیم نهایی و تصویب‌شده (`Approved` / `Accepted`) تلقی گردد.  
> **یادداشت شماره‌گذاری ADRها:** این تصمیم رسماً شماره **ADR-024** را به خود اختصاص داد؛ سند معماری بعدی پیرامون مالکیت Access/Promo (موضوع P-3) با شماره **ADR-025** صادر خواهد شد.

---

## ۱. زمینه و انگیزه (Context & Problem Statement)

در جریان توسعه مونوریپوی بک‌اند (`api/`) و افزایش تعداد سرویس‌ها به ۲۰ میکروسرویس، پلتفرم لمو با چالش ناهمگونی ساختاری و استانداردهای متغیر میان سرویس‌ها مواجه گردیده است. برخی سرویس‌ها مجهز به کانفیگ نسخه‌بندی‌شده هستند در حالی که برخی دیگر فاقد آن بوده یا دارای اتصالات هاردکد هستند؛ ساختار پوشه‌ها و نام‌گذاری کانتینرها در بخش‌هایی از استانداردهای مصوب [ADR-009](./ADR-009-service-owned-deployment-and-financial-ledger.md) و [DOC-OPS-001](../../07-devops/docker-spec.md) فاصله گرفته است؛ و مهم‌تر از همه، پیش از این هیچ مکانیزم خودکار و قابل‌اثباتی برای ممیزی انطباق سرویس‌ها وجود نداشته است.

دستور قطعی مالک محصول (۲۰۲۶-۱۰-۱۸): **پیش از افزودن هر سرویس تجاری جدید (از جمله سرویس Access/Promo مرحله ۲)، تمامی سرویس‌های فعلی و آتی باید از یک استاندارد زیرساختی واحد و قابل‌اثبات پیروی کنند.**

### اصل حاکم بر حقیقت (Golden Rule of Truth):
> هیچ سرویس پیاده‌سازی‌شده‌ای مرجع حقیقت تلقی نمی‌شود. **مرجع حقیقت منحصراً اسناد و ADRهای مصوب معماری است.**  
> استانداردها از اسناد رسمی استخراج شده و در یک فایل داده ساخت‌یافته در کنار همین سند ([`ADR-024.rules.yaml`](./ADR-024.rules.yaml)) نگه‌داری می‌شوند. ابزار خط فرمان پروژه (`lemmo-cli`) صرفاً این کاتالوگ را می‌خواند و اجرا می‌کند. گیت CI تضمین می‌کند که هر قاعده‌ای در ابزار دقیقاً با این فایل داده همگام است.

---

## ۲. تصمیمات پیشنهادی (Proposed Decisions)

### ۲.۱. تفکیک قطعی مرز بررسی‌های ایستا و زنده (Single Verification Authority Principle)
برای جلوگیری از سردرگمی، افزونگی و تعریف مجدد قواعد، **هر قاعده الگو منحصراً و دقیقاً توسط یکی از دو مکانیزم زیر ارزیابی می‌شود:**
1. **بررسی ایستا (`lemmo-cli check`):** ۲۲ الزام فنی که بدون نیاز به اجرای سرویس، از طریق بازرسی فایل‌ها، پیکربندی‌ها، متادیتاها و AST سورس‌کد Go قابل اثبات هستند.
2. **بررسی زنده (`make verify-live` / تجمیع در `make doctor`):** ۵ الزام فنی ران‌تایم که اثبات آن‌ها نیازمند استقرار واقعی کانتینر سرویس، پاسخ‌دهی به پروب‌های شبکه و استعلام سلامت اتصالات به وابستگی‌های حیاتی (DB، Redis، Broker) است.

هیچ قاعده‌ای در هر دو ابزار تعریف نخواهد شد.

---

### ۲.۲. کاتالوگ قواعد رسمی الگوی میکروسرویس (۲۷ قاعده شناسه‌دار در `ADR-024.rules.yaml`)

کلیه قواعد زیر دارای شناسه یکتای پایدار بوده و در فایل ماشین‌خوان [`ADR-024.rules.yaml`](./ADR-024.rules.yaml) ثبت گردیده‌اند:

#### الف) قواعد ایستای ساختار، لایه‌ها و پکیج‌ها (Static Architecture — `lemmo-cli check`)

| شناسه | حوزه قاعده | مکانیزم ارزیابی | شرح الزام فنی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- | :--- |
| **`SB-DIR-01`** | لایه‌های معماری پاک | `filesystem` | وجود پوشه‌های `internal/domain` (موجودیت‌های ناب بدون وابستگی خارجی)، `internal/app` (یوزکیس‌ها)، `internal/ports` (اینترفیس‌ها) و `internal/adapters` (آداپتورهای HTTP/gRPC/DB). | [ADR-007 §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-004 §3](../../03-backend/style-guide.md) |
| **`SB-DIR-02`** | نقطه ورود باریک | `ast` | وجود فایل باریک `cmd/main.go` با مسئولیت انحصاری سیم‌کشی و فراخوانی لایف‌سایکل بوت‌استرپ مشترک؛ منع پیاده‌سازی لاجیک بیزینسی در این فایل. | [ADR-008 §2.1](./ADR-008-internal-tooling-and-versioning-governance.md)، [DOC-BE-004 §3](../../03-backend/style-guide.md) |
| **`SB-DIR-03`** | تعریف ماژول Go | `filesystem` | وجود فایل معتبر `go.mod` مستقل در ریشه سرویس با پیشوند رسمی ماژول `github.com/lemmo-lab/api/services/<name>`. | [ADR-008 §2.2](./ADR-008-internal-tooling-and-versioning-governance.md)، [DOC-BE-001 §2](../../03-backend/architecture.md) |
| **`SB-DIR-04`** | مایگریشن‌های دیتابیس | `filesystem` | وجود پوشه `migrations/` حاوی زوج‌فایل‌های SQL ۶رقمی golang-migrate (`000001_init_schema.up.sql` و down.sql) یا ثبت صریح نشانگر `migrations/.no_migration`. | [ADR-007 §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-004 §6](../../03-backend/style-guide.md) |
| **`SB-DOC-01`** | شناسنامه سرویس | `filesystem` | وجود فایل `service.md` در ریشه سرویس با متادیتای کامل (Title, ID, Status, Owner, Tags, Exposed Ports, Storage, Dependencies). | [ADR-007 §3](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-002](../../03-backend/services.md) |

#### ب) قواعد پیکربندی، سکرت‌ها و انضباط کد (Configuration & Secrets — `lemmo-cli check`)

| شناسه | حوزه قاعده | مکانیزم ارزیابی | شرح الزام فنی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- | :--- |
| **`SB-CFG-01`** | کانفیگ نسخه‌بندی‌شده | `filesystem` | وجود فایل `config/default.yaml` برای پیش‌فرض‌های غیرحساس و بارگذاری انحصاری از طریق پکیج متمرکز `api/core/config`. | [DOC-ARCH-009 §2](../configuration-and-secrets.md)، [RULES.md §۲.۵](../../09-governance/rules.md) |
| **`SB-CFG-02`** | اعتبارسنجی Fail-Fast | `ast` | پیاده‌سازی اینترفیس اعتبارسنجی کانفیگ (متد `Validate() error`) بر روی Struct پیکربندی سرویس جهت جلوگیری از بالا آمدن با کانفیگ نامعتبر. | [DOC-ARCH-009 §3](../configuration-and-secrets.md) |
| **`SB-CFG-03`** | منع فال‌بک هاردکد سکرت‌ها | `ast` | ممنوعیت قطعی وجود مقادیر پیش‌فرض برای سکرت‌ها (پسورد دیتابیس، سکرت JWT، کلیدهای API) در سورس‌کد و توقف فوری در صورت غیاب سکرت. | [DOC-ARCH-009 §1](../configuration-and-secrets.md)، [RULES.md §۲.۲](../../09-governance/rules.md) |
| **`SB-CFG-04`** | منع ثوابت هاردکد شبکه | `ast` | ممنوعیت آدرس‌ها یا پورت‌های لیترال هاردکد در فراخوانی‌های شبکه (`net.Listen`, `http.ListenAndServe`, `grpc.Dial`)؛ الزام خواندن پویا از کانفیگ/محیط. | [ADR-009 §2.4](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [DOC-ARCH-009 §1](../configuration-and-secrets.md) |

#### ج) قواعد استقرار سرویس‌محور و استانداردهای داکر (Deployment & Docker Hygiene — `lemmo-cli check`)

| شناسه | حوزه قاعده | مکانیزم ارزیابی | شرح الزام فنی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- | :--- |
| **`SB-DEP-01`** | استقرار اختصاصی سرویس | `filesystem` | وجود مانیفست `deploy/compose.yaml` و پوشه `deploy/config/` در ریشه سرویس جهت ادغام در Compose ریشه با دستور `include:`. | [ADR-009 §2.1](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [DOC-OPS-001 §3.3](../../07-devops/docker-spec.md) |
| **`SB-DEP-02`** | داکرفایل چندمرحله‌ای واحد | `filesystem` | وجود دقیقاً یک فایل `Dockerfile` در ریشه سرویس به صورت Multi-Stage سبک‌وزن (Alpine/Distroless)؛ ممنوعیت فایل‌های موازی نظیر `.dev`. | [DOC-OPS-001 §4.3](../../07-devops/docker-spec.md) |
| **`SB-DEP-03`** | نام‌گذاری کانتینر و نقش‌محوری | `yaml_schema` | تنظیم صریح `container_name: lemmo-svc-<name>` در کامپوز؛ ممنوعیت کاربرد نام ابزار یا برندهای ثالث در نام سرویس، کانتینر، ولوم و متغیرها. | [ADR-009 §2.3](./ADR-009-service-owned-deployment-and-financial-ledger.md)، [DOC-OPS-001 §3.1-§3.2](../../07-devops/docker-spec.md) |
| **`SB-DEP-04`** | شناسنامه بیلد در لاگ استارت | `dockerfile` | تزریق آرگومان‌های `ARG GIT_COMMIT` و `ARG BUILD_TIME` در داکرفایل و ثبت این مقادیر در اولین خط لاگ استارت در `cmd/main.go`. | [DOC-OPS-001 §4.5](../../07-devops/docker-spec.md) |

#### د) قواعد چرخه حیات نسخه، چنج‌لاگ و فایل‌های خودتولید (SemVer & Codegen — `lemmo-cli check`)

| شناسه | حوزه قاعده | مکانیزم ارزیابی | شرح الزام فنی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- | :--- |
| **`SB-VER-01`** | چنج‌لاگ انسان‌نویس | `filesystem` | وجود فایل `CHANGELOG.md` در ریشه سرویس مطابق استاندارد Keep a Changelog با دسته‌بندی‌های رسمی مجاز. | [ADR-008 §2.6](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-023 §2.1](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-16) |
| **`SB-VER-02`** | نسخه معنایی و تگ گیت | `filesystem` | پیروی از SemVer 2.0.0 و الگوی تگ‌گذاری گیت چندماژوله `services/<name>/vX.Y.Z`. | [ADR-008 §2.3-§2.4](./ADR-008-internal-tooling-and-versioning-governance.md)، [ADR-023 §2.1](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) |
| **`SB-IMG-01`** | تگ ایمیج مبتنی بر نسخه سورس | `yaml_schema` | استخراج خودکار تگ ایمیج داکر از نسخه سرویس (`lemmo/svc-<name>:vX.Y.Z`) و سیاست نگه‌داری ۳ نسخه آخر (مشروط به `QF-BUILD-REGISTRY-01`). | [ADR-023 §2.5](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-17)، [DOC-OPS-001 §4.6](../../07-devops/docker-spec.md) |
| **`SB-HDR-01`** | هدر شناسنامه فایل خودتولید | `ast` | درج هدر ۴گانه غیرقابل‌ویرایش در فایل‌های تولیدی توسط ژنراتورها (نام ابزار، نسخه، هش قرارداد مبدأ، هشدار منع ویرایش) و برقراری گیت Zero-Diff در CI. | [ADR-023 §2.3-§2.4](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-18) |

#### هـ) قواعد انتشار رویداد و پیام‌رسانی ناهمگام (Event Publishing — `lemmo-cli check`)

| شناسه | حوزه قاعده | مکانیزم ارزیابی | شرح الزام فنی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- | :--- |
| **`SB-EVT-01`** | الگوی Transactional Outbox | `ast` | انتشار رویدادهای دامنه منحصراً از طریق پکیج `api/core/outbox` و ثبت اتمیک در جدول `outbox_messages` دیتابیس محلی سرویس؛ ممنوعیت ارسال مستقیم به RabbitMQ در تراکنش وب. | [DOC-BE-001 §2](../../03-backend/architecture.md)، [ADR-022 §2](./ADR-022-platform-reliability-and-observability.md) |
| **`SB-EVT-02`** | پاکت استاندارد EventEnvelope | `ast` | قراردادن پیام‌های رویداد منحصراً درون انولوپ `platform.v1.EventEnvelope` همراه با نام‌گذاری سه‌بخشی نسخه‌دار `<domain>.<entity>.<action>.v<ver>`. | [DOC-BE-003 §2](../../03-backend/contracts.md#۲-رجیستری-متمرکز-و-پاکت-استاندارد-رویدادها-central-event-registry--eventenvelope---f4) |
| **`SB-EVT-03`** | انتقال Traceparent در رویدادها | `ast` | الزام تزریق هدر W3C `traceparent` در خواص پیام AMQP و فیلد `trace_id` در `EventEnvelope` جهت حفظ زنجیره ردیابی در پردازش ناهمگام (F-7). | [DOC-GOV-002 §F-7](../../09-governance/current-path.md#f-7)، [ADR-022 M0-02](./ADR-022-platform-reliability-and-observability.md) |

#### و) قواعد هسته، لاگ ساخت‌یافته و خطای استاندارد (Core & Observability — `lemmo-cli check`)

| شناسه | حوزه قاعده | مکانیزم ارزیابی | شرح الزام فنی | مرجع سندی مصوب |
| :---: | :--- | :---: | :--- | :--- |
| **`SB-LOG-01`** | لاگ استاندارد ساخت‌یافته JSON | `ast` | صدور کلیه لاگ‌ها منحصراً روی stdout در فرمت JSON از طریق `core/bootstrap` / `log/slog`؛ ممنوعیت استفاده از `fmt.Print` یا لاگرهای متفرقه. | [ADR-022 M0-03](./ADR-022-platform-reliability-and-observability.md)، [DOC-BE-005 §11.1](../../03-backend/mvp-operational-readiness.md) (D-11) |
| **`SB-TRC-01`** | انتشار W3C traceparent | `ast` | سیم‌کشی میدل‌ور `core/middleware.TraceInterceptor()` جهت استخراج، هدایت و بازتاب هدر استاندارد `traceparent` در پاسخ‌ها و لاگ‌ها. | [ADR-022 M0-02](./ADR-022-platform-reliability-and-observability.md) (D-02)، [DOC-BE-005 §11.2](../../03-backend/mvp-operational-readiness.md) |
| **`SB-ERR-01`** | انطباق کاتالوگ خطا با AIP-193 | `ast` | استفاده انحصاری از انولوپ `google.rpc.Status` همراه با `ErrorInfo.reason` متصل به رجیستری متمرکز `contracts/platform/errors.proto`. | [ADR-007 §1](./ADR-007-backend-contracts-and-tooling-standards.md)، [DOC-BE-004 §4](../../03-backend/style-guide.md)، [DOC-BE-005 §11.3](../../03-backend/mvp-operational-readiness.md) |
| **`SB-TST-01`** | بهداشت تست‌ها و Makefile | `filesystem` | قرارگیری تست‌های یکپارچه‌سازی زنده در `tests/live/` و منع باینری‌های تستی موقت در `cmd/`؛ وجود تارگت‌های استاندارد `test` و `verify-live` در `Makefile` سرویس. | [AGENTS.md §4](../../../../../AGENTS.md)، [DOC-BE-004 §3](../../03-backend/style-guide.md) |

---

### ۲.۳. مشخصات آزمون زنده سرویس و فرمان‌های تجمیعی (Live Verification Specification — D3b)

برخلاف قواعد ایستا که به متن سورس و ساختار فایل تکیه دارند، قواعد ران‌تایم مستقیماً روی **کانتینر مستقر و در حال اجرای سرویس** ارزیابی می‌شوند:

#### جدول قواعد آزمون زنده (`make verify-live`):

| شناسه | حوزه پروب زنده | مکانیزم ارزیابی | شرح آزمون ران‌تایم | مرجع سندی مصوب | وضعیت در مرحله ۱ |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **`SB-RT-01`** | سلامت وابستگی‌ها (Honest Readiness) | `network_probe` | استعلام اندپوینت `/readyz`؛ سرویس موظف است پینگ لایو اتصالات حیاتی خود (PostgreSQL, Redis, RabbitMQ, Downstream) را اعتبارسنجی کند. اگر دیتابیس قطع باشد، پاسخ نباید ۲۰۰ باشد (منع Fake UP). | [ADR-022 §3](./ADR-022-platform-reliability-and-observability.md)، [DOC-BE-005 §11.4](../../03-backend/mvp-operational-readiness.md) (D-13) | **مرحله ۱ (الزامی)** |
| **`SB-RT-02`** | تطبیق نسخه، کامیت و Digest | `network_probe` | مقایسه نسخه در حال اجرا، کامیت گیت و Image Digest گزارش‌شده در متادیتای هلث با مقادیر مخزن و داکر اینسپکت؛ تفاوت = INCOMPLETE/FAIL (وابسته به `SB-DEP-04` و `SB-IMG-01`). | [ADR-023 §2.1-§2.5](./ADR-023-service-release-versioning-image-hygiene-and-generated-file-provenance.md) (D-16/D-17)، [DOC-OPS-001 §4.5](../../07-devops/docker-spec.md) | **مرحله ۱ (الزامی)** |
| **`SB-RT-03`** | بازتاب و همگامی Traceparent | `network_probe` | ارسال یک درخواست پروب با هدر مشخص `traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`؛ پاسخ باید همان TraceID را بازگرداند و لاگ JSON معادل آن در لاگ‌های stdout ثبت گردد. | [ADR-022 M0-02 & M0-03](./ADR-022-platform-reliability-and-observability.md) (D-02)، [DOC-BE-005 §11.2](../../03-backend/mvp-operational-readiness.md) | **مرحله ۱ (الزامی)** |
| **`SB-RT-04`** | سلامت Outbox و اتصال بروکر | `network_probe` | استعلام وضعیت Outbox و کانال RabbitMQ از طریق پاسخ متادیتای اندپوینت سلامت خودِ سرویس (بدون کوئری مستقیم SQL از بیرون سرویس جهت حفظ ایزولاسیون داده‌ها و سکرت‌ها)؛ نبود پیام‌های FAILED یا انباشت PENDING کهنه (F-7). | [DOC-GOV-002 §F-7](../../09-governance/current-path.md#f-7)، [ADR-022 §2](./ADR-022-platform-reliability-and-observability.md) | **مرحله ۱ (الزامی — F-7)** |
| **`SB-RT-05`** | انطباق خطای کنترل‌شده با AIP-193 | `network_probe` | ارسال درخواست با شناسه تعمدی نامعتبر (Fixture ایزوله خواندنی)؛ اعتبارسنجی پاسخ بر مبنای انولوپ `google.rpc.Status` همراه با `ErrorInfo.reason`، `owner_service` و `request_id` بدون دستکاری دیتابیس یا عارضه مالی. | [ADR-007 §1](./ADR-007-backend-contracts-and-tooling-standards.md)، [ADR-022 M0-04](./ADR-022-platform-reliability-and-observability.md)، [DOC-BE-005 §11.3](../../03-backend/mvp-operational-readiness.md) (D-11/D-13) | **مرحله ۱ (الزامی)** |

#### مشخصات فنی فرمان بررسی زنده:
1. **فرمان در سطح هر سرویس:**
   ```bash
   make -C services/<name> verify-live
   ```
2. **فرمان تجمیعی در ریشه پلتفرم (`api/`):**
   ```bash
   make doctor
   ```
   فرمان `make doctor` (مصوب M0-03 / D-13) تمامی فرمان‌های `verify-live` سرویس‌های مستقر را فراخوانی کرده و جدول سلامت واحد چاپ می‌کند. هیچ ابزار موازی ساخته نمی‌شود.
3. **پروتکل خروجی سه‌حالته (Three-State Exit Code — D-13):**
   - **`0 (SUCCESS)`:** تمامی پروب‌های ضروری موفق بوده و شواهد کامل ثبت شده است.
   - **`1 (FAILURE)`:** حداقل یک پروب با شکست قطعی مواجه شده است.
   - **`2 (INCOMPLETE)`:** عدم دسترسی به وابستگی‌ها، پارس نشدن لاگ، تایم‌اوت پروب یا نامعلوم بودن نسخه مستقر.
   - **قانون قطعی:** `SKIP` هرگز به عنوان `PASS` تلقی نمی‌شود.

---

### ۲.۴. موتور اعتبارسنجی ایستا (`lemmo-cli check`)
ابزار خط فرمان رسمی مونوریپو (`api/tools/lemmo-cli`) با مصرف مستقیم فایل [`ADR-024.rules.yaml`](./ADR-024.rules.yaml) ساب‌کامند `check` را اجرا می‌کند:
```bash
# بررسی یک سرویس مشخص
go run ./tools/lemmo-cli check <service-name>

# بررسی تمامی سرویس‌ها با خروجی خلاصه ماتریس و گزارش JSON
go run ./tools/lemmo-cli check --all [--format=table|json]
```
- خروجی این فرمان روی سرویس‌های موجود، **تنها سند معتبر و رسمی برای تعیین فهرست اقدامات اصلاحی هر سرویس** است و هرگونه ممیزی دستی را نامعتبر می‌سازد.
- وضعیت خروجی سه‌حالته (۰: پاس، ۱: شکست، ۲: ناقص) در پایپ‌لاین‌های CI به عنوان گیت بلاک‌کننده ادغام می‌شود.

---

### ۲.۵. سیاست Ratchet برای سرویس‌های موجود و گیت صفر-خطا برای سرویس‌های جدید

1. **گیت ورود سرویس جدید (New Service Zero-Tolerance Gate):**  
   هیچ سرویس جدیدی (از جمله سرویس‌های فاز ۲) مجاز به ادغام (Merge) نیست مگر آنکه در پایپ‌لاین CI آزمون `lemmo-cli check <service>` را با **۱۰۰٪ امتیاز سبز (Zero Exceptions)** بگذراند و در محیط آزمون محلی آزمون `make verify-live` آن با خروجی ۰ پاس شود.
2. **قاعده Ratchet برای سرویس‌های ۲۰گانه موجود:**  
   برای سرویس‌های موجود پلتفرم، یک فایل رجیستری بدهی رسمی در `.task/governance/conformance-ratchet.yaml` نگهداری می‌شود. انحرافات فعلی سرویس‌ها با ارجاع به شناسه بدهی (`QF-xx` یا `STB-DEBT-xx`) فهرست می‌شوند. ابزار `lemmo-cli check` در بررسی سرویس‌های قدیمی، صرفاً موارد ثبت‌شده در فایل استثنا را موقتاً مجاز دانسته و **فهرست استثناهای هر سرویس منحصراً می‌تواند کوچک شود (خاصیت چرخ‌دنده یک‌طرفه / Ratchet)**. هرگونه ایجاد انحراف ساختاری جدید در سرویس‌های قدیمی موجب شکست CI خواهد شد.
3. **تصمیم قطعی مالک پیرامون سرویس‌های استاب (`token-service` و `notification-service`):**  
   پیرو تایید مالک محصول (گزینه الف)، این دو سرویس با `Status: Planned` فریز شده و در رجیستری ratchet از گیت‌های جاری معاف می‌گردند تا هنگام آغاز فاز اختصاصی‌شان با آخرین نسخه ژنراتور اسکافولد شوند.

---

## ۳. پیامدها و سازگاری معماری (Consequences & Architecture Parity)

### مزایا:
- حذف کامل سلیقه در توسعه میکروسرویس‌ها و یکدست شدن ۱۰۰٪ ساختار کدهای ۲۰ سرویس.
- اتصال مستقیم اسناد معماری به گیت‌های خط بیلد (CI) از طریق کاتالوگ یکتای YAML.
- ممانعت ساختاری از ورود کدهای فاقد لاگ، فاقد ترایس یا دارای سکرت‌های هاردکد پیش از ادغام سرویس‌های جدید.
- شفاف‌سازی مرزهای مرحله ۱ قابلیت اطمینان (M0) و جلوگیری از اختلاط آن با جورنی‌های پیچیده فازهای آتی.

### تعهدات و اقدامات اجرایی متعاقب (Action Items):
1. ارتقای ابزار `tools/lemmo-cli` جهت خواندن کاتالوگ `ADR-024.rules.yaml` و اجرای دستورات `check`.
2. آزمون خودآزمایی ژنراتور در تست‌های CI ابزار و برقراری گیت Zero-Diff برای قالب‌ها.
3. درج تارگت‌های استاندارد در `Makefile` ریشه و سرویس‌ها.
4. تثبیت رجیستری `conformance-ratchet.yaml` برای هدایت تدریجی سرویس‌های موجود.
