---
layout: doc
title: استاندارد نهایی نام‌گذاری رویدادها
description: تصمیم معماری برای تعیین الگوی رسمی نام‌گذاری، دامنه‌ها، فرمت افعال، نسخه‌بندی و منبع حقیقت رویدادهای پلتفرم
version: 1.0.0
status: DRAFT
author: Antigravity
owner: Platform Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - ADR
  - Event
  - Naming
  - Standard
  - Platform
reviewers:
  - Platform Team
  - Backend Team
  - Devops
---

# استاندارد نهایی نام‌گذاری رویدادها

**Event Naming & Versioning Final Standard**

> **ADR-EVENT-001**

---

## وضعیت

**Status**

⏳ **پیش‌نویس (DRAFT)**

---

## تاریخ

**Date**

2026-06-15

---

## زمینه

**Context**

پلتفرم NONS بر پایه معماری رویدادمحور (Event-Driven Architecture) طراحی شده است. تمام ارتباطات بین سرویس‌ها از طریق NATS JetStream و در قالب رویداد انجام می‌شود.一致性 و یکپارچگی در نام‌گذاری رویدادها برای درکپذیری، اشکال‌زدایی و نگهداری بلندمدت حیاتی است.

در مستندات فعلی پروژه سه استاندارد نام‌گذاری با تضادهای مشخص وجود دارد:

| سند | الگو | مثال |
| --- | --- | --- |
| `standards/event-standard.md` (خط ۱۶۰) | `nons.<domain>.<entity>.<action>` | `nons.order.completed` |
| `standards/naming-conventions.md` (خط ۱۳۸) | `nons.{resource}.{past_tense_verb}` | `nons.payment.escrow.held` |
| `standards/event-contract.md` (خط ۱۶۹) | `nons.<domain>.<entity>.<action>` | `nons.payment.escrow.released` |

همچنین در `packages/events/src/events.ts` دو دسته نام وجود دارد — دسته‌ای با پیشوند `nons.` و دسته‌ای بدون آن (`user.registered`, `platform.service.status_changed`). این تضادها توسعه‌دهنده را در نام‌گذاری رویدادهای جدید سردرگم می‌کند و مانع یکپارچگی پلتفرم می‌شود.

---

## مسئله

**Problem Statement**

الگوی نام‌گذاری رویدادها باید:
- یکتا و قابل پیش‌بینی باشد — توسعه‌دهنده بتواند نام رویداد جدید را بدون مراجعه به سند حدس بزند.
- از collision با رویدادهای خارج از پلتفرم جلوگیری کند.
- قابلیت مسیریابی با wildcard در NATS را حفظ کند (`nons.>.created`).
- از بسط‌پذیری برای sub-entityها پشتیبانی کند (`nons.payment.escrow.held`).
- با ابزارهای Cross-Cutting مانند Telemetry, Audit Log و Alerting سازگار باشد.

---

## گزینه‌های بررسی‌شده

**Alternatives Considered**

### گزینه ۱ — الگوی ساده `{verb}.{resource}` (بدون پیشوند)

مانند `user.registered`, `order.created`.

**مزایا:**
- بسیار کوتاه و خواناتر.

**معایب:**
- خطر collision با کتابخانه‌ها یا ابزارهای خارجی.
- عدم تفکیک domain — `user.registered` مشخص نمی‌کند کدام سرویس صادر کرده است.
- مشکل در Wildcard — `*.registered` همه رویدادهای ثبت‌نام را یکسان می‌گیرد.

**نتیجه:** رد شد.

---

### گزینه ۲ — الگوی `nons.{domain}.{entity}.{action}` با فعل حال

مانند `nons.order.complete`, `nons.user.register`.

**مزایا:**
- خوانایی بالا برای انگلیسی‌زبانان.

**معایب:**
- فعل حال (`register`) مفهوم Command را منتقل می‌کند نه Event.
- در معماری Event-Driven، رویداد باید حقیقتی از گذشته باشد (`registered` نه `register`).
- مصرف‌کننده ممکن است تصور کند باید اقدامی انجام دهد.

**نتیجه:** رد شد.

---

### گزینه ۳ — الگوی `nons.{domain}.{entity}.{past_action}` ✅

مانند `nons.auth.user.registered`, `nons.order.fulfillment.completed`.

**مزایا:**
- پیشوند `nons.` از collision جلوگیری می‌کند.
- domain اولین بخش معنی‌دار — امکان wildcard روی domain.
- entity اختیاری — برای domainهای ساده حذف می‌شود.
- فعل گذشته مفهوم Event را به درستی منتقل می‌کند.
- sub-entity با dot قابل افزودن است (`nons.payment.escrow.held`).
- حداکثر عمق ۴ بخش بعد از `nons.` از پیچیدگی جلوگیری می‌کند.

**نتیجه:** ✅ پذیرفته شد.

---

## تصمیم

**Decision**

### الگوی رسمی نام‌گذاری رویدادها

```text
nons.<domain>.<entity>.<past_action>
```

- `nons.` — پیشوند ثابت (اجباری برای همه رویدادهای پلتفرم)
- `<domain>` — bounded context یا نام سرویس مالک (مفرد، kebab-case)
- `<entity>` — موجودیت اصلی رویداد (مفرد، اختیاری)
- `<past_action>` — فعل گذشته ساده (lowercase، جداکننده کلمات: `_`)

### دامنه‌های مصوب (Domains)

| Domain | سرویس مالک | توضیح |
| ------ | ---------- | ----- |
| `auth` | auth-service | احراز هویت — ثبت‌نام، ورود، خروج، تغییر رمز |
| `iam` | iam-service | مدیریت نقش‌ها، مجوزها و سیاست‌های دسترسی |
| `user` | user-service | پروفایل، شناسه عمومی، Username، تنظیمات شخصی |
| `marketplace` | marketplace-service | محصولات، فروشگاه‌ها، موجودی |
| `order` | order-service | سفارشات، وضعیت‌ها |
| `payment` | payment-service | پرداخت، اسکرو |
| `wallet` | wallet-service | کیف پول، تراکنش‌ها |
| `settlement` | settlement-service | تسویه، کمیسیون |
| `currency` | currency-service | نرخ ارز |
| `chat` | chat-service | پیام‌ها |
| `dispute` | dispute-service | اختلافات، داوری |
| `review` | review-service | بازخوردها |
| `moderation` | moderation-service | نظارت |
| `zone` | zone-service | حوزه تخصصی |
| `boost` | boost-service | تبلیغات |
| `search` | search-service | جستجو |
| `notification` | notification-service | اعلانات |
| `storage` | storage-service | ذخیره‌سازی فایل |
| `analytics` | analytics-service | تحلیل |
| `kyc` | kyc-service | احراز هویت مشتریان |
| `platform` | core-service | رویدادهای سطح زیرساخت |

> **قانون:** domain جدید فقط با ADR جدید قابل اضافه شدن است.

> **تغییر نسخه 1.1 — 2026-06-22:** دامنه `user` به لیست دامنه‌های مصوب اضافه شد. مالک: `user-service`. این تصمیم به دلیل جداسازی مسئولیت پروفایل و هویت نمایشی کاربر از IAM Service اتخاذ شد — IAM فقط مالک Authorization (Role, Permission, Policy) است.

> **تغییر نسخه 1.2 — 2026-06-22:** دامنه `iam` مطابق Blueprint v1.1 بازنگری شد. رویدادهای IAM از الگوی `nons.iam.<entity>.<past_action>` پیروی می‌کنند که در `<past_action>` از underscore (`_`) برای کلمات چندبخشی استفاده می‌شود (مثلاً `nons.iam.user.status_changed`). مستندات کامل رویدادها در [ایونت کاتالوگ IAM](../../../../nons-api/catalog/events/iam/events.yaml).

### نسخه‌بندی

نسخه **فقط در Envelope** قرار می‌گیرد، هرگز در NATS Subject:

```
❌ nons.order.completed.v1
✅ nons.order.completed   (version داخل Envelope)
```

فرمت: `major.minor` — minor برای افزودن فیلد اختیاری، major برای تغییرات ناسازگار.

### منبع حقیقت (Source of Truth)

```text
Proto (envelope.proto)    → ساختار EventEnvelope
        ↓
Event Catalog (catalog/)  → ثبت نام، domain، owner، consumers، schema
        ↓
Code Bindings (events.ts) → ثابت‌های TypeScript
```

---

## پیامدها

**Consequences**

### پیامدهای مثبت

- **یکپارچگی:** همه رویدادها از یک الگو پیروی می‌کنند — دیگر تضاد نام وجود ندارد.
- **Wildcard-friendly:** `nons.auth.>.registered` تمام رویدادهای ثبت‌نام در Auth را می‌گیرد.
- **Self-documenting:** نام رویداد domain، entity و ماهیت تغییر را مشخص می‌کند.
- **بازدارنده از collision:** `nons.` یک namespace انحصاری پلتفرم است.

### پیامدهای منفی

- **تغییر نام رویدادهای موجود:** ۴ رویداد Auth (بدون `nons.`) و ۱ رویداد Platform باید تغییر نام دهند.
- **نیاز به بروزرسانی استانداردهای موجود:** `standards/event-standard.md` و `standards/naming-conventions.md` باید با این ADR هماهنگ شوند.
- **هزینه مهاجرت:** سرویس‌هایی که رویدادهای قدیمی را مصرف می‌کنند باید همزمان هر دو نام را پشتیبانی کنند.

---

## نتیجه

**Conclusion**

الگوی `nons.<domain>.<entity>.<past_action>` به عنوان استاندارد رسمی نام‌گذاری رویدادهای پلتفرم NONS تصویب می‌شود. این الگو جایگزین تمام استانداردهای قبلی می‌شود و تمام رویدادهای جدید باید از آن پیروی کنند.

لایه‌های Source of Truth به ترتیب Proto → Event Catalog → Code Bindings هستند و هیچ رویداد جدیدی بدون ثبت در هر سه لایه مجاز نیست.
