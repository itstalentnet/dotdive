---
layout: doc
title: هسته مرکزی
description: مستندات مربوط به سرویس هسته مرکزی (Core Platform) پروژه NONS
version: 1.0.0
status: PUBLIC
author: xoxxel
owner: xoxxel
created_at: 2026-06-11
updated_at: 2026-06-13
tags:
  - Core
  - Platform
  - Architecture
reviewers:
  - backend team
  - platform team 
---

# هسته مرکزی

**Platform Core**

> **خلاصه:** سرویس Core نقش کنترل‌کننده مرکزی (Control Plane) پلتفرم NONS رو ایفا می‌کنه و وظیفه مدیریت قابلیت‌های فنی مشترک رو به عهده داره.

---

## فهرست مستندات

**Document Directory**

1. [معماری Core](./Architecture)  
   ساختار، ماژول‌ها، وابستگی‌ها و قوانین فنی سرویس Core.
2. [بلوپرینت Core](./blueprint)  
   اهداف، اصول طراحی و مسئولیت‌های تعیین‌شده برای هسته اصلی.
3. [تصمیم معماری ۱: انتخاب Go](./ADR/ADR-Core-001)  
   بررسی دلایل فنی انتخاب زبان Go برای پیاده‌سازی سرویس Core.
4. [تصمیم معماری ۲: Core به عنوان Platform Control Plane](./ADR/ADR-Core-002)  
   دلایل ایجاد لایه مستقل برای مدیریت دغدغه‌های پلتفرمی.

---

## نکات مهم

**Important Notes**

> [!NOTE]
> سرویس Core از بایندینگ‌های Go تولیدشده از فایل‌های Proto در مسیر `nons-api/contracts/` استفاده می‌کنه. واسه جزئیات بیشتر می‌تونی مستند [ADR-Platform-001](../ADR/ADR-Platform-001) رو ببینی.
