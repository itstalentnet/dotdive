---
layout: doc
title: پشتیبانی
description: فرآیندهای پشتیبانی، سرویس‌های عملیاتی و ابزارهای مانیتورینگ
version: 0.1.0
status: Draft
author: xoxxel
owner: xoxxel
created_at: 2026-06-09
updated_at: 2026-06-09
tags:
  - Support
  - Operations
  - Monitoring
reviewers:
  - Product Team
  - DevOps
  - Backend Team
---

# پشتیبانی

این صفحه به مرور تکمیل خواهد شد. در حال حاضر ساختار و فرآیندهای پایه پشتیبانی در اینجا مستند می‌شود.

## سرویس‌های تحت پشتیبانی

پلتفرم از سرویس‌های زیر پشتیبانی می‌کند:

- **Auth Service** — احراز هویت و مدیریت دسترسی
- **Marketplace** — سرویس بازارگاه
- **Order Service** — مدیریت سفارش‌ها
- **Payment Service** — تراکنش‌های مالی
- **Wallet Service** — موجودی کیف پول و برداشت
- **Chat Service** — پیام‌رسانی
- **Storage Service** — ذخیره‌سازی فایل
- **Search Service** — جستجو و ایندکس

## ابزارهای مانیتورینگ

- NATS JetStream برای رویدادها و خطاها
- Grafana و Prometheus برای دیده‌بانی (مسیر داخلی)
- Runbook عملیات در `docs/team/devops/runbook.md`

## TODO

- [ ] تعریف سطوح پشتیبانی (Tier 1, 2, 3)
- [ ] تعریف SLA و زمان پاسخگویی
- [ ] ایجاد فرآیند escalation
- [ ] ایجاد FAQ و دانش‌نامه
- [ ] اسکریپت‌های خودکار پشتیبانی

[بازگشت به تیم‌ها](/docs/team/)
