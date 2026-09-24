---
layout: doc
title: ساختار مخزن
description: ساختار استاندارد نونز (nons-api) — Monorepo بک‌اند، قراردادها، و سرویس‌ها
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-13
tags:
  - Backend
  - Standard
  - Repository
  - Architecture
reviewers:
  - Backend Team
---

# ساختار مخزن
**Repository Structure**

نسخه 1.0 | الزامی برای همه سرویس‌ها

---

## ساختار استاندارد هر سرویس

هر سرویس درون `services/{service-name}/` باید از این ساختار پیروی کند:

```
services/{service-name}/
│
├── src/                      # تمام کدهای منبع
│   └── {feature}/            # یک پوشه به ازای هر ویژگی/ماژول
│
├── tests/
│   ├── unit/                 # منطق خالص، بدون I/O
│   └── integration/          # دیتابیس واقعی، NATS واقعی
│
├── docs/
│   ├── README.md             # اجباری — راه‌اندازی، متغیرها، API
│   ├── openapi.yaml          # **خودکار (Generated)** — توسط ابزار سرویس تولید می‌شود (مطابق [OpenAPI Guidelines](../api/openapi-guidelines)) — ویرایش مستقیم ممنوع
│   ├── events.md             # رویدادهای منتشر شده و مصرف شده
│   ├── database.md           # طرح دیتابیس، نکات مهاجرت
│   └── adr/                  # سوابق تصمیمات معماری
│       └── 001-why-mongodb.md
│
├── demo/
│   ├── index.html            # صفحه اصلی دمو
│   └── assets/               # منابع استاتیک (CSS, JS, assets)
│
├── blueprint/                # فقط قبل از توسعه — پس از تکمیل حذف یا بایگانی می‌شود
│   ├── blueprint.md          # هدف، مسئولیت‌ها، API اولیه
│   ├── requirements.md       # نیازمندی‌های دقیق
│   └── scenarios.md          # سناریوهای اصلی و خطا
│
├── CHANGELOG.md              # اجباری — ثبت همه تغییرات
├── Dockerfile                # اجباری — بیلد کانتینر
├── .env.example              # همه متغیرهای محیط با placeholder
├── .env.test                 # مقادیر امن برای محیط تست
├── .dockerignore             # جلوگیری از ورود فایل‌های اضافه به تصویر
├── .gitignore
└── package.json / go.mod / pyproject.toml
```

---

## توضیح پوشه‌ها

### `src/` — کد منبع
- تمام کدهای اصلی سرویس اینجا قرار می‌گیرد
- هر ماژول یا ویژگی یک پوشه مجزا دارد
- هیچ فایل تستی در `src/` قرار نمی‌گیرد

### `tests/` — تست‌ها
- **واحد (unit):** منطق خالص کسب‌وکار، بدون وابستگی به I/O
- **یکپارچه (integration):** دیتابیس واقعی، NATS واقعی، بدون mock
- نام فایل تست: `{module}.test.{ext}` یا `{module}.spec.{ext}`

### `docs/` — مستندات سرویس
- هر سرویس مستندات خود را داخل پوشه `docs/` خود نگهداری می‌کند
- شامل: README، API اسنادات (OpenAPI)، رویدادها، طرح دیتابیس، ADRها
- هیچ مستند سرویسی خارج از دایرکتوری سرویس زندگی نمی‌کند
- **مستندات پلتفرم و معماری عمومی:** درون `dotdive/docs/` (پروژه جداگانه)
- **رجیستری محلی کلاینت:** درون `.nons/services/` در پروژه فرانت‌اند (تولیدشده توسط `nons service add`)
- **مصنوعات تولیدشده (Types, API Client, Hooks):** درون `.nons/generated/` در پروژه فرانت‌اند (تولیدشده توسط `nons generate`)

### `demo/` — پیش‌نمایش
- یک پیش‌نمایش HTML/CSS از عملکرد سرویس
- فقط HTML و CSS ساده — بدون فریم‌ورک، بدون Build Step
- باید مستقیماً در مرورگر باز شود

### `blueprint/` — طرح اولیه
- فقط قبل از شروع توسعه وجود دارد
- پس از اتمام توسعه، محتوای آن به `docs/` منتقل یا بایگانی می‌شود

---

## قوانین کلی

| قانون | توضیح |
|---|---|
| تفکیک مسئولیت | هر پوشه یک مسئولیت دارد — `src` برای کد، `tests` برای تست، `docs` برای مستندات |
| عدم نفوذ | هیچ فایل مستنداتی در `src/`، هیچ فایل کدی در `docs/` |
| خودکفایی | هر سرویس مستقل است — وابستگی به سرویس دیگر فقط از طریق API یا NATS |
| CHANGELOG اجباری | هر تغییری باید در CHANGELOG ثبت شود |
| README اجباری | هر سرویس باید `docs/README.md` داشته باشد (طبق الگوی مشخص) |
| عدم تکرار | محتوای تکراری بین سرویس‌ها در پکیج‌های مشترک (`packages/`) قرار می‌گیرد |

---

## ساختار Monorepo (ریشه اصلی پروژه)

```
nons-api/                      ← ریشه اصلی پروژه (ROOT)
│
├── services/                  # همه سرویس‌ها
│   ├── auth/
│   │   ├── src/
│   │   ├── tests/
│   │   ├── docs/
│   │   └── ...
│   ├── order/
│   ├── payment/
│   └── ...
│
├── contracts/                 # **لایه قراردادهای پلتفرم (Proto — Source of Truth)**
│   ├── envelope.proto
│   ├── registry.proto
│   ├── errors.proto
│   └── permissions.proto
│
├── packages/                  # پکیج‌های اشتراکی (Bindingها و قراردادها)
│   ├── contracts/             # Binding TS از Proto — Error Codes, Permissions (تولیدشده)
│   ├── events/                # Binding TS از Proto — Event Envelope (تولیدشده)
│   └── logging/               # قرارداد ثبت وقایع (interfaces — خارج از Proto)
│
├── core/                      # Go Core (از Bindingهای Go تولیدشده از Proto استفاده می‌کند)
│
├── infra/                     # زیرساخت توسعه محلی (کوبرنتیز)
│   └── k8s/                   # مانیفست‌های K8s
│
├── nx.json                    # NX config
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## مرجع سریع: چه چیزی کجا می‌رود

**درون `nons-api/`:**

| محتوا | مکان |
|---|---|---|
| قراردادهای پلتفرم (Proto SoT) | `contracts/` |
| Bindingهای TS — Error Codes, Permissions | `packages/contracts/` (تولیدشده) |
| Bindingهای TS — Event Envelope | `packages/events/` (تولیدشده) |
| Catalog رویدادها (YAML/JSON) | `catalog/events/` |
| قرارداد لاگینگ | `packages/logging/` |
| مصنوعات فرانت‌اند (Types, API Client, Hooks) | `project/.nons/generated/` (تولیدشده توسط `nons generate`) |
| انتزاعات دامنه | `core/` |
| کد منبع سرویس | `services/{name}/src/` |
| تست‌های سرویس | `services/{name}/tests/` |
| مستندات سرویس | `services/{name}/docs/` |
| دموی سرویس | `services/{name}/demo/` |
| طرح اولیه سرویس | `services/{name}/blueprint/` |
| تغییرات سرویس | `services/{name}/CHANGELOG.md` |

| مانیفست‌های K8s | `infra/k8s/` |
| اسرار | **هیچ‌کجا در git** — از secret manager استفاده کنید |
