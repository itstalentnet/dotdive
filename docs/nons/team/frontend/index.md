---
layout: doc
title: فرانت
description: ابزارها و یوتیلیتی‌های مفید تیم فرانت — دسترسی سریع به ابزارهای کاربردی
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-05
updated_at: 2026-06-18
tags:
  - Frontend
  - Tools
  - Utilities
reviewers:
  - Frontend Team
  - Backend Team
---

# فرانت

مجموعه‌ای از ابزارها و یوتیلیتی‌های مفید برای وظایف مختلف.

---

## مستندات معماری فرانت‌اند (Architecture Documentation)

- 🏗️ [نمای کلی معماری فرانت‌اند (Overview)](/docs/team/frontend/architecture/overview)
- 📁 [ساختار پروژه کلاینت (Project Structure)](/docs/team/frontend/architecture/project-structure)
- ⚙️ [لایه پیکربندی پلتفرم (Nons Configuration)](/docs/team/frontend/architecture/nons-configuration)
- 🔌 [الگوی ارتباطی رجیستری (Registry Pattern)](/docs/team/frontend/architecture/registry-pattern)
- 🔄 [جریان داده‌ها در زمان اجرا (Data Flow)](/docs/team/frontend/architecture/data-flow)
- 🔐 [قرارداد Auth Header در پنل ادمین](/docs/team/frontend/architecture/admin-panel-auth-headers)

---

## سیستم طراحی (Design System)

مستندات توکن‌های گرافیکی، حالت‌های تعاملی و تایپوگرافی:

- 🎨 [معرفی سیستم طراحی (Overview)](/docs/team/frontend/design-system/)
- 🧩 [راهنمای مصرف توسعه‌دهنده (Developer Usage)](/docs/team/frontend/design-system/developer-usage)
- 🖱️ [حالت‌های تعاملی (Interactive States)](/docs/team/frontend/design-system/interactive-states)
- 🔤 [تایپوگرافی (Typography)](/docs/team/frontend/design-system/typography)

---

## استانداردهای UX ورود (Login UX Standards)

### اصل اول — حذف Registration

پلتفرم NONS صفحه «ثبت‌نام» (Sign Up / Register) ندارد. کاربران همیشه «ورود به NONS» را تجربه می‌کنند.

### صفحه ورود (Login Page)

| عنصر | توضیح |
|------|-------|
| عنوان | "ورود به NONS" |
| روش Primary | **Magic Code** — فیلد ایمیل + دکمه "ارسال کد" + فیلد کد تایید |
| روش Secondary | دکمه "ورود با Google" (OAuth redirect) |
| خطاها | پیام‌های خطای فارسی، بدون افشای اطلاعات هویتی |
| وضعیت‌ها | لودینگ هنگام ارسال کد، تایمر مجدد برای درخواست کد جدید |

### Magic Code UX

1. کاربر ایمیل خود را وارد می‌کند ← دکمه "ارسال کد" فعال می‌شود
2. کد ۶ رقمی به ایمیل ارسال می‌شود ← پیام تأیید نمایش داده می‌شود
3. کاربر کد را در ۶ فیلد مجزا یا یک فیلد وارد می‌کند
4. تایم‌ر ۱۲۰ ثانیه‌ای برای درخواست مجدد کد
5. پس از تایید، کاربر به صفحه اصلی هدایت می‌شود

### Google Login UX

1. کاربر روی دکمه "ورود با Google" کلیک می‌کند
2. به صفحه انتخاب حساب Google هدایت می‌شود
3. پس از تایید، به NONS بازمی‌گردد
4. اگر ایمیل کاربر وجود داشته باشد → ورود | اگر وجود نداشته باشد → ایجاد حساب خودکار + ورود

### تشخیص کاربر جدید (Onboarding)

- پس از اولین ورود موفق، سیستم هدر `X-Onboarding-Required: true` را به فرانت‌اند ارسال می‌کند.
- فرانت‌اند کاربر را به صفحه خوش‌آمدگویی / راهنمای اولیه هدایت می‌کند.
- پس از تکمیل اونبوردینگ، درخواست `POST /v1/auth/onboarding/complete` ارسال می‌شود.

### امنیت

- **Rate Limiting:** حداکثر ۵ تلاش ناموفق برای Magic Code در ۱۵ دقیقه
- **انقضای کد:** هر کد یکبار مصرف حداکثر ۵ دقیقه اعتبار دارد
- **HttpOnly Cookies:** نشست Kratos در کوکی امن ذخیره می‌شود
- **CORS:** فقط دامنه‌های مجاز (مطابق تنظیمات Gateway)
