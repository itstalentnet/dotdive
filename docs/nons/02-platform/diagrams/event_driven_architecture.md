---
layout: doc
title: جریان رویداد ها
description: جریان رویداد ها و ارتباط با کانتینرها
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


# جریان رویدادها
**Event Driven Architecture**

این دیاگرام معماری رویدادمحور سیستم را نشان می‌دهد. تمام سرویس‌ها از طریق NATS JetStream به صورت ناهمزمان با هم ارتباط برقرار می‌کنند.

## اصول معماری رویدادمحور

1. **تولیدکنندگان (Producers)** — تمام سرویس‌ها رویدادها را در NATS منتشر می‌کنند: Auth, KYC, IAM, Marketplace, Order, Payment, **Currency**, Wallet, **Settlement**, Chat, Dispute, Review, Zone, Moderation, Boost, Storage
2. **NATS JetStream** — گذرگاه رویداد با قابلیت ذخیره‌سازی، تکرار و Delivery Guarantee
3. **مصرف‌کنندگان (Consumers)** — سرویس‌های Search, Notification, Moderation, Review, Zone, Analytics, Storage, Dispute, **Settlement**, **Currency** رویدادها را مصرف می‌کنند

## جریان رویدادها

### رویدادهای هویت → همه لایه‌ها
- رویدادهای Auth و IAM (ایجاد کاربر، تغییر نقش، مسدودیت) به KYC, Moderation, Notification, Review, Zone ارسال می‌شوند

### رویدادهای مالی — جریان جدید
- `payment.confirmed.v1` از Payment به Settlement و Analytics ارسال می‌شود (آغازگر تسویه)
- `order.delivered.v1` از Order به Settlement ارسال می‌شود (تسویه پس از تحویل)
- `settlement.completed.v1` از Settlement به Wallet، Notification و Analytics ارسال می‌شود
- `settlement.commission.calculated.v1` از Settlement به Analytics ارسال می‌شود (درآمد پلتفرم)
- `settlement.refund.initiated.v1` از Settlement به Wallet و Notification ارسال می‌شود (برگشت وجه)

### رویدادهای کسب‌وکار → خدمات عملیاتی
- تغییرات Marketplace و Order به Moderation ارسال می‌شود (بررسی تخلف)
- رویدادهای پرداخت به Notification می‌رود (اطلاع‌رسانی)
- تکمیل سفارش به Review و Zone ارسال می‌شود (به‌روزرسانی امتیاز و اعتبار)
- رویدادهای سفارش به Dispute ارسال می‌شود (ثبت اختلاف)

### رویدادهای کسب‌وکار → خدمات رشد
- انتشار محصول جدید به Search ارسال می‌شود (ایندکس شدن)
- رویدادهای مختلف به Analytics می‌روند (گزارش‌گیری)

### رویدادهای عملیاتی → خدمات زیرساختی
- رویدادهای Dispute و Review به Storage ارسال می‌شود (ذخیره مدارک)
- رویدادهای Moderation به Notification ارسال می‌شود (اعلان محدودیت)

## مزایا

- **جداسازی (Decoupling)** — سرویس‌ها مستقیماً هم را صدا نمی‌زنند
- **مقیاس‌پذیری** — هر مصرف‌کننده مستقل مقیاس می‌شود
- **بازیابی** — NATS JetStream رویدادها را ذخیره و در صورت نیاز بازپخش می‌کند
- **انعطاف‌پذیری** — سرویس جدید می‌تواند بدون تغییر در تولیدکنندگان رویدادها را مصرف کند

```mermaid

flowchart LR

    Auth[Auth]
    KYC[KYC]
    IAM[IAM]
    Marketplace[Marketplace]
    Order[Order]
    Payment[Payment]
    Currency[Currency]
    Wallet[Wallet]
    Settlement[Settlement]
    Chat[Chat]
    Dispute[Dispute]
    Review[Review]
    Zone[Zone]
    Moderation[Moderation]
    Boost[Boost]
    Storage[Storage]

    NATS[(NATS JetStream)]

    Search[Search]
    Notification[Notification]
    Moderation_Consumer[Moderation]
    Review_Consumer[Review]
    Zone_Consumer[Zone]
    Analytics[Analytics]
    Dispute_Consumer[Dispute]
    Storage_Consumer[Storage]
    Settlement_Consumer[Settlement]

    Auth --> NATS
    KYC --> NATS
    IAM --> NATS
    Marketplace --> NATS
    Order --> NATS
    Payment --> NATS
    Currency --> NATS
    Wallet --> NATS
    Settlement --> NATS
    Chat --> NATS
    Dispute --> NATS
    Review --> NATS
    Zone --> NATS
    Moderation --> NATS
    Boost --> NATS
    Storage --> NATS

    NATS --> Search
    NATS --> Notification
    NATS --> Moderation_Consumer
    NATS --> Review_Consumer
    NATS --> Zone_Consumer
    NATS --> Analytics
    NATS --> Dispute_Consumer
    NATS --> Storage_Consumer
    NATS --> Settlement_Consumer

```