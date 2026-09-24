---
layout: doc
title: قرارداد رویداد
description: پوسته استاندارد NATS، فیلدها، نسخه‌بندی payload و مثال‌ها
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - Event
  - NATS
  - Contract
reviewers:
  - Backend Team
  - Devops
---

# قرارداد رویداد
**Event Payload Contract**

نسخه 1.0 | الزامی برای همه رویدادهای NATS

---

## 1. پوسته استاندارد (Envelope)

هر رویداد منتشر شده در NATS باید از این پوسته پیروی کند:

```json
{
  "id": "evt_01j2k3m4n5p6q7r8",
  "subject": "nons.order.completed",
  "version": "1.0",
  "timestamp": "2026-06-03T10:54:00.000Z",
  "source": "order-service",
  "traceId": "trace_abc123",
  "payload": {}
}
```

---

## 2. توضیح فیلدها

| فیلد | نوع | قانون | مثال |
|---|---|---|---|
| `id` | `evt_<ulid>` | یکتا در کل پلتفرم — هر انتشار یک id جدید | `evt_01j2k3m4n5p6q7r8` |
| `subject` | string | فرمت `nons.<domain>.<entity>.<action>` — مطابق با subject NATS | `nons.order.completed` |
| `version` | string | `major.minor` — با تغییرات مخرب major افزایش می‌یابد | `"1.0"`, `"2.0"` |
| `timestamp` | string | ISO 8601 UTC — همیشه UTC، همیشه با میلی‌ثانیه | `2026-06-03T10:54:00.000Z` |
| `source` | string | نام دقیق سرویس مبدأ | `order-service`, `payment-service` |
| `traceId` | string | شناسه ردیابی در سراسر سرویس‌ها — **الزامی** | `trace_abc123` |
| `payload` | object | فقط فیلدهای ضروری — نه کل موجودیت | `{ "orderId": "..." }` |

---

## 3. قوانین payload

| قانون | توضیح |
|---|---|
| حداقلی | فقط فیلدهای ضروری برای مصرف‌کنندگان — نه کل موجودیت دیتابیس |
| بدون وابسته | payload شامل داده‌های سرویس‌های دیگر نشود |
| انگلیسی | همه نام فیلدها و مقادیر به انگلیسی |
| نوع ثابت | نوع فیلدها در طول نسخه تغییر نمی‌کند |

```json
// ✅ درست — حداقلی
{
  "orderId": "018e1234-...",
  "sellerId": "018e1234-...",
  "amount": 15000,
  "status": "paid"
}

// ❌ غلط — کل موجودیت دیتابیس
{
  "id": "...",
  "orderId": "...",
  "sellerId": "...",
  "buyerId": "...",
  "amount": 15000,
  "status": "paid",
  "createdAt": "...",
  "updatedAt": "...",
  "internalNote": "...",
  "paymentGatewayId": "...",
  "cancelledAt": null,
  "deliveredAt": null
}
```

---

## 4. نسخه‌بندی رویداد (Event Versioning)

**تغییر مخرب در payload رویداد** = افزایش major version.

مصرف‌کنندگان قدیمی باید در طول انتقال هر دو نسخه را مدیریت کنند.

| نوع تغییر | مثال | افزایش version |
|---|---|---|
| افزودن فیلد اختیاری | اضافه شدن `discount` به payload | minor — `1.0` → `1.1` |
| افزودن فیلد اجباری | اضافه شدن `region` به payload | major — `1.x` → `2.0` |
| حذف فیلد | حذف `oldField` | major — `1.x` → `2.0` |
| تغییر نوع فیلد | `amount` از integer به string | major — `1.x` → `2.0` |
| تغییر نام فیلد | `createdAt` → `timestamp` | major — `1.x` → `2.0` |

### مثال انتشار همزمان دو نسخه:

```
nons.order.completed با version 1.0 → مصرف‌کنندگان قدیمی
nons.order.completed با version 2.0 → مصرف‌کنندگان جدید
```

پس از اطمینان از مهاجرت همه مصرف‌کنندگان، نسخه قدیمی متوقف می‌شود.

---

## 5. مثال‌های کامل

### رویداد ایجاد سفارش

```json
{
  "id": "evt_01j2k3m4n5p6q7r8",
  "subject": "nons.order.completed",
  "version": "1.0",
  "timestamp": "2026-06-03T10:54:00.000Z",
  "source": "order-service",
  "traceId": "trace_abc123",
  "payload": {
    "orderId": "018e1234-...",
    "sellerId": "018e1234-...",
    "buyerId": "018e1234-...",
    "amount": 25000,
    "currency": "USD"
  }
}
```

### رویداد پرداخت (version 2.0 با فیلد جدید)

```json
{
  "id": "evt_01j2k3m4n5p6q7r9",
  "subject": "nons.payment.released",
  "version": "2.0",
  "timestamp": "2026-06-03T10:55:00.000Z",
  "source": "payment-service",
  "traceId": "trace_abc123",
  "payload": {
    "orderId": "018e1234-...",
    "sellerId": "018e1234-...",
    "amount": 25000,
    "fee": 250,
    "releaseType": "standard"
  }
}
```

---

## 6. استاندارد subject NATS

فرمت کامل: `nons.<domain>.<entity>.<action>`

```
nons.order.completed
nons.order.paid
nons.order.delivered
nons.payment.escrow.released
```

برای مصرف‌کنندگان از wildcard: `nons.order.*` — همه رویدادهای یک entity را دریافت کنید.

---

## خلاصه

| مورد | قانون |
|---|---|
| پوسته ثابت | `id`, `subject`, `version`, `timestamp`, `source`, `traceId`, `payload` |
| id یکتا | `evt_<ulid>` برای هر رویداد |
| traceId | اجباری — ردیابی در سراسر سرویس‌ها |
| payload حداقلی | فقط فیلدهای ضروری |
| تغییر مخرب | افزایش version + انتشار همزمان دو نسخه |
