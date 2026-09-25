---
layout: doc
title: 'ADR-Backend-007: معماری Pool Service و تثبیت مرزهای مسئولیت Username/Avatar/Onboarding'
description: Architectural Decision Record documenting the introduction of Pool Service as a centralized Reference Data and material generation source, and clarifying ownership boundaries for username generation, avatar pool, reserved usernames, onboarding state, user status, and change policies.
version: 1.0.0
status: PROPOSED
author: Backend Team
owner: Backend Team
created_at: 2026-07-15
updated_at: 2026-07-15
tags:
  - ADR
  - Backend
  - Pool
  - Username
  - Avatar
  - Onboarding
  - IAM
reviewers:
  - Backend Team
  - Platform Team
  - IAM Team
---

# تصمیم معماری: معماری Pool Service و مرزهای مسئولیت Username/Avatar/Onboarding

**Architectural Decision Record — Pool Service & Ownership Boundaries**

> **ADR-Backend-007 — Proposed (Rev. 1.0)**

---

## وضعیت (Status)

PROPOSED (پیشنهاد شده — در انتظار تایید تیم)

---

## تاریخ (Date)

2026-07-15

---

## زمینه (Context)

پس از بررسی پیاده‌سازی فعلی `user-service` (که تولید تصادفی Username و ویرایش آن را پیاده کرده بود) در مقابل [blueprint.md](../../backend/services/user-service/blueprint.md) و [user-service.md](../../backend/services/user-service.md)، تضادهای زیر شناسایی شد:

۱. **منبع تولید Username مشخص نبود:** کد فعلی کلمات (adjective/noun) را در خود هاردکد کرده بود و Registry صرفاً برای یکتایی استفاده می‌شد — هیچ منبع متمرکزی برای مواد اولیه تولید وجود نداشت.

۲. **انتشار دوگانه رویداد:** تغییر Username هم در `nons.user.profile.changed` و هم به صورت بالقوه در جای دیگر منتشر می‌شد (نقض قانون ۵).

۳. **تضاد Onboarding:** blueprint ادعا می‌کرد User Service مالک Onboarding است، در حالی که State Machine Onboarding در IAM تعریف شده است.

۴. **وضعیت حساب (Status):** blueprint مقدار اولیه را `PENDING` و تغییر آن را توسط User Service می‌دانست، در حالی که وضعیت باید از IAM بازتاب شود و مقدار اولیه در عمل `ACTIVE` است.

۵. **پالیسی تغییر Username/Avatar:** هیچ مرجع واحدی برای محدودیت‌های تغییر (cooldown، quota، rate-limit) تعریف نشده بود.

۶. **همپوشتی احتمالی با Currency Service:** داده‌های مرجع ارز (ISO codes و غیره) نیازمند منبع واحد بودند.

این ADR تصمیمات D1–D11 را برای رفع این تضادها و ایجاد سرویس Pool تثبیت می‌کند.

---

## تصمیمات مصوب (Decisions)

### D1. سرویس جدید: Pool Service

یک سرویس دامنه جدید با نام **Pool Service** معرفی می‌شود که مالک **Reference Data** و **مواد اولیه تولید** (curated pools) است. Pool Service یک سرویس مستقل با دیتابیس PostgreSQL خود و Read API (REST) است و توسط سایر سرویس‌ها مصرف می‌شود. جزئیات در [blueprint.md](../../backend/services/pool-service/blueprint.md) و [README.md](../../backend/services/pool-service/README.md).

### D2. Registry فقط مالک Username است؛ Generator از Pool مواد می‌گیرد

- `username_registry` **فقط و فقط** یکتایی و تخصیص Username را مدیریت می‌کند — منبع تولید نیست.
- منطق Generator (الگوی `adjective_noun_NNN`) در **Consumer** (user-service) باقی می‌ماند اما مواد اولیه (لیست adjectives/nouns، طول/ساختار) را از **Pool Service** می‌گیرد.
- این تفکیک در §۶ و §۷ [user-service.md](../../backend/services/user-service.md) تثبیت شد.

### D3. ساختار مواد Username و API رزرو

- Pool Service لیست‌های adjectives و nouns را نگهداری می‌کند (قابل مدیریت توسط ادمین).
- هر ماده دارای `id`, `value`, `category`, `status` (active/inactive) است.
- Pool Service یک **Reserve API** ارائه می‌دهد تا Consumer پس از تولید یک نامتشابه، آن را reserve کند (قفل اتمیک برای جلوگیری از race).

### D4. Avatar Pool

- آواتارها منابع **curated** هستند که منبع آن‌ها Pool Service است (شامل متادیتا: skin tone, style, category, tags).
- user-service متادیتای آواتار را از Pool می‌گیرد؛ فایل‌های فیزیکی در MVP موقتاً در Pool Service ذخیره می‌شوند (ر.ک. C8 / §۱۳ blueprint) و در آینده به Storage Service مهاجرت می‌کنند.

### D5. لیست RESERVED و بررسی الگو

- لیست Usernameهای **RESERVED** (ادمین، برند، کلمات ممنوعه) توسط ادمین از طریق Pool API مدیریت می‌شود.
- بررسی الگو (regex) برای جلوگیری از نام‌های توهین‌آمیز یا نقض‌کننده کماکان در user-service اعمال می‌شود (منطق محلی).

### D6. مالکیت Onboarding → IAM

- **State Machine Onboarding** در IAM (یا سرویس Onboarding تخصصی) است.
- user-service صرفاً یک **Projection** از وضعیت Onboarding نگهداری می‌کند و چرخه وضعیت را هدایت نمی‌کند.
- این تضاد در §۱۳ [user-service.md](../../backend/services/user-service.md) اصلاح شد.

### D7. وضعیت حساب (Status) بازتاب‌دهنده IAM است

- user-service مالک وضعیت نیست؛ وضعیت را از IAM بازتاب می‌دهد.
- مقدار اولیه کاربر جدید **همواره `ACTIVE`** است (تضاد با مقدار `PENDING` در blueprint برطرف شد).
- این در §۱۲ [user-service.md](../../backend/services/user-service.md) تثبیت شد.

### D8. پالیسی تغییر Username → IAM Policy Engine

- محدودیت‌های تغییر Username (`max_changes_per_year`, `cooldown_days`, `minimum_account_age`) توسط **IAM Policy Engine** تعریف و اعمال می‌شوند.
- user-service صرفاً نتیجه بررسی پالیسی IAM را اجرا می‌کند و هیچ محدودیتی را هاردکد نمی‌کند.
- این در §۱۶ و §۱۸ [user-service.md](../../backend/services/user-service.md) تثبیت شد.

### D9. پالیسی تغییر Avatar → IAM

- همین سیاست (cooldown، rate_limit، quota) برای تغییر Avatar نیز توسط IAM اعمال می‌شود (ر.ک. §۱۸ [user-service.md](../../backend/services/user-service.md)).

### D10. رویدادهای دامنه (Domain Events)

- رویداد اختصاصی **`nons.user.username.changed`** برای تغییر Username معرفی شد (مشتریان: search-service, notification-service, activity-service, audit-service).
- رویداد `nons.user.profile.changed` دیگر فیلد `username` را در `changed_fields` منتشر نمی‌کند — جلوگیری از انتشار دوگانه (نقض قانون ۵).
- ثبت در [events.yaml](../../../catalog/events/user/events.yaml) و [nons.user.username.changed.md](../../../catalog/events/user/nons.user.username.changed.md).

### D11. Pool به عنوان Shared Service

Pool Service توسط چندین سرویس مصرف می‌شود:
- **user-service:** مواد تولید Username + متادیتای Avatar.
- **currency-service:** Reference Data ارز (ISO 4217, نام، نماد، precision، country mapping) — ر.ک. C9.
- **storage-service (آینده):** مهاجرت فایل‌های فیزیکی آواتار از Pool به Storage.

---

## اصلاحات نسبت به پیش‌نویس اولیه (Scope Modifications)

> این اصلاحات توسط مالک در تایید اولیه اعمال شدند:

- **C8 (Storage):** در MVP فایل‌های فیزیکی آواتار موقتاً در Pool Service ذخیره می‌شوند؛ در blueprint Pool به صراحت یادداشت مهاجرت به Storage Service در فاز بعدی آورده شد.
- **C9 (Currency):** مرز صریح — Pool مالک Reference Data ارز، Currency Service مالک نرخ زنده (live rate / historical).
- **C13 (Task):** تسک token-service پایان یافته است؛ در این فاز فقط مستندات به‌روزرسانی می‌شوند، سپس این ADR، و سپس تسک‌های جدید تعریف می‌شوند. هیچ تسک جدیدی فعلاً ایجاد نمی‌شود.

---

## پیامدها (Consequences)

### پیامدهای مثبت (Positive)
- **Single Source of Truth:** Reference Data و مواد تولید در یک نقطه متمرکز و قابل‌حکمرانی هستند.
- **حکمرانی ادمین:** ادمین می‌تواند لیست کلمات و نام‌های رزرو شده را بدون deploy تغییر دهد.
- **رفع تضاد Onboarding/Status:** مرز مسئولیت بین user-service و IAM صریح شد.
- **عدم انتشار دوگانه:** قانون ۵ رعایت شد.
- **قابلیت مقیاس‌پذیری:** سایر سرویس‌ها (currency, storage) می‌توانند از Pool بهره ببرند.

### پیامدهای منفی (Negative)
- **هزینه ایجاد سرویس جدید:** Pool Service زیرساخت و نگهداری جدید دارد.
- **وابستگی runtime:** user-service برای تولید Username به Pool Service وابسته می‌شود (نیاز به fallback محلی در Consumer برای resilience).
- **کار migration کد:** حذف آرایه‌های hardcoded از `service.go` و seedهای آواتار از `migrations/001_init.sql` به فاز کد موکول شد (طبق C13).

---

## منابع (References)

- [user-service.md](../../backend/services/user-service.md) — §۶/§۷/§۱۲/§۱۳/§۱۵/§۱۶/§۱۸ (تثبیت D2/D6/D7/D8/D9/D10)
- [pool-service/blueprint.md](../../backend/services/pool-service/blueprint.md) — تعریف کامل سرویس (D1/D3/D4/D11)
- [pool-service/README.md](../../backend/services/pool-service/README.md)
- [iam-service.md](../../backend/services/iam-service.md) — مالکیت پالیسی و Onboarding (D6/D8/D9)
- [currency-service.md](../../backend/services/currency-service.md) — مرز Reference Data (C9)
- [events.yaml](../../../catalog/events/user/events.yaml) — تعریف رویدادها (D10)
- [ADR-EVENT-001](./ADR-EVENT-001) — قرارداد نام‌گذاری رویدادها (`nons.<domain>.<entity>.<action>`)
