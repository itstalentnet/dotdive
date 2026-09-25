---
layout: doc
title: معماری پروژه
description: معماری Monorepo، ساختار هسته مشترک، سرویس‌ها و لایه‌های سیستم
version: 0.3.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-06
updated_at: 2026-06-18
tags:
  - Backend
  - Architecture
  - Monorepo
  - Microservice
reviewers:
  - Backend Team
  - Devops
  - Product Team
---

# معماری پروژه

**Monorepo Architecture**
این پروژه بر پایه معماری Monorepo طراحی شده است. هر سرویس مالک یک حوزه مشخص از کسب‌وکار بوده و به صورت مستقل توسعه، استقرار و مقیاس‌پذیر می‌شود. ارتباط میان سرویس‌ها از طریق قراردادهای مشخص (Contracts) و رویدادها (Events) انجام می‌شود تا وابستگی مستقیم میان اجزا به حداقل برسد.

```
nons/                          ← پوشه والد (مرز یا ریشه پروژه نیست)
│
├── dotdive/                   ← VitePress Docs (فقط مستندات پلتفرم - بدون کد)
│
├── nons-api/                  ← ریشه اصلی پروژه (Monorepo همه سرویس‌ها و پکیج‌ها)
│   │
│   ├── contracts/             ← **لایه قراردادهای پلتفرم (Proto — Source of Truth)**
│   │   ├── envelope.proto
│   │   ├── registry.proto
│   │   ├── errors.proto
│   │   └── permissions.proto
│   │
│   ├── core/                  ← Go Core (از Bindingهای Go تولیدشده از Proto استفاده می‌کند)
│   │
│   ├── packages/              ← Bindingهای تولیدشده از Proto + قراردادهای مستقل
│   │   ├── contracts/         ← Binding TS از Proto (Error Codes, Permissions)
│   │   ├── events/            ← Binding TS از Proto (Event Envelope)
│   │   └── logging/           ← قرارداد لاگینگ (خارج از Proto)
│   │
│   ├── services/
│   │   ├── auth-service/       ← احراز هویت و مدیریت نشست (Ory Kratos)
│   │   ├── token-service/      ← صدور و اعتبارسنجی توکن OAuth2/OIDC (Ory Hydra)
│   │   ├── login-consent-app/  ← سرویس مستقل Go — واسط بین Hydra و Kratos (Login & Consent flow + Token Hook)
│   │   ├── IAM/
│   │   ├── keto/
│   │   ├── user-service/
│   │   ├── kyc-service/
│   │   ├── marketplace-service/
│   │   ├── order-service/
│   │   ├── payment-service/
│   │   ├── wallet-service/
│   │   ├── currency-service/
│   │   ├── settlement-service/
│   │   ├── chat-service/
│   │   ├── dispute-service/
│   │   ├── zone-service/
│   │   ├── review-service/
│   │   ├── moderation-service/
│   │   ├── boost-service/
│   │   ├── search-service/
│   │   ├── notification-service/
│   │   ├── analytics-service/
│   │   └── storage-service/
│   │
│   └── infra/
│       ├── gateway/
│       └── k8s/
│           ├── services/
│           ├── configmaps/
│           └── secrets/
│
├── AGENTS.md                  ← راهنمای ایجنت
├── rule.md                    ← قوانین حاکمیتی
├── task.md                    ← فعال تسک
└── project-audit.md           ← حسابرسی پروژه
```

---

## Core (Platform Control Plane)

`nons-api/core/`

Core یک **سرویس زیرساختی** (Go) است — نه Framework و نه Shared Library. Core مسئول دغدغه‌های فنی مشترک در سطح پلتفرم است و هیچ مسئولیت کسب‌وکاری ندارد.

- همه ارتباطات از طریق NATS انجام می‌شود — Core توسط هیچ سرویس دیگری import نمی‌شود
- Core از Bindingهای Go تولیدشده از `nons-api/contracts/` (Proto) برای اعتبارسنجی و Registry استفاده می‌کند
- Core به هیچ پکیج TypeScript (`nons-api/packages/*`) وابسته نیست

برای جزئیات بیشتر: [معماری Core](./core/Architecture) و [بلوپرینت Core](./core/blueprint).

---

## استاندارد طراحی API

پلتفرم نونز دارای استاندارد رسمی طراحی API است که تمام سرویس‌ها موظف به رعایت آن هستند:

| سند | توضیح |
|-----|--------|
| [راهنمای طراحی API](./api/api-design-guidelines) | مرجع رسمی — نسخه‌گذاری، پوسته پاسخ، خطا، صفحه‌بندی، فیلتر، مرتب‌سازی، جستجو، تاریخ، شناسه، احراز هویت، نام‌گذاری، کدهای وضعیت، Nullable، Deprecation |
| [راهنمای تولید OpenAPI](./api/openapi-guidelines) | استاندارد تولید، اعتبارسنجی و انتشار OpenAPI — نسخه، ابزار، پایپلاین CI، فراداده، امنیت |

**جریان اطلاعات از API تا کلاینت:**

```
Backend Service
    │
    └── OpenAPI 3.1 (بر اساس استاندارد طراحی API)
          │
          ▼ [nons registry build]
    Registry (.nons/registry/{service}/manifest.json)
          │
          ▼ [nons generate]
    Generated Artifacts (.nons/generated/)
          │
          ▼
    Project Code (Hooks, API Client, Types)
```

برای جزئیات فرآیند یکپارچه‌سازی کلاینت به [ADR-Platform-004](./ADR/ADR-Platform-004) و [راهنمای مدیریت قراردادها با CLI (nons)](./package/nons-ContractManagement-guide) مراجعه کنید.

---

## لایه قراردادها (Contract Layer)

`nons-api/contracts/`

قراردادهای مشترک پلتفرم در قالب **Protocol Buffers** در `nons-api/contracts/` تعریف می‌شوند. این لایه منبع حقیقت (Source of Truth) برای قراردادهای پلتفرم است. هیچ زبانی مالک قراردادها نیست — Proto مصرف‌کننده نهایی را تعیین نمی‌کند. Bindingها از طریق Buf در CI تولید و به صورت Artifact توزیع می‌شوند.

```text
nons-api/contracts/
├── envelope.proto      # Event Envelope
├── registry.proto      # Service Registry
├── errors.proto        # Platform Error Codes
└── permissions.proto   # Permissions
```

## پکیج‌های اشتراکی

`nons-api/packages/`

پکیج‌های اشتراکی شامل Bindingهای تولیدشده از Proto و قراردادهای مستقل (Logging) هستند.

### رویدادها

`nons-api/packages/events` (`@nons/events`)

Bindingهای Event Envelope تولیدشده از Proto. نام رویدادها و مستندات payload در Catalog (YAML/JSON) نگهداری می‌شوند.

### قراردادها

`nons-api/packages/contracts` (`@nons/contracts`)

Bindingهای قراردادهای پلتفرم تولیدشده از Proto. شامل Error Codes و Permissions.

### لاگینگ (قرارداد ثبت وقایع)

`nons-api/packages/logging` (`@nons/logging`)

قرارداد ثبت وقایع پلتفرم — نه پیاده‌سازی نهایی. این پکیج شامل types و interfaces است و در Proto تعریف نمی‌شود (خارج از محدوده ADR-Platform-001). سرویس‌ها در انتخاب کتابخانه لاگر آزاد هستند، اما خروجی نهایی باید با قرارداد این پکیج مطابقت داشته باشد.

### مصنوعات تولیدشده توسط CLI

پلتفرم NONS ابزار رسمی **`nons`** را ارائه می‌دهد. `nons` مصنوعات پروژه‌محور را برای فریم‌ورک هدف تولید می‌کند. برای جزئیات به [ADR-Platform-004](./ADR/ADR-Platform-004) و [راهنمای مدیریت قراردادها با CLI (nons)](./package/nons-ContractManagement-guide) مراجعه کنید.

**جریان یکپارچه‌سازی:**

```
Backend Service
    │
    └── openapi.yaml
          │
          ▼ [nons registry build user]
    .nons/registry/user/manifest.json (Service Manifest)
          │
          ▼ [nons generate]
    .nons/generated/
      ├── types/user.ts
      ├── api-client/user.ts
      └── hooks/useUsers.ts
```

---

## سرویس‌ها

`nons-api/services/`

هر سرویس مسئول یک حوزه مشخص از سیستم بوده و مالک کامل داده‌ها، قوانین و منطق تجاری مربوط به همان حوزه است.

---

## هویت و کنترل دسترسی

**Identity & Access Layer**

این لایه مسئول شناسایی کاربران، مدیریت دسترسی‌ها و اعمال سیاست‌های امنیتی در کل پلتفرم است.

### احراز هویت

لایه احراز هویت NONS از سه مؤلفه مجزا تشکیل شده است:

#### Ory Kratos — مدیریت هویت

`nons-api/services/auth-service` (از سرویس آماده **Ory Kratos** استفاده می‌کند)

مسئول مدیریت هویت کاربران (Identity Management):
- ایجاد خودکار هویت (Auto Sign-Up) در اولین ورود
- ورود (Login) با Magic Code و Google OIDC
- بازیابی حساب (Recovery)
- مدیریت Credentialها (Magic Code, OIDC, MFA در آینده)
- نشست‌های کاربری (Sessions)
- ارسال ایمیل‌های Magic Code و تایید از طریق SMTP اختصاصی NONS

> **نکته:** Kratos یک ابزار آماده (off-the-shelf) است و از صفر توسعه داده نمی‌شود. تیم باید از قابلیت‌های آماده Kratos استفاده کند و توسعه اختصاصی روی آن انجام ندهد.
>
> **روش‌های احراز هویت فعال در MVP:** `code` (Magic Code) و `oidc` (Google Login). روش `password` و `oidc/discord` غیرفعال هستند.

#### Auth Service — واسط و مدیریت نشست کاربری

`nons-api/services/auth-service` (سرویس اختصاصی NONS — Go Auth Service)

سرویس اختصاصی NONS که وظیفه ارائه رابط کاربری و هماهنگی نشست‌ها را بر عهده دارد:

- **مدیریت فلو ورود و ثبت‌نام یکپارچه:** پیاده‌سازی فرم یکپارچه ورود/ثبت‌نام، بررسی وضعیت نشست کاربری و هدایت کاربران بر پایه متد Code (ارسال کدهای OTP یکبار مصرف) و Google OIDC در Ory Kratos.
- **ارائه صفحات محلی (Embedded UI):** رندرسازی و سرو صفحات وب احراز هویت (Login، Register، Dashboard و Error) به صورت داخلی.
- **اعتبارسنجی نشست‌ها برای درگاه (ForwardAuth):** ارائه نقطه پایانی `/v1/auth/validate` جهت تأیید نشست‌های کوکی‌محور یا هدرهای سشن برای درگاه Traefik Gateway با استعلام مستقیم از Kratos.
- **مدیریت وضعیت اونبوردینگ:** به‌روزرسانی مقدار `onboarded` در traits هویت کاربر پس از اولین ورود موفق از طریق Kratos Admin API.
- **دریافت وب‌هوک‌های Kratos:** دریافت رویداد پس از ثبت‌نام Kratos در مسیر `/v1/auth/webhooks/kratos/register`.

**این سرویس Stateless است** — فاقد دیتابیس مستقل بوده و مدیریت کامل داده‌های هویت و نشست‌ها به عهده Ory Kratos است.

#### Token Service — صدور و اعتبارسنجی توکن (Ory Hydra)

`nons-api/services/token-service` (از سرویس آماده **Ory Hydra** استفاده می‌کند)

سرویس اختصاصی NONS که لایه صدور و اعتبارسنجی **توکن‌های API** (OAuth2/OIDC) را از لایه هویت/نشست جدا می‌کند:

- **سرور OAuth2/OIDC:** صدور `access_token` (JWT)، `refresh_token` و `id_token` از طریق Hydra.
- **تبدیل نشست Kratos به توکن:** اجرای جریان Login & Consent از طریق `login-consent-app` که نشست Kratos را با استعلام `GET /sessions/whoami` تأیید می‌کند.
- **افشای JWKS:** انتشار کلیدهای عمومی در `/.well-known/jwks.json` جهت اعتبارسنجی stateless توکن توسط میکروسرویس‌ها (بدون تماس شبکه‌ای هر بار — کلیدها cache می‌شوند).
- **ابطال توکن:** پشتیبانی از `refresh_token rotation`، `/oauth2/revoke` و `/oauth2/sessions/logout`.
- **دیتابیس مجزا:** Hydra دیتابیس اختصاصی (جدا از Kratos) برای client، consent و grants دارد تا coupling نداشته باشد.

> **نکته:** میکروسرویس‌ها توکن را به‌صورت **stateless و محلی** با استفاده از JWKS اعتبارسنجی می‌کنند و به Hydra Admin API دسترسی ندارند (فقط JWKS عمومی). Kratos Admin API و Hydra Admin API صرفاً در شبکه داخلی در دسترس هستند.
>
> 📖 مطالعه کامل: [Blueprint سرویس Token](../backend/services/token-service)

#### Login-Consent App — واسط مستقل Login & Consent (Go)

`nons-api/services/login-consent-app` (سرویس اختصاصی NONS — Go)

سرویس مستقل (مانند auth-service و iam-service) که طبق الگوی رسمی Ory بین **Hydra** (token-service) و **Kratos** (auth-service) قرار می‌گیرد و **تنها کد اختصاصی** در حوزه توکن است:

- **واسط Login & Consent:** دریافت `login_challenge`، استعلام نشست Kratos با `GET /sessions/whoami` (forward کوکی `ory_kratos_session`)، سپس accept کردن Login/Consent Request در Hydra Admin با `subject = <kratos-identity-id>`.
- **Token Hook:** endpoint `/token-hook` که پیش از صدور توکن توسط Hydra فراخوانی می‌شود تا claims (نقش از iam-service) را غنی‌سازی کند.
- **ایزوله‌سازی Admin API:** طبق NetworkPolicy، **تنها Pod مجاز** به دسترسی به Hydra Admin (port 4445) است.

> این سرویس بخشی از token-service یا auth-service نیست؛ به صورت مستقل در `services/login-consent-app/` توسعه، استقرار و مقیاس‌پذیر می‌شود.
>
> 📖 مطالعه کامل: [سرویس Login-Consent App](../backend/services/login-consent-app)

### احراز هویت مشتریان (KYC)

`nons-api/services/kyc-service`

سرویس احراز هویت مشتریان (Know Your Customer) مسئول تأیید هویت کاربران پیش از انجام معاملات حساس است. این سرویس شامل موارد زیر است:

- **تأیید هویت** — بررسی مدارک هویتی (کارت ملی، پاسپورت)
- **تأیید آدرس** — تأیید محل سکونت کاربر
- **تأیید شماره تلفن** — تأیید شماره تلفن همراه
- **تأیید ایمیل** — تأیید آدرس ایمیل
- **سطوح احراز هویت** — سطوح مختلف KYC (پایه، پیشرفته، حرفه‌ای)
- **مدیریت وضعیت** — وضعیت احراز هویت کاربران (تأیید شده، در انتظار، رد شده)
- **مدیریت محدودیت‌ها** — اعمال محدودیت بر اساس سطح احراز هویت

> این سرویس پس از احراز هویت اولیه (Auth Service) فعالیت می‌کند و مسئول تأیید هویت دقیق‌تر کاربران برای معاملات مالی و حساس است.

### دسترسی و مجوز ها

`nons-api/services/iam-service`

مرکز حکمرانی دسترسی‌ها و قوانین سامانه است. نقش‌ها (Roles)، قابلیت‌ها (Capabilities)، مجوزها (Permissions)، طرح‌های اشتراک (Plans)، امتیازات ویژه (Entitlements)، محدودیت‌ها، وضعیت کاربران و سیاست‌های دسترسی در این سرویس مدیریت می‌شوند. همچنین تمامی تغییرات امنیتی و مدیریتی برای اهداف حسابرسی ثبت می‌گردند.

> 📖 مطالعه کامل: [Blueprint سرویس IAM](../backend/services/iam-service.md)

> **مرز مسئولیت IAM:** سرویس IAM فقط مالک **Authorization** است: Role، Permission، Access Policy.
>
> اطلاعات پروفایل کاربر (preferred_currency، نام نمایشی، Avatar، Username) در **User Service** نگهداری می‌شود.
> preferred_currency از طریق API داخلی **User Service** در دسترس payment-service قرار می‌گیرد.

#### مدل مالکیت خط‌مشی (Policy Ownership)

هر سرویس کسب‌وکاری مالک قوانین و Business Rules خود است. IAM خط‌مشی‌های حاکمیتی را نگهداری می‌کند اما منطق کسب‌وکار را اجرا نمی‌کند.

```
هر سرویس:
  ۱. Permissions مورد نیاز خود را تعریف می‌کند
  ۲. در IAM ثبت می‌کند (Permission Contract)
  ۳. در زمان اجرا از POST /v1/iam/authorization/check استفاده می‌کند
  ۴. Business Rules خود را خودش اجرا می‌کند
```

> 📖 مطالعه کامل: [استاندارد قرارداد مجوز](./standards/permission-contract-standard.md)

#### جریان بررسی مجوز

```
Business Service → POST /v1/iam/authorization/check { userId, action }
                ← 200: { allowed: true/false, reason: "..." }
```

سرویس‌ها هرگز مستقیماً به دیتابیس IAM دسترسی ندارند. تمام بررسی‌ها از طریق API انجام می‌شود.


#### CommissionRule و ارتباط با settlement-service

سطوح کمیسیون فروشنده در IAM تعریف می‌شوند:

```typescript
interface CommissionRule {
  sellerTier: "standard" | "premium" | "enterprise";
  rate: number; // درصد کمیسیون
  minAmountUsd: number;
  maxAmountUsd: number;
}
```

settlement-service برای محاسبه کمیسیون هر سفارش، tier فروشنده را از IAM دریافت می‌کند.

#### مجوزهای مالی جدید

| مجوز                        | توضیح                       |
| --------------------------- | --------------------------- |
| `can_withdraw`              | اجازه برداشت از کیف پول     |
| `can_settle`                | اجازه درخواست تسویه دستی    |
| `can_view_financial_report` | اجازه مشاهده صورت‌حساب مالی |

#### محدودیت‌های KYC

| سطح KYC         | سقف برداشت روزانه | سقف تسویه        |
| --------------- | ----------------- | ---------------- |
| سطح ۱ (پایه)    | ۵۰۰,۰۰۰ تومان     | ۱,۰۰۰,۰۰۰ تومان  |
| سطح ۲ (پیشرفته) | ۵,۰۰۰,۰۰۰ تومان   | ۱۰,۰۰۰,۰۰۰ تومان |
| سطح ۳ (حرفه‌ای) | بدون محدودیت      | بدون محدودیت     |

### سرویس کاربر

`nons-api/services/user-service`

مسئول مدیریت اطلاعات مرتبط با تجربه کاربری و پروفایل است. این سرویس منبع حقیقت برای:

- **پروفایل کاربر** — Display Name، Avatar، Username
- **شناسه عمومی (Public ID)** — جایگزین ایمن UUID در فضای عمومی
- **تنظیمات شخصی** — `preferred_currency`، تم و زبان کاربر

| سوال | جواب |
|---------|--------|
| **این شخص کیست؟** | Auth Service / Kratos |
| **چطور نمایش داده شود؟** | **User Service** |
| **چه کاری اجازه دارد؟** | IAM Service |
| **چه سطح خدماتی دارد؟** | Billing Service |

این سرویس **Stateful** است و دیتابیس PostgreSQL مستقل دارد.

برای جزئیات کامل: [User Service Blueprint](../backend/services/user-service)

### بررسی مجوزها

`nons-api/services/iam-service`

تمامی بررسی‌های مجوز از طریق IAM Service و با API `POST /v1/iam/authorization/check` انجام می‌شود. سرویس‌های کسب‌وکاری در زمان اجرا مجوز کاربر را از IAM می‌پرسند.

```
Business Service → POST /v1/iam/authorization/check { userId, action }
                ← 200: { allowed: true/false, reason: "..." }
```

> **نکته:** معماری اولیه از Ory Keto استفاده می‌کرد اما در نسخه نهایی، Policy Engine داخلی IAM جایگزین آن شد. سرویس `keto-service` منسوخ شده است.

---

## هسته کسب‌وکار

**Core Business Layer**

این لایه مسئول اجرای فرآیندهای اصلی بازار و مدیریت چرخه کامل معاملات است.

### مارکت پلیس

`nons-api/services/marketplace-service`

مدیریت محصولات، فروشگاه‌ها، موجودی‌ها و کالاهای خودکار را بر عهده دارد. هر محصول دارای نسخه‌بندی بوده و هنگام خرید، یک Snapshot از وضعیت محصول ثبت می‌شود تا در آینده برای بررسی اختلافات و حسابرسی قابل استناد باشد. نام فروشگاه‌ها یکتا و تغییرناپذیر است.

### سفارشات

`nons-api/services/order-service`

مسئول مدیریت چرخه کامل سفارش از زمان ایجاد تا تکمیل یا لغو است. هر سفارش Snapshot نسخه خریداری‌شده محصول را نگهداری می‌کند تا از تغییرات بعدی مستقل باشد. Order فقط نماینده «فرآیند تجاری معامله» است و هیچ اطلاعی از escrow، wallet یا balance ندارد.

وضعیت‌های سفارش: `CREATED` → `ACTIVE` → `COMPLETED` | `CANCELLED` | `DISPUTED`

### پرداخت

`nons-api/services/payment-service`

مدیریت پرداخت امن و Escrow را بر عهده دارد. Payment فقط مسئول دریافت پول از کاربر، نگهداری پول در حالت Escrow و آزادسازی یا برگشت پول به Wallet است. Payment **مالک پول نیست** — Wallet تنها منبع حقیقت موجودی مالی کاربران است.

وضعیت‌های پرداخت: `PENDING` → `ESCROW_HELD` → `RELEASED` | `REFUNDED`

### چت آنلاین

`nons-api/services/chat-service`

زیرساخت ارتباط چت آنلاین میان کاربران را فراهم می‌کند. پیام‌ها قابل ویرایش نیست . این داده‌ها به عنوان بخشی از سوابق رسمی معامله نگهداری شده و در فرآیند داوری قابل استناد هستند.

### کیف پول

`nons-api/services/wallet-service`

تنها منبع حقیقت (Source of Truth) برای موجودی مالی کاربران. مسئول نگهداری balance، ثبت تراکنش‌های مالی (Ledger)، مدیریت برداشت و درآمد فروشندگان. Wallet مستقیماً با Payment Service در تعامل است و پول را فقط پس از آزادسازی از Escrow جابه‌جا می‌کند.

### ارز

`nons-api/services/currency-service`

تنها مرجع نرخ ارز و تبدیل مبلغ در کل پلتفرم. هر سرویسی که نیاز به تبدیل ارز دارد فقط با این سرویس صحبت می‌کند. نرخ‌ها از منابع خارجی (Nobitex، fixer.io) دریافت و در Redis cache می‌شوند (هر ۵ دقیقه یک‌بار). تبدیل مبلغ با rounding صحیح و مدیریت precision انجام می‌شود.

API: `GET /rates` (نرخ خام)، `POST /convert` (تبدیل مبلغ)

### تسویه

`nons-api/services/settlement-service`

مدیریت چرخه مالی پس از تحویل سفارش: محاسبه کمیسیون پلتفرم بر اساس seller_tier (standard ۱۰٪، premium ۷٪، enterprise ۵٪)، انتقال سهم فروشنده از escrow به seller_wallet از طریق TigerBeetle، تسویه دوره‌ای خودکار (هفتگی/ماهانه) و دستی، و مدیریت refund و برگشت وجه.

رویدادهای دریافتی: `order.delivered.v1`, `order.cancelled.v1`, `dispute.resolved.v1`
رویدادهای خروجی: `settlement.completed.v1`, `refund.initiated.v1`, `commission.calculated.v1`

> برای جزئیات کامل چرخه فروش به [استاندارد چرخه فروش و تسویه](./order-payment-wallet-flow) مراجعه کنید.

---

## عملیات و نظارت

**Operations Layer**

این لایه مسئول اعتماد، اعتبار، نظارت و پایداری اکوسیستم بازار است.

### داوری

`nons-api/services/dispute-service`

مدیریت اختلافات میان خریدار و فروشنده را بر عهده دارد. این سرویس شواهد مورد نیاز را از سایر سرویس‌ها جمع‌آوری کرده، پرونده را به داور اختصاص داده و پس از صدور رأی، نتیجه را اجرا می‌کند.

### حوزه تخصصی

`nons-api/services/zone-service`

مسئول ایجاد و مدیریت ساختار حوزه تخصصی فروشندگان است. این سرویس اطلاعات مورد نیاز را از سایر سرویس‌ها جمع‌آوری میکنه و بر اساس فعالیت واقعی کاربران، میزان تخصص، اعتبار و جایگاه آنان را در حوزه‌های مختلف محاسبه میکنه. زون ها هویت تخصصی فروشندگان را نمایش می‌دهند و حاصل عملکرد واقعی آنها در پلتفرم هستند.

### بازخورد

`nons-api/services/review-service`

مدیریت بازخوردها و ارزیابی‌های کاربران پس از تکمیل سفارش را انجام می‌دهد. ثبت نظر، نمایش امتیازات، مدیریت درخواست بازبینی و نگهداری سوابق بازخوردها در این سرویس انجام می‌شود.

### نظارت

`nons-api/services/moderation-service`

به صورت کلی روی جریان رویدادهای سامانه فعالیت می‌کند و مسئول نظارت و شناسایی رفتارهای مشکوک، تخلفات و محتوای نامناسب است. در صورت تشخیص تخلف، پیشنهاد اعمال محدودیت یا تغییر وضعیت کاربر را به IAM ارسال می‌کند.

---

## کشف و رشد

**Discovery & Growth Layer**

این لایه مسئول افزایش دیده‌شدن محصولات و بهبود فرصت‌های فروش در بازار است.

### بوست

`nons-api/services/boost-service`

سیستم تبلیغات و ارتقای نمایش محصولات را مدیریت می‌کند. رتبه‌بندی تبلیغات بر اساس مدل رقابتی انرژی انجام شده و هر ارتقا دارای مدت اعتبار مشخص است. نتایج فعال در فرآیند جستجو و نمایش محصولات لحاظ می‌شوند.

### جستجو

`nons-api/services/search-service`

سرویس مستقل جستجو با Elasticsearch. مسئول ایندکس‌سازی محصولات، full-text search، فیلترها و رتبه‌بندی ترکیبی. ایندکس از رویدادهای سایر سرویس‌ها ساخته می‌شود و هیچ دسترسی مستقیم به دیتابیس سرویس‌های دیگر ندارد.

#### فیلتر قیمتی پویا با ارز کاربر

برای فیلتر محصولات بر اساس محدوده قیمت در ارز کاربر، search-service از currency-service استفاده می‌کند:

```text
کاربر با preferred_currency = "IRR" فیلتر «کمتر از ۵۰۰,۰۰۰ تومان» را اعمال می‌کند
  → search-service از currency-service می‌خواهد:
     POST /convert { amount: 500000, from: "IRR", to: "USD" }
  → نتیجه: ~$5.88
  → ایندکس Elasticsearch روی price_usd_cents فیلتر می‌شود
```

`price_usd_cents` در ایندکس Elasticsearch ذخیره می‌شود تا فیلتر بر اساس آن امکان‌پذیر باشد.

---

## سرویس‌های زیرساختی

**Utility Services**

این سرویس‌ها قابلیت‌های عمومی مورد نیاز سایر بخش‌های پلتفرم را فراهم می‌کنند.

### اعلانات

`nons-api/services/notification-service`

مسئول ارسال اعلان‌های داخلی، ایمیل‌های تراکنشی و پیام‌های اطلاع‌رسانی از طریق کانال‌های مختلف است. این سرویس صرفاً مصرف‌کننده رویدادها بوده و هیچ منطق تجاری مستقلی ندارد.

### فضای ذخیره

`nons-api/services/storage-service`

مدیریت فایل‌ها، رسانه‌ها و داده‌های مرتبط با محصولات خودکار و مدیا ها را بر عهده دارد. دسترسی به فایل‌ها از طریق لینک‌های موقت و امضاشده (Signed URL) یا لینک های عمومی مدیریت میکند تا امنیت و محدودیت دسترسی قابل کنترل گردد.

### استخر داده‌های مرجع (Pool Service)

`nons-api/services/pool-service`

سرویس متمرکز مدیریت **داده‌های مرجع (Reference Data)** و مواد اولیه تولید. تنها منبع حقیقت لیست‌های ایستا و مشترک شامل: مواد اولیه تولید Username (adjectives/nouns)، آواتارهای پیش‌فرض، نام‌ها و الگوهای رزرو شده (Reserved)، کلمات نامناسب، لیست کشورها/زبان‌ها، و اطلاعات مرجع ارز (کد/نام/نماد/دقت).

این سرویس **هیچ داده عملیاتی نگهداری نمی‌کند**؛ صرفاً داده مرجع را تعریف و نگهداری می‌کند و اجرا/تولید بر عهده Consumer (مانند user-service) است. در نسخه فعلی (MVP) فایل‌های Asset به‌صورت موقت در Pool نگهداری می‌شوند و در معماری نهایی به Storage Service منتقل خواهند شد (Pool تنها متادیتا و Reference را حفظ می‌کند).

> 📖 مطالعه کامل: [Blueprint سرویس Pool](../backend/services/pool-service/blueprint.md)

### تحلیل

`nons-api/services/analytics-service`

سیستم تحلیل و گزارش‌گیری کل پلتفرم. Read-only است و فقط از Event Stream تغذیه می‌شود. شامل گزارش فروشندگان، داشبورد مدیریتی و تحلیل رفتار خریدار.

---

## زیرساخت و معماری استقرار

**Infrastructure & Deployment Architecture**

این بخش شامل تنظیمات و ابزارهای مورد نیاز برای اجرای محیط‌های توسعه، آزمایش و عملیاتی پلتفرم NONS است. بستر اصلی و رسمی اجرای پلتفرم بر پایه **Kubernetes (K3s/K3d)** طراحی شده است.

### ساختار پوشه استقرار (Deployment Directory Structure)

تمامی دارایی‌ها، اسکریپت‌ها و فایل‌های مربوط به استقرار پروژه در پوشه `deploy/` در روت اصلی سازمان‌دهی می‌شوند:
```text
deploy/
├── helm/                    # چارت‌های Helm برای میکروسرویس‌ها و متعلقات
├── environments/            # پیکربندی محیط‌های مختلف
│   ├── local/               # تنظیمات مخصوص توسعه محلی
│   ├── staging/             # تنظیمات محیط تست و پیش‌تولید
│   └── production/          # تنظیمات نهایی عملیاتی (Production)
├── scripts/                 # اسکریپت‌های راه‌اندازی و اتوماسیون استقرار
└── docs/                    # مستندات و راهنماهای مرتبط با DevOps و Deployment
```

### بستر استقرار: Kubernetes-Native First Architecture (D13)

- **مسیر رسمی توسعه و استقرار:** کلاستر کوبرنتیز مبتنی بر توزیع سبک **K3s** بستر رسمی استقرار پلتفرم NONS در محیط‌های عملیاتی و پیش‌ تولید است. کلاستر محلی **K3d** نیز تنها مسیر رسمی و استاندارد توسعه و تست‌های محلی می‌باشد.

### استاندارد استقرار: Helm as Deployment Standard (D15)

استقرار رسمی کلیه میکروسرویس‌ها در محیط کلاستر صرفاً از طریق ابزار **Helm** انجام می‌شود. چارت‌های استقرار کلیه منابع زیر را مدیریت می‌کنند:
- `Deployment` و `Service` برای فرآیندهای ران‌تایم
- `Ingress` جهت کنترل ترافیک ورودی
- `Secret` و `ConfigMap` جهت مدیریت پیکربندی‌ها
- `HPA (Horizontal Pod Autoscaler)` برای مقیاس‌پذیری خودکار

### استراتژی کشف سرویس (Service Discovery Strategy - D17)

کشف سرویس‌ها و مسیریابی ترافیک به صورت Kubernetes-Native مدیریت می‌شود:
- **مسیر رسمی (Kubernetes-Native):** در کل محیط‌های رسمی (کلاستر محلی K3d برای توسعه و کلاستر K3s برای پروداکشن)، کشف سرویس به صورت پویا از طریق Traefik Ingress Controller و با استفاده از منابع استاندارد Kubernetes Ingress / IngressRoute CRD انجام می‌شود.

### نقشه راه مدیریت رازها (Secrets Management Roadmap - D18)

- **فاز فعلی (MVP):** تمامی کلیدها، پسوردها و داده‌های حساس از طریق **Kubernetes Secrets** به صورت ایمن مدیریت و به کانتینرها تزریق می‌شوند.
- **فاز آینده (Advanced):** انتقال سیستم مدیریت رازها به ابزار پیشرفته **HashiCorp Vault** در نقشه راه آینده پروژه پیش‌بین شده است.

### ابزارهای مشترک توسعه محلی

#### TigerBeetle — Ledger مالی
دفترکل تراکنش‌های مالی با double-entry accounting. حساب‌های مجزا: `buyer_wallet`, `seller_wallet`, `escrow`, `platform_revenue`, `platform_fees`, `refund_pool`. مکانیزم Hold/Release داخلی برای escrow: پرداخت → PENDING, تأیید → RELEASE, لغو → VOID.

#### Redis — کش نرخ ارز و محدودیت نرخ
ذخیره‌سازی موقت نرخ‌های ارز دریافتی از منابع خارجی و شمارنده‌های Rate Limiting درگاه API Gateway.

---

## اصول معماری

**Architecture Principles**

- هر سرویس مالک کامل داده‌ها و منطق تجاری خود است.
- ارتباط میان سرویس‌ها صرفاً از طریق Contract و Event انجام می‌شود.
- هیچ سرویسی به پایگاه داده سرویس دیگر دسترسی مستقیم ندارد.
- احراز هویت از مدیریت دسترسی و مجوزها جدا نگه داشته شده است.
- تمامی تراکنش‌های مالی قابلیت حسابرسی کامل دارند.
- سوابق گفتگوها و اسناد معامله تغییرناپذیر هستند.
- تمامی سرویس‌ها قابلیت استقرار و مقیاس‌پذیری مستقل دارند.
- طراحی سیستم بر مبنای توسعه تدریجی، نگهداری بلندمدت و تحمل خطا انجام شده است.
- قرارداد ثبت وقایع (Logging Contract) از پیاده‌سازی لاگر جدا است. سرویس‌ها آزادند اما باید با استاندارد یکسان لاگ‌نویسی کنند.
