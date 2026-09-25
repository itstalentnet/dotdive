---
layout: doc
title: بلوپرینت هسته اصلی
description: راهنمای طراحی، اصول، مسئولیت‌ها و ساختار کلان سرویس Core
version: 1.0.0
status: PUBLIC
author: xoxxel 
owner: xoxxel
created_at: 2026-06-11
updated_at: 2026-06-13
tags:
  - Blueprint
  - Core
  - Platform
reviewers:
  - backend team 
  - platform team
  - Devops team
---

# بلوپرینت هسته اصلی

**Core Platform Blueprint**

> **خلاصه:** این سند نمای کلی، اصول طراحی، مسئولیت‌ها و الگوهای تعاملی لایه کنترل پلتفرم (Core) رو در پروژه NONS تشریح می‌کنه.

---

## ارجاعات مرتبط

**Related Documents**

- [معماری هسته اصلی](./Architecture)
- [تصمیم معماری ۱: انتخاب Go](./ADR/ADR-Core-001)
- [تصمیم معماری ۲: Core به عنوان Platform Control Plane](./ADR/ADR-Core-002)

---

## فهرست محتوا

**Table of Contents**

1. [هدف](#هدف)
2. [اصول طراحی](#اصول-طراحی)
3. [جایگاه در معماری](#جایگاه-در-معماری)
4. [مسئولیت‌های Core](#مسئولیت‌های-core)
5. [مسئولیت‌های ممنوع](#مسئولیت‌های-ممنوع)
6. [ساختار پروژه](#ساختار-پروژه)
7. [معرفی تفصیلی ماژول‌ها](#معرفی-تفصیلی-ماژول‌ها)
8. [ذخیره‌سازی و وابستگی‌ها](#ذخیره‌سازی-و-وابستگی‌ها)
9. [رویدادهای مورد انتظار](#رویدادهای-مورد-انتظار)
10. [الزامات غیرعملیاتی و معیار موفقیت](#الزامات-غیرعملیاتی-و-معیار-موفقیت)

---

## هدف

**Objective**

Core لایه کنترل پلتفرم (Platform Control Plane) در پروژه NONS هستش.
این سرویس مسئول مدیریت قابلیت‌های فنی مشترک در سطح پلتفرمه و اصلاً نباید وارد حوزه‌های کسب‌وکاری و بیزنس بشه.

هدف از طراحی Core، ایجاد یک نقطه متمرکز واسه کارهای زیر هست:

- Audit Logging
- Technical Event Validation
- Service Registry
- Health Monitoring
- Platform Governance

> [!IMPORTANT]
> سرویس Core نباید به هیچ عنوان به دامنه‌های کسب‌وکاری پلتفرم وابسته باشه.

---

## اصول طراحی

**Design Principles**

### استقلال از دامنه کسب‌وکار

**Domain Agnostic**

سرویس Core نسبت به دامنه‌های کسب‌وکاری کاملاً ناآگاه هستش و نباید هیچ اطلاعاتی درباره سفارش‌ها، پرداخت‌ها، کیف پول، محصولات، کاربرا، چت و جستجو داشته باشه. وجود هر مدل دامنه‌ای توی Core یه نقض معماری جدی به حساب میاد.

### اولویت زیرساخت

**Infrastructure First**

Core یه سرویس زیرساختیه که واسه پشتیبانی از اکوسیستم سرویس‌ها طراحی شده، نه برای اجرای منطق محصول و کارهای تجاری.

### رویدادمحور بودن

**Event Driven**

تمام تعاملات Core مبتنی بر رویداد (Event) هستن. Core هیچ وقت سرویس‌های دیگه رو مستقیم صدا نمی‌زنه و کل ارتباطاتش از طریق NATS انجام می‌شه.

### استقلال از فناوری

**Technology Independent**

واسه‌ Core فرقی نداره سرویس‌های دیگه با چی نوشته شدن (Go، Node.js، Python یا غیره). Core نباید هیچ وابستگی به تکنولوژی سرویس‌ها داشته باشه.

### پایداری بلندمدت

**Long-Term Stability**

اضافه شدن سرویس یا رویداد جدید، یا تغییر تکنولوژی سرویس‌ها نباید تغییری روی Core اعمال کنه.

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
    ├───────────────► Core
    │
    ▼
Other Consumers
```

Core خارج از فرآیند مستقیم درخواست‌های کاربرا قرار داره و هیچ Endpoint عمومی برای کاربرا نداره.

---

## مسئولیت‌های Core

**Core Responsibilities**

### ثبت لاگ‌های حسابرسی

**Audit Logging**

ثبت غیرقابل تغییر وقایع سیستم جهت پیگیری رخدادها، انطباق با قوانین، عیب‌یابی و بررسی حوادث. Core تاریخچه کامل رویدادها رو نگه می‌داره.

### اعتبارسنجی فنی رویدادها

**Technical Event Validation**

اعتبارسنجی فراداده‌های فنی رویدادها بر اساس ساختار مشترک در فایل [envelope.proto](file:///C:/Users/ASUS/Documents/GitHub/nons/nons-api/contracts/envelope.proto). فیلدهای فنی مثل `id`، `subject`، `version`، `timestamp`، `source` و `trace_id` اعتبارسنجی می‌شن. Core حق نداره محتوای دامنه‌ای (Payload) رو بررسی کنه.

### ثبت سرویس‌ها

**Service Registry**

نگهداری لیست و اطلاعات سرویس‌های فعال شامل نام سرویس، نسخه، محیط اجرا (Environment)، زمان اولین مشاهده و آخرین مشاهده.

### پایش وضعیت سلامت

**Health Monitoring**

بررسی و تعیین وضعیت سلامت سرویس‌ها از طریق سیگنال‌های Heartbeat. وضعیت‌ها شامل **UP**، **DEGRADED** و **DOWN** می‌شه.

### حاکمیت پلتفرم

**Platform Governance**

کنترل و نظارت روی انطباق فنی سرویس‌ها با قوانین و استانداردهای پلتفرم (مثل قرارداد رویدادها، متادیتا و لاگ‌نویسی).

---

## مسئولیت‌های ممنوع

**Forbidden Responsibilities**

سرویس Core به هیچ عنوان نباید کارهای زیر رو انجام بده:

- احراز هویت (Authentication) و مجوزها (Authorization)
- مدیریت پرداخت‌ها، کیف پول و تسویه حساب
- پردازش سفارش‌ها و مدیریت محصولات
- چت، جستجو و اجرای گردش کارهای دامنه‌ای (Workflow / Saga)

---

## ساختار پروژه

**Project Structure**

```text
core/
├── cmd/
│   └── main.go
├── internal/
│   ├── audit/
│   ├── validation/
│   ├── registry/
│   ├── health/
│   ├── lifecycle/
│   ├── eventrouter/
│   ├── storage/
│   ├── telemetry/
│   └── shared/
├── configs/
├── migrations/
├── deployments/
├── go.mod
└── Dockerfile
```

---

## معرفی تفصیلی ماژول‌ها

**Modules In-Depth**

### ماژول Event Router

**Event Router Module**

وظیفه این ماژول دریافت رویدادها از NATS و تحویل اون‌ها به بخش‌های Validator و Audit هستش. این ماژول نباید هیچ تصمیم تجاری یا هماهنگی فرآیندی انجام بده.

### ماژول Validation

**Validation Module**

وظیفه بررسی Envelope رویدادها رو بر اساس بایندینگ‌های Go تولیدشده داره. در صورت نامعتبر بودن رویداد، موضوع رو ثبت کرده و متریک‌های مربوطه رو بالا می‌بره.

### ماژول Audit

**Audit Module**

مسئول ذخیره‌سازی ایمن و غیرقابل تغییر رویدادها و تاریخچه‌ نویسی هست.

### ماژول Registry

**Registry Module**

ثبت و به‌روزرسانی مشخصات و نسخه‌های تمام سرویس‌های فعال پلتفرم رو انجام می‌ده.

### ماژول Health

**Health Module**

دریافت Heartbeatها و تحلیل تاخیرها برای اعلام وضعیت سلامت سرویس‌ها رو انجام می‌ده.

> [!NOTE]
> **محدودیت فاز فعلی (MVP):** سرویس Core در این فاز مسئولیتی بابت فرستادن اعلان یا اجرای خودکار فرآیندهای بازیابی در زمان خرابی سرویس‌ها نداره. رویداد `platform.service.status_changed` به عنوان نقطه توسعه آتی (Extension Point) واسه این کار در نظر گرفته شده.

### ماژول Lifecycle

**Lifecycle Module**

مدیریت بالا آمدن و خاموش شدن امن و منظم (Graceful Shutdown) سرویس Core و وابستگی‌هاش رو بر عهده داره.

---

## ذخیره‌سازی و وابستگی‌ها

**Storage & Dependencies**

### پایگاه داده PostgreSQL

**PostgreSQL Database**

سرویس Core برای ذخیره اطلاعات فقط به PostgreSQL وابسته هست و از جداول `services`، `heartbeats` و `audit_logs` استفاده می‌کنه.

### وابستگی‌های مجاز و غیرمجاز

**Allowed & Forbidden Dependencies**

- **مجاز:** NATS، PostgreSQL، OpenTelemetry و Prometheus.
- **غیرمجاز:** وابستگی به کدهای اختصاصی هر سرویس تجاری در `nons-api/services/*` و کلیه پکیج‌های TypeScript در `nons-api/packages/*`.
- **مجاز پس از ADR-Platform-001:** استفاده از فایل‌های Proto در `contracts/` و بایندینگ‌های Go تولید شده از اون‌ها در مرحله CI.

---

## رویدادهای مورد انتظار

**Expected Events**

Core رویدادهای اختصاصی خودش رو نداره و فقط رویدادهای عمومی پلتفرم رو که ساختارشون توی `envelope.proto` مشخص شده، مصرف می‌کنه. مثل:

```text
platform.service.registered
platform.service.heartbeat
platform.service.shutdown
```

Core نباید با اضافه شدن رویداد جدید تغییر کنه.

---

## الزامات غیرعملیاتی و معیار موفقیت

**Performance Requirements & Success Criteria**

### الزامات عملکردی

**Performance Requirements**

- **بی‌حالت بودن (Stateless):** Core باید Stateless بمونه تا بشه چندتا نسخه ازش رو به طور همزمان اجرا کرد.
- **مقیاس‌پذیری افقی:** پشتیبانی کامل از Horizontal Scaling.
- **متریک‌ها:** ثبت متریک‌های پردازش رویدادها، وضعیت سلامت و تعداد سرویس‌ها.

### معیار موفقیت

**Success Criteria**

اگه با حذف، اضافه یا تغییر زبان هر کدوم از سرویس‌های محصول (مثل پرداخت یا سفارش)، سرویس Core بدون هیچ تغییری به کار خودش ادامه بده، معماری طراحی شده موفق بوده.
