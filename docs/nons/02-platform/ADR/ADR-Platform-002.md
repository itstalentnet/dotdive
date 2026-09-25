---
layout: doc
title: 'ADR-Platform-002: Transition to Native K3s (Model B) for Zero-Docker Development'
description: Architecture Decision Record for shifting from K3d to native K3s to eliminate Docker dependency in local development.
version: 1.0.0
status: APPROVED
author: Antigravity
owner: DevOps Team
created_at: 2026-06-15
updated_at: 2026-06-15
tags:
  - ADR
  - DevOps
  - Kubernetes
  - K3s
  - Docker-Free
reviewers:
  - DevOps Team
  - Platform Team
  - Backend Team
---

# تصمیم معماری: انتقال به K3s بومی (Model B) برای توسعه فاقد داکر

**Architectural Decision Record — Shifting to Native K3s (Model B) for Docker-Free Development**

> **ADR-Platform-002 — Approved**

---

## وضعیت (Status)

APPROVED (تایید شده)

---

## تاریخ (Date)

2026-06-15

---

## زمینه (Context)

در تصمیم معماری پیشین (ADR-DevOps-001)، پلتفرم از داکر کامپوز به **K3d** و **Helm** مهاجرت کرد تا فرآیند استقرار محلی و پروداکشن یکپارچه شود. با این حال:
- ابزار **K3d** ذاتا یک لایه‌پیچ (Wrapper) برای اجرای K3s در داخل کانتینرهای داکر است. این امر باعث می‌شود توسعه‌دهندگان همچنان وابستگی سختی به داکر (Docker Desktop / Docker Daemon) داشته باشند.
- در معماری جدید درگاه (Traefik Gateway)، نیاز به سوکت داکر (`docker.sock`) به طور کامل مرتفع شده و مسیریابی از طریق Kubernetes IngressRoute انجام می‌شود.
- بسترهای مدرن کلاستر کوبرنتیز نظیر K3s از ران‌تایم استاندارد **containerd** به صورت توکار استفاده می‌کنند که هیچ وابستگی به موتور داکر ندارد.

جهت برآورده‌سازی هدف حذف کامل داکر از زنجیره توسعه و عملیات، باید بین ادامه کار با K3d (Model A) و انتقال به K3s بومی (Model B) تصمیم‌گیری شود.

---

## گزینه‌های بررسی شده (Options Considered)

### Model A: Local Development = K3d, Production = K3s
- **مزایا:** راه‌اندازی بسیار آسان روی سیستم‌عامل‌های ویندوز و مک از طریق Docker Desktop.
- **معایب:** وابستگی سخت به داکر دیمون؛ عدم شبیه‌سازی دقیق ران‌تایم containerd خالص؛ نیاز به نصب داکر دسکتاپ.

### Model B: Local Development = K3s, Production = K3s (انتخاب شده)
- **مزایا:** حذف ۱۰۰ درصدی وابستگی به داکر؛ یکپارچگی کامل موتورهای توسعه و عملیات بر پایه K3s بومی؛ اجرای مستقیم روی WSL2 (با فعال‌سازی systemd) یا لینوکس خام با ران‌تایم containerd؛ مصرف بهینه منابع سیستم.
- **معایب:** نیاز به پیکربندی اولیه systemd در WSL2 برای توسعه‌دهندگان ویندوز.

---

## تصمیم (Decision)

تصویب شد که پلتفرم NONS به صورت رسمی به **Model B** منتقل شود:
1.  **حذف داکر دیمون:** در توسعه محلی و عملیات، کلاستر K3s به صورت مستقیم و بدون نیاز به موتور داکر اجرا می‌شود.
2.  **ران‌تایم کانتینر:** ابزار **containerd** توکار K3s وظیفه اجرا و مدیریت کانتینرها را بر عهده دارد. برای تعامل مستقیم از ابزار `ctr` یا `nerdctl` به جای دستورات داکر استفاده می‌شود.
3.  **یکپارچه‌سازی کامل:** هیچ‌کدام از ابزارهای اتوماسیون استقرار یا عیب‌یابی نباید به ابزارها یا فایل‌های داکر (docker-compose یا docker client) متکی باشند.

---

## پیامدها (Consequences)

### پیامدهای مثبت (Positive)
- **پایداری صد در صدی:** حذف داکر دسکتاپ به عنوان یک لایه اضافی و سنگین، سرعت بالا آمدن کلاستر محلی را تا ۳ برابر افزایش داده و مصرف رم را به شدت کاهش می‌دهد.
- **امنیت بیشتر:** عدم نصب داکر دیمون و عدم اشتراک‌گذاری سوکت مخرب `docker.sock` ریسک امنیتی نشت دسترسی روت را به صفر می‌رساند.
- **همسویی کامل با پروداکشن:** توسعه‌دهندگان دقیقاً روی همان نسخه‌ای از K3s با containerd کار می‌کنند که در محیط پروداکشن نهایی مستقر است.

### پیامدهای منفی (Negative)
- توسعه‌دهندگانی که روی ویندوز بدون WSL2 یا مک فاقد شبیه‌ساز لینوکس کار می‌کنند، باید از ابزارهایی مانند Rancher Desktop با موتور containerd (به جای Docker Daemon) استفاده کنند.
