---
layout: doc
title: معماری صدور و اعتبارسنجی توکن (token-service + login-consent-app)
description: سند تصمیم‌گیری معماری (ADR) درباره لایه توکن OAuth2/OIDC — Ory Hydra به‌عنوان token-service و login-consent-app به‌عنوان سرویس مستقل
version: 1.0.0
status: APPROVED
author: Backend Team
owner: Backend Team
created_at: 2026-07-15
updated_at: 2026-07-15
tags:
  - Backend
  - Architecture
  - Auth
  - Token
  - ADR
reviewers:
  - Backend Team
  - Platform Team
---

# معماری صدور و اعتبارسنجی توکن (token-service + login-consent-app)

**Token Issuance & Validation Architecture — Ory Hydra + login-consent-app**

> **ADR-Backend-006**
>
> این سند **تنها مرجع قطعی (Source of Truth) تصمیمات معماری حوزه توکن** است. تمام تصمیمات قطعی (شامل بایگانی سناریوهای قدیمی) در اینجا ثبت شده‌اند. مستندات سطح پروژه (Blueprint، service doc، task) صرفاً مشخصات فنی را بدون تاریخچه تصمیم‌گیری بازتولید می‌کنند.

---

## وضعیت

**Status**

✅ **تایید شده (APPROVED)**

---

## تاریخ

**Date**

2026-07-15

---

## زمینه

**Context**

لایه احراز هویت NONS از دو مسئولیت مجزا تشکیل شده است که باید از هم تفکیک شوند:

- **هویت و نشست (Identity & Session):** بر عهده `auth-service` (Ory Kratos) — ثبت‌نام، لاگین، MFA، نشست مرورگر.
- **صدور و اعتبارسنجی توکن API (Token Issuance & Validation):** باید از لایه هویت جدا شود تا میکروسرویس‌ها توکن را **stateless و محلی** با JWKS اعتبارسنجی کنند (بدون تماس همزمان با auth-service).

مدیریت توکن‌های OAuth2/OIDC با ابزار آماده **Ory Hydra** انجام می‌شود. استقرار همزمان Kratos (هویت) و Hydra (توکن) طبق الگوی رسمی Ory از یک **واسط Login & Consent** استفاده می‌کند که بین این دو قرار می‌گیرد. این واسط در NONS به صورت سرویس مستقل **`login-consent-app`** پیاده‌سازی می‌شود.

نیاز به یک **سیستم جدید و مستقل**: `login-consent-app` یک سرویس مستقل (مانند `auth-service` و `iam-service`) است — نه بخشی از سرویس دیگر. این سرویس **تنها کد اختصاصی** در حوزه توکن است.

---

## تصمیم معماری

**Decision**

حوزه توکن از دو جزء تشکیل می‌شود:

| مؤلفه | ماهیت | نقش |
|---|---|---|
| `token-service` | ابزار آماده (Ory Hydra، Helm) — **بدون کد اختصاصی** | سرور OAuth2/OIDC، صدور/ابطال توکن، افشای JWKS |
| `login-consent-app` | **سرویس مستقل اختصاصی (Go)** | واسط Login & Consent بین Hydra و Kratos + Token Hook |

### D1 — تفکیک token-service و login-consent-app

- `token-service` = **صرفاً Ory Hydra از طریق Helm**، بدون هیچ wrapper یا کد اختصاصی. Hydra یک باینری کامل است؛ پیچاندن آن نگهداری را سخت می‌کند.
- `login-consent-app` = **سرویس مستقل Go** در `nons-api/services/login-consent-app/` با سه endpoint:
  - `GET /login` — دریافت `login_challenge`، استعلام Kratos `GET /sessions/whoami` (با forward کوکی `ory_kratos_session`)، سپس `PUT .../login/accept` با `subject = <kratos-identity-id>`.
  - `GET /consent` — accept برای first-party (با `skip_consent`).
  - `POST /token-hook` — غنی‌سازی claims (نقش از iam-service) پیش از صدور توکن.
- **نباید** داخل `auth-service` قرار گیرد: auth-service مسئول هویت است، login-consent-app مسئول واسطگری Hydra↔Kratos — ترکیب آن‌ها coupling ایجاد می‌کند و تعویض IdP را سخت می‌کند.

### D2 — URLهای Login / Consent / Logout

در پیکربندی Hydra، `urls.login` / `urls.consent` / `urls.logout` باید به endpointهای **`login-consent-app`** اشاره کنند (الگوی استاندارد Ory، مثال رسمی `hydra-login-consent-node`) — نه `auth-service`.

```yaml
urls:
  self:
    issuer: ${HYDRA_ISSUER}
  login: http://login-consent-app:3002/login
  consent: http://login-consent-app:3002/consent
  logout: http://login-consent-app:3002/logout
```

### D3 — عمر توکن (TTL)

| توکن | عمر |
|---|---|
| `access_token` | **15m** |
| `refresh_token` | **720h / 30 روز** (با rotation فعال) |
| `id_token` | **15m** |

Hydra همچنین امکان تنظیم TTL به‌ازای هر client را از طریق API فراهم می‌کند.

### D4 — ایزوله‌سازی Hydra Admin API

Hydra Admin API (port 4445) **هیچ احراز داخلی ندارد** ("None of the administrative endpoints have any built-in access control"). بنابراین امنیت آن در سطح شبکه اعمال می‌شود:

- **MVP:** Kubernetes **NetworkPolicy** — فقط Pod دارای Label `app=login-consent-app` مجاز به دسترسی به port 4445 است (`deploy/helm/hydra/templates/networkpolicy.yaml`).
- **Roadmap (Hardening):** پیاده‌سازی **mTLS** بین login-consent-app و Hydra Admin.
- استفاده از OAuth2 Client Credentials / scope برای محافظت Admin API **رد شد** — برای Hydra معنا ندارد.

### D5 — رویدادهای حوزه توکن (Event Catalog)

دامنه رویداد `token` بخشی از Event Catalog رسمی است (طبق ADR-EVENT-001). تعریف رسمی در `nons-api/catalog/events/token/events.yaml`:

| رویداد | زمان صدور | مصرف‌کنندگان |
|---|---|---|
| `nons.token.issued` | پس از صدور موفق access/refresh token | audit-service, analytics-service |
| `nons.token.revoked` | پس از ابطال توکن / logout | audit-service, iam-service |

### D6 — تفکیک عملیات OAuth2 از Permissionها

عملیات استاندارد OAuth2 شامل **صدور (Issue)، تمدید (Refresh) و تبادل (Exchange)** توکن **جزء Permissionهای سامانه نیستند** — توسط Hydra و مطابق پروتکل OAuth2 کنترل می‌شوند و نباید در `permissions.proto` مدل شوند.

تنها عملیات مدیریتی مربوط به Token که نیازمند مجوز سطح سامانه است:

- **`token.revoke:any`** — ابطال توکن **سایر کاربران**؛ صرفاً برای نقش Administrator، ثبت‌شده در IAM (طبق `permission-contract-standard.md`).

پیامد: صدور/تمدید/ابطال توکن توسط **خود کاربر** نیاز به Permission ندارد؛ ابطال توکن سایر کاربران نیازمند `token.revoke:any` (Admin).

### D7 — Issuer محیط‌محور و صرفاً از طریق Gateway

Hydra در تمام محیط‌ها **صرفاً از طریق API Gateway** در دسترس است؛ هیچ Client مجاز به ارتباط مستقیم نیست. `urls.self.issuer` باید مسیر Gateway را منعکس کند تا claim `iss` در همه محیط‌ها یکسان باشد:

- **Development:** `http://localhost:8080/v1/auth/hydra`
- **Production / Staging:** `https://api.nons.ir/v1/auth/hydra`

تنها دامنه تغییر می‌کند؛ ساختار مسیر (`/v1/auth/hydra`) ثابت است.

> **نسخه Hydra:** به دلیل رفع باگ custom-domain issuer/audience در Hydra OEL، نسخه باید **≥ v26.2.1 (OEL)** باشد.

### D8 — مدیریت کلیدهای JWKS

- **الگوریتم:** RS256.
- **بدون نیاز به Kubernetes Secret** — Hydra کلیدها را در `hydra_db` مدیریت می‌کند و از `/.well-known/jwks.json` expose می‌کند؛ کلیدهای قدیمی حفظ می‌شوند تا میکروسرویس‌های cache شده بدون قطعی کار کنند.
- **چرخش:** دستی از طریق Hydra CLI توسط CronJob 90 روزه:
  ```bash
  hydra create jwks --endpoint=http://hydra-admin:4445/ hydra.openid.id-token --alg RS256
  hydra create jwks --endpoint=http://hydra-admin:4445/ hydra.jwt.access-token --alg RS256
  ```

### D9 — ثبت OAuth2 Clients

- **first-party** (web-frontend، mobile-app): ثبت **static** از طریق Helm/CLI — قابل audit، بدون نیاز به expose کردن Admin API.
- **third-party:** DCR (Dynamic Client Registration) فقط در صورت نیاز — خارج از MVP. در آن صورت `/clients` باید با Gateway محافظت شود.
- `skip_consent: true` برای first-party باید **صریحاً** در تنظیمات Hydra client تنظیم شود (خودکار نیست).

---

## گزینه‌های بررسی‌شده

**Alternatives Considered**

| گزینه | نتیجه | دلیل |
|---|---|---|
| تعلیق Hydra (Deferred) و ادامه session-cookie-only | **رد شد (Rejected)** — رجوع به بایگانی A1 | نیاز به توکن‌های استاندارد API برای اعتبارسنجی stateless |
| پیچاندن Hydra (wrapper code در token-service) | **رد شد** | نگهداری سخت؛ Hydra باینری کامل است |
| محافظت Admin API با OAuth2 scope | **رد شد** | Hydra Admin هیچ auth داخلی ندارد؛ scope معنا ندارد |
| Redis blacklist برای ابطال آنی JWT | **خارج از MVP** | انقضای طبیعی access_token (۱۵ دقیقه) طبق ADR-Gateway-001 کافی است |

---

## پیامدها

**Consequences**

### پیامدهای مثبت

- اعتبارسنجی محلی و stateless توکن با JWKS در تمام میکروسرویس‌ها.
- تفکیک تمیز لایه هویت (Kratos) از لایه توکن (Hydra) — تعویض هر کدام بدون تأثیر روی دیگری.
- کمترین کد اختصاصی (فقط login-consent-app) و استفاده از ابزارهای آماده.

### پیامدهای منفی / هزینه عملیاتی

- نگهداری login-consent-app (تنها کد اختصاصی دامنه).
- چرخش دستی JWKS (CronJob) و NetworkPolicy برای Hydra Admin.
- وابستگی به نسخه Hydra ≥ v26.2.1 (OEL) برای issuer محیط‌محور.

---

## بایگانی تصمیمات قبلی (Old Scenario Archive)

**Prior Scenario Archive — فقط در این ADR نگهداری می‌شود**

این بخش تنها محل بایگانی تاریخچه تصمیمات قدیمی است. مستندات سطح پروژه (Blueprint، service doc، task) نباید شامل این تاریخچه باشند.

### A1 — تعلیق Hydra (Hydra Deferred)

تصمیم اولیه در `ADR-Backend-001` (نسخه ۱.۰.۰، ۱۴۰۵/۰۳/۲۳) مبنی بر «تعلیق (Deferred) استقرار Ory Hydra و ادامه session-cookie-only» **لغو (Reversed)** شد. دلیل: نیاز به توکن‌های استاندارد OAuth2/OIDC برای اعتبارسنجی stateless در میکروسرویس‌ها. Hydra اکنون به عنوان `token-service` رسمی پذیرفته شده است.

### A2 — فقط کوکی نشست (Session-Cookie-Only)

تصمیم اولیه در `ADR-Backend-003` مبنی بر عدم صدور JWT و تکیه بر کوکی نشست (بدون لایه توکن) **لغو (Reversed)** شد. دلیل: همان A1 — جداسازی لایه توکن و صدور JWT از طریق Hydra جایگزین شد.

> یادداشت: ویرایش‌های موضعی مرتبط قبلاً در `ADR-Backend-001` / `ADR-Backend-003` اعمال شده‌اند؛ این ADR مرجع قطعی و یکپارچه تصمیمات حوزه توکن است.

### منابع بازخورد خارجی (Ory Support — بایگانی‌شده)

بازخورد پشتیبانی Ory که منجر به شفاف‌سازی جزئیات فنی شد (Login & Consent flow، forward کوکی `ory_kratos_session`، `skip_consent` صریح، یک‌بارمصرف بودن challenge، OAuth2 Token Hook، ترتیب logout، اجباری‌بودن PKCE برای public clients) پیش‌تر در فایل‌های `gom.md` / `gom2.md` / `gom3.md` ثبت بود. این فایل‌ها در سطح پروژه حذف شدند و محتوای تصمیم‌گیری آن‌ها در D1–D9 و A1–A2 فوق ادغام گردید.

---

## تصمیم نهایی

**Final Decision**

معماری توکن NONS بر پایه **Ory Hydra (token-service، Helm، بدون wrapper) + login-consent-app (سرویس مستقل Go، واسط Login & Consent + Token Hook) + Kratos (auth-service، هویت/نشست)** است. تمام تصمیمات D1–D9 قطعی و لازم‌الاجرا هستند. مشخصات فنی کامل در Blueprint سرویس (`nons-api/services/token-service/blueprint.md`) و مستند سرویس (`dotdive/docs/team/backend/services/token-service.md`) ثبت شده‌اند.
