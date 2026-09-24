---
layout: doc
title: Login-Consent App
description: سرویس واسط مستقل بین Ory Hydra و Ory Kratos (Login & Consent flow + Token Hook)
version: 1.0.0
status: APPROVED
author: Backend Team
owner: Backend Team
created_at: 2026-07-15
updated_at: 2026-07-15
tags:
  - Backend
  - Service
  - Auth
  - Token
reviewers:
  - Backend Team
  - Platform Team
---

# Login-Consent App

**Login-Consent App — واسط مستقل Login & Consent (Ory Hydra ↔ Ory Kratos)**

> این سرویس **تنها کد اختصاصی** در حوزه توکن است. مستقل از `token-service` (Hydra) و `auth-service` (Kratos) عمل می‌کند.
> مرجع تصمیمات: [`ADR-Backend-006`](../../backend/ADR/ADR-Backend-006) — مشخصات فنی: [`blueprint.md` (token-service) §۲، §۳.۲، §۴](../services/token-service.md)

---

## ۱. هدف سرویس

**Service Objective**

`login-consent-app` سرویس اختصاصی Go است که طبق الگوی رسمی Ory، بین **Ory Hydra** (صدور توکن) و **Ory Kratos** (هویت/نشست) قرار می‌گیرد و جریان‌های **Login & Consent** و **Token Hook** را پیاده‌سازی می‌کند. این سرویس:

- نشست Kratos را تأیید می‌کند و subject را به Hydra معرفی می‌کند.
- consent را برای first-party clients مدیریت می‌کند.
- claims توکن را پیش از صدور غنی‌سازی می‌کند (نقش از iam-service).

**مسیر کد:** `nons-api/services/login-consent-app/`

---

## ۲. چرا سرویس مستقل؟

**Why a Standalone Service**

- auth-service مسئول هویت است؛ login-consent-app مسئول **واسطگری Hydra↔Kratos** — ترکیب آن‌ها coupling ایجاد می‌کند.
- اگر IdP (Kratos) در آینده عوض شود، فقط login-consent-app تغییر می‌کند، نه auth-service و نه token-service.
- Kratos Admin API و Hydra Admin API از این واسط ایزوله می‌شوند.
- طبق [`ADR-Backend-006`](../../backend/ADR/ADR-Backend-006) (D1)، login-consent-app یک سرویس مستقل مانند auth-service و iam-service است — نه بخشی از سرویس دیگر.

---

## ۳. مسئولیت‌ها

**Responsibilities**

- پیاده‌سازی endpoint `/login` — دریافت `login_challenge`، استعلام نشست Kratos، accept کردن Login Request در Hydra.
- پیاده‌سازی endpoint `/consent` — accept کردن Consent Request برای first-party (با `skip_consent`).
- پیاده‌سازی endpoint `/token-hook` — دریافت session context از Hydra و بازگرداندن JSON حاوی claims غنی‌شده.
- انتشار رویدادهای `nons.token.issued` / `nons.token.revoked` به NATS (از طرف حوزه توکن).
- اجرای ترتیب صحیحLogout (ابتدا Hydra revoke، سپس Kratos logout).

---

## ۴. خارج از مسئولیت‌ها

**Non-Responsibilities**

- **صدور توکن:** بر عهده Hydra (token-service) است — login-consent-app صرفاً واسط است.
- **مدیریت هویت و نشست:** بر عهده Kratos (auth-service) است.
- **مدیریت نقش‌ها/مجوزها:** بر عهده iam-service است؛ login-consent-app فقط claims را از آن دریافت و به توکن تزریق می‌کند.

---

## ۵. جریان‌های اصلی

**Core Flows**

### ۵.۱ Login Flow

```
[مرورگر] → GET /oauth2/auth → [Hydra]
[Hydra] → 302 → [login-consent-app]/login?login_challenge=<X>
[login-consent-app] → GET /admin/oauth2/auth/requests/login?login_challenge=<X> → [Hydra Admin]
[login-consent-app] → GET /sessions/whoami (Cookie: ory_kratos_session) → [Kratos Public]
  ├─ نشست معتبر:
  │   [login-consent-app] → PUT /admin/oauth2/auth/requests/login/accept
  │                          {subject: "<kratos-identity-id>", remember: true}
  │   [Hydra] → 302 → [login-consent-app]/consent?consent_challenge=<Y>
  └─ نشست نامعتبر:
      [login-consent-app] → 302 → [Kratos Login]
```

**نکات حیاتی:**
- **کوکی `ory_kratos_session` باید forward شود** (درخواست از کاربر به whoami Kratos). بدون آن whoami همیشه ۴۰۱ است.
- **`subject` = Kratos Identity ID** (identity.id)، نه email/username.
- **هر login_challenge یک‌بار مصرف.** خطا → restart flow.

### ۵.۲ Consent Flow

- برای first-party clients، `skip_consent: true` در Hydra client تنظیم شده → login-consent-app مستقیماً `PUT .../consent/accept` را فراخوانی می‌کند.
- برای third-party (آینده)، login-consent-app صفحه consent را رندر و پس از تأیید کاربر accept می‌کند.

### ۵.۳ Token Hook (Claims Enrichment)

پیش از صدور توکن، Hydra POST به `http://login-consent-app:PORT/token-hook` می‌زند. login-consent-app:

1. session object را از Hydra دریافت می‌کند.
2. نقش کاربر را از iam-service استعلام می‌کند.
3. JSON حاوی claims غنی‌شده (نقش، سطح دسترسی) برمی‌گرداند تا در توکن inject شود.

```yaml
oauth2:
  token_hook:
    url: http://login-consent-app:PORT/token-hook
```

---

## ۶. امنیت و دسترسی

**Security & Access**

- login-consent-app **تنها Pod مجاز** به دسترسی به Hydra Admin API (port 4445) طبق Kubernetes NetworkPolicy (`deploy/helm/hydra/templates/networkpolicy.yaml`).
- برای سخت‌گیری بیشتر: mTLS بین login-consent-app و Hydra Admin (Roadmap).
- کوکی `ory_kratos_session` نباید در پاسخ به مرورگر افشا شود؛ فقط درون فراخوانی‌های سرور-to-سرور به Kratos ارسال می‌شود.

---

## ۷. رویدادها

**Events**

| رویداد | زمان صدور | توضیح |
|---|---|---|
| `nons.token.issued` | پس از صدور موفق توکن | `client_id`, `sub`, `scope`, `grantedAt` |
| `nons.token.revoked` | پس از ابطال توکن / logout | `sub`, `client_id`, `revokedAt` |

تعریف رسمی: `nons-api/catalog/events/token/events.yaml`.

---

## ۸. پیوند با سایر سرویس‌ها

**Relations**

- **token-service (Hydra):** login-consent-app واسط آن است؛ URLهای `login/consent/logout` به این سرویس اشاره می‌کند.
- **auth-service (Kratos):** نشست را از طریق `GET /sessions/whoami` استعلام می‌کند.
- **iam-service:** نقش کاربر را برای Token Hook استعلام می‌کند.

> 📖 مطالعه کامل معماری حوزه توکن: [Token Service](../services/token-service.md) و [ADR-Backend-006](../../backend/ADR/ADR-Backend-006)
