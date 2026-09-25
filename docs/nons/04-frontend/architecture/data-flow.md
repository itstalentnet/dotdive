---
layout: doc
title: جریان رسمی داده‌ها (Data Flow)
description: مسیر پردازش، بارگذاری تنظیمات پلتفرم و حرکت رویدادها در زمان اجرای برنامه
version: 1.1.0
status: PRIVATE
author: Antigravity
owner: xoxxel
created_at: 2026-06-30
updated_at: 2026-06-30
tags:
  - Frontend
  - Data Flow
  - Runtime Loader
  - Lifecycle
reviewers:
  - Frontend Team
  - Backend Team
---

# جریان داده‌ها در زمان اجرا (Official Data Flow)

این مستند جریان چرخش داده‌ها و چرخه حیات بارگذاری پلتفرم Nons را در زمان اجرای فرانت‌بند (Runtime) تشریح می‌کند.

---

## ۱. چرخه حیات کلان و بارگذاری پیکربندی

هنگام راه‌اندازی فرانت‌بند، سیستم از زنجیره سلسله‌مراتبی زیر برای خواندن پیکربندی‌ها، آماده‌سازی قالب‌ها و ارسال درخواست‌ها استفاده می‌کند:

```mermaid
graph TD
    NonsConfig[.nons Configuration / فایل‌های تنظیمات پلتفرم] --> Loader[Runtime Loader / بارگذار زمان اجرا]
    Loader --> App[Application / اجرای بدنه برنامه]
    App --> Renderer[Template / Renderer / قالب‌ساز و رندرر]
    Renderer --> UIKit[UI Kit / کیت طراحی کامپوننت]
    UIKit --> Registry[Registry / لایه واسط رجیستری]
    Registry --> GeneratedAPI[API Client / کدهای تولیدشده]
    GeneratedAPI --> Backend[Backend / سرور اصلی وب]
```

### تشریح زنجیره اجرای زمان اجرا (Runtime Lifecycle)

1. **مرحله بارگذاری تنظیمات (.nons Configuration):**
   در بدو اجرای وب‌سایت، فایل‌های پیکربندی پروژه (از جمله `config.yaml` ،`theme.yaml` و `navigation.yaml`) خوانده می‌شوند.
2. **مرحله راه‌انداز زمان اجرا (Runtime Loader):**
   بارگذار سیستم کدهای پیکربندی را تحلیل کرده، توکن‌های پوسته، زبان سیستم، ساختار منوها و نگاشت رجیستری‌ها را در حافظه زمان اجرا بارگذاری می‌کند.
3. **مرحله برنامه (Application):**
   برنامه کلاینت (درون پوشه `src/`) با استفاده از داده‌های بارگذاری‌شده آغاز به کار می‌کند.
4. **مرحله قالب و رندرینگ (Template / Renderer):**
   برنامه بر اساس شِمای صفحات، قالب‌ها (`Templates`) و پوسته‌های ساختاری را فراخوانی و ساختار بصری را آماده می‌کند.
5. **مرحله کیت رابط کاربری (UI Kit):**
   کامپوننت‌های پایه (لایه `components/`) استایل‌ها و متون خود را از توکن‌های تم و لوکال سیستم طراحی دریافت کرده و ظاهر صفحه را رندر می‌کنند.
6. **مرحله رجیستری (Registry):**
    لایه واسط رجیستری (مطابق [الگوی رجیستری](./registry-pattern)) فراخوانی‌های صفحات را به متدهای API Client هدایت می‌کند. این لایه خطاها را قالب‌بندی کرده و خروجی تمیز به صفحه تحویل می‌دهد.
7. **مرحله ارتباطات شبکه (API Client):**
    کدهای API Client تولیدشده (توسط `nons generate` در `.nons/generated/api-client/`) متدهای تایپ‌پذیر را با Mapping خودکار فرمت داده فراخوانی کرده و درخواست‌های HTTP به سمت بک‌اند ارسال می‌کند.

---

## ۲. جریان رویدادها در تعاملات کاربری (User Event Flow)

هنگامی که کاربر تعاملی با صفحه ایجاد می‌کند (مانند کلیک روی دکمه ثبت فرم)، اطلاعات و پاسخ‌ها مسیر زیر را طی می‌کنند:

```mermaid
sequenceDiagram
    participant User as کاربر
    participant UIKit as کامپوننت بصری (UI Kit)
    participant Template as قالب صفحه (Template)
    participant Reg as رجیستری (Registry)
    participant APIClient as API Client تولیدشده
    participant BE as سرور بک‌اند
    
    User->>UIKit: کلیک یا ارسال فرم
    UIKit->>Template: ارسال رویداد ساده (onClick Event)
    Template->>Reg: فراخوانی متد رجیستری (مثلاً usersRegistry.create)
    Reg->>APIClient: فراخوانی متد تولیدشده از رجیستری
    APIClient->>BE: ارسال درخواست HTTP به وب‌سرویس بک‌اند
    BE-->>APIClient: بازگرداندن داده خروجی (Response)
    APIClient-->>Reg: تحویل داده سازمان‌یافته به رجیستری
    Note over Reg: به‌روزرسانی وضعیت و کش داده‌ها
    Reg-->>Template: تغییر وضعیت کامپوننت (State Update)
    Template-->>UIKit: رندر مجدد تغییرات گرافیکی با متون جدید
    UIKit-->>User: نمایش پیام موفقیت یا تغییر صفحه
```
