---
layout: doc
title: انتخاب پلتفرم احراز هویت و هویت کاربری
description: مستند تصمیم‌گیری معماری (ADR) درباره انتخاب پلتفرم احراز هویت و هویت کاربری در پلتفرم NONS
version: 1.0.0
status: APPROVED
author: Backend Team
owner: Backend Team
created_at: 2026-06-13
updated_at: 2026-07-14
tags:
  - Backend
  - Architecture
  - Auth
  - ADR
reviewers:
  - Backend Team
---

# انتخاب پلتفرم احراز هویت و هویت کاربری

**Authentication & Identity Platform Selection**

> **ADR-Backend-001**

> **بروزرسانی ۱۴۰۵/۰۴/۲۳ (بایگانی در ADR-Backend-006 / بخش Archive A1):** تصمیم تعلیق Hydra (Deferred) طبق ADR-Backend-006 و Blueprint v3.3 لغو شد. **Ory Hydra اکنون به عنوان `token-service` (سرور OAuth2/OIDC رسمی) پذیرفته شده است.** بخش‌های مربوط به تعلیق Hydra و session-cookie-only با معماری جدید جایگزین شده‌اند — رجوع به `nons-api/services/token-service/blueprint.md` و `ADR-Backend-006.md`.

---

## وضعیت

**Status**

✅ **تایید شده (APPROVED)**

---

## تاریخ

**Date**

2026-06-13 (به‌روزرسانی شده در 2026-06-21)

---

## زمینه

**Context**

پلتفرم NONS به یک سامانه احراز هویت نیاز دارد که:
- مستقل از سرویس‌های خارجی باشد.
- قابلیت استقرار کامل در زیرساخت اختصاصی را داشته باشد.
- از امنیت و پایداری بالایی برخوردار باشد.
- با معماری Microservice و سیستم مسیریابی Gateway سازگار باشد.
- وابستگی به Vendor خاص ایجاد نکند.
- برای استفاده در محیط Production قابل اعتماد و اثبات‌شده باشد.

در فازهای نخست، گزینه‌های متعددی چون SuperTokens بررسی شدند، اما به دلیل وابستگی به سرورهای خارجی رد گردیدند. همچنین استقرار همزمان زوج Ory Kratos (برای هویت) و Ory Hydra (برای توکن‌های OAuth2/OIDC) مورد تصمیم‌گیری قرار گرفت. پیچیدگی‌های عملیاتی اولیهٔ Hydra (امضاهای دیجیتال، توزیع JWKS، چرخش توکن) با الگوهای استاندارد Ory (login-consent-app + چرخش کلید) قابل مدیریت تشخیص داده شد و در نهایت Hydra به عنوان `token-service` رسمی پذیرفته شد (رجوع به Blueprint v3.2).

---

## تصمیم معماری

**Decision**

پلتفرم NONS از موتور **Ory Kratos** به همراه یک **سرویس اختصاصی احراز هویت (Go Auth Service)** بر پایه معماری **نشست‌محور (Session-Cookie Based)** و اعتبارسنجی درگاه با استفاده از **Traefik ForwardAuth** استفاده می‌کند.

اجزای اصلی لایه احراز هویت فعلی عبارتند از:

### اوری کراتوس

**Ory Kratos**

مسئول:
- مدیریت مشخصات وTraits کاربران (ایمیل، نام و وضعیت اونبوردینگ).
- ثبت‌نام و ایجاد هویت‌های جدید (Auto Sign-Up).
- احراز هویت بدون رمز عبور (Magic Code/OTP).
- ورود با گوگل (Google OIDC).
- مدیریت نشست‌های کاربری (Browser Sessions).

### سرویس احراز هویت

**Auth Service**

سرویس سبک نوشته شده با Go که:
- صفحات ورود، ثبت‌نام و داشبورد را در داخل خود رندر و به کاربر ارائه می‌دهد (بدون وابستگی به فرانت‌اند خارجی).
- فلوهای ورود و ثبت‌نام یکپارچه را به موتور Kratos پروکسی می‌کند.
- نقطه پایانی `/v1/auth/validate` را جهت اعتبارسنجی نشست‌های کاربری برای درگاه Traefik Gateway فراهم می‌سازد.

### وضعیت Ory Hydra (به‌روزرسانی ۱۴۰۵/۰۴/۲۳)

تصمیم قبلی مبنی بر «تعلیق (Deferred) استقرار Ory Hydra» **لغو شد**. طبق ADR-Backend-006 و Blueprint v3.3، **Ory Hydra اکنون به عنوان `token-service` (سرور رسمی OAuth2/OIDC) پذیرفته شده است** و مسئول صدور/ابطال توکن‌های API است. احراز هویت مرورگر همچنان بر عهدهٔ Kratos + Traefik ForwardAuth باقی می‌ماند؛ صدور توکن‌های استاندارد API بر عهدهٔ Hydra است. واسط بین این دو از طریق `login-consent-app` (سرویس مستقل Go) انجام می‌شود.

---

## اصول معماری

**Architecture Principles**

### اولویت استقرار محلی و معماری کلاستر (D13, D15)

**Self Hosted First & Cluster Architecture**

تمام اجزای احراز هویت در کلاستر Kubernetes (K3s در پروداکشن و K3d در محیط توسعه) مستقر می‌شوند (D13) و فرآیند مدیریت آن‌ها با Helm انجام می‌گیرد (D15). هیچ وابستگی به سرویس‌های هویت خارجی (مانند Auth0) وجود ندارد.

### امنیت در درگاه Gateway

**Gateway Security**

درگاه Gateway (Traefik) با استفاده از مکانیزم ForwardAuth هر درخواست ورودی به مسیرهای محافظت‌شده را به صورت محلی به `auth-service` هدایت کرده تا از وجود نشست معتبر اطمینان حاصل کند.

---

## گزینه‌های بررسی شده

**Alternatives Considered**

### سوپرتوکنز

**SuperTokens**

- **نتیجه:** رد شد (Rejected) - به دلیل وابستگی عملیاتی بالا به سرورهای ابری خارجی.

### کی‌کلاک

**Keycloak**

- **نتیجه:** انتخاب نشد (Not Selected) - به دلیل حجم زیاد قابلیت‌های غیرضروری و منابع سنگین مورد نیاز در کلاستر.

---

## پیامدها

**Consequences**

### پیامدهای مثبت

**Positive Consequences**

- اعتبارسنجی محلی توکن‌های API توسط میکروسرویس‌ها با JWKS (بدون تماس همزمان با auth-service).
- ساده‌سازی مکانیزم اعتبارسنجی هویت با اتکا به نشست‌های استاندارد Kratos.
- بهبود تجربه توسعه با مدیریت متمرکز صفحات ورود و ثبت‌نام در قالب‌های سبک Go.

### پیامدهای منفی

**Negative Consequences**

- نیاز به مدیریت عملیاتی Hydra (چرخش کلید JWKS، NetworkPolicy برای Admin API، نگهداری login-consent-app) — از طریق Helm و CronJob در Blueprint v3.2 پوشش داده شد.

---

## تصمیم نهایی

**Final Decision**

معماری احراز هویت NONS بر پایه **Ory Kratos (هویت/نشست) + Hydra (token-service / OAuth2-OIDC) + Auth Service (Go) + Traefik ForwardAuth** مستقر و نهایی گردیده است. واسط بین Kratos و Hydra از طریق `login-consent-app` (سرویس مستقل Go) انجام می‌شود. این معماری استقلال کامل، صدور توکن‌های استاندارد و اعتبارسنجی محلی را تضمین می‌کند (رجوع به Blueprint v3.3 و ADR-Backend-006).
