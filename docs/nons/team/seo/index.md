---
layout: doc
title: سئو
description: استراتژی سئو، بهینه‌سازی محتوا و متادیتا
version: 0.1.0
status: Draft
author: xoxxel
owner: xoxxel
created_at: 2026-06-09
updated_at: 2026-06-09
tags:
  - SEO
  - Optimization
  - Content
reviewers:
  - Product Team
  - Frontend Team
---

# سئو

این صفحه به مرور تکمیل خواهد شد. در حال حاضر اصول اولیه سئوی پروژه در اینجا مستند می‌شود.

## وضعیت فعلی

- فایل `sitemap.xml` در زمان build به صورت خودکار تولید می‌شود
- متادیتای Open Graph و Twitter Card در `config.ts` تنظیم شده است
- لینک‌های canonical برای تمام صفحات اضافه شده است
- داده‌های ساختاریافته (Schema.org) با نوع `TechArticle` و `BreadcrumbList` پیاده‌سازی شده است

## اقدامات انجام‌شده

- ✅ `robots.txt` — تولید خودکار حین build
- ✅ `sitemap.xml` — تولید خودکار با آخرین تاریخ به‌روزرسانی
- ✅ `canonical URL` — برای تمام صفحات
- ✅ `og:title`, `og:description`, `og:image` — در تمام صفحات
- ✅ `structured data` — Breadcrumb و Article Schema

## TODO

- [ ] تحقیق کلمات کلیدی و استراتژی محتوا
- [ ] بهینه‌سازی performance و Core Web Vitals
- [ ] بررسی hreflang برای نسخه چندزبانه
- [ ] آنالیز رقبا و شکاف محتوا
- [ ] تنظیم ابزارهای آنالیتیکس و کنسول جستجو

[بازگشت به تیم‌ها](/docs/team/)
