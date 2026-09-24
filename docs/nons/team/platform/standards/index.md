---
layout: doc
title: استایل گاید — راهنمای یکپارچه استانداردها
description: نمای کلی تمام استانداردهای پروژه — راهنما و دسترسی سریع به مستندات
version: 2.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-06
updated_at: 2026-06-12
tags:
  - Backend
  - Standard
  - Style Guide
  - ADR-Platform-001
reviewers:
  - Backend Team
  - Product Team
---

# استایل گاید — راهنمای یکپارچه استانداردها

**Global Style Guide**

نسخه 2.0 | الزامی برای همه سرویس‌ها، پکیج‌ها و مشارکت‌کنندگان

> این سند نمای کلی تمام استانداردهای پروژه نونز است. هر بخش به یک فایل مجزا لینک می‌دهد که جزئیات کامل در آن آمده.

---

## اصول پایه

- **فارغ از تکنولوژی:** این استانداردها برای همه سرویس‌ها صرف نظر از زبان یا فریم‌ورک الزامی است
- **زبان رسمی:** کد منبع به انگلیسی — مستندات محصول به فارسی
- **اجرا:** رعایت این استانداردها برای همه اعضای تیم الزامی است

---

## ۱. استانداردهای عمومی

| #   | عنوان                    | توضیح کوتاه                                                       | فایل                                                 |
| --- | ------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------- |
| ۱   | **خط مشی زبان**          | زبان رسمی کد (انگلیسی)، موارد مجاز فارسی، ممنوعیت‌ها              | [`language-policy.md`](language-policy.md)           |
| ۲   | **قراردادهای نام‌گذاری** | فایل‌ها، دیتابیس، env vars، Docker images، NATS، API، Error Codes | [`naming-conventions.md`](naming-conventions.md)     |
| ۳   | **ساختار مخزن**          | ساختار استاندارد هر سرویس، monorepo، مرجع سریع                    | [`repository-structure.md`](repository-structure.md) |
| ۴   | **نسخه‌بندی**            | Semantic Versioning، پیش‌انتشار، تگ‌گذاری، وابستگی نسخه‌ها        | [`versioning-policy.md`](versioning-policy.md)       |
| ۵   | **امنیت**                | رازها، parameterized queries، JWT expiry، HTTP-only cookies       | [`security-policy.md`](security-policy.md)           |

---

## ۲. مستندات و ارتباطات

| #   | عنوان                   | توضیح کوتاه                                                | فایل                                         |
| --- | ----------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| ۶   | **مستندات سرویس**       | فایل‌های اجباری `docs/`، توضیح هر فایل، قوانین به‌روزرسانی | [`docs-policy.md`](docs-policy.md)           |
| ۷   | **الگوی README**        | ساختار اجباری `docs/README.md` با مثال کامل                | [`readme-template.md`](readme-template.md)   |
| ۸   | **تغییرات (CHANGELOG)** | ساختار Keep a Changelog، بخش‌ها، چرخه به‌روزرسانی          | [`changelog-policy.md`](changelog-policy.md) |

---

## ۳. طراحی API

| #   | عنوان                     | توضیح کوتاه                                          | فایل                                                               |
| --- | ------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| ۹   | **راهنمای طراحی API**     | مرجع رسمی طراحی API — نسخه‌گذاری، پوسته پاسخ، خطا، صفحه‌بندی، فیلتر، مرتب‌سازی، جستجو، تاریخ، شناسه، احراز هویت، نام‌گذاری، کدهای وضعیت، Nullable، Deprecation | [`api-design-guidelines.md`](../api/api-design-guidelines) |
| ۱۰  | **راهنمای تولید OpenAPI** | استاندارد تولید، اعتبارسنجی و انتشار OpenAPI — نسخه، ابزار، پایپلاین CI، فراداده، امنیت | [`openapi-guidelines.md`](../api/openapi-guidelines) |
| ۱۱  | **قرارداد رویداد**        | پوسته استاندارد NATS، فیلدها، versioning payload     | [`event-contract.md`](event-contract.md)                            |

---

## ۴. توسعه و کیفیت

| #   | عنوان                     | توضیح کوتاه                        | فایل                                             |
| --- | ------------------------- | ---------------------------------- | ------------------------------------------------ |
| ۱۲  | **تست**                   | واحد و یکپارچه، CI، پوشش، قوانین   | [`testing-policy.md`](testing-policy.md)         |
| ۱۳  | **استاندارد لاگ‌نویسی**   | JSON ساختاریافته، سطوح، قوانین PII | [`logging-standard.md`](logging-standard.md)     |
| ۱۴  | **تعریف انجام شده (DoD)** | چک‌لیست کامل پذیرش Feature/PR      | [`definition-of-done.md`](definition-of-done.md) |

---

## ۵. چرخه عمر سرویس

| #   | عنوان                  | توضیح کوتاه                                     | فایل                                                                            |
| --- | ---------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------- |
| ۱۵  | **بلوپرینت**           | الزامات پیش از توسعه، فایل‌ها، تأیید تیمی       | [`blueprint-policy.md`](blueprint-policy.md)                                    |
| ۱۶  | **دمو (پیش‌نمایش)**    | HTML/CSS ساده، قوانین فنی، همگام‌سازی با سرویس  | [`demo-policy.md`](demo-policy.md)                                              |
| ۱۷  | **گیت (کامیت و برنچ)** | فرمت کامیت، فرمت برنچ، workflow، PR             | [`git-policy.md`](git-policy.md)                                                |
| ۱۸  | **مصنوعات ساخت**       | `.dockerignore`، multi-stage build، امنیت build | [`build-artifact-policy.md`](/docs/team/devops/standards/build-artifact-policy) |

## ۶. یکپارچگی و حاکمیت

| #   | عنوان                     | توضیح کوتاه                                                    | فایل                                                                                 |
| --- | -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| ۱۹  | **قرارداد مجوز (Permission Contract)** | تعریف، ثبت و مصرف Permissions توسط سرویس‌ها در IAM | [`permission-contract-standard.md`](permission-contract-standard.md)                 |
| ۲۰  | **همگام‌سازی مجوزها و SDK** | راهکار هماهنگی مجوزهای IAM، هدرهای Auth و زنجیره codegen SDK | [`permission-and-sdk-sync-standard.md`](permission-and-sdk-sync-standard.md)         |

---

## مرجع سریع

| محتوا                      | مکان                                                           |
| -------------------------- | -------------------------------------------------------------- |
| استاندارد طراحی API        | [`docs/team/platform/api/api-design-guidelines.md`](../api/api-design-guidelines) |
| استاندارد تولید OpenAPI    | [`docs/team/platform/api/openapi-guidelines.md`](../api/openapi-guidelines) |
| قراردادهای پلتفرم (Proto)  | `nons-api/contracts/`                                          |
| انواع داده Platform        | `nons-api/contracts/*.proto` (تولیدشده در `nons-api/packages/contracts`) |
| قراردادهای API و کدهای خطا | `nons-api/contracts/*.proto` (تولیدشده در `nons-api/packages/contracts`) |
| کاتالوگ رویدادها           | `nons-api/catalog/events/` (YAML) + ساختار Envelope در Proto   |
| قرارداد لاگینگ             | `nons-api/packages/logging/`                                   |
| مصنوعات فرانت‌اند (Types, API Client, Hooks) | `.nons/generated/` (تولیدشده توسط `nons generate`)          |
| انتزاعات دامنه             | `nons-api/core/`                                               |
| کد منبع سرویس              | `nons-api/services/{name}/src/`                                |
| تست‌های سرویس              | `nons-api/services/{name}/tests/`                              |
| مستندات سرویس              | `nons-api/services/{name}/docs/`                               |
| دموی سرویس                 | `nons-api/services/{name}/demo/`                               |
| طرح اولیه سرویس            | `nons-api/services/{name}/blueprint/`                          |
| تغییرات سرویس              | `nons-api/services/{name}/CHANGELOG.md`                        |
| مانیفست‌های K8s            | `nons-api/infra/k8s/`                                          |
| اسرار                      | هیچ‌کجا در git — از secret manager استفاده کنید      |

---

## مسیر یادگیری پیشنهادی

1. [`language-policy.md`](language-policy.md) — قوانین زبانی
2. [`naming-conventions.md`](naming-conventions.md) — نام‌گذاری
3. [`repository-structure.md`](repository-structure.md) — ساختار پروژه
4. [`api-design-guidelines.md`](../api/api-design-guidelines) — استاندارد طراحی API
5. [`openapi-guidelines.md`](../api/openapi-guidelines) — استاندارد تولید OpenAPI
6. [`git-policy.md`](git-policy.md) — گردش کار گیت
7. [`definition-of-done.md`](definition-of-done.md) — تعریف انجام شده
8. [`ADR-Platform-001_Contract-Layer`](../ADR/ADR-Platform-001) — معماری لایه قراردادها
9. [`ADR-Platform-004`](../ADR/ADR-Platform-004) — استراتژی مدیریت قراردادها و تولید مصنوعات کلاینت
10. سایر استانداردها بر اساس نیاز

