---
layout: doc
title: معماری هسته اصلی
description: معماری، ساختار ماژول‌ها، روابط و قوانین فنی سرویس Core به عنوان کنترل‌کننده پلتفرم
version: 1.0.0
status: PUBLIC
author: xoxxel
owner: xoxxel
created_at: 2026-06-11
updated_at: 2026-06-13
tags:
  - Architecture
  - Core
  - Platform
reviewers:
  - backend team
  - platform team 
---

# معماری هسته اصلی

**Core Architecture**

> **خلاصه:** این سند ساختار معماری، وظایف ماژول‌ها، وابستگی‌ها و قوانین فنی سرویس Core رو توضیح می‌ده.

---

## ارجاعات مرتبط

**Related Documents**

- [بلوپرینت هسته اصلی](./blueprint)
- [تصمیم معماری ۱: انتخاب Go](./ADR/ADR-Core-001)
- [تصمیم معماری ۲: Core به عنوان Platform Control Plane](./ADR/ADR-Core-002)

---

## فهرست محتوا

**Table of Contents**

1. [هدف](#هدف)
2. [جایگاه در معماری](#جایگاه-در-معماری)
3. [ساختار پیشنهادی](#ساختار-پیشنهادی)
4. [معرفی ماژول‌ها](#معرفی-ماژول‌ها)
5. [قابلیت مشاهده‌پذیری](#قابلیت-مشاهده‌پذیری)
6. [ذخیره‌سازی و ارتباطات](#ذخیره‌سازی-و-ارتباطات)
7. [قوانین وابستگی‌ها](#قوانین-وابستگی‌ها)
8. [قوانین معماری و معیار موفقیت](#قوانین-معماری-و-معیار-موفقیت)

---

## هدف

**Objective**

سرویس Core یه سرویس زیرساختی هستش که سلامت کل اکوسیستم سرویس‌ها، ثبت وقایع و اعتبارسنجی فنی رویدادها رو مدیریت می‌کنه. یادت باشه که Core هیچ وقت تصمیم‌گیرنده کسب‌وکار (بیزنس) نیست.

---

## جایگاه در معماری

**Position in Architecture**

```text
Frontend
    │
    ▼
API Gateway
    │
    ▼
Business Services
    │
    ▼
NATS
    │
    ▼
Core
```

> [!IMPORTANT]
> سرویس Core اصلاً در مسیر مستقیم درخواست‌های کاربرا قرار نداره و هیچ درخواست HTTP از سمت کاربرا مستقیماً به سمت Core فرستاده نمی‌شه.

---

## ساختار پیشنهادی

**Proposed Structure**

ساختار دایرکتوری‌های پروژه Core به شکل زیر پیشنهاد می‌شه:

```text
core/
├── cmd/
│   └── main.go
├── internal/
│   ├── audit/
│   ├── registry/
│   ├── validation/
│   ├── health/
│   ├── lifecycle/
│   ├── eventrouter/
│   ├── storage/
│   ├── telemetry/
│   └── shared/
├── configs/
├── migrations/
├── go.mod
└── Dockerfile
```

---

## معرفی ماژول‌ها

**Modules Overview**

### ماژول Audit

**Audit Module**

وظایف و اهداف این ماژول عبارتند از:

- ثبت غیرقابل تغییر رویدادهای سیستم
- نگهداری تاریخچه کامل پلتفرم
- رهگیری رخدادها (Tracking / Traceability)
- بررسی و بازبینی رویدادها (Event Review)
- تحلیل وقایع و رفتار سیستم (Analysis)
- انطباق با قوانین و استانداردهای پلتفرم (Compliance)

**خروجی:**

- جدول `audit_logs` در دیتابیس.

### ماژول Validation

**Validation Module**

وظایف این ماژول شامل موارد زیر می‌شه:

- اعتبارسنجی Envelope رویدادها مطابق فایل [envelope.proto](file:///C:/Users/ASUS/Documents/GitHub/nons/nons-api/contracts/envelope.proto)
- اعتبارسنجی فراداده‌های فنی (Metadata)

فیلدهای فنی اجباری که باید اعتبارسنجی بشن (تعریف‌شده در `envelope.proto`):

- `id`
- `subject`
- `version`
- `timestamp`
- `source`
- `trace_id`

> [!TIP]
> سرویس Core از بایندینگ‌های Go که از روی فایل‌های Proto تولید شدن واسه اعتبارسنجی استفاده می‌کنه و نیازی نیست این ساختارها رو به صورت دستی تعریف کنیم.

> [!CAUTION]
> اعتبارسنجی ساختار داده‌های دامنه‌ای و تجاری (Business Payload Validation) در سطح سرویس Core اکیداً ممنوع هستش.

### ماژول Registry

**Registry Module**

وظایف اصلی:

- ثبت سرویس‌ها
- ثبت نسخه (Version) سرویس‌ها
- ثبت آخرین Heartbeat دریافتی از اون‌ها

نمونه سرویس‌هایی که توی این رجیستری ثبت می‌شن:

- `auth-service`
- `marketplace-service`
- `wallet-service`
- `payment-service`

### ماژول Health

**Health Module**

وظایف این ماژول به شرح زیر هستش:

- تعیین وضعیت سلامت سرویس‌ها بر اساس دریافت Heartbeat در بازه زمانی مجاز
- تشخیص از دسترس خارج شدن (Down) سرویس‌ها

وضعیت‌های سلامت معتبر (Valid States):

- **UP**: دریافت موفق Heartbeat در بازه زمانی مجاز.
- **DEGRADED**: مشاهده تاخیر غیرعادی در ارسال Heartbeat.
- **DOWN**: عدم دریافت Heartbeat پس از گذشت مهلت معین.

#### پایش وضعیت و نقاط توسعه

**Health Monitoring & Extension Point**

- **نگهداری وضعیت سلامت:** Core صرفاً وضعیت سلامت سرویس‌ها رو نگهداری می‌کنه.
- **محدوده MVP:** سرویس Core در نسخه MVP هیچ‌گونه مسئولیت عملیاتی مثل ارسال هشدار (Alerting) یا اتوماسیون جریان‌های کاری (Workflow Automation) در زمان تغییر وضعیت‌ها نداره.
- **رویدادهای آتی:** رویداد `platform.service.status_changed` به عنوان یه نقطه توسعه (Extension Point) برای انتشار وضعیت‌های جدید رزرو شده تا در فازهای بعدی بدون تغییر در هسته اصلی، توسط سیستم‌های بیرونی مصرف بشه.

### ماژول Platform Governance

**Platform Governance**

وظیفه این ماژول کنترل و اطمینان از انطباق فنی سرویس‌ها با استانداردهای کلان پلتفرم هست.

قراردادهای فنی هدف جهت اعمال حاکمیت:

- **Event Contract**: فرمت و ساختار پیام‌ها در رویدادها (تعریف‌شده در `envelope.proto`).
- **Logging Contract**: انطباق با قالب لاگ‌های سیستم (تعریف‌شده در `packages/logging`).
- **Metadata Contract**: انطباق اطلاعات هدر و فراداده‌های پلتفرم (تعریف‌شده در Proto).

### ماژول Event Router

**Event Router Module**

وظایف اصلی:

- دریافت رویدادها از NATS
- ارسال به بخش Audit
- ارسال به بخش Validator

> [!IMPORTANT]
> این ماژول نقش Orchestrator یا هماهنگ‌کننده رو نداره و صرفاً هدایت‌کننده فنی پیام‌هاست.

---

## قابلیت مشاهده‌پذیری

**Observability**

سرویس Core باید اطلاعات زیر رو جهت مانیتورینگ منتشر کنه:

### متریک‌ها

**Metrics**

| متریک                       | توضیح                         |
| :-------------------------- | :---------------------------- |
| `received_events_total`     | تعداد کل رویدادهای دریافت‌شده |
| `validated_events_total`    | تعداد رویدادهای معتبر         |
| `invalid_events_total`      | تعداد رویدادهای نامعتبر       |
| `audit_writes_total`        | تعداد دفعات ثبت در بخش Audit  |
| `registered_services_total` | تعداد کل سرویس‌های ثبت‌شده    |
| `service_health_status`     | وضعیت سلامت لحظه‌ای سرویس‌ها  |

### ردیابی

**Tracing**

ردیابی توزیع‌شده (Distributed Tracing) باید برای این موارد فعال باشه:

- Event Processing
- Validation
- Audit Persistence

### لاگ‌نویسی

**Logging**

- تمام لاگ‌ها باید به صورت Structured JSON Logs باشن.

---

## ذخیره‌سازی و ارتباطات

**Storage & Communications**

سرویس Core برای ذخیره‌سازی داده‌ها از **PostgreSQL** استفاده می‌کنه.

جداول اصلی دیتابیس:

- `services`: اطلاعات و متادیتای سرویس‌ها.
- `heartbeats`: تاریخچه ضربان‌های سلامت.
- `audit_logs`: لاگ‌های غیرقابل تغییر سیستم.

نحوه تعامل با بقیه بخش‌ها:

- Core ↔ NATS
- Core ↔ PostgreSQL
- Core ↔ OpenTelemetry
- Core ↔ Prometheus

---

## قوانین وابستگی‌ها

**Dependency Rules**

سرویس Core به عنوان Platform Control Plane قوانین سخت‌گیرانه‌ای برای وابستگی‌ها داره:

- **وابستگی‌های مجاز:**
  - NATS (ارتباطات پیام‌رسان)
  - PostgreSQL (ذخیره داده‌ها)
  - OpenTelemetry (ردیابی توزیع‌شده)
  - Prometheus (جمع‌آوری متریک‌ها)

- **وابستگی‌های ممنوع:**
  - `nons-api/packages/*` (همه پکیج‌های TypeScript - چون Core با Go نوشته می‌شه نباید به اکوسیستم JS/TS وابسته باشه)
  - `nons-api/services/*` (کدهای اختصاصی هر کدوم از سرویس‌های تجاری)
  - هرگونه دایرکتوری مربوط به `domain/` یا `business/` خارج از پکیج‌های پایه و فنی

- **تغییرات پس از ADR-Platform-001:**
  - Core مجازه از Bindingهای Go تولیدشده از Proto (`nons-api/contracts/`) استفاده کنه. این کدها در CI تولید می‌شن و وابستگی به پکیج‌های TS ندارن.

---

## قوانین معماری و معیار موفقیت

**Architectural Rules & Success Criteria**

### قوانین معماری

**Architectural Rules**

1. Core هیچ Event اختصاصی دامنه‌ای (مثل سفارش یا پرداخت) تعریف نمی‌کنه.
2. Core هیچ گردش کاری (Workflow) یا فرآیندی رو اجرا نمی‌کنه.
3. Core هیچ ماشین حالتی (State Machine) رو نگه نمی‌داره.
4. Core هیچ تصمیم کسب‌وکاری یا منطقی مربوط به محصول رو اعمال نمی‌کنه.
5. اضافه شدن سرویس جدید نباید نیازمند تغییر در کدهای Core باشه.
6. اضافه شدن رویداد جدید نباید تغییری در Core ایجاد کنه.
7. تغییر فناوری یا زبان سرویس‌های دیگر نباید تأثیری روی Core بذاره.

### معیار موفقیت

**Success Criteria**

اگه توی آینده هر کدوم از اتفاقات زیر بیفته و سرویس Core بدون هیچ تغییری و بدون مشکل به کار خودش ادامه بده، یعنی معماری اون موفقیت‌آمیز بوده:

- حذف شدن یا تغییر منطق `order-service`
- بازنویسی کامل `wallet-service`
- تغییر زبان یا فریمورک `payment-service`

> **اصل نهایی:**  
> Core مالک زیرساخته، نه مالک دامنه کسب‌وکار!
