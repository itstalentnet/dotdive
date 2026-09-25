---
layout: doc
title: یکپارچه‌سازی استراتژی احراز هویت
description: ADR برای تصویب استراتژی یکپارچه احراز هویت شامل Canonical Identity, Magic Code, Google Login, حذف Password/Discord
version: 1.0.0
status: APPROVED
author: Antigravity
owner: Backend Team
created_at: 2026-06-18
updated_at: 2026-06-18
tags:
  - Backend
  - Architecture
  - Auth
  - ADR
reviewers:
  - Backend Team
  - Product Team
  - Devops
---

# یکپارچه‌سازی استراتژی احراز هویت

**Authentication Strategy Consolidation**

> **ADR-Backend-005** — جایگزین و تکمیل‌کننده ADR-Backend-002 در بخش‌های مربوط به روش‌های احراز هویت

---

## وضعیت

**Status**

✅ **تایید شده (APPROVED)**

---

## تاریخ

**Date**

2026-06-18

---

## زمینه

**Context**

پس از تحلیل معماری فعلی و بررسی گزینه‌های مختلف (Discovery Report)، تصمیمات نهایی زیر برای یکپارچه‌سازی استراتژی احراز هویت پلتفرم NONS اتخاذ شده است. این تصمیمات جایگزین و تکمیل‌کننده بخش‌های مربوط به روش‌های احراز هویت در ADR-Backend-002 هستند.

---

## تصمیمات معماری

**Decisions**

### A1 — Email به عنوان شناسه اصلی کاربر (Canonical Identity)

در کل پلتفرم:

- **Email** شناسه یکتا و دائمی کاربر است.
- هیچ Provider هویتی مالک حساب نیست.
- Google فقط یک روش احراز هویت است.
- یک حساب کاربری = یک ایمیل.

### A2 — حذف مفهوم Registration از UX

پلتفرم مفهومی به نام Sign Up، Registration یا Create Account در رابط کاربری نخواهد داشت. رفتار سیستم:

- اگر ایمیل وجود نداشت → حساب ایجاد شود.
- اگر ایمیل وجود داشت → ورود انجام شود.
- تجربه کاربر همیشه «ورود به NONS» است.

### A3 — روش‌های ورود MVP

1. **Magic Code (Primary):** ورود با ایمیل + کد یکبار مصرف — بدون رمز عبور.
2. **Google Login (Secondary):** ورود با حساب Google. در صورت تطبیق ایمیل، حساب‌ها ادغام می‌شوند.

### A4 — حذف Password Authentication

رمز عبور بخشی از MVP نیست. دلایل:
- افزایش سطح حمله
- نیاز به بازیابی رمز
- نیاز به سیاست‌های پیچیده امنیتی
- تجربه کاربری ضعیف‌تر نسبت به Magic Code

### A5 — حذف Discord Authentication

Discord Login از نقشه راه فعال حذف شود. دلایل:
- عدم تضمین تأییدشدگی ایمیل در تمام سناریوها
- پیچیدگی لینک حساب‌ها
- ارزش پایین نسبت به Google

### A6 — Magic Code به جای Magic Link

روش رسمی ورود بدون رمز: **Magic Code** — نه Magic Link. دلایل:
- تجربه یکسان در دسکتاپ و موبایل
- عدم وابستگی به باز شدن ایمیل روی همان دستگاه
- عدم جابه‌جایی ناخواسته بین دستگاه‌ها

### A7 — تشخیص کاربران جدید (Onboarding Detection)

پس از اولین ورود موفق، سیستم باید بتواند تشخیص دهد کاربر جدید است یا بازگشتی. در MVP فقط ثبت وضعیت کافی است.

### A8 — معماری آینده

- **Phase Future — Passkeys:** پشتیبانی از Passkey و WebAuthn به عنوان Credential ثانویه.
- **Phase Future — MFA:** پشتیبانی از TOTP و Authenticator Apps به عنوان لایه امنیتی اختیاری.
- **Phase Future — Transaction Verification:** برای عملیات حساس (Withdrawal, Payout, Settlement) امکان فعال‌سازی TOTP یا Passkey Confirmation.

---

## پیامدها

**Consequences**

### پیامدهای مثبت

- **حذف سطح حمله:** عدم ذخیره‌سازی رمز عبور، خطر افشای credentialهای احراز هویت را به حداقل می‌رساند.
- **UX یکپارچه:** کاربران بدون نیاز به انتخاب بین «ورود» و «ثبت‌نام» از یک مسیر واحد استفاده می‌کنند.
- **انعطاف‌پذیری:** افزودن روش‌های جدید (Passkey, TOTP) در آینده بدون تغییر معماری هسته امکان‌پذیر است.
- **سادگی پیاده‌سازی:** Kratos به صورت بومی از OIDC و Code method پشتیبانی می‌کند.

### پیامدهای منفی

- **حذف Discord:** کاربرانی که تنها حساب Discord دارند، نمی‌توانند با آن وارد شوند.
- **وابستگی به ایمیل:** کاربران بدون دسترسی به ایمیل، قادر به ورود نخواهند بود (نیاز به راهکار جایگزین در آینده).
- **تغییر در Kratos Config:** نیاز به فعال‌سازی `code` و `oidc` methods و غیرفعال‌سازی `password`.

---

## اسناد متأثر

**Impacted Documents**

- ADR-Backend-002 — بازنویسی بخش روش‌های احراز هویت
- auth-service.md — حذف password, افزودن Magic Code + Google
- platform/Architecture.md — بروزرسانی لایه هویت
- backend/roadmap.md — تغییر M1.1
- authentication_authorization_flow.md — بروزرسانی دیاگرام
- gateway/blueprint.md — بروزرسانی جریان ورود
- gateway/README.md — بروزرسانی سناریوی ورود
- security-policy.md — به‌روزرسانی سیاست JWT
- frontend/index.md — افزودن استانداردهای UX برای ورود یکپارچه
