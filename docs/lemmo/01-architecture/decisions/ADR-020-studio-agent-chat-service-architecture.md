---
title: "ADR-020: معماری میکروسرویس چت ایجنت استودیو (agent-service)، تفکیک استریم رویدادها و چرخه حیات پیام‌ها"
description: "تصویب معماری سرویس چت ایجنت، مدل داده lemmo_agent، پروتکل تفکیک‌شده استریم پیام‌ها و کارت‌های جاب، زیرساخت شبیه‌ساز ماک مدل‌های زبانی و حذف ماک چت پیرو OQ-056 تا OQ-060"
order: 21
icon: "bot"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Studio Agent Chat Service Architecture, Decoupled Message Event Streaming, and Message Lifecycle Governance |
| **Title (FA)** | معماری میکروسرویس چت ایجنت استودیو، تفکیک استریم رویدادها و چرخه حیات پیام‌ها |
| **ID** | ADR-020 |
| **Category** | `architecture` |
| **Status** | `Approved` |
| **Owner** | تیم معماری و پلتفرم بک‌اند / @behroz |
| **Last Updated** | 2026-10-09 |
| **Summary (EN)** | Ratifies Stage 16B architectural blueprint following OQ-056 to OQ-060: Establishes agent-service (DualServer HTTP 8096 + gRPC 50066, lemmo_agent DB), workspace/user-isolated immutable threads (404 on access mismatch, private to author), decoupled message lifecycle (POST /messages returning 202 Accepted, GET /messages/{id}/events per-message SSE stream with Last-Event-ID and THREAD_BUSY protection), typed parts schema with message_jobs mapping, client-driven job status observation via sdk.jobs.subscribe, deterministic containerized LLM emulator (lemmo-mock-llm) in dev/test with fail-fast in production, dual Kong routing, and decommission of lemmo-mock-chat. |
| **Summary (FA)** | تصویب مشخصات معماری مرحله 16B پیرو تصمیمات OQ-056 تا OQ-060: استقرار agent-service (دوال‌سرور پورت HTTP 8096 و gRPC 50066، دیتابیس lemmo_agent)، رشته‌های تغییرناپذیر اسکوپ‌شده به کاربر و ورک‌اسپیس (خطای ۴۰۴ در عدم تطابق، حریم خصوصی مطلق پرامپت‌ها)، چرخه حیات تفکیک‌شده پیام (ارسال با ۲۰۲ و استریم مجزای هر پیام با رویدادهای تایپ‌دار، Last-Event-ID و خطای THREAD_BUSY)، ساختار parts تایپ‌دار با جدول message_jobs، اتصال مستقیم کلاینت به استریم جاب‌ها، شبیه‌ساز قطعی LLM در dev/test (کانتینر lemmo-mock-llm) با منع قطعی در پروداکشن، تفکیک دو روت چت در Kong و حذف کامل lemmo-mock-chat. |
| **Tags** | `adr`, `adr-020`, `agent-service`, `stage16b`, `sse`, `model-router`, `chat`, `kong` |

---

## ۱. زمینه و انگیزه تصمیم (Context)

در امتداد استقرار **Stage 16A** (ارتقای قرارداد اجرای قابلیت‌ها، متادیتای ایجنت و قیمت‌گذاری تک‌نقطه‌ای در ADR-019)، پیاده‌سازی سرویس واقعی چت ایجنت استودیو (**Stage 16B**) جهت جایگزینی آخرین ماک محصولی تعاملی (`lemmo-mock-chat`) نیازمند تصمیم‌گیری دقیق پیرامون مدل داده، چرخه حیات پیام‌ها، نحوه استریم پاسخ‌ها و مرزهای تعاملی با کلاینت بود:
1. **نقص استریم تک‌مسیره:** بازگرداندن استریم SSE در پاسخ مستقیم به `POST /messages` عمر پیام را به اتصال کلاینت گره می‌زد، بازپیوست (Reconnect) پس از رفرش صفحه را ناممکن می‌ساخت و با ماهیت استاندارد `EventSource` (که فقط متد GET دارد) در تضاد بود.
2. **خطر نشت حریم خصوصی:** در چت تعاملی، پرامپت‌ها و افکار کاربر حاوی اطلاعات محرمانه هستند و نباید حتی توسط سایر اعضای ورک‌اسپیس یا ادمین‌ها دیده شوند.
3. **خطر شکستن فرانت‌اند و هدررفت منابع در رویدادهای جاب:** پروکسی کردن پیشرفت جاب‌ها درون استریم چت موجب ایجاد منبع حقیقت دوم و قطعی استریم در تولیدهای طولانی می‌شد.
4. **خطر شبیه‌سازهای قانون‌محور در کد پروداکشن:** ایجاد Fallback بی‌صدا به Parserهای محلی در کد سرویس ریسک کسر هزینه واقعی با پاسخ جعلی در پروداکشن را ایجاد می‌کرد.

این ADR پیرو پاسخ‌های مصوب به سوالات **OQ-056 تا OQ-060**، استانداردهای فنی مرحله 16B را تصویب می‌کند.

---

## ۲. تصمیمات مصوب (Decisions)

### ۲.۱. مدل داده، مرز مالکیت و چرخه حیات پیام در `lemmo_agent` (مصوب OQ-056)
1. **اسکوپ و حریم خصوصی مطلق رشته‌ها (Thread Isolation):**
   - هر Thread منحصراً به جفت `(workspace_id, user_id)` تعلق دارد و پس از ایجاد **تغییرناپذیر** است.
   - هیچ شخصی به جز خود کاربر سازنده (حتی Owner یا Admin ورک‌اسپیس) مجاز به مشاهده Threadها و پرامپت‌های او نیست.
   - هرگونه عدم تطابق هویت کاربر یا ورک‌اسپیس با خطای **۴۰۴** پاسخ داده می‌شود (جلوگیری از نشت وجود شناسه).
2. **وضعیت‌های شش‌گانه پیام:**
   - وضعیت‌های پیام دستیار: `pending`، `streaming`، `awaiting_confirmation`، `completed`، `failed`، `cancelled`. بازگشت از وضعیت‌های پایانی ممنوع است.
3. **درج زودهنگام با نوشتن در نقاط ثابت (Checkpointing):**
   - رکورد پیام از ابتدا با شناسه ثابت درج می‌شود، اما متن توکن‌ها در حافظه/ردیس بافر شده و در دیتابیس فقط در نقاط ثابت (شروع، tool call، پایان، و flush دوره‌ای) ثبت می‌گردد.
4. **مدیریت کرش و پیام‌های فعال:**
   - پاک‌سازی پیام‌های معلق با Reaper دوره‌ای (انتقال به `failed` با دلیل `interrupted`).
   - در هر Thread در هر لحظه حداکثر یک پیام فعال مجاز است؛ ارسال جدید در این حالت خطای **`409 THREAD_BUSY`** تولید می‌کند.
   - افزودن اندپوینت لغو صریح: `POST /api/v1/chat/threads/{threadId}/messages/{messageId}/cancel`.
5. **ارسال پیام Idempotent:**
   - الزام هدر `Idempotency-Key` در دامنه `(workspace_id, user_id, key)`. ترتیب پیام‌ها با شماره صعودی تعیین می‌شود.
6. **ساختار `parts` تایپ‌دار و جدول `message_jobs`:**
   - محتوای پیام شامل آرایه‌ای از بخش‌های تایپ‌دار (`parts`: متن، فراخوانی ابزار، ارجاع جاب، ارجاع دارایی).
   - جدول رابط `message_jobs(message_id, job_id, tool_id, tool_version)` با ایندکس معکوس. وضعیت جاب در چت کپی نمی‌شود؛ فقط `job_id` نگهداری شده و وضعیت از `job-service` استعلام می‌شود.
   - کلید Idempotency فراخوانی `ExecuteTool` به صورت قطعی از `(message_id, tool_call_index)` مشتق می‌شود.
   - قرارداد پیام در OpenAPI از `jobId` تکی به آرایه `jobs[]` توسعه می‌یابد.

---

### ۲.۲. تفکیک ارسال از استریم (SSE Protocol & Endpoints) (مصوب OQ-057)
1. **تفکیک اندپوینت‌ها:**
   - ارسال پیام: `POST /api/v1/chat/messages` با وضعیت **`202 Accepted`** شامل `thread_id`، `user_message_id` و `assistant_message_id`.
   - استریم پیام: **`GET /api/v1/chat/threads/{threadId}/messages/{messageId}/events`** اختصاصی برای هر پیام.
   - فیلد `active_message_id` در پاسخ Thread برای همگام‌سازی لحظه‌ای دستگاه‌های ثانویه.
2. **پروتکل رویدادهای تایپ‌دار:**
   - رویدادها با شناسه صعودی در هر پیام: `token`، `tool_call`، `confirmation_required`، `job_dispatched`، `message_done`، `message_failed`، `message_cancelled`.
   - رویداد `confirmation_required` حامل برآورد هزینه (`expected_cost`).
   - رویداد `job_dispatched` فقط حامل `job_id` و `tool_id` بدون URL امضاشده یا درصد پیشرفت.
   - رویداد پایانی `message_done` حامل ساختار نهایی `parts`.
3. **پایداری اتصال و بازپیوست:**
   - بافر مشترک رویدادها در Redis با پشتیبانی از `Last-Event-ID`.
   - ترتیب اتصال: اشتراک در رویدادها، سپس اسنپ‌شات وضعیت.
   - بستن اتصال یا تب مرورگر **تولید را لغو نمی‌کند**؛ پاسخ تا انتها در سرور کامل می‌شود.
4. **مدیریت خطای استریم:**
   - اعلام خطا با رویداد `message_failed` و کد دلیل AIP-193.
   - اعتبارسنجی قطعی Tool Call سمت سرور قبل از انتشار رویداد `tool_call`.
   - تجمیع فریم‌های توکن و Heartbeat دوره‌ای هر ۱۵ ثانیه.

---

### ۲.۳. پایپ‌لاین تشخیص نیت و شبیه‌ساز ماک مدل زبانی (مصوب OQ-058)
1. **ممنوعیت منطق جعلی در کد سرویس:**
   - `agent-service` فقط یک مسیر اجرایی دارد: اتصال به `model-router-service` با Function Calling. هیچ Parser قانون‌محور یا Mock پنهان در کد سرویس وجود ندارد.
2. **سرویس شبیه‌ساز مستقل در محیط Dev/Test (`lemmo-mock-llm`):**
   - در محیط‌های توسعه و تست، رجیستری Provider در `model-router-service` به کانتینر مجزای `lemmo-mock-llm` اشاره می‌کند که رفتاری قطعی (Deterministic) و برچسب‌دار (`X-Lemmo-Mock: true`) ارائه می‌دهد.
   - در محیط Production، داده این Provider اصلاً وجود ندارد و اشاره به آن موجب Fail-Fast در استارت‌آپ می‌شود.
3. **رفتار در قطعی یا غیاب LLM واقعی:**
   - در غیاب مدل‌های زبانی واقعی در پروداکشن: بازگرداندن خطای صریح ۵۰۳ (`LLM_UNAVAILABLE`) برای ورودی متن طبیعی بدون کسر کردیت.
   - کامندهای صریح (`/image ...`) و اجرای نودهای بوم به دلیل عدم وابستگی به LLM بدون اختلال به کار خود ادامه می‌دهند (Graceful Degradation).

---

### ۲.۴. نمایش کارت جاب در فرانت‌اند استودیو (مصوب OQ-059)
1. **اتصال مستقیم کلاینت به استریم جاب:**
   - ایجنت صرفاً شناسه `job_id` را در پیام درج می‌کند. کامپوننت چت فرانت‌اند (`AgentChatMessage.tsx`) با تابع استاندارد `sdk.jobs.subscribe(jobId)` به استریم زنده وضعیت در `job-service` متصل می‌شود.
2. **هوک مشترک `useJobStatus`:**
   - استخراج منطق دریافت وضعیت جاب به هوک مشترک در فرانت‌اند جهت استفاده مشترک در چت، پنل ابزارها و بوم بوم (جلوگیری از موازی‌کاری لاجیک UI).
3. **مدیریت سقف اتصالات مرورگر:**
   - باز شدن اتصال SSE فقط برای کارت‌های غیرپایانی که در Viewport کاربر هستند؛ بقیه کارت‌ها از استعلام یک‌باره `GET` استفاده می‌کنند.
   - بستن قطعی اتصال در Unmount کامپوننت، دریافت رویداد `job.terminal`، یا تغییر ورک‌اسپیس/سشن.

---

### ۲.۵. توپولوژی پورت‌ها، روت‌های Kong و ترتیب جایگزینی ماک (مصوب OQ-060)
1. **تخصیص رسمی پورت‌ها و کانتینر:**
   - نام کانتینر: `lemmo-svc-agent`
   - پورت HTTP اختصاصی: **`8096`**
   - پورت gRPC اختصاصی: **`50066`**
   - پایگاه داده اختصاصی: PostgreSQL **`lemmo_agent`**
2. **تفکیک دو روت در Kong Gateway:**
   - روت استریم: `/api/v1/chat/threads/[^/]+/messages/[^/]+/events` با `workspace-policy: none` و `response_buffering: false`.
   - روت‌های استاندارد: `/api/v1/chat` با `workspace-policy: required` و بافر معمولی.
3. **مراحل ایمن جایگزینی ماک (Zero-Downtime Cutover):**
   - استقرار `agent-service` کنار کانتینر ماک.
   - اجرای تست‌های انطباق قرارداد OpenAPI و آزمون‌های یکپارچگی زنده.
   - تغییر Upstream در `kong.yml` به `http://lemmo-svc-agent:8096`.
   - حذف ۱۰۰٪ کانتینر `lemmo-mock-chat` از `infra/compose/dev.yml` و پاک‌سازی کامل ارجاعات.

---

## ۳. پیامدها و الزامات فنی (Consequences)

### پیامدهای مثبت:
- رفع قطعی گره‌خوردگی استریم چت با اتصالات ناپایدار کلاینت و امکان ادامه گفتگو پس از رفرش صفحه.
- حفظ ۱۰۰٪ حریم خصوصی پرامپت‌های کاربران در سطح فضای کاری.
- سبک‌سازی سرور ایجنت و جلوگیری از بار مضاعف استریم جاب‌ها بر روی چت.
- حذف کامل ریسک Fallback بی‌صدا به منطق جعلی در محیط‌های عملیاتی.
- حذف آخرین ماک محصولی پلتفرم و پیشبرد استک به سمت آمادگی کامل سرور.

### اقدامات پیاده‌سازی مرحله 16B:
1. ایجاد پایگاه داده `lemmo_agent` و تدوین مایگریشن‌های اسکیما.
2. پیاده‌سازی سرویس `services/agent-service/` در Go بر مبنای Clean Architecture و DualServer (HTTP `8096` + gRPC `50066`).
3. پیاده‌سازی کانتینر شبیه‌ساز `lemmo-mock-llm` برای تست‌های محلی و CI.
4. به‌روزرسانی قرارداد OpenAPI چت به ساختار دوقلوی ارسال/استریم و آرایه `jobs[]`.
5. به‌روزرسانی روت‌های Kong، اتصال کلاینت استودیو و حذف کانتینر ماک `lemmo-mock-chat`.
