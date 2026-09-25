---
layout: doc
title: جریان اختلافات و داوری
description: جریان اختلافات و داوری و ارتباط با کانتینر های وابسته
version: 0.1.0
status: Draft
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Product
  - Infrastructure
  - Architecture
reviewers:
  - Product Team
  - Backend Team
  - Devops
---

# فلو اختلاف و داوری
**Dispute Resolution Flow**

این فلو فرآیند ثبت، رسیدگی و حل اختلاف بین خریدار و فروشنده را نشان می‌دهد.

## مراحل

1. **ثبت اختلاف** — خریدار یا فروشنده اختلاف را از طریق Dispute Service ثبت می‌کند
2. **گردآوری شواهد** — سرویس‌های Order و Chat اطلاعات مرتبط را به Dispute ارسال می‌کنند
3. **ارجاع به داور** — Dispute Service اختلاف را به داور اختصاص می‌دهد
4. **صدور حکم** — داور پس از بررسی، حکم را صادر می‌کند
5. **اجرای حکم** — Payment Service وجه را مطابق حکم آزاد می‌کند

## سرویس‌های درگیر

- **Dispute Service** — مدیریت چرخه حیات اختلافات
- **Order Service** — اطلاعات سفارش مرتبط
- **Chat Service** — تاریخچه مکالمات خریدار و فروشنده
- **Payment Service** — اجرای حکم مالی (آزادسازی یا استرداد وجه)

## رویدادها

- `dispute.created` — اختلاف جدید ثبت شد
- `dispute.assigned` — داور به اختلاف تخصیص یافت
- `dispute.resolved` — اختلاف با حکم نهایی بسته شد

```mermaid

flowchart TD

    Buyer[خریدار]
    Seller[فروشنده]

    Order[Order Service]

    Dispute[Dispute Service]

    Chat[Chat Service]

    Arbitrator[داور]

    Payment[Payment Service]

    Buyer -->|ثبت اختلاف| Dispute

    Seller --> Dispute

    Order --> Dispute

    Chat --> Dispute

    Dispute --> Arbitrator

    Arbitrator -->|صدور حکم| Dispute

    Dispute --> Payment

    Payment -->|آزادسازی وجه| Buyer

    Payment -->|یا| Seller
    
```