---
layout: doc
title: شروع سریع CLI و Codegen
description: راهنمای شروع کار با ابزارهای خط فرمان و pipeline تولید خودکار کد از Proto — Buf، OpenAPI، SDK
version: 1.0.0
status: ACTIVE
author: Platform Team
owner: Platform Team
created_at: 2026-07-24
updated_at: 2026-07-24
tags:
  - Platform
  - CLI
  - Codegen
  - GetStarted
---

# شروع سریع CLI و Codegen

**CLI & Codegen Get Started**

> این سند برای یک توسعه‌دهنده جدید کافی است تا pipeline تولید خودکار کد از Proto را بفهمد، اجرا کند و خطاهای رایج را رفع کند.

---

## ۱. پیش‌نیازها

| ابزار | نسخه | توضیح |
|-------|------|-------|
| Node.js | >= 20 | برای pnpm + اسکریپت‌ها |
| pnpm | >= 9 | مدیریت وابستگی‌ها |
| Go | >= 1.26 | برای protoc-gen-go و کامپایل سرویس‌ها |
| Buf CLI | ^1.70.0 | از طریق devDependencies نصب می‌شود (`npx buf`) |

---

## ۲. دستورات اصلی

```bash
# از ریشه nons-api/ اجرا شود
pnpm codegen
```

این دستور ۸ مرحله را به ترتیب اجرا می‌کند:

```
1. buf generate (types)       → packages/types/src/
2. buf generate (contracts)   → packages/contracts/src/
3. buf generate (events)      → packages/events/src/
4. buf generate (go)          → core/platform/        (Go pb bindings)
5. buf generate (openapi)     → gen/                  (gitignored .swagger.json)
6. generate-iam-keys          → iam-service Go constants
7. aggregate-permission-meta  → iam-service aggregated metadata
8. openapi-typescript         → iam-sdk.ts            (TS from OpenAPI)
   └── prettier --write       → فرمت‌دهی تمام خروجی‌ها
```

---

## ۳. تمایز FINAL vs INTERMEDIATE

| Artifact | مسیر | وضعیت | توضیح |
|----------|------|-------|-------|
| تایپ‌های TS | `packages/types/src/` | ✅ FINAL | commit شده، CI-enforced |
| کانترکت‌های TS | `packages/contracts/src/` | ✅ FINAL | commit شده |
| رویدادها | `packages/events/src/` | ✅ FINAL | commit شده |
| Go pb bindings | `core/platform/*.pb.go` | ✅ FINAL | commit شده |
| Go aggregated meta | `iam-service/.../permission_meta_aggregated.go` | ✅ FINAL | commit شده |
| OpenAPI JSON | `gen/openapi/` | 🔄 INTERMEDIATE | gitignored |
| iam-sdk.ts | `packages/contracts/src/iam-sdk.ts` | ✅ FINAL | commit شده |

> **قاعده:** INTERMEDIATEها (`gen/`) gitignore هستند چون در همان run مصرف می‌شوند. FINALها commit می‌شوند و CI با `git diff --exit-code` بررسی می‌کند که همیشه با Proto هماهنگ باشند.

---

## ۴. افزودن Permission جدید

زنجیره کامل (رجوع کنید به `permissions-source-of-truth.md` برای جزئیات):

1. افزودن enum value به `contracts/permissions.proto`
2. `pnpm codegen` (تایپ‌های Go/TS به‌روز می‌شوند)
3. افزودن metadata به `services/<your-service>/permissions.meta.yaml` (مالکیت توزیع‌شده)
4. `pnpm codegen` (aggregation + بررسی orphan/collision)
5. ثبت در IAM DB seed (`002_seed_defaults.sql`)
6. افزودن برچسب فارسی/انگلیسی در `admin-panel/locales/`

---

## ۵. عیب‌یابی خطاهای رایج CI

### `git diff --exit-code` fail

علت: فایل‌های FINAL با Proto هماهنگ نیستند. یا Proto تغییر کرده و codegen اجرا نشده، یا خروجی دستی تغییر کرده.

**رفع:** `pnpm codegen` را اجرا کنید و فایل‌های تغییر یافته را commit کنید.

### `buf breaking` fail

علت: تغییری در Proto ایجاد شده که با نسخهٔ قبلی سازگار نیست (حذف فیلد، تغییر شماره enum).

**رفع:** فیلدهای حذف‌شده را با `reserved` علامت‌گذاری کنید یا enum values را با `reserved` نگه دارید.

### Orphan key (CI rejects)

علت: کلیدی در Proto تعریف شده که هیچ `permissions.meta.yaml`ای مالکیت آن را اعلام نکرده.

**رفع:** به سرویس مربوطه `permissions.meta.yaml` اضافه کنید.

### Collision key (CI rejects)

علت: یک کلید در دو فایل `permissions.meta.yaml` متفاوت تعریف شده.

**رفع:** مشخص کنید کدام سرویس مالک واقعی است و از دیگری حذف کنید.

---

## مستندات مرتبط

- [شروع سریع فرانت‌اند](/docs/team/frontend/get-started)
- [شروع سریع بک‌اند](/docs/team/backend/get-started)
- [منبع حقیقت مجوزها](https://github.com/nons/nons-api/blob/main/services/iam-service/docs/permissions-source-of-truth.md)
- [استاندارد قرارداد مجوز](/docs/team/platform/standards/permission-contract-standard)
- [معماری پلتفرم](/docs/team/platform/Architecture)
