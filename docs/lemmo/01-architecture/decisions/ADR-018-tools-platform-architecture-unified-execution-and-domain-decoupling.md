---
title: "ADR-018: معماری پلتفرم ابزارها، مدل داده ابزار=تعریف، مسیر اجرای مشترک و تفکیک دامنه‌های قرارداد"
description: "تصویب معماری سرویس ابزارها (tools-service)، مدل داده تعریف نسخه‌دار، مسیر اجرای مشترک، تفکیک مالکیت دارایی‌ها به storage-service و جاب‌ها به job-service، و استانداردهای اعتبارسنجی سرتاسری"
order: 19
icon: "file-check"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Tools Platform Architecture, Tool-as-Definition Data Model, Unified Single Execution Path, and Contract Domain Decoupling |
| **Title (FA)** | معماری پلتفرم ابزارها، مدل داده ابزار=تعریف، مسیر اجرای مشترک و تفکیک دامنه‌های قرارداد |
| **ID** | ADR-018 |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | تیم معماری و پلتفرم بک‌اند / @behroz |
| **Last Updated** | 2026-10-08 |
| **Summary (EN)** | Ratifies Stage 15 architectural blueprint following OQ-050 to OQ-055: Mandates Tool-as-Definition schema (tool-definition.schema.json, immutable versions, DB-backed catalog_version, idempotent seeder), Single Unified Execution Path preventing parallel booking logic (Single Execution Path via orchestrator/core with WorkflowOrigin=MENU), moves assets ownership to storage-service (contracts/openapi/assets/v1) and jobs ownership to job-service (contracts/openapi/jobs/v1), enforces end-to-end Idempotency-Key scoping, AIP-193 error mappings, role-based tool naming (text-to-image with fal-ai/flux-dev model_ref), and strict workspace boundary access rules. |
| **Summary (FA)** | تصویب نقشه راه و مشخصات معماری مرحله ۱۵ پیرو تصمیمات OQ-050 تا OQ-055: الزام مدل ابزار=تعریف با JSON Schema، عدم تغییرناپذیری نسخه‌ها، نسخه کاتالوگ در دیتابیس، مسیر اجرای مشترک سرتاسری بدون لاجیک موازی، انتقال دارایی‌ها به storage-service و جاب‌ها به job-service، الزام Idempotency-Key اسکوپ‌شده، نام‌گذاری نقش‌محور ابزارها و جدول خطای AIP-193. |
| **Tags** | `adr`, `tools-service`, `stage15`, `openapi`, `storage-service`, `job-service`, `execution-path` |

---

## ۱. زمینه و انگیزه تصمیم (Context)

در مسیر استقرار مرحله ۱۵ نقشه راه (Stage 15: `tools-service` و اولین ابزار پایه)، چالش‌های معماری عمیقی در تفکیک مرزها، جلوگیری از دوباره‌کاری لاجیک‌های موازی (Parallel Logic) و تعیین متولی واقعی داده‌ها شناسایی گردید:
1. **خطر لاجیک موازی (نقض B1.1):** اگر `tools-service` به صورت مستقل پایپ‌لاین رزرو کردیت، ایجاد جاب و ارتباط با صف را پیاده‌سازی کند، دو پیاده‌سازی موازی و واگرا برای اجرای نودها در پلتفرم به وجود می‌آمد (یکی در ارکستریتور برای بوم و دیگری در ابزارها برای منو).
2. **دوگانگی و نشت منبع حقیقت در دارایی‌ها و جاب‌ها:** قرارداد فعلی `tools/v1/openapi.yaml` به صورت نامتجانس روت‌های دارایی‌ها (`/assets`) و جاب‌ها (`/jobs`) را ذیل ابزارها تجمیع کرده بود. این در حالی است که دارایی‌ها متعلق به کل پلتفرم (`storage-service`) و جاب‌ها متعلق به موتور پردازش پس‌زمینه (`job-service`) هستند.
3. **واقع‌بینی در چشم‌انداز «ابزار = داده/پلاگین»:** طبق ارزیابی تخصصی، افزودن ابزارهای تک‌مرحله‌ای (`generic_rest`) می‌تواند بدون کد انجام شود اما نیازمند زیرساخت داده‌محور استاندارد و پایدار است.

این ADR پیرو پاسخ‌های مصوب به سوالات **OQ-050 تا OQ-055**، استانداردهای فنی مرحله ۱۵ و فازهای آتی را به عنوان **قانون قطعی معماری** تصویب می‌کند.

---

## ۲. تصمیمات مصوب (Decisions)

### ۲.۱. مدل داده «ابزار = تعریف نسخه‌دار» (Tool Definition Schema) — مصوب OQ-050
1. **قالب استاندارد واحد:** هر ابزار منحصراً در قالب یک فایل YAML/JSON منطبق بر JSON Schema رسمی (`tool-definition.schema.json`) در ریپو نگهداری می‌شود.
2. **تغییرناپذیری نسخه‌ها (Immutability):** جفت `(tool_id, version)` تغییرناپذیر است. در صورت تغییر محتوا بدون افزایش نسخه، Seeder در استارت‌آپ به صورت fail-fast متوقف می‌شود.
3. **تفکیک تعریف از وضعیت عملیاتی:** جدول تعاریف ابزار (`tool_definitions`) از وضعیت عملیاتی (`tool_state` شامل `active`, `disabled`, `retired`) تفکیک می‌شود تا فعال/غیرفعال کردن ابزار (Kill Switch) بدون نیاز به نسخه جدید و deploy ممکن باشد.
4. **نسخه‌بندی کاتالوگ (`catalog_version`):** مقدار `catalog_version` در دیتابیس `lemmo_tools` ذخیره می‌شود. کلید کش ردیس نسخه‌دار است (`lemmo:tools:catalog:{catalog_version}`) و نیازی به پاکسازی دستی ندارد. با از دست رفتن ردیس، خواندن به صورت Fallback از دیتابیس انجام می‌پذیرد.
5. **ارزیابی نود در CI:** اعتبارسنجی ارجاع `node_type_id` به عنوان گیت تست CI اعمال می‌شود، نه وابستگی مسدودکننده در زمان اجرای سرویس.
6. **قیمت فقط راهنما است:** فیلد `cost_hint` در کاتالوگ صراحتاً جنبه نمایشی دارد؛ منبع انحصاری و قطعی قیمت فقط `rate-card` در `quota-service` است.

---

### ۲.۲. مسیر اجرای مشترک و یکپارچه (Single Unified Execution Path) — مصوب OQ-051
1. **ممنوعیت قطعی لاجیک موازی:** پیاده‌سازی مستقل رزرو اعتبار، درج جاب در دیتابیس و مدیریت صف در `tools-service` **مطلقا ممنوع** است.
2. **مسیر اجرای مشترک:** تمام اجراها (از بوم، منو، چت یا API) از یک موتور واحد عبور می‌کنند:
   - `tools-service` ورودی‌های فرم را اعتبارسنجی می‌کند (بررسی constraints، رد قاطع URLهای خام خارجی).
   - ورودی‌ها به پارامترهای نود نگاشت شده و در قالب `ToolInvocation` با منشأ `WorkflowOrigin = MENU` به مسیر اجرای مشترک تحویل داده می‌شود:
     `رزرو اعتبار دوفازی در quota-service → درج جاب در job-service (با الگوی Transactional Outbox) → انتشار رویداد RabbitMQ → مصرف توسط ورکر image-service → ذخیره خروجی در storage-service → تسویه کردیت در Ledger`.
3. **شناسه ابزار نقش‌محور:** شناسه ابزار پایه در پلتفرم بر اساس نقش عملکردی (`text-to-image`) نام‌گذاری می‌شود و مقدار `fal-ai/flux-dev` صرفاً به عنوان `model_ref` در پیکربندی هندلر قید می‌گردد.
4. **رابطه زمانی Timeout جاب و رزرو کردیت:** حداکثر طول عمر و Timeout سخت یک جاب باید **کوتاه‌تر** از Timeout رزرو اعتبار در Ledger مالی باشد (`job_hard_timeout < quota_reservation_timeout`). این شرط در آغاز به کار سرویس اعتبارسنجی شده و در صورت نقض بلافاصله fail-fast رخ می‌دهد.
5. **جدول قطعی وضعیت پایانی جاب و اقدام کردیت:**
   | حالت پایانی جاب | اقدام مالی در Quota/Ledger |
   |---|---|
   | `SUCCEEDED` | تسویه قطعی (Settle) |
   | `FAILED` (شامل خطا یا تایم‌اوت) | آزادسازی و بازگشت کامل رزرو (Release/Void) |
   | `CANCELLED` | آزادسازی و بازگشت کامل رزرو (Release/Void) |
   | `CONTENT_POLICY_VIOLATION` | آزادسازی کامل بدون کسر جریمه |
6. **پاسخ اندپوینت اجرا:** پاسخ موفقیت‌آمیز فراخوانی `POST /api/v1/tools/{toolId}/execute` وضعیت **`202 Accepted`** به همراه شناسه `jobId` است.

---

### ۲.۳. انتقال انحصاری مالکیت دارایی‌ها به `storage-service` — مصوب OQ-052
1. **مالکیت متمرکز:** اندپوینت‌های `/api/v1/assets` و `/api/v1/assets/{id}` منحصراً توسط `storage-service` بر بستر پایگاه داده `lemmo_storage` و جدول `stored_assets` سرویس‌دهی می‌شوند. ساخت جدول موازی دارایی در `tools-service` ممنوع است.
2. **تفکیک قرارداد:** قرارداد OpenAPI دارایی‌ها به `contracts/openapi/assets/v1/openapi.yaml` منتقل شده و از قرارداد ابزارها حذف می‌گردد.
3. **آدرس عمومی و امضای Presigned URL:** `storage-service` موظف است Presigned URLها را بر پایه آدرس عمومی کانفیگ‌پذیر (دروازه عمومی یا ساب‌دامین دارایی‌ها) امضا کند تا برای مرورگر کلاینت قابل دسترس باشد. هاست مذکور در سیاست `img-src` در CSP لحاظ می‌گردد.
4. **عدم نشت URL در جاب‌ها:** خروجی جاب‌ها و رویدادهای SSE فقط و فقط **`asset_id`** را حمل می‌کنند؛ صدور URL امضاشده صرفاً در زمان استعلام دارایی از `storage-service` و به صورت دسته‌ای (Batch) صورت می‌گیرد.
5. **امنیت دسترسی:** دارایی متعلق به ورک‌اسپیس دیگر با خطای **۴۰۴** پاسخ داده می‌شود (جلوگیری از نشت وجود شناسه). پاسخ‌های حاوی URL امضاشده حامل هدر `Cache-Control: private, no-store` بوده و پارامترهای حساس امضا در لاگ‌های گیت‌وی Redact می‌شوند.

---

### ۲.۴. متولی انحصاری چرخه حیات و رویدادهای جاب (`job-service`) — مصوب OQ-053
1. **تمرکز دامنه‌ای:** روت‌های REST جاب‌ها (`GET /api/v1/jobs` و `GET /api/v1/jobs/{id}`) و روت استریم رویدادهای زنده (`GET /api/v1/jobs/{id}/events`) منحصراً توسط `job-service` سرویس‌دهی می‌شوند.
2. **حذف روت موقت context-service:** هندلر موقت SSE در `context-service` به طور کامل حذف شده و ترافیک در Kong مستقیماً به `lemmo-svc-job` هدایت می‌شود.
3. **مجوز دسترسی به جاب:**
   - مسیر استریم رویدادها و دریافت تکی جاب دارای سیاست `workspace-policy: none` است (زیرا EventSource هدر ورک‌اسپیس ارسال نمی‌کند).
   - `job-service` موظف است خود به صورت داخلی عضویت کاربر در `job.workspace_id` و نسخه عضویت (`lemmo:membership:version`) را با استراتژی Fail-Closed بررسی کند.
   - دسترسی به جاب ورک‌اسپیس دیگر خطای **۴۰۴** تولید می‌کند.
   - **قانون دسترسی کاربران به جاب‌ها:** هر کاربر منحصراً جاب‌های خودش (`user_id = me`) را در ورک‌اسپیس مشاهده می‌کند؛ نقش‌های `owner` و `admin` مجاز به مشاهده تمام جاب‌های ورک‌اسپیس هستند.
4. **تضمین سلامت استریم SSE:** رویدادها دارای `id` صعودی هستند؛ ترتیب هندلر به صورت «اول اشتراک، سپس اسنپ‌شات وضعیت» است؛ در صورت اتصال به جاب پایان‌یافته، رویداد `job.terminal` ارسال و اتصال بسته می‌شود.
5. **تفکیک روت‌ها در Kong:** دو روت مجزا در Kong تنظیم می‌شود؛ مسیر استریم دارای `response_buffering: false` و تایم‌اوت طولانی است.

---

### ۲.۵. حاکمیت امنیت، هویت و الزام Idempotency-Key — مصوب OQ-054
1. **کاتالوگ عمومی و یکپارچه:** پاسخ `GET /api/v1/tools` برای همه کاربران (مهمان و احراز هویت‌شده) یکسان و کش‌پذیر با ETag است و هیچ داده شخصی در آن نشت نمی‌کند. ریت‌لیمیت per-IP اعمال می‌گردد.
2. **الزام سخت‌گیرانه در اجرا:** اجرای ابزار منحصراً نیازمند توکن معتبر و هدر ورک‌اسپیس است (`workspace-policy: required`). اجرای مهمان به هر شکل ممنوع است.
3. **شناسه یکتایی تکرار (`Idempotency-Key`):**
   - هدر `Idempotency-Key` برای تمام درخواست‌های `POST .../execute` الزامی است (`IDEMPOTENCY_KEY_REQUIRED`).
   - دامنه یکتایی کلید: `(workspace_id, user_id, idempotency_key)`.
   - درخواست مجدد با همان کلید و بدنه، همان پاسخ اول (`202 Accepted` با همان `jobId`) را به همراه هدر `Idempotent-Replayed: true` بازمی‌گرداند.
   - کلید سطح بالا به طور قطعی به کلیدهای رزرو مالی و درج جاب مشتق می‌شود.
4. **جدول استاندارد خطاهای AIP-193 در اجرا:**
   | وضعیت | HTTP | Reason Code |
   |---|---|---|
   | بدون توکن یا نامعتبر | 401 | `UNAUTHENTICATED` |
   | هدر ورک‌اسپیس غایب | 400 | `WORKSPACE_REQUIRED` |
   | عدم عضویت در ورک‌اسپیس | 403 | `WORKSPACE_FORBIDDEN` |
   | منبع متعلق به ورک‌اسپیس دیگر | 404 | `NOT_FOUND` |
   | نقش ناکافی در ورک‌اسپیس (کمتر از runner) | 403 | `INSUFFICIENT_ROLE` |
   | ابزار ناموجود یا بازنشسته | 404 | `TOOL_NOT_FOUND` |
   | ابزار موقتاً غیرفعال (Kill Switch) | 503 | `TOOL_DISABLED` (+ Retry-After) |
   | اعتبار ناکافی یا کیف‌پول خالی | 402 | `INSUFFICIENT_CREDITS` / `WORKSPACE_WALLET_EMPTY` |
   | پارامترهای نامعتبر | 400 | `INVALID_ARGUMENT` |
   | تغییر قیمت حین نمایش تا اجرا | 409 | `PRICE_CHANGED` (مصوب ADR-019) |
   | نقض ریت‌لیمیت یا سقف همزمانی | 429 | `RATE_LIMITED` |

---

### ۲.۶. تفکیک ماژولار قراردادهای OpenAPI — مصوب OQ-055
1. **یک مسیر، یک قرارداد، یک مالک:**
   - `contracts/openapi/tools/v1/openapi.yaml`: فقط کاتالوگ و اجرای ابزارها (`tools-service`).
   - `contracts/openapi/assets/v1/openapi.yaml`: مدیریت دارایی‌ها (`storage-service`).
   - `contracts/openapi/jobs/v1/openapi.yaml`: مدیریت جاب‌ها و استریم رویدادها (`job-service`).
2. **پایداری کلاینت فرانت‌اند:** مسیرها (`paths`) و `operationId`ها در تفکیک قرارداد بدون تغییر باقی می‌مانند تا کلاینت تولیدی Orval در `app/` دچار شکست نگردد.

---

### ۲.۷. الحاقیه مصوبات ADR-019 (Unified Capability Invocation)
پیرو تصویب **[ADR-019](./ADR-019-unified-capability-invocation-and-agent-boundaries.md)**، اصلاحات و قواعد زیر به این سند ملحق می‌گردد:
1. **حذف `cost_hint`:** فیلد `cost_hint` از اسکیما تعریف ابزارها و جدول `tool_definitions` حذف شده و انحصاراً با استعلام نرخ‌نامه `rate-card` در `quota-service` جایگزین می‌شود.
2. **قرارداد `ToolInvocation` یکپارچه:** افزودن فیلدهای `input_kind` (مقادیر `structured`, `command`, `natural_language`)، سقف محافظتی `expected_cost`، و فیلدهای اجرای سطح ران (`run_id` و `parent_reservation_id`).
3. **متادیتای ابزارها برای ایجنت:** افزودن فیلدهای `capability`, `chat_alias`, `agent_visible`, `llm_description` و فیلد نوع `type` (`generator`, `template`, `workflow`).
4. **مسیر همگرایی بوم:** اجرای نودهای بوم از طریق همین پایپ‌لاین و با رزرو متمرکز ران در `orchestrator-service` همگرا خواهد شد.

---

## ۳. پیامدها و اثرات (Consequences)

### پیامدهای مثبت:
- پیشگیری قطعی از بدهی فنی بزرگ ناشی از موازی‌کاری رزرو کردیت و اجرای جاب.
- ایزولاسیون کامل دامنه‌های تجاری دارایی‌ها و جاب‌ها در میکروسرویس‌های متولی خود.
- آماده‌سازی ۱۰۰٪ زیرساخت کاتالوگ برای تبدیل شدن به پلاگین و ادمین پنل در آینده بدون تغییر قالب.
- بستن تمام منافذ امنیتی در دسترسی به دارایی‌ها، استریم‌های SSE و سوءاستفاده‌های مالی با Idempotency سرتاسری.

### اقدامات پیاده‌سازی مرحله ۱۵:
1. ایجاد پایگاه داده `lemmo_tools` و پیاده‌سازی سرویس `tools-service` در Go بر مبنای Clean Architecture و DualServer.
2. تدوین فایل‌های تعریف ابزارها با JSON Schema در `services/tools-service/catalog/`.
3. افزودن لایه HTTP/DualServer به `storage-service` جهت سرویس‌دهی مستقیم دارایی‌ها.
4. پیاده‌سازی اندپوینت‌های جاب در `job-service` و تفکیک روت‌های Kong.
5. اتصال کلاینت فرانت‌اند استودیو به سرویس‌های واقعی و حذف کامل کانتینر ماک `lemmo-mock-tools`.
