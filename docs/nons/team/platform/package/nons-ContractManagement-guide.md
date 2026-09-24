---
layout: doc
title: راهنمای مدیریت قراردادها با CLI (nons)
description: راهنمای معماری، جریان مدیریت قرارداد و تولید مصنوعات توسط ابزار رسمی پلتفرم NONS
version: 2.0.0
status: APPROVED
author: Platform Team
owner: Platform Team
created_at: 2026-07-03
updated_at: 2026-07-03
tags:
  - CLI
  - Nons
  - Contract Management
  - Registry
  - OpenAPI
  - Artifact Generation
reviewers:
  - Backend Team
  - Frontend Team
  - Platform Team
---

# راهنمای مدیریت قراردادها با CLI (nons)

**NONS Contract Management Guide**

> ابزار رسمی و مستقل پلتفرم NONS برای مدیریت قراردادها، رجیستری، باندل‌ها و تولید مصنوعات پروژه.

---

## ۱. نمای کلی

`nons` (مخفف NONS CLI) یک **ابزار مدیریت قرارداد (Contract Management Tool)** است — نه یک پکیج TypeScript و نه یک کتابخانه زمان اجرا.

مسئولیت `nons` مدیریت چرخه حیات قراردادهای API است:

```
Backend Service
    │
    └── openapi.yaml (قرارداد فنی سرویس)
          │
          ▼ [nons]
    Service Manifest (رجیستری محلی)
          │
          ▼ [nons]
    مصنوعات پروژه (Types, API Client, Hooks)
          │
          ▼
    پروژه مصرف‌کننده (React, Vue, Flutter, ...)
```

### ویژگی‌های معماری

| ویژگی | توضیح |
|--------|--------|
| **مستقل** | یک فایل اجرایی واحد — بدون وابستگی به Node.js، Python یا هر runtime دیگر |
| **چندسکویی** | پشتیبانی از Windows, macOS, Linux |
| **زبان‌آگنوستیک** | مستقل از زبان برنامه‌نویسی پروژه مصرف‌کننده |
| **Contract Management** | مدیریت قراردادها، رجیستری، باندل‌ها — نه Business Logic |
| **خروجی پروژه‌محور** | مصنوعات متناسب با فریم‌ورک هدف تولید می‌شوند |

---

## ۲. Contract Management — چرخه مدیریت قرارداد

`nons` قراردادهای فنی سرویس‌ها (OpenAPI) را دریافت، پردازش و به فرمت مناسب پروژه مصرف‌کننده تبدیل می‌کند.

### ۲.۱ دریافت قرارداد (Contract Acquisition)

`nons` OpenAPI سرویس را دریافت می‌کند و یک **Service Manifest** از آن می‌سازد:

```
nons registry build user --source services/user-service/docs/openapi.yaml
```

Service Manifest یک JSON غنی شامل:
- **Operations:** متد HTTP، مسیر، Schema درخواست/پاسخ
- **Metadata:** احراز هویت، timeout، retry، cache
- **Types:** تعاریف داده‌ای هر Operation
- **Security:** طرح‌های امنیتی

### ۲.۲ رجیستری محلی (Local Registry)

Service Manifestها در دایرکتوری `.nons/registry/{service}/` ذخیره می‌شوند. هر پروژه فقط Registryهای مورد نیاز خود را نگهداری می‌کند.

```
.nons/
└── registry/
    ├── user/
    │   └── manifest.json
    └── auth/
        └── manifest.json
```

### ۲.۳ باندل (Bundle)

Bundle یک **Feature** است، نه یک Service. یک Bundle می‌تواند شامل Operationهایی از چند سرویس مختلف باشد.

```
Onboard Bundle:
  ├── auth.login
  ├── auth.register
  ├── profile.create
  └── avatar.upload
```

Bundleها در `.nons/bundles/` ذخیره می‌شوند.

### ۲.۴ تولید مصنوعات (Artifact Generation)

`nons` بر اساس Service Manifestها و فریم‌ورک هدف پروژه، مصنوعات مصرفی را تولید می‌کند:

```
nons generate
```

خروجی بر اساس فریم‌ورک پروژه:

| فریم‌ورک | مصنوعات تولیدشده |
|-------------|-------------------|
| React / Next.js | Custom Hooks, Types, API Client Functions |
| Vue / Nuxt | Composables, Types, API Client Functions |
| Flutter | Dart Classes, API Service |
| React Native | Custom Hooks, Types |
| Angular | Services, Types, HTTP Interceptors |
|  ... | سایر فریم‌ورک‌ها |

**خروجی همیشه پروژه‌محور است — نه یک محصول عمومی.**
مصنوعات تولیدشده در `.nons/generated/` قرار می‌گیرند:

```
.nons/generated/
├── types/
│   └── user.ts           (یا .dart, .swift, ...)
├── api-client/
│   └── user.ts
└── hooks/
    └── useUsers.ts       (یا composables/, services/, ...)
```

### ۲.۵ اعتبارسنجی (Validation)

`nons` قراردادها، رجیستری‌ها و سلامت اندپوینت‌ها را اعتبارسنجی می‌کند:

```
nons validate
```

---

## ۳. مرزهای مسئولیت

### `nons` مسئول است

- دریافت و اعتبارسنجی قراردادهای OpenAPI
- ساخت و مدیریت Service Manifestها (Registry)
- نصب فقط Registryهای مورد نیاز پروژه
- مدیریت Bundleها (Feature-based grouping)
- تولید فایل‌های مصرفی متناسب با تکنولوژی پروژه
- اعتبارسنجی قراردادها و سلامت اندپوینت‌ها
- بروزرسانی Registryها

### `nons` مسئول نیست

- نوشتن Business Logic
- مدیریت state فرانت‌اند
- اجرای درخواست‌های API در زمان اجرا
- جایگزینی برای ابزارهای بیلد (Vite, Webpack, ...)
- تعیین نحوه نمایش داده‌ها در UI

---

## ۴. جریان یکپارچه

### ۴.۱ نصب

```bash
curl -fsSL https://nons.dev/cli/install.sh | sh
```

`nons` به صورت یک باینری مستقل توزیع می‌شود — بدون نیاز به Node.js، npm یا هر runtime دیگری.

### ۴.۲ مقداردهی اولیه پروژه

```bash
nons init
```

### ۴.۳ افزودن سرویس به پروژه

```bash
nons registry build user --source path/to/openapi.yaml
```

### ۴.۴ تولید مصنوعات

```bash
nons generate
```

### ۴.۵ بروزرسانی پس از تغییر بک‌اند

```bash
nons registry build user --update
nons generate
```

پروژه مصرف‌کننده نیازی به تغییر کد ندارد.

---

## ۵. ساختار دایرکتوری `.nons/`

```
project/
└── .nons/
    ├── config.yaml             # تنظیمات پروژه (فریم‌ورک، مسیرها)
    │
    ├── registry/               # ← Service Manifestها
    │   ├── user/
    │   │   └── manifest.json
    │   └── auth/
    │       └── manifest.json
    │
    ├── bundles/                # ← Bundleها
    │   └── onboard/
    │       └── bundle.json
    │
    └── generated/              # ← مصنوعات تولیدشده
        ├── types/
        ├── api-client/
        └── hooks/
```

**قوانین:**
1. هیچ فایلی در `.nons/` دستی ویرایش نمی‌شود — به جز `config.yaml`
2. `registry/` فقط توسط `nons` مدیریت می‌شود
3. `bundles/` فقط توسط `nons` مدیریت می‌شود
4. `generated/` فقط توسط `nons generate` تولید می‌شود
5. `.nons/` در git commit می‌شود

---

## مستندات مرتبط

| سند | توضیح |
|-----|--------|
| [ADR-Platform-004](../ADR/ADR-Platform-004) | تصمیمات معماری CLI و Registry |
| [راهنمای CLI (CLI Reference)](./cli-reference) | دستورات و مسئولیت‌های `nons` |
| [OpenAPI Guidelines](../api/openapi-guidelines) | استاندارد تولید OpenAPI |
| [API Design Guidelines](../api/api-design-guidelines) | استاندارد طراحی API |
| [Repository Structure](../standards/repository-structure) | مسیر فایل‌ها در سرویس |
