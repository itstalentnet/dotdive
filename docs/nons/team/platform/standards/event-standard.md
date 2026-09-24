---
layout: doc
title: سیاست رویدادها
description: استاندارد رسمی پلتفرم برای طراحی، انتشار، نسخه‌بندی و مصرف رویدادها در NATS JetStream
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-15
tags:
  - Platform
  - Event
  - Standard
  - NATS
  - Contract
reviewers:
  - Backend Team
  - Devops
  - Platform Team
---

# سیاست رویداد ها
> Event Standard

## مفهوم کلیدی

```text
Event Catalog = فقط معنی و قرارداد
NATS = فقط حمل‌کننده پیام
```

رویدادها در سطح **معنا و قرارداد** در کاتالوگ رویدادها تعریف می‌شوند.
NATS JetStream صرفاً نقش **حمل‌کننده پیام** را دارد و هیچ اطلاعاتی از معنای رویداد ندارد.

---

## ۱. هدف سند

این سند استاندارد رسمی پلتفرم برای طراحی، انتشار، نسخه‌بندی و مصرف رویدادها است.

هر رویدادی که توسط هر سرویس منتشر می‌شود باید از این استاندارد پیروی کند.

این سند منبع حقیقت (Source of Truth) برای:

* تولیدکنندگان رویداد (Publishers)
* مصرف‌کنندگان رویداد (Consumers)
* بازبینان معماری
* توسعه‌دهندگان سرویس‌های جدید

است.

**توجه:** ساختار Event Envelope در `nons-api/contracts/envelope.proto` (Proto) تعریف می‌شود. این سند استانداردهای محتوایی و فرآیندی را مشخص می‌کند. این دو مکمل یکدیگر هستند.

---

# ۲. اصول طراحی رویداد

## Event یک حقیقت گذشته است

رویداد باید بیان‌کننده اتفاقی باشد که قبلاً رخ داده است.

درست:

```text
nons.order.completed
```

نادرست:

```text
nons.marketplace.complete_order
```

یا

```text
nons.order.complete
```

زیرا این‌ها Command هستند نه Event.

---

## Event باید Immutable باشد

پس از انتشار، هیچ Eventی نباید تغییر کند.

اگر وضعیت جدیدی ایجاد شد، Event جدید منتشر می‌شود.

درست:

```text
nons.order.created
nons.order.completed
nons.order.refunded
```

نادرست:

```text
nons.order.updated
```

برای هر تغییر وضعیت مهم.

---

## Event باید Self-Contained باشد

مصرف‌کننده نباید برای فهم Event مجبور به فراخوانی Publisher شود.

ترجیح:

```json
{
  "sellerId": "usr_123",
  "rating": 2
}
```

به جای:

```json
{
  "reviewId": "rev_123"
}
```

که مصرف‌کننده را مجبور به Query می‌کند.

---

## Event نباید شامل منطق تجاری باشد

درست:

```json
{
  "status": "BANNED"
}
```

نادرست:

```json
{
  "shouldLogout": true
}
```

تصمیم‌گیری وظیفه Consumer است.

---

# ۳. قرارداد نام‌گذاری

## Subject Convention

```text
nons.<domain>.<entity>.<action>
```

### Domain

نام bounded context یا سرویس مالک (مفرد).

نمونه:

```text
auth
iam
user
marketplace
order
payment
wallet
settlement
currency
chat
dispute
review
moderation
zone
boost
search
notification
storage
analytics
kyc
```

> **توجه:** لیست کامل ۲۰ دامنه مصوب در `ADR-EVENT-001` ثبت شده است. domain جدید فقط با ADR جدید قابل اضافه شدن است.

> **نکته دامنه `iam`:** رویدادهای IAM از بخش `<past_action>` با underscore برای کلمات چندبخشی استفاده می‌کنند (مثلاً `nons.iam.user.status_changed`). کاتالوگ کامل در `nons-api/catalog/events/iam/events.yaml`.

---

### Entity

موجودیت اصلی.

نمونه:

```text
user
order
product
review
message
transaction
```

---

### Action

باید فعل گذشته ساده (Past Simple) باشد — رویداد حقیقتی از گذشته را بیان می‌کند.

نمونه:

```text
created
registered
completed
published
resolved
verified
suspended
```

> ⚠️ `updated` ممنوع است — رویدادها باید تغییر وضعیت‌های مشخص را نشان دهند. از رویدادهای مشخص‌تر مانند `status_changed` استفاده کنید.

---

### قوانین

مجاز:

```text
nons.order.completed
```

غیرمجاز:

```text
nons.orders.completed
```

```text
nons.order.complete
```

```text
nons.Marketplace.Order.Completed
```

---

# ۴. قرارداد پاکت رویداد

تمام Eventها بدون استثنا باید از Envelope استاندارد استفاده کنند.

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

## الزامات فیلدها

### id

* یکتا در کل پلتفرم
* فرمت:

```text
evt_<ulid>
```

* هرگز نباید دوباره استفاده شود

---

### subject

باید دقیقاً با Subject منتشر شده در NATS یکسان باشد.

---

### version

نسخه Payload.

فرمت:

```text
major.minor
```

نمونه:

```text
1.0
1.1
2.0
```

---

### timestamp

* UTC
* ISO-8601
* زمان انتشار Event

نه زمان پردازش.

---

### source

نام سرویس منتشرکننده.

نمونه:

```text
iam-service
payment-service
order-service
```

---

### traceId

شناسه Correlation بین سرویس‌ها.

باید از درخواست اولیه propagate شود.

---

# ۵. طراحی Payload

## قواعد عمومی

Payload باید:

* حداقلی باشد
* کافی باشد
* قابل نسخه‌بندی باشد
* بدون داده اضافی باشد

---

## فیلدهای ممنوع

نباید موارد زیر داخل Event قرار گیرند:

```json
{
  "password": "...",
  "token": "...",
  "refreshToken": "...",
  "privateKey": "..."
}
```

---

## داده‌های PII

فقط در صورت نیاز واقعی.

نمونه:

```json
{
  "body": "chat message"
}
```

در `chat.message.sent`

مجاز است زیرا Moderation به آن نیاز دارد.

---

## داده‌های مشتق‌شده

از انتشار داده‌ای که Consumer می‌تواند خودش محاسبه کند خودداری شود.

نادرست:

```json
{
  "sellerLevel": "gold"
}
```

اگر از سایر داده‌ها قابل محاسبه است.

---

# ۶. Versioning

## Minor Version

سازگار با عقب.

نمونه:

```json
{
  "userId": "usr_1",
  "status": "ACTIVE",
  "country": "DE"
}
```

افزودن:

```json
{
  "country": "DE"
}
```

نسخه:

```text
1.0 -> 1.1
```

---

## Major Version

Breaking Change.

نمونه:

حذف:

```json
"userId"
```

یا

تغییر نوع:

```json
"userId": 123
```

به جای

```json
"userId": "123"
```

نسخه:

```text
1.x -> 2.0
```

---

## قوانین سازگاری

Publisher نباید Consumerهای موجود را بشکند.

تا زمان حذف کامل نسخه قبلی باید هر دو نسخه پشتیبانی شوند.

---

# ۷. مسئولیت Publisher

Publisher موظف است:

* Schema را اعتبارسنجی کند.
* Event را فقط پس از Commit موفق منتشر کند.
* از انتشار Event تکراری جلوگیری کند.
* TraceId را حفظ کند.
* Version صحیح را ارسال کند.

---

# ۸. مسئولیت Consumer

Consumer موظف است:

* Idempotent باشد.
* Version را بررسی کند.
* Eventهای ناشناخته را نادیده بگیرد.
* خطاها را Retry کند.
* وابسته به Ordering بین Subjectها نباشد.

---

# ۹. Ordering و Delivery

## Ordering

تضمین فقط در سطح:

```text
subject + publisher
```

وجود دارد.

بین Subjectهای مختلف هیچ تضمینی وجود ندارد.

---

## Delivery

تحویل حداقل یک بار:

```text
At-Least-Once
```

بنابراین:

```text
Duplicate Delivery Possible
```

---

## Idempotency

شناسه Event باید کلید Idempotency باشد.

```text
event.id
```

---

# ۱۰. مدیریت خطا و DLQ

(محتوای فعلی DLQ تقریباً بدون تغییر منتقل شود.)

زیرا این بخش استاندارد پلتفرم است نه وابسته به نوع Event.

---

# ۱۱. فرآیند افزودن Event جدید

قبل از ایجاد Event جدید باید بررسی شود:

1. آیا Event موجود نیاز را پوشش می‌دهد؟
2. آیا این تغییر واقعاً یک Event است یا Command؟
3. آیا Payload حداقلی است؟
4. آیا داده حساس در Payload وجود دارد؟
5. آیا Version مشخص شده است؟
6. آیا Consumerهای مورد انتظار شناسایی شده‌اند؟
7. آیا قرارداد در Catalog ثبت شده است؟

---

# ۱۲. رجیستری قراردادها

در انتهای سند، به جای بدنه اصلی فعلی، فقط یک رجیستری قرار می‌گیرد:

| Subject                                | Version | Owner               | Schema |
| -------------------------------------- | ------- | ------------------- | ------ |
| `nons.iam.user.status_changed`         | 1.0     | iam-service         | لینک   |
| `nons.iam.user.role_assigned`          | 1.0     | iam-service         | لینک   |
| `nons.order.completed`     | 1.0     | order-service | لینک   |
| ...                           | ...     | ...                 | ...    |

و سپس برای هر Event یک بخش مستقل:

```text
Contract Reference
```

شامل:

* Subject
* Publisher
* Consumers
* Schema
* Business Meaning
* Version History
* Examples
