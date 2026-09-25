---
layout: doc
title: Pool Service
description: سرویس مدیریت داده‌های مرجع — Reference Data، مواد اولیه تولید Username، آواتارها و داده‌های ارز
version: 0.1.0
status: BLUEPRINT
author: Backend Team
owner: Backend Team
created_at: 2026-07-24
updated_at: 2026-07-24
tags:
  - Backend
  - Service
  - Pool
  - Blueprint
---

# Pool Service

**Pool Service — Reference Data & Asset Management**

> وضعیت: Blueprint (پیش‌نویس برای بازبینی تیم)

## ۱. تعریف

Pool Service یک سرویس دامنه مستقل است که **مالک داده‌های مرجع (Reference Data)** و **مواد اولیه تولید** (کلمات ساخت Username، آواتارهای curated، لیست نام‌های رزرو شده) می‌باشد. سایر سرویس‌ها (user-service، currency-service، storage-service) این داده‌ها را از طریق Read API مصرف می‌کنند.

## ۲. Scope

### Pool Service مسئول است برای:
- **Username Materials:** لیست adjectives و nouns برای تولید تصادفی Username
- **Reserved Usernames:** نام‌های رزرو شده (ادمین، برند، کلمات ممنوعه)
- **Username Registry:** ثبت و بررسی یکتایی نام‌های تولیدشده (Reserve API اتمیک)
- **Avatar Pool:** آواتارهای curated با متادیتا (skin tone, category, tags)
- **Currency Reference:** داده‌های مرجع ارز (ISO 4217, نام، نماد، precision, country mapping)

### Pool Service مسئول نیست برای:
- تولید واقعی Username (در user-service)
- نرخ زنده ارز (در currency-service)
- احراز هویت کاربران (در auth-service / IAM)
- فایل‌های فیزیکی آواتار (در MVP موقتاً در Pool؛ مهاجرت به Storage Service بعدی)

## ۳. تکنولوژی

- **زبان:** Go (net/http + pgx)
- **دیتابیس:** PostgreSQL مستقل
- **API:** REST/JSON
- **رویداد:** در این نسخه رویدادی منتشر نمی‌شود

## ۴. مسیرهای API (برنامه‌ریزی شده)

| Method | Path | توضیح |
|--------|------|-------|
| `GET` | `/v1/pool/username-materials` | لیست adjectives/nouns |
| `GET` | `/v1/pool/usernames/reserved` | نام‌های رزرو شده |
| `POST` | `/v1/pool/usernames/reserve` | رزرو اتمیک نام |
| `GET` | `/v1/pool/avatars` | لیست آواتارها با فیلتر |
| `GET` | `/v1/pool/currencies` | داده‌های مرجع ارز |

## ۵. مستندات مرتبط

- [Blueprint اصلی (nons-api)](https://github.com/nons/nons-api/blob/main/services/pool-service/blueprint.md)
