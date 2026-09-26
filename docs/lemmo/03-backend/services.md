| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Microservices Catalog & Phased Delivery Roadmap |
| **Title (FA)** | شناسنامه میکروسرویس‌ها و نقشه فازبندی تحویل بک‌اند |
| **ID** | DOC-BE-002 |
| **Category** | `backend` |
| **Status** | `Approved` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-26 |
| **Summary (EN)** | Complete breakdown of nons reused services, Lemmo specific microservices, service anatomy, and phased delivery roadmap. |
| **Summary (FA)** | فهرست کامل سرویس‌های اشتراکی، میکروسرویس‌های اختصاصی Lemmo، ساختار داخلی هر سرویس و نقشه فازبندی. |
| **Tags** | `backend`, `services`, `catalog`, `roadmap`, `microservices` |

---

# شناسنامه میکروسرویس‌ها و نقشه فازبندی تحویل (`services/`)

> ⚠️ **وضعیت پیاده‌سازی در کد (`api/`):**  
> وضعیت معماری این سند `Approved` است و بر پایه تصمیمات مصوب [ADR-004](../01-architecture/decisions/adr-004-backend-microservices.md) و [ADR-007](../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) تدوین شده است. در راستای متدولوژی **Contract-First & Spine-First**، کلیه ۹ سرویس مسیر حیاتی فاز ۱ با ساختار استاندارد لایه‌ای Clean Architecture، فایل شناسنامه `service.md` و الگوهای مایگریشن در پوشه `services/` اسکافولد شده‌اند. همچنین پیاده‌سازی عملیاتی استاب اینترفیس هسته `QuotaChecker` در `orchestrator-service` و میدل‌ور `MockAuthMiddleware` در پکیج `core/` مستقر گردیده است. تکمیل منطق تجاری داخلی و تست‌های یکپارچگی گام‌به‌گام مطابق نقشه راه ([DOC-BE-005](./roadmap.md)) انجام خواهد شد.

این سند کاتالوگ جامع کلیه سرویس‌های فعال و رزروشده در مونوریپوی بک‌اند (`lemmo-api`) را به همراه ساختار داخلی استاندارد و زمان‌بندی پیاده‌سازی فازها تشریح می‌کند.

---

## ۱. سرویس‌های مشترک و بازاستفاده از پلتفرم Nons

به منظور کاهش چشمگیر زمان توسعه و بهره‌برداری از مؤلفه‌های استاندارد اثبات‌شده، سرویس‌های پایه‌ای هویت و زیرساخت از پلتفرم **nons** با حداقل تغییرات بازاستفاده می‌شوند:

| نام سرویس | نقش و مسئولیت در پلتفرم Lemmo | وضعیت |
| :--- | :--- | :--- |
| **`auth-service` (Ory Kratos)** | مدیریت ثبت‌نام، ورود با کد یکبارمصرف (OTP)، مدیریت نشست‌ها (Session) و SSO | اسکلت `service.md` آماده / بازاستفاده |
| **`iam-service` (Ory Keto)** | موتور ماتریس نقش‌ها و مجوزها (مالک، ویرایشگر، بیننده و مجری روی پروژه‌ها) | اسکلت `service.md` آماده / بازاستفاده |
| **`user-service`** | نمایه و اطلاعات هویتی کاربر (شماره تلفن، نام نمایشی، وضعیت تایید) | اسکلت `service.md` آماده / بازاستفاده |
| **`token-service` (Ory Hydra)** | مدیریت توکن‌های امنیتی OAuth2 و OIDC، اعطای کلیدهای API سازمانی جهت اجرای خارجی ورک‌فلوها | اسکلت `service.md` آماده / بازاستفاده |
| **`notification-service`** | ارسال اعلان‌های سیستمی (پایان پردازش تصویر/ویدیو، دعوت به تیم، هشدار پایان اعتبار) | اسکلت `service.md` آماده / بازاستفاده |
| **`storage-service`** | مدیریت فایل‌های ورودی کاربر، خروجی‌های تولیدشده، لینک‌های امضاشده (S3/MinIO) و توزیع CDN | اسکلت `service.md` آماده / بازاستفاده |
| **`login-consent-app`** | رابط واسط میان Kratos و Hydra جهت اخذ تاییدیه ورود و دامنه دسترسی کاربران | آماده / بازاستفاده |

### مسیر گام‌به‌گام گذار به سیستم احراز هویت واقعی (Kratos Transition Roadmap)
1. **فاز ۰ (ستون فقرات محلی):** توسعه محلی بک‌اند و فرانت‌اند با میدل‌ور موک (`MockAuthMiddleware`) و داده‌های ساختگی انجام می‌شود تا وابستگی به سرویس‌های هویت مانع پیشرفت نشود.
2. **فاز ۱ (Milestone Gate 1 & 2):** با راه‌اندازی `project-service` و `orchestrator-service`، فرانت‌اند با تنظیم `NEXT_PUBLIC_API_MODE=live` مستقیماً به نشست‌های Kratos متصل می‌شود؛ کوکی‌های Session کلاینت از طریق متد `/sessions/whoami` در Kratos اعتبارسنجی شده و شناسه کاربری در کانتکست تزریق می‌گردد.
3. **فاز ۲ و ۳ (Milestone Gate 4 به بعد):** اتصال کلاینت‌های بیرونی و CLI از طریق Ory Hydra (`token-service`) و توکن‌های OAuth2/OIDC پیاده‌سازی می‌گردد.

---

## ۲. سرویس‌های اختصاصی اکوسیستم Lemmo

سرویس‌های تجاری زیر به‌طور اختصاصی برای موتور پردازش گراف و تولید هوش مصنوعی Lemmo طراحی شده و در فازهای زمان‌بندی‌شده مستقر می‌شوند:

| نام سرویس | مسئولیت و وظیفه اصلی | فاز تحویل | وضعیت پیاده‌سازی در مخزن |
| :--- | :--- | :---: | :---: |
| **`project-service`** | نگهداری و مدیریت JSON مرجع پروژه‌ها (نودها، اتصالات، متادیتا، کلون رمزشده) | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`workspace-service`** | مدیریت فضاهای کاری چندمستأجری، تیم‌ها، سطوح دسترسی و دعوت اعضا | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`orchestrator-service`** | تفسیر گراف جریان کار (DAG Execution) و هدایت ترتیبی نودها (اینترفیس سهمیه `QuotaChecker` مصوب طبق [ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md)) | فاز ۱ | پیاده‌سازی فعال هسته (`Core Stub Active`) |
| **`node-registry-service`** | ثبت و اعتبارسنجی اسکیما و قرارداد نودها (فرمت Protobuf مصوب طبق [ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md)) | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`job-service`** | صف‌بندی کارهای سنگین هوش مصنوعی، اولویت‌بندی، تلاش مجدد (Retry) و وضعیت زنده | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`model-router-service`** | مسیریابی هوشمند پرامپت‌ها به ارائه‌دهندگان مختلف هوش مصنوعی بر اساس هزینه و سرعت | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`image-service`** | ارتباط با مدل‌های مولد تصویر (Stable Diffusion، ComfyUI و مدل‌های اختصاصی GPU) | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`usage-service`** | ثبت اتمیک و قطعی میزان مصرف واقعی منابع و محاسبه هزینه‌های مصرف‌شده | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`quota-service`** | اعتبارسنجی سقف مجاز و رزرو اعتبار پیش از اجرا (اتصال به `QuotaChecker` ارکستریتور مصوب طبق [ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md)) | فاز ۱ | ساختار لایه‌ای و `service.md` آماده (`Scaffolded`) |
| **`version-service`** | نسخه‌بندی تاریخچه تغییرات گراف پروژه، مقایسه نسخه‌ها (Diff) و بازگردانی | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`collaboration-service`** | همگام‌سازی لحظه‌ای بوم و نمایش نشانگر اعضای آنلاین از طریق WebSocket | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`video-service`** | تولید، تغییر فریم و تدوین ویدیو با مدل‌های تولید ویدیوی هوش مصنوعی | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`media-service`** | بهینه‌سازی مدیا، فشرده‌سازی، تغییر فرمت، تولید بندانگشتی و افزودن واترمارک | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`prompt-service`** | کتابخانه پرامپت‌ها، قالب‌های مهندسی پرامپت و پیشنهادهای هوشمند | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`subscription-service`** | پلن‌های ماهانه/سالانه، بسته‌های اعتبار اشتراکی، ارتقا و تنزل بسته‌ها | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`billing-service`** | صدور فاکتور و درگاه پرداخت آنلاین ریالی و ارزی (اتصال به والت nons) | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`audit-service`** | ثبت ماندگار و تغییرناپذیر لاگ رخدادهای حساس و تغییرات دسترسی تیم | فاز ۲ | در صف توسعه (`Planned - Phase 2`) |
| **`publish-service`** | انتشار نسخه‌های ثابت ورک‌فلوها به شکل REST Endpoint جهت مصرف خارجی | فاز ۳ | در صف توسعه (`Planned - Phase 3`) |
| **`plugin-registry-service`**| رجیستری مرکزی، اعتبارسنجی مانیفست و فهرست‌نویسی پلاگین‌های رسمی و ثالث | فاز ۳ | در صف توسعه (`Planned - Phase 3`) |
| **`plugin-runtime-service`** | اجرای ایزوله و سندباکس پلاگین‌ها با محدودیت سقف پردازنده و رم | فاز ۳ | در صف توسعه (`Planned - Phase 3`) |
| **`integration-service`** | مدیریت Webhookها و اتصال با پلتفرم‌های بیرونی (Shopify، Discord و ...) | فاز ۳ | در صف توسعه (`Planned - Phase 3`) |
| **`audio-service`** | تولید صوت، گویندگی هوش مصنوعی (TTS) و تولید موسیقی متناسب | فاز ۴ | در صف توسعه (`Planned - Phase 4`) |

---

## ۳. مؤلفه‌هایی که سرویس مستقل نیستند و کتابخانه‌های هسته (`core/`)

برخی اجزا نباید به صورت سرویس جداگانه ساخته شوند و جایگاه آن‌ها در پوشه‌های هسته (`core/`) یا زیرساخت (`infra/`) است:
- **Event Bus / Message Broker:** زیرساخت است (`infra/messaging`)، نه سرویس بیزینسی.
- **Observability:** سیستم متریک و تریس در `infra/observability` و میدل‌ورهای `core/` تعبیه می‌شود.
- **Secrets Management:** توسط Vault / External Secrets در سطح زیرساخت مدیریت می‌گردد.
- **Contract Generator:** اسکریپت‌های تبدیل در پوشه `contracts/` قرار دارند، نه یک سرویس اجرایی.
- **Project Clone:** کلون‌های پروژه به عنوان نمای اختصاصی هر عضو در همان `project-service` باقی می‌مانند.

### ۱. مشخصات میدل‌ور موک احراز هویت (`core/middleware/MockAuthMiddleware`)
برای محیط توسعه محلی و تست‌های یکپارچگی مستقل از Ory Kratos:
- **هدرهای ورودی پشتیبانی‌شده:**
  - `X-Mock-User-ID`: شناسه کاربر در کانتکست (در صورت عدم ارسال: مقدار پیش‌فرض `"mock-user-dev"`).
  - `X-Mock-Tenant-ID`: شناسه فضای کاری جاری (پیش‌فرض: `"mock-tenant-default"`).
  - `X-Mock-Roles`: نقش‌های کاربر به صورت کاما-جدا (پیش‌فرض: `"workspace:owner,admin"`).
- **قانون امنیتی غیرفعال‌سازی در پروداکشن:** این میدل‌ور فقط در صورتی اجازه اجرا دارد که متغیر محیطی `LEMMA_ENV=development` یا `APP_ENV=development` باشد. در محیط‌های `production`، بارگذاری یا فراخوانی این میدل‌ور بلافاصله با خطای مهلک (Panic) مانع از بالا آمدن سرویس می‌شود.

### ۲. مشخصات اینترفیس سهمیه در ارکستریتور (`orchestrator-service/domain/QuotaChecker`)
ارکستریتور برای بررسی اعتبار پیش از آغاز اجرای گره‌های سنگین DAG از اینترفیس انتزاعی زیر در لایه Domain خود استفاده می‌کند:

```go
package domain

import "context"

// QuotaChecker checks credit/token sufficiency before DAG execution.
type QuotaChecker interface {
    CheckQuota(ctx context.Context, tenantID string, estimatedCost int64) error
}
```
- **پیاده‌سازی فاز ۰ و ۱:** یک پیاده‌سازی خنثی (`NoopQuotaChecker`) که بدون مسدودسازی اجازه پیشروی می‌دهد.
- **پیاده‌سازی نهایی فاز ۱:** پیاده‌سازی کلاینت gRPC متصل به `quota-service` جهت رزرو اتمیک اعتبار.

---

## ۴. ساختار داخلی استاندارد هر سرویس

کلیه سرویس‌های موجود در پوشه `services/` ملزم به رعایت ساختار تمیز و لایه‌ای یکسان هستند:

```text
services/<service-name>/
├── cmd/                     ← نقطه ورود برنامه و تابع main (فقط راه‌اندازی و تزریق وابستگی)
├── api/                     ← فایل‌های Proto یا OpenAPI مربوط به همین سرویس
├── internal/                ← منطق محافظت‌شده سرویس (غیرقابل ایمپورت توسط دیگران)
│   ├── domain/              ← موجودیت‌ها (Entities) و قواعد کسب‌وکار خالص (بدون وابستگی)
│   ├── app/                 ← سناریوهای کاربردی (Use Cases) و هماهنگ‌کننده منطق
│   ├── ports/               ← اینترفیس‌های ورودی (API/gRPC) و خروجی (Database/Broker)
│   └── adapters/            ← پیاده‌سازی عینی دیتابیس، کلاینت صف و کالک‌های بیرونی
├── migrations/              ← فایل‌های مایگریشن اختصاصی دیتابیس همین سرویس (000001_...)
├── test/                    ← آزمون‌های یکپارچگی (Integration Tests)
├── Dockerfile               ← دستورالعمل بیلد ایمیج سبک کانتینر
└── service.md               ← شناسنامه مستند سرویس (مسئولیت‌ها، قراردادها و وابستگی‌ها)
```

> **الزام فایل `service.md` و تولید خودکار با CLI:**  
> پیش از نوشتن کدهای هر سرویس، فایل `service.md` باید در ریشه پوشه همان سرویس ایجاد شده و مسئولیت دقیق، رویدادهای تولیدی و جدول تعاملات آن مستند شود. تولید خودکار این ساختار لایه‌ای و فایل `service.md` توسط باینری رسمی اسکافولدر Go در `tools/lemmo-cli` (مصوب طبق [ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) و [ADR-008](../../01-architecture/decisions/ADR-008-internal-tooling-and-versioning-governance.md)) انجام می‌شود.

---

## ۵. نقشه فازبندی پیاده‌سازی و راه‌اندازی (Implementation Roadmap)

```mermaid
flowchart TD
    P0["فاز ۰: اسکلت اولیه<br/>(Contracts, Core, Infra Gateway, Service Stubs)"] --> P1["فاز ۱: مسیر حیاتی تولید AI<br/>(Project, Orchestrator, Job, Image, Usage, Quota)"]
    P1 --> P2["فاز ۲: همکاری تیمی و تجاری<br/>(Workspace, Version, Collaboration, Video, Billing)"]
    P2 --> P3["فاز ۳: باز شدن روی بستر اکوسیستم<br/>(Publish Endpoints, Plugin Registry, Runtime, SDKs)"]
    P3 --> P4["فاز ۴: توسعه پیشرفته<br/>(Audio Generation, Advanced Analytics, Semantic Search)"]
```

### فاز ۰ — استقرار فونداسیون
- پیاده‌سازی قراردادهای پایه در `contracts/platform/` و تنظیمات کامپایل Proto با `buf`.
- توسعه هسته مشترک `core/` (بوت‌استرپ سرور، متغیرهای پیکربندی، لاگر و میدل‌ورها).
- راه‌اندازی درگاه اولیه ورودی `infra/gateway` و ایجاد اسکلت پوشه‌های سرویس‌ها با `service.md`.

### فاز ۱ — مسیر اصلی (MVP ساخت و اجرای یک جریان کار)
- اتصال سرویس‌های هویتی بازاستفاده از nons (`auth`, `token`, `user`, `IAM`).
- پیاده‌سازی زنجیره اصلی: `project-service` ← `node-registry-service` ← `orchestrator-service` ← `job-service` ← `model-router-service` + `image-service` ← `storage-service` ← `quota-service` + `usage-service`.
- نتیجه فاز ۱: کاربر وارد سیستم می‌شود، پروژه‌ای می‌سازد، گراف نودها اجرا شده و تصویر هوش مصنوعی تولید و ذخیره می‌گردد و اعتبار کاربر ثبت می‌شود.

### فاز ۲ — همکاری، تاریخچه و مدل درآمدی
- استقرار `workspace-service` جهت تشکیل تیم و مدیریت دسترسی‌های مشترک.
- پیاده‌سازی `collaboration-service` (همگام‌سازی سوکت) و `version-service` (تاریخچه).
- اضافه شدن `video-service` و `media-service` جهت پردازش ویدیویی.
- استقرار سیستم مالی و سهمیه: `subscription-service` و `billing-service`.

### فاز ۳ — باز شدن به دنیای بیرون و پلاگین‌ها
- استقرار `publish-service` جهت اکسپورت ورک‌فلوها به عنوان وب‌هوک و API قابل فراخوانی.
- راه‌اندازی اکوسیستم پلاگین: `plugin-registry-service` و سندباکس امنیتی `plugin-runtime-service`.
- انتشار بسته‌های بیرونی `plugin-sdk` و `embed-sdk` برای توسعه‌دهندگان مستقل.

### فاز ۴ — قابلیت‌های پیشرفته
- پیاده‌سازی موتور پردازش و تولید صوت (`audio-service`).
- جستجوی پیشرفته برداری روی پروژه‌ها و پایش بلادرنگ هوشمند (Analytics).
