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
    ├── plugin-manifest.json← مانیفست رجیستری و قابلیت‌های هر پلاگین
    └── node-contract.json  ← مشخصات پورت‌های ورودی و خروجی نودهای سفارشی
```

---

## ۲. پاکت استاندارد رویدادها (Canonical Event Envelope)

کلیه رویدادهای غیرهمگام که در صف‌های پیام (Message Broker) تبادل می‌شوند، درون پاکت استاندارد `EventEnvelope` قرار می‌گیرند:

```protobuf
syntax = "proto3";

package platform.v1;

import "google/protobuf/timestamp.proto";
import "google/protobuf/any.proto";

message EventEnvelope {
  string event_id = 1;                     // شناسه یکتای رخداد (UUID v4)
  string event_type = 2;                   // نام رویداد (e.g. "lemmo.workflow.run_started")
  string aggregate_id = 3;                // شناسه شیء هدف (e.g. project_id یا job_id)
  string tenant_id = 4;                   // شناسه فضای کاری (workspace_id)
  google.protobuf.Timestamp occurred_at = 5;// زمان دقیق وقوع رخداد
  string producer = 6;                    // نام سرویس منتشرکننده (e.g. "orchestrator-service")
  string trace_id = 7;                    // شناسه تریس اوپن‌تلمتری جهت پایش توزیع‌شده
  int32 schema_version = 8;               // نسخه اسکیمای رویداد
  google.protobuf.Any payload = 9;        // بدنه اصلی پیام بر اساس نوع رویداد
}
```

### فهرست رویدادهای کلیدی فاز ۱ و ۲
- `WorkflowRunStarted` — آغاز اجرای یک ورک‌فلو توسط کاربر.
- `NodeExecutionCompleted` — پایان موفق پردازش یک نود منفرد در گراف.
- `JobQueued` / `JobFinished` / `JobFailed` — چرخه حیات کارهای سنگین مدل هوش مصنوعی.
- `UsageRecorded` — ثبت اتمیک مصرف کردیت یا توکن جهت اعمال در دفترکل حسابداری.
- `ProjectAccessRevoked` — سلب فوری دسترسی یک عضو به یک پروژه مشترک.

---

## ۳. اسکیماهای اعتبارسنجی JSON (`schemas/`)

برای بخش‌هایی از سیستم که ماهیت گراف پویا یا پلاگین‌های سوم‌شخص دارند و ساختار دقیق آن‌ها در کامپایل‌تایم با Protobuf قابل قفل شدن نیست، از **JSON Schema (Draft-07 / 2020-12)** استفاده می‌شود:

1. **طرح گراف پروژه (`project-graph.json`):**
   - تعیین آرایه نودها (`nodes`) و لبه‌های اتصال (`edges`).
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
