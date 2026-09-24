---
layout: doc
title: درگاه API Gateway
description: مستندات فنی و معماری درگاه ورود پلتفرم (API Gateway) پروژه NONS
version: 1.0.0
status: PUBLIC
author: Antigravity
owner: Platform Team
created_at: 2026-06-14
updated_at: 2026-06-14
tags:
  - Gateway
  - Platform
  - Architecture
  - Traefik
reviewers:
  - Platform Team
  - Backend Team
  - Devops
---

# درگاه API Gateway

**API Gateway Documentation**

> **خلاصه:** درگاه API Gateway (بر پایه Traefik) به عنوان تنها نقطه ورود (Single Entry Point) کلاینت‌ها به پلتفرم NONS عمل می‌کند. این درگاه مسئول مسیریابی، اعتبارسنجی اولیه توکن، اعمال محدودیت نرخ درخواست (Rate Limiting), مدیریت CORS و تزریق هدرهای امنیتی و ردگیری است.

---

## فهرست مستندات

**Document Directory**

1. [تصمیم معماری ۱: انتخاب و طراحی درگاه](./ADR/ADR-Gateway-001)  
   علت وجود Gateway، گزینه‌های بررسی‌شده، دلایل فنی انتخاب Traefik و معماری تأیید هویت.
2. [بلوپرینت درگاه (Gateway Blueprint)](./blueprint)  
   اهداف، مسئولیت‌ها، معماری ران‌تایم، استراتژی‌های مسیریابی، مدل امنیتی، مانیتورینگ و دیاگرام‌های توالی جریان‌ها.
3. [راهنمای کاربری و توسعه (Gateway README)](./README)  
   نحوه پیکربندی، اجرا، تست محلی، متغیرهای محیطی و سناریوهای رفع خطا (Troubleshooting).

---

## اصول حاکم بر طراحی درگاه

**Core Design Principles**

- **عدم داشتن منطق کسب‌وکار (Business Logic Free):** درگاه Gateway صرفاً ترافیک را هدایت و لایه‌های امنیتی اولیه را اعمال می‌کند. هیچ‌گونه دانشی در خصوص دامنه و قوانین بیزینس (مانند مدیریت سفارش یا کیف پول) در این لایه قرار نمی‌گیرد.
- **توسعه‌پذیری پویا (Dynamic Routing):** اضافه شدن سرویس‌های جدید به صورت خودکار و از طریق پیکربندی‌های بومی کوبرنتیز (Kubernetes IngressRoute / Services) شناسایی و ثبت می‌شوند بدون نیاز به ری‌استارت درگاه.
- **اعتبارسنجی متمرکز نشست‌ها (Centralized Session Validation):** اعتبارسنجی وضعیت ورود کاربران در سطح درگاه به صورت متمرکز از طریق متد ForwardAuth و با اتکا به نشست‌های کاربری Ory Kratos انجام می‌شود تا از نفوذ درخواست‌های غیرمجاز به میکروسرویس‌های داخلی جلوگیری شود.
- **اعتبارسنجی توکن‌های API (JWT / Bearer):** درخواست‌های کلاینت‌های ماشینی (SPA، موبایل، CLI، سرویس‌به‌سرویس) حامل `Authorization: Bearer <access_token>` هستند. درگاه امضای JWT را با کلید عمومی منتشرشده توسط **Token Service (Ory Hydra)** از طریق `JWKS endpoint` (`/.well-known/jwks.json`) اعتبارسنجی می‌کند. این اعتبارسنجی stateless است و نیازی به تماس با Hydra Admin API ندارد.

---

**آخرین بروزرسانی:** 2026-06-14  
**وضعیت:** ✅ تایید شده (APPROVED)  
