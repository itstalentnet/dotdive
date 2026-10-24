---
title: "مشخصات فنی سرویس ابزارها، دارایی‌ها و اجرای مشترک (DOC-BE-011)"
description: "سند منبع واحد حقیقت (SSOT) برای معماری، مدل داده کاتالوگ، پایپ‌لاین اجرای مشترک، تفکیک دارایی‌ها به storage-service و جاب‌ها به job-service پیرو ADR-018"
order: 11
icon: "cpu"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Tools Service, Asset Registry & Unified Execution Architecture Specification |
| **Title (FA)** | مشخصات فنی سرویس ابزارها، رجیستری دارایی‌ها و معماری اجرای مشترک |
| **ID** | DOC-BE-011 |
| **Category** | `backend` |
| **Status** | `Approved` |
| **Owner** | تیم پلتفرم بک‌اند / @behroz |
| **Last Updated** | 2026-10-08 |
| **Summary (EN)** | Authoritative specification for Stage 15 following ADR-018: Codifies Tools Service Clean Architecture (DualServer, lemmo_tools DB, tool-definition.schema.json, immutable versions, DB-backed catalog_version, Redis cached catalog), Single Unified Execution Path for tools invocation (WorkflowOrigin=MENU, end-to-end Idempotency-Key, transactional outbox in job-service, two-phase quota reservation, image-service worker), Asset Domain decoupling to storage-service (contracts/openapi/assets/v1, stored_assets DB, signed URLs with public endpoint, CSP), and Jobs Domain decoupling to job-service (contracts/openapi/jobs/v1, SSE events streaming, membership version fail-closed check). |
| **Summary (FA)** | سند منبع واحد حقیقت (SSOT) مرحله ۱۵ پیرو مصوبه ADR-018: کدگذاری معماری تمیز سرویس ابزارها (دوال‌سرور، دیتابیس lemmo_tools، اسکیما JSON تعریف ابزار، نسخه‌بندی کاتالوگ، کش ردیس)، مسیر اجرای مشترک ابزارها (منشأ MENU، آیدم‌پوتنسی سرتاسری، ترنزکشنال آوت‌باکس در job-service، رزرو دوفازی، ورکر تصویر)، انتقال دارایی‌ها به storage-service (قرارداد assets/v1، امضای عمومی، CSP)، و انتقال جاب‌ها به job-service (قرارداد jobs/v1، استریم SSE، کنترل دسترسی عضویت). |
| **Tags** | `doc-be-011`, `tools-service`, `storage-service`, `job-service`, `openapi`, `adr-018`, `stage15` |

---

## ۱. معرفی و دامنه سند (Overview & Scope)

این سند پیرو مصوبات رسمی **[ADR-018](../01-architecture/decisions/ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md)**، تصمیمات مصوب ADR-018 و تصمیمات کلان قبلی (ADR-016، ADR-017، DOC-BE-007) تدوین شده و به عنوان **منبع واحد حقیقت (SSOT)** برای پیاده‌سازی مهندسی مرحله ۱۵ عمل می‌کند.

### اهداف اصلی مرحله ۱۵:
1. **استقرار سرویس ابزارها (`tools-service`):** راه‌اندازی مایکروسرویس Go با الگوی Clean Architecture و DualServer بر پورت‌های HTTP `8094` و gRPC `50065` منحصراً جهت رجیستری و کاتالوگ تعاریف ابزارها ([کارت tools-service](../01-architecture/service-responsibility-registry.md#۳۱۰-tools-service)).
2. **مدل ابزار = تعریف داده‌محور (T1-T5):** بارگذاری ابزارها از فایل‌های اعلانی در ساختار پوشه‌ای `tools/<tool-name>/` به صورت تغییرناپذیر در دیتابیس `lemmo_tools` با Advisory Lock و کش‌گذاری نسخه‌دار در Redis.
3. **تفکیک قطعی اجرا از تعریف ابزار (مصوب D-46 و T5):** `tools-service` هیچ‌گونه نقشی در اجرا، رزرو یا تسویه سهمیه، یا انتشار جاب ندارد. کلیه فراخوانی‌ها و اجرای ابزارها منحصراً توسط `orchestrator-service` هدایت می‌شود.
4. **تفکیک قطعی دامنه‌ها:** انتقال اندپوینت‌های دارایی (`/api/v1/assets`) به `storage-service` و اندپوینت‌های جاب (`/api/v1/jobs`) به `job-service`.
5. **جایگزینی کامل ماک:** حذف ۱۰۰٪ کانتینر ماک `lemmo-mock-tools` در داکر کامپوز و اتصال گیت‌وی Kong به سرویس‌های واقعی.

---

## ۲. مشخصات مایکروسرویس ابزارها (`tools-service`)

### ۲.۱. توپولوژی و پورت‌ها
- **نام کانتینر:** `lemmo-svc-tools`
- **پورت HTTP:** `8094` (پاسخ‌گویی به استعلام کاتالوگ و متادیتای ابزارها؛ اندپوینت‌های اجرا به orchestrator-service منتقل شده‌اند)
- **پورت gRPC:** `50065` (ارتباطات داخلی بین‌سرویسی جهت ارائه تعاریف ابزار به orchestrator-service و سایر کلاینت‌ها)
- **پایگاه داده اختصاصی:** PostgreSQL `lemmo_tools`
- **کش:** Redis کش‌اَساید با پیشوند کلید `lemmo:tools:catalog:{catalog_version}`

### ۲.۲. پایگاه داده `lemmo_tools` (اسکیما DDL)

```sql
-- 000001_init_tools_schema.up.sql

CREATE TABLE IF NOT EXISTS tool_definitions (
    id VARCHAR(64) NOT NULL,
    version INT NOT NULL,
    category VARCHAR(64) NOT NULL,
    output_type VARCHAR(32) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_en TEXT NOT NULL,
    name_fa VARCHAR(255) NOT NULL,
    description_fa TEXT NOT NULL,
    input_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    handler_type VARCHAR(32) NOT NULL DEFAULT 'generic_rest',
    provider_ref VARCHAR(64),
    model_ref VARCHAR(128),
    param_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
    native_key VARCHAR(64),
    node_type_id VARCHAR(128) NOT NULL,
    cost_hint INT NOT NULL DEFAULT 0,
    ui_component_key VARCHAR(64),
    source VARCHAR(32) NOT NULL DEFAULT 'seed', -- 'seed' | 'admin'
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, version)
);

CREATE TABLE IF NOT EXISTS tool_state (
    tool_id VARCHAR(64) PRIMARY KEY,
    active_version INT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'draft' | 'active' | 'disabled' | 'retired'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS catalog_metadata (
    key VARCHAR(64) PRIMARY KEY,
    value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_status ON tool_state(status);
```

### ۲.۳. چرخه Seeder و کش‌گذاری نسخه‌دار
1. در شروع به کار `tools-service`، فایل‌های تعریف موجود در پوشه `catalog/*.json` اعتبارسنجی می‌شوند.
2. با استفاده از `pg_advisory_xact_lock(746193)`، تعاریف به صورت Idempotent درج می‌شوند. اگر نسخه تکراری با هش متفاوت مشاهده شود، سرویس فوراً Fail-Fast می‌شود.
3. در صورت ایجاد نسخه جدید، مقدار `catalog_version` در جدول `catalog_metadata` به صورت اتمیک افزایش می‌یابد.
4. کلید کش ردیس برابر با `lemmo:tools:catalog:{catalog_version}` است. بنابراین با ارتقای نسخه، کلاینت‌ها بلافاصله داده جدید را دریافت کرده و هیچ تداخلی در استقرار موازی (Rolling Update) به وجود نمی‌آید.

---

## ۳. پایپ‌لاین اجرای ابزارها (تفکیک به orchestrator-service طبق مصوبه D-46 و T5)

> ⚠️ **وضعیت معماری: جایگزین‌شده (Superseded)**  
> پیرو تصمیم معمارانه **D-46** و بندهای **T1 تا T5** در [ADR-018 §۲.۸](../01-architecture/decisions/ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md#۲۸-تکمیل-معماری-ابزار-و-اجرا-و-بازنشستگی-image-service-t1-تا-t7--مصوب-d-46) و [سند مرجع مسئولیت سرویس‌ها (DOC-ARCH-013)](../01-architecture/service-responsibility-registry.md#۳۱۰-tools-service)، **`tools-service` هیچ نقشی در اجرای ابزارها، رزرو سهمیه، یا انتشار جاب ندارد.** اجرا منحصراً بر عهده **`orchestrator-service`** است. `tools-service` صرفاً رجیستری و فراهم‌کننده تعاریف اعلانی ابزارهاست.

### ۳.۱. پایپ‌لاین جاری معماری (Orchestrator Execution Pipeline)
1. کلاینت استودیو درخواست اجرای ابزار یا گردش‌کار را به `orchestrator-service` ارسال می‌کند.
2. `orchestrator-service` تعریف ابزار را از `tools-service` (فقط‌خواندنی) واکشی و اعتبارسنجی می‌کند.
3. `orchestrator-service` عملیات بررسی و رزرو اعتبار را از طریق `quota-service` هدایت می‌کند.
4. `orchestrator-service` وظایف را به ورکرها ارسال کرده یا مستقیماً از طریق `ai-gateway` اجرا می‌نماید.
5. تسویه نهایی اعتبار بر اساس هزینه واقعی توسط `orchestrator-service` انجام می‌شود.

### ۳.۲. دیاگرام تاریخی مرحله ۱۵ (سابقه — منسوخ‌شده)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Studio Client (app/)
    participant Kong as Kong Gateway
    participant Tools as tools-service (سابقه)
    participant Quota as quota-service
    participant JobSvc as job-service
    participant Rabbit as RabbitMQ
    participant Worker as image-service
    participant Storage as storage-service
    participant Usage as usage-service (متریک خام)

    Note over Tools: این پایپ‌لاین تاریخی با مصوبه D-46 T5 جایگزین گردید و اجرا به orchestrator-service واگذار شد.
    Client->>Kong: POST /api/v1/tools/text-to-image/execute (Idempotency-Key)
    Kong->>Tools: Proxy to 8094
    Tools->>Tools: Validate Inputs & Workspace Scope
    Tools->>Quota: CheckAndReserveQuota(tool_id, credits, idempotency_key)
    Quota-->>Tools: ReservationID confirmed
    Tools->>JobSvc: EnqueueJob(WorkflowOrigin=MENU, reservation_id, outbox)
    JobSvc-->>Tools: JobID created
    Tools-->>Client: 202 Accepted { "jobId": "..." }
```

### قواعد تضمین سازگاری و امنیت پایپ‌لاین:
1. **تضمین تطابق زمانی:** کانفیگ `job_hard_timeout` (مثلاً ۱۸۰ ثانیه) باید همواره کوچک‌تر از `quota_reservation_timeout` (مثلاً ۳۰۰ ثانیه) باشد؛ در غیر این صورت سرویس استارت نخواهد خورد.
2. **آیدم‌پوتنسی سرتاسری:** کلید هدر `Idempotency-Key` در دامنه‌‌ی `(workspace_id, user_id, key)` نگهداری شده و کلیدهای لجر و جاب از آن مشتق می‌شوند.
3. **تراکنش Outbox در جاب‌ها:** ایجاد جاب و صف‌بندی پیام در `job-service` با الگوی Transactional Outbox انجام می‌پذیرد تا هیچ جاب یتیمی بدون انتشار پیام در سیستم باقی نماند.

---

## ۴. تفکیک دامنه دارایی‌ها (`storage-service`)

1. **انتقال قرارداد:** اندپوینت‌های زیر از قرارداد ابزارها حذف و به `contracts/openapi/assets/v1/openapi.yaml` منتقل می‌گردند:
   - `GET /api/v1/assets`: دریافت لیست دارایی‌های ورک‌اسپیس با نشانگر Keyset Pagination.
   - `GET /api/v1/assets/{assetId}`: دریافت اطلاعات و لینک امضاشده موقت دارایی.
2. **ارتقای سرویس ذخیره‌سازی:** افزودن لایه HTTP DualServer بر روی پورت `8084` به `storage-service` در Go.
3. **امنیت Presigned URL:**
   - متغیر محیطی `STORAGE_PUBLIC_BASE_URL` هاست قابل دسترس از مرورگر را تعیین می‌کند.
   - کلیه URLها حامل هدر `Cache-Control: private, no-store` بوده و پارامترهای Query امضا در لاگ‌های گیت‌وی Redact می‌شوند.
   - درخواست دارایی متعلق به ورک‌اسپیس دیگر با خطای **۴۰۴** پاسخ داده می‌شود.

---

## ۵. تفکیک دامنه جاب‌ها (`job-service`)

1. **انتقال قرارداد:** اندپوینت‌های زیر به `contracts/openapi/jobs/v1/openapi.yaml` منتقل می‌گردند:
   - `GET /api/v1/jobs`: لیست جاب‌های ورک‌اسپیس (کاربر عادی فقط جاب‌های خودش، Owner/Admin تمام جاب‌ها).
   - `GET /api/v1/jobs/{jobId}`: وضعیت فعلی جاب.
   - `GET /api/v1/jobs/{jobId}/events`: استریم بلادرنگ رویدادهای Server-Sent Events (SSE).
2. **ارتقای سرویس جاب:** افزودن پورت HTTP اختصاصی `8095` به `job-service`.
3. **حذف روت موقت context-service:** تمام کدهای موقت SSE در `context-service` بازنشانی و حذف شده و روت گیت‌وی در Kong مستقیماً به `lemmo-svc-job:8095` متصل می‌گردد.
4. **اعتبارسنجی عضویت در SSE:** کنترل کلید `lemmo:membership:version:{workspace_id}:{user_id}` به صورت داخلی توسط کتابخانه مشترک `job-service` با الگوی Fail-Closed انجام می‌پذیرد.

---

## ۶. تفکیک قراردادهای OpenAPI و نگاشت Kong Gateway

```text
/api/v1/tools/**   ──>  lemmo-svc-tools:8094     (contracts/openapi/tools/v1)
/api/v1/assets/**  ──>  lemmo-svc-storage:8084   (contracts/openapi/assets/v1)
/api/v1/jobs/**    ──>  lemmo-svc-job:8095       (contracts/openapi/jobs/v1)
```

- **کانتینر `lemmo-mock-tools`:** پس از اعمال سرویس‌های واقعی، کانتینر ماک Prism به طور کامل از `infra/compose/dev.yml` حذف می‌گردد.

---

## ۷. مشخصات تکمیلی اجرای قابلیت‌های واحد (Unified Capability Invocation — مصوب ADR-019)

پیرو تصویب **[ADR-019](../01-architecture/decisions/ADR-019-unified-capability-invocation-and-agent-boundaries.md)**، مشخصات زیر در معماری سرویس ابزارها و اجرای مشترک اعمال می‌گردد:

### ۷.۱. قرارداد یکپارچه `ToolInvocation`
تمام کانسومرها (Canvas, Agent, Public API) از ساختار واحد زیر جهت درخواست اجرا استفاده می‌کنند:
- `tool_id`: شناسه نقش‌محور ابزار (مانند `text-to-image`).
- `input_kind`: نوع صریح ورودی (`structured`, `command`, `natural_language`). ممنوعیت قطعی استنباط نوع ورودی در گیت‌وی.
- `inputs`: مپ پارامترهای اعتبارسنجی‌شده مطابق اسکیما.
- `expected_cost`: سقف محافظتی هزینه تخمینی کاربر. اگر قیمت محاسبه‌شده در سرور بیشتر از این مقدار باشد، درخواست با خطای `409 PRICE_CHANGED` رد می‌شود.
- `run_id` (اختیاری): شناسه اجرای والد در بوم یا جریان چندمرحله‌ای.
- `parent_reservation_id` (اختیاری): شناسه رزرو مالی در سطح ران (جهت جلوگیری از رزرو مجدد برای نودهای داخل یک ران).

### ۷.۲. حذف `cost_hint` و تثبیت قیمت‌گذاری تک‌نقطه‌ای
- فیلد `cost_hint` از اسکیما تعریف ابزارها و دیتابیس `lemmo_tools` حذف می‌شود.
- نرخ‌نامه رسمی `rate-card` در `quota-service` تنها منبع قیمت پلتفرم است.
- کلاینت استودیو قیمت‌ها را از اندپوینت عمومی نمای قیمت در `quota-service` دریافت کرده و برآورد قطعی پیش از اجرا از `POST /api/v1/quota/estimate` دریافت می‌شود.

### ۷.۳. گسترش متادیتای ابزارها برای ایجنت
اسکیمای تعریف ابزار به فیلدهای زیر برای سازگاری با مدل‌های زبانی مجهز می‌گردد:
- `capability`: شناسه قابلیت عملکردی (مانند `image.generate`).
- `chat_alias`: آرایه نام‌های مستعار کامند چت (مانند `["/image", "/flux"]`).
- `agent_visible`: پرچم بولی قابلیت رویت برای ایجنت چت.
- `llm_description`: متن راهنمای عملکرد ابزار برای مدل زبانی.
- `type`: نوع ابزار مطابق با `generator`, `template`, `workflow`.
- تولید شمای ابزارها برای LLM به صورت خودکار از آرایه `input_fields` انجام می‌پذیرد.

---

## ۸. الزامات مصوب معماری «ابزار و اجرا» و ویژگی‌های مدل (مصوب ADR-018 الحاقیه T1–T7 و K1–K9)

پیرو تصمیمات تکمیلی معماری مصوب **[ADR-018 §۲.۸ و §۲.۹](../01-architecture/decisions/ADR-018-tools-platform-architecture-unified-execution-and-domain-decoupling.md#۲۸-تکمیل-معماری-ابزار-و-اجرا-و-بازنشستگی-image-service-t1-تا-t7--مصوب-d-46)**:

1. **تفکیک مسئولیت‌های اجرا و تعریف (مصوب D-46 T5 و سند مرجع):**
   - مسئولیت اجرا و رزرو سهمیه از `tools-service` سلب شده و منحصراً بر عهده **`orchestrator-service`** قرار دارد. `tools-service` فقط رجیستری و تعریف اعلانی ابزارهاست ([کارت tools-service](../01-architecture/service-responsibility-registry.md#۳۱۰-tools-service)).
   - *(سابقه منسوخ T5)*: خواندن تعاریف، رزرو هزینه و اجرای گام‌به‌گام توسط tools-service جایگزین گردید و تمام وظایف اجرایی به orchestrator منتقل شد.
2. **استقلال تعاریف از ران‌تایم موتور گردش‌کار و قواعد اجرایی (T6 — مصوب D-55 تا D-58):** ساختار تعاریف گردش‌کار به گونه‌ای طراحی می‌شود که ارتقا به موتورهای ارکستراسیون پیشرفته (مانند Temporal) بدون تغییر فایل‌های تعریف ابزار و صرفاً با بازنویسی اجراکننده میسر باشد. بر اساس تصمیمات مصوب:
   - **دایره سازندگان گردش‌کار (مصوب D-55):** دایره سازندگان گردش‌کارها در فاز بتا منحصراً به صورت سیستمی و از طریق فایل‌های مخزن گیت (Git repo) تعریف می‌شود. ابزار گردش‌کارساز کاربر (User Workflow Builder) به فازهای پس از بتا موکول است.
   - **ساختار خطی گردش‌کار (مصوب D-56):** ساختار گردش‌کارها در فاز بتا منحصراً خطی و ترتیبی (Sequential Pipeline) است. استفاده از موتورهای ارکستراسیون پیشرفته (نظیر Temporal) و پشتیبانی از گراف‌های محاسباتی ناهمگام یا شاخه‌دار (DAG) به فازهای آتی تعویق می‌گردد.
   - **اجرای بدون توقف بین‌راهی (مصوب D-57):** گردش‌کارها در فاز بتا بدون توقف تعاملی کاربر (Human-in-the-Loop) اجرا می‌شوند؛ هر مرحله به صورت خودکار و پیوسته پس از تکمیل مرحله قبل آغاز شده و نیاز به تعامل یا تایید بین‌راهی کاربر ندارد.
   - **مدیریت ابزارها با GitOps (مصوب D-58):** مدیریت و افزودن ابزارهای جدید منحصراً از طریق فایل در ریپازیتوری کد (الگوی GitOps) صورت می‌پذیرد و هیچ‌گونه پنل ادمین یا بک‌آفیس تحت وب برای افزودن داینامیک ابزارها در فاز بتا وجود نخواهد داشت.
3. **نیازمندی‌های ابزار و تطبیق با واژه‌نامه (K1، K5 و K6 — بعد از بتا):**
   - نیازهای هر ابزار در فیلد `required_capabilities` همان ابزار قید می‌شود و با واژه‌نامه رسمی `contracts/platform/ai/` سنجیده می‌شود.
   - `tools-service` نیازمندی‌های ابزار را همراه درخواست به `ai-gateway` ارسال می‌کند؛ هرگونه عدم انطباق با رفتار Fail-Closed متوقف می‌گردد.
   - کلاینت فرانت‌اند ویژگی‌های مدل را مستقیماً دریافت نمی‌کند، بلکه `tools-service` پارامترهای مجاز فرم را به کلاینت ارائه می‌دهد (K8).

