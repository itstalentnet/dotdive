| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Contracts, Schemas and Event Envelope Governance |
| **Title (FA)** | مدیریت قراردادها، اسکیماها و پاکت رویدادهای بک‌اند |
| **ID** | DOC-BE-003 |
| **Category** | `backend` |
| **Status** | `Approved` |
| **Owner** | Backend & Platform Team |
| **Last Updated** | 2026-09-26 |
| **Summary (EN)** | Specification for contracts/ directory, platform and lemmo protos, JSON schemas, event envelopes, and code generation. |
| **Summary (FA)** | معماری و قوانین حاکمیت پوشه contracts، پروتوباف‌های پلتفرم و لیمو، اسکیماهای JSON و ساختار رویدادها. |
| **Tags** | `backend`, `contracts`, `proto`, `events`, `schemas`, `envelope` |

---

# مدیریت قراردادها، اسکیماها و پاکت رویدادها (`contracts/`)

> **وضعیت پیاده‌سازی در کد (`api/`):**  
> تمامی قراردادهای پایه به صورت رسمی و کامپایل‌شده در دایرکتوری `api/contracts/` بر پایه Protobuf v3 مستقر هستند (شامل ۹ فایل قرارداد در بسته‌های `platform/v1/` و `lemmo/v1/`). قراردادها به صورت منظم با کامپایلر `buf` بیلد شده و تایپ‌های کلاینت در `@lemmo/sdk` تولید می‌شوند.

پوشه **`contracts/`** در مونوریپوی بک‌اند، **منبع یگانه حقیقت (SSOT)** برای تمامی تعاریف API، بایندینگ‌های کلاینت، رویدادهای منتشرشده و اسکیماهای اعتبارسنجی داده است. هیچ سرویسی بدون اتکا به تعاریف رسمی این بخش مجاز به تبادل اطلاعات با سایر بخش‌های سیستم نیست.

---

## ۱. ساختار دسته‌بندی قراردادها

```text
contracts/
├── platform/               ← تعاریف زیرساختی و مشترک با پلتفرم nons
│   ├── envelope.proto      ← ساختار عمومی و هدرهای استاندارد رویدادها
│   ├── errors.proto        ← کدهای خطای سراسری و تعاریف AIP-193 Status
│   ├── permissions.proto   ← تعاریف مجوزها و اکشن‌های RBAC
│   └── registry.proto      ← شناسه سرویس‌ها و قراردادهای رجیستری
│
├── lemmo/                  ← قراردادهای اختصاصی سرویس‌ها و رویدادهای Lemmo
│   ├── v1/
│   │   ├── project.proto   ← متدهای دستکاری و بازیابی گراف پروژه
│   │   ├── workflow.proto  ← اجرای مرحله‌ای گراف و ارسال جاب
│   │   ├── node.proto      ← قراردادهای انواع نودها و تایپ پورت‌ها
│   │   ├── usage.proto     ← ثبت مصرف منابع و سهمیه‌ها
│   │   └── events.proto    ← رویدادهای دامنه لیمو (Domain Events)
│
└── schemas/                ← تعاریف JSON Schema برای ساختارهای داده آزاد و پویا
    ├── project-graph.json  ← اعتبارسنجی ساختار JSON گراف نودها و ارتباطات
    └── plugin-manifest.json← مانیفست رجیستری و قابلیت‌های هر پلاگین
```

---

## ۲. رجیستری متمرکز و پاکت استاندارد رویدادها (Central Event Registry & EventEnvelope - F4)

کلیه رویدادهای غیرهمگام در صف‌های پیام RabbitMQ درون ساختار استاندارد `EventEnvelope` قرار می‌گیرند.

### ۲.۱. قوانین نام‌گذاری و رجیستری رویدادها (F4 Invariant)
1. **الگوی نام‌گذاری سه‌بخشی نسخه‌دار:** کلیه نام‌ها از الگوی `<domain>.<entity>.<past_action>.v<version>` تبعیت می‌کنند (مانند `provider.call.completed.v1`).
2. **معماری اکسچنج‌ها در RabbitMQ:** به ازای هر `<domain>` دقیقاً یک Topic Exchange ایجاد می‌شود و `Routing Key` دقیقاً برابر با نام کامل رویداد است.
3. **ممنوعیت تاپیک‌های Ad-hoc و لینت در CI:** هیچ رویدادی بدون ثبت رسمی پی‌لود در `contracts/` اجازه انتشار ندارد و فرآیند CI رویدادها را لینت و اعتبارسنجی می‌کند.

```protobuf
syntax = "proto3";

package platform.v1;

import "google/protobuf/timestamp.proto";
import "google/protobuf/any.proto";

message EventEnvelope {
  string event_id = 1;                     // شناسه یکتای رخداد (UUID v4)
  string event_type = 2;                   // نام رویداد طبق رجیستری (e.g. "provider.call.completed.v1")
  string aggregate_id = 3;                // شناسه شیء هدف (e.g. project_id یا job_id)
  string tenant_id = 4;                   // شناسه فضای کاری (workspace_id)
  google.protobuf.Timestamp occurred_at = 5;// زمان دقیق وقوع رخداد
  string producer = 6;                    // نام سرویس منتشرکننده (e.g. "image-service")
  string trace_id = 7;                    // شناسه تریس جهت پایش توزیع‌شده
  int32 schema_version = 8;               // نسخه اسکیمای رویداد
  google.protobuf.Any payload = 9;        // بدنه تایپ‌سیف پیام بر اساس نوع رویداد
}
```

### ۲.۲. کاتالوگ جامع رویدادهای مصوب پلتفرم

| نام رویداد | دامنه | سرویس تولیدکننده | پی‌لود و هدف رویداد |
|---|---|---|---|
| `provider.call.completed.v1` | `provider` | `image-service` / `model-router` | **(قلاب ۳ MVP)** ثبت شناسه اینستنس، مدل، هزینه دلاری `actual_cost_micros` و لتنسی |
| `credit.ledger.entry_created.v1` | `credit` | `usage-service` / `quota-service` | ثبت تراکنش جدید در دفترکل با `entry_id`، فیلد `type` و مانده باکت |
| `entitlement.grant.expired.v1` | `entitlement`| `iam-service` / `quota-service` | انقضای یک سهمیه فضا یا کردیت و فعال‌سازی وضعیت `over_quota` یا grace period |
| `generation.job.fallback_applied.v1`| `generation` | `model-router-service` | اعمال فالبک ۳ سطحی با ثبت مدل درخواستی و مدل واقعی جهت ممیزی |
| `provider.instance.circuit_opened.v1`| `provider` | `model-router-service` | باز شدن مدار شکن یک پراویدر پس از خطاهای متوالی ۴۲۹ یا ۵۰۳ |
| `asset.file.created.v1` | `asset` | `storage-service` | ایجاد فایل مدیا جدید با `asset_id`، `object_key` و حجم بایت‌ها |
| `asset.file.deleted.v1` | `asset` | `storage-service` | حذف فایل مدیا در راستای سیاست Retention یا اقدام کاربر |
| `workflow.run.started.v1` | `workflow` | `orchestrator-service` | شروع پردازش DAG پس از رزرو موفق کردیت |
| `workflow.run.completed.v1` | `workflow` | `orchestrator-service` | پایان موفق کل ورک‌فلو و آزادسازی منابع |
| `node.execution.completed.v1` | `workflow` | `orchestrator-service` | پایان موفق یک نود در بوم و آماده‌سازی داده برای نودهای بعدی |
| `user.erasure.requested.v1` | `user` | `iam-service` | آغاز فرآیند ناهمگام حذف کامل اطلاعات کاربر طبق الزامات GDPR (فاز ۳) |

---

## ۳. استانداردهای قرارداد نودها و اسکیماهای JSON

### ۱. قراردادهای نودها و پورت‌ها (Protobuf — مصوب طبق [ADR-007](../../01-architecture/decisions/ADR-007-backend-contracts-and-tooling-standards.md) و [DOC-MOD-001](../06-modules/canvas-modes.md))
- کلیه تعاریف نودها، پورت‌های ورودی و خروجی و ارتباطات گراف در بک‌اند **انحصاداً بر پایه Protobuf** در فایل `contracts/lemmo/v1/node.proto` تعریف می‌شوند.
- **معماری دوحالته بوم (`CanvasMode`):** تفکیک صریح حالت طراحی وکتور (`CANVAS_MODE_DESIGN` - رایگان) از حالت اجرای هوش مصنوعی (`CANVAS_MODE_WORKFLOW` - پردازشی) در سطح مدل قراردادها.
- **اصل پورت‌های پویا و عدم هاردکد کردن (Dynamic & Extensible Ports):** هیچ پورتی در سیستم هاردکد نمی‌شود. نودهای پرامپت متغیرهای پویا (`var:xxx`) را به عنوان پورت ورودی باز می‌کنند، و نودهای تصویر پورت‌های چندگانه و افزایشی LoRA (`PORT_DATA_TYPE_LORA`)، تصاویر رفرنس و پرامپت منفی را به صورت داینامیک پشتیبانی می‌نمایند. نمونه‌های نود روی بوم فیلد `dynamic_ports` را برای ذخیره‌سازی این اتصالات نگه می‌دارند.
- **منسوخ شدن JSON Schema برای نودها:** استفاده از JSON Schema برای مشخصات نود منسوخ شده و به نفع Protobuf (`contracts/lemmo/v1/node.proto`) کنار گذاشته شده است.
- فرمت قراردادها در سراسر بک‌اند کاملاً یکپارچه و استاندارد است.
- فرانت‌اند استودیو تایپ‌های مورد نیاز رابط کاربری خود را مستقیماً از طریق کامپایلر `buf generate` و پکیج `@/sdk` دریافت کرده و تعاریف دستی و موازی قبلی در فرانت‌اند حذف می‌گردند.

### ۲. اسکیماهای اعتبارسنجی JSON (`schemas/`)
برای بخش‌هایی از سیستم که ماهیت داده‌های آزاد و پلاگین‌های سوم‌شخص دارند و ساختار دقیق آن‌ها در کامپایل‌تایم با Protobuf قابل قفل شدن نیست، از **JSON Schema (Draft-07 / 2020-12)** استفاده می‌شود:

1. **طرح گراف پروژه (`project-graph.json`):**
   - تعیین آرایه نودها (`nodes`) و لبه‌های اتصال (`edges`).
   - پشتیبانی از پورت‌های داینامیک و لایه‌های طراحی حالت Design Mode.
   - کنترل نوع پورت‌ها (سازگاری تایپ تصویر، ماسک، متن و عدد بین دو نود متصل).
2. **مانیفست پلاگین (`plugin-manifest.json`):**
   - شناسه و نسخه پلاگین، نیازمندی‌های منابع سخت‌افزاری (سقف رم و دسترسی GPU).
   - اعلام قابلیت‌ها (Capabilities) و پرمیشن‌های مورد نیاز.

---

## ۴. قوانین تولید کد و تغییرات نسخه‌بندی

1. **ممنوعیت ویرایش دستی بایندینگ‌ها:**  
   کدهای درون پوشه `packages/` (بایندینگ‌های تایپ‌اسکریپت، رویدادها، SDKها) و بایندینگ‌های پایتون مستقیماً توسط اسکریپت‌های کامپایلر `buf generate` تولید می‌شوند. هرگونه ویرایش دستی در این پکیج‌ها تخلف حاکمیتی محسوب شده و در فرآیند بیلد لغو می‌گردد.
2. **قانون تغییرات ناسازگار (Breaking Changes):**  
   - تغییر ناسازگار (مانند حذف فیلد یا تغییر نوع داده) در فایل‌های موجود **اکیداً ممنوع** است.
   - هرگونه تغییر ناسازگار باید با ایجاد نسخه جدید پکیج (مانند ایجاد مسیر `v2/`) صورت گیرد تا کلاینت‌ها و ورکرها دچار اختلال نشوند.
   - دستور `buf breaking --against '.git#branch=main'` در پایپ‌لاین CI از ادغام هرگونه تغییر مخرب جلوگیری می‌کند.
3. **پشتیبانی چندزبانه ورکرها:**  
   ورکرهای پردازش سنگین هوش مصنوعی در صورت نیاز به زبان پایتون (PyTorch / Diffusers) از همین فایل‌های Proto تغذیه کرده و پکیج کلاینت استاندارد پایتونی دریافت می‌کنند.
