---
title: "معماری بک‌اند"
description: "سرویس‌های بک‌اند، قراردادهای API، احراز هویت و پایپ‌لاین‌های پردازش"
order: 3
icon: "server"
---

| فیلد / Field | مقدار / Value |
| :--- | :--- |
| **Title (EN)** | Backend Architecture & API Specifications |
| **Title (FA)** | راهنمای معماری بک‌اند و مشخصات APIها |
| **ID** | DOC-BE-000 |
| **Category** | `backend` |
| **Status** | `Active` |
| **Owner** | Backend Team |
| **Last Updated** | 2026-09-23 |
| **Summary (EN)** | Central index for backend services, REST/gRPC API contracts, database schemas, and auth. |
| **Summary (FA)** | نمایه مرکزی سرویس‌های بک‌اند، قراردادهای API، اسکیمای دیتابیس و مکانیزم‌های احراز هویت. |
| **Tags** | `backend`, `api`, `auth`, `database`, `services` |

---

# راهنمای اسناد بک‌اند لمو

بسته تحلیل ۲۰۲۶-۰۹-۲۳ برای شروع توسعه `api`، بر اساس کد فعلی `app`، رابط `auth`، اسناد قبلی لمو و معماری نونز در `dotdive` تهیه شده است. **اسناد طراحی Draft هستند؛ این نمایه Active بودن مسیر مستندات را نشان می‌دهد، نه تصویب معماری پیشنهادی.** کد اجرایی بک‌اند و سرویس‌های نونز در این تسک پیاده‌سازی یا آزمایش نشده‌اند.

## ترتیب مطالعه

| سند | نقش یگانه | خروجی مورد انتظار برای خواننده |
| :--- | :--- | :--- |
| [ممیزی فرانت و نیازمندی‌ها — DOC-BE-006](./frontend-requirements-audit.md) | شاهد و نیاز محصول | بدانیم چه چیزی واقعاً در کد هست، چه چیز mock است و بک‌اند چه باید بسازد |
| [ارزیابی نونز — DOC-BE-007](./dotdive-reuse-assessment.md) | مقایسه و بازاستفاده | چه اصولی منتقل شوند، چه مدل‌هایی بازطراحی شوند و چه کدی هنوز تأیید نشده |
| [معماری پیشنهادی — DOC-BE-003](./architecture.md) | مرز سرویس و failure handling | استقلال داده/deploy، Job/credit saga و عملیات سازمانی |
| [دسترسی و عضویت — DOC-BE-004](./auth-and-workspace.md) | مرجع سیاست Authorization | Workspace/Team/Project، ماتریس نقش، دعوت، revoke و API key |
| [قرارداد افزونه — DOC-BE-008](./plugin-contract.md) | مرز افزونه و host | local/schema/third-party/remote، manifest و capability |
| [مدل داده — DOC-BE-002](./data-model.md) | مالکیت persistence و invariant | جدول‌های هر سرویس، ledger، tenant isolation و lifecycle |
| [قرارداد API — DOC-BE-001](./api-contracts.md) | wire/event/SDK | endpointهای scopeدار، idempotency، SSE و مهاجرت SDK |
| [دفتر تصمیم‌ها — DOC-BE-009](./decision-register.md) | ابهام و گیت تصمیم | پیش‌فرض پیشنهادی، مسئول و موعد تصمیم قبل از توسعه/تولید |
| [برنامه شروع api — DOC-BE-005](./kickstart.md) | ترتیب تحویل و پذیرش | G0–G5، backlog آغازین و مسیر Live فرانت |

## جمع‌بندی جهت پیشنهادی

میکروسرویس با مرزهای درشت و مالکیت داده مستقل؛ Workspace به‌عنوان tenant و حساب مصرف، Project به‌عنوان مرز همکاری، Team برای دسترسی گروهی، RBAC به‌همراه روابط منبع، schema-driven plugins و اجرای پایدار AI با رزرو/تسویه اعتبار. استفاده مجدد از نونز در سطح طراحی توصیه می‌شود؛ انتقال کد نیازمند مخزن اجرایی و تست است.

## حاکمیت و بازنگری

DOC-BE-001 تا DOC-BE-005 پیش‌نویس‌های موجود بودند و در همین مسیرها بازنگری شدند تا مرجع موازی ساخته نشود. چهار سند 006 تا 009 برای شواهد، مقایسه، مرز افزونه و دفتر ابهام‌ها اضافه شدند. قواعد Active فرانت، متن ADRهای تاریخی و کد app/auth/dotdive تغییر نکرده‌اند. قبل از آغاز implementation، انتخاب‌های اصلی در ADR ثبت و وضعیت اسناد با تصمیم تیم به‌روز شود.

ثبت رسمی پیشنهاد: [ADR-004](../architecture/decisions/adr-004-backend-microservices.md).

مرجع بالادستی: [تصمیمات فرانت](../frontend/workspace-decisions.md) و [قوانین مستندات](../RULE.md). متن‌های این بسته با فاصله میان «وضعیت مشاهده‌شده»، «نیاز»، «پیشنهاد» و «تصمیم باز» خوانده شوند؛ UI یا mock قرارداد امنیتی/تجاری قطعی نیست.
