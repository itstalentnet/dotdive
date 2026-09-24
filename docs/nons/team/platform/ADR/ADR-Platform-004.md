---
layout: doc
title: 'ADR-Platform-004: Platform CLI، Registry و استراتژی تولید مصنوعات کلاینت'
description: Architectural Decision Record defining the platform CLI, service registry, client artifact generation strategy, and validation pipeline.
version: 2.2.0
status: APPROVED
author: Platform Team
owner: Platform Team
created_at: 2026-07-01
updated_at: 2026-07-04
tags:
  - ADR
  - Platform
  - CLI
  - Registry
  - OpenAPI
  - Artifact Generation
reviewers:
  - Backend Team
  - Frontend Team
  - Platform Team
---

# تصمیم معماری: Platform CLI، مدیریت رجیستری و استراتژی تولید مصنوعات کلاینت

**Architectural Decision Record — Platform CLI, Registry and Client Artifact Generation Strategy**

> **ADR-Platform-004 — Approved (Rev. 2.1)**

---

## وضعیت (Status)

APPROVED (تایید شده)

---

## تاریخ (Date)

2026-07-01 (آخرین به‌روزرسانی: 2026-07-03)

---

## زمینه (Context)

در توسعه معماری میکروسرویس‌های پلتفرم NONS، ارتباط میان پروژه‌های کلاینت (Client Applications شامل فرانت‌اند، ابزارهای خط فرمان، برنامه‌های دسکتاپ و ابزارهای Builder) و سرویس‌های بک‌اند نیازمند یک ابزار رسمی، مستقل و زبان‌آگنوستیک است.

**تصمیم:** پلتفرم NONS یک **Platform CLI** به نام `nons` به عنوان ابزار رسمی توسعه‌دهنده ارائه می‌دهد. CLI مسئول مدیریت قراردادها، رجیستری، باندل‌ها و تولید مصنوعات پروژه‌محور می‌باشد.

---

## تصمیمات مصوب (Decisions)

### ۱. جایگاه رجیستری (Service Registry Ownership)

Service Registry به عنوان بخشی از لایه یکپارچه‌سازی کلاینت (Client Integration Layer) تعریف می‌شود و به هیچ عنوان نباید درون کدهای اصلی بک‌اند نگهداری شود. بک‌اند صرفاً وظیفه دارد OpenAPI خود را منتشر کند.

جریان رسمی:

```
Service (سرویس بک‌اند)
   │
   └── openapi.yaml (قرارداد فنی)
         │
         ▼
   Platform CLI (nons)
         │
         ▼
   .nons/registry/{service}/manifest.json (دایرکتوری محلی پروژه کلاینت)
```

*   **بک‌اند فقط می‌گوید:** "من چه APIهایی دارم (قرارداد فنی)."
*   **بک‌اند هرگز نمی‌گوید:** "فرانت‌اند چطور داده‌ها را نمایش دهد (UI decisions)."

---

### ۲. ابزار خط فرمان پلتفرم (Platform CLI)

**`nons`** تنها ابزار رسمی توسعه‌دهنده برای تعامل با سرویس‌های پلتفرم است.

#### ویژگی‌های معماری CLI

| ویژگی | توضیح |
|--------|--------|
| **مستقل (Standalone)** | یک فایل اجرایی واحد — بدون وابستگی به Node.js، Python یا هر runtime دیگر |
| **چندسکویی (Cross-platform)** | پشتیبانی از Windows, macOS, Linux |
| **زبان‌آگنوستیک** | مستقل از زبان برنامه‌نویسی پروژه مصرف‌کننده |
| **تک‌فایل (Single Binary)** | توزیع به صورت یک باینری قابل اجرا |

CLI یک **ابزار مدیریت قرارداد (Contract Management Tool)** است، نه یک پکیج TypeScript. CLI:
- قراردادهای OpenAPI سرویس‌ها را دریافت و اعتبارسنجی می‌کند
- Registryهای محلی از Endpointها و Operationها می‌سازد
- Bundleهای پروژه‌محور را مدیریت می‌کند
- فایل‌های مصرفی را متناسب با تکنولوژی پروژه هدف تولید می‌کند

TypeScript تنها یکی از **خروجی‌های ممکن** CLI است — خود CLI به هیچ زبان یا فریم‌ورکی وابسته نیست.

زبان پیاده‌سازی CLI در این سند مشخص نمی‌شود و به ADR جداگانه واگذار می‌گردد.

#### حوزه‌های مسئولیتی (مسئولیت‌ها فعلاً به صورت حوزه مشخص می‌شوند — دستورات دقیق در فاز پیاده‌سازی تعیین می‌گردند)

| دستور | مسئولیت |
|-------|---------|
| `nons init` | مقداردهی اولیه پروژه کلاینت و ساخت دایرکتوری `.nons/` |
| `nons registry build <service>` | ساخت Service Manifest از OpenAPI سرویس |
| `nons registry list` | فهرست رجیستری‌های محلی |
| `nons bundle create` | ساخت باندل از مجموعه‌ای از سرویس‌ها |
| `nons generate` | تولید مصنوعات پروژه (Types, API Client, Hooks) متناسب با فریم‌ورک هدف |
| `nons validate` | اعتبارسنجی قراردادها، رجیستری‌ها و باندل‌ها |
| `nons interactive` / `nons ui` | حالت تعاملی (TUI) |

---

### ۳. مدیریت تغییر اندپوینت‌ها (Endpoint Change)

در صورتی که مسیر یک اندپوینت در بک‌اند تغییر کند:

*   **قبل:** `/v1/auth/login`
*   **بعد:** `/v2/auth/login`

**پروژه کلاینت به هیچ عنوان تغییر کدی نخواهد داشت.** مراحل اعمال تغییر:

1. بروزرسانی رجیستری محلی: `nons registry build auth --update`
2. بازتولید مصنوعات: `nons generate`

---

### ۴. مصنوعات تولیدشده (Generated Artifacts)

CLI بر اساس Service Manifest و فریم‌ورک هدف پروژه، مصنوعات زیر را تولید می‌کند:

| فریم‌ورک هدف | مصنوعات تولیدشده |
|-------------|-------------------|
| React / Next.js | Custom Hooks, Types, API Client Functions |
| Vue / Nuxt | Composables, Types, API Client Functions |
| Flutter | Dart Classes, API Service |
| React Native | Custom Hooks, Types |
| Angular | Services, Types, HTTP Interceptors |
| Swift | Swift Models, API Client |
| Kotlin | Data Classes, Retrofit Service |

**خروجی همیشه پروژه‌محور است — نه یک محصول عمومی و از پیش‌ساخته.**
CLI کدها را متناسب با ساختار و فریم‌ورک پروژه مصرف‌کننده تولید می‌کند.

---

### ۵. زنجیره اعتبارسنجی قرارداد (Contract Validation Pipeline)

```
OpenAPI Source (تولیدشده توسط سرویس)
      │
      ▼
OpenAPI Lint (اعتبارسنجی ساختار)
      │
      ▼
Schema Validation (بررسی هماهنگی با طرح‌های داده)
      │
      ▼
Breaking Change Detection (شناسایی تغییرات مخرب)
      │
      ▼
Contract Test (تست‌های قرارداد)
      │
      ▼
Publish (انتشار به Registry)
```

> مرحله تولید کدهای مصرف‌کننده از این Pipeline حذف شده است — CLI مسئول تولید مصنوعات است. جزئیات کامل در [OpenAPI Guidelines](../api/openapi-guidelines).

> [!IMPORTANT]
> هرگونه حذف فیلد، تغییر نام فیلدهای اجباری، یا تغییر در کدهای وضعیت HTTP بدون ارتقای نسخه API، به عنوان تغییر مخرب شناسایی شده و فرآیند بیلد متوقف خواهد شد.

---

### ۶. تفکیک مسئولیت‌های CLI

#### CLI مسئول است:
- مدیریت قراردادها (دریافت، اعتبارسنجی، همگام‌سازی)
- مدیریت رجیستری (ساخت، نصب، به‌روزرسانی، حذف)
- مدیریت باندل‌ها (ساخت، نصب، به‌روزرسانی، وابستگی‌ها)
- تولید مصنوعات پروژه (Types, API Client, Hooks)
- همگام‌سازی پروژه (رجیستری، باندل‌ها، مصنوعات)
- اعتبارسنجی (قرارداد، رجیستری، باندل، سلامت اندپوینت)
- تجربه تعاملی (پروژه جدید، انتخاب باندل، انتخاب سرویس)

#### CLI مسئول نیست:
- منطق کسب‌وکار
- مدیریت state فرانت‌اند
- کدهای مختص فریم‌ورک (بیرون از مصنوعات تولیدشده)
- اجرای درخواست‌های API در زمان اجرا

---

### ۷. استراتژی تولید مبتنی بر مدل (Model-Driven Artifact Generation)

CLI از استراتژی **Model-Driven Generation** پیروی می‌کند: ساختار مصنوعات به عنوان یک «مدل داده‌ای» (Service Manifest) تعریف شده و تولید کد برای هر فریم‌ورک به صورت خودکار توسط CLI انجام می‌شود.

**لایه قرارداد (Source of Truth):**

| لایه | منبع حقیقت | ابزار Generation | خروجی |
|------|-----------|-------------------|-------|
| Platform Contracts (Platform Types) | `nons-api/contracts/*.proto` | Buf (`buf generate`) | TypeScript bindings (برای CLI)، Go bindings (برای Core) |
| Service APIs (HTTP endpoints) | کد منبع سرویس | OpenAPI Generator → CLI (`nons registry build`) | `.nons/registry/{service}/manifest.json` |
| Client Artifacts | Service Manifest | CLI (`nons generate`) | کدهای پروژه‌محور (Hooks, Types, API Client) |

---

## پیامدها (Consequences)

### پیامدهای مثبت (Positive)
- **حذف وابستگی به زبان:** CLI مستقل از زبان پروژه مصرف‌کننده است
- **انعطاف‌پذیری در خروجی:** پشتیبانی از فریم‌ورک‌های مختلف (React, Vue, Flutter, ...)
- **کاهش هزینه نگهداری:** تغییر اندپوینت = `nons generate`
- **تفکیک کامل وظایف:** بک‌اند و فرانت‌اند بدون تداخل با یکدیگر توسعه می‌کنند
- **توسعه آفلاین:** Mock Server داخلی CLI (`nons mock`)

### پیامدهای منفی (Negative)
- **سربار مدیریت محلی:** نیاز به اجرای دوره‌ای `nons generate`
- **هزینه پیاده‌سازی CLI:** ساخت CLI مستقل نیاز به توسعه اختصاصی دارد
- **تغییر عادت تیم:** transition به ابزار جدید CLI نیاز به آموزش دارد

---

## تکمیل و گسترش

تصمیمات معماری جنریتور (metadata strategy و template-per-framework) در **[ADR-Platform-005](./ADR-Platform-005)** رسمی شده‌اند.

ADR-005 به طور مستقیم بر این سند بنا شده و آن را گسترش می‌دهد — نه جایگزین آن.
