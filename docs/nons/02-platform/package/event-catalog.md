# سیاست کاتالوگ رویدادها

**Event Catalog Policy**

نسخه 2.0 | مرجع رسمی ثبت و نگهداری رویدادهای سیستم

> **به‌روزرسانی:** با تصویب ADR-Platform-001، ساختار Event Envelope در Proto تعریف می‌شود اما Event Catalog همچنان به صورت انسانی (yaml/json) نگهداری می‌شود. Proto فقط ساختار قراردادها را تعریف می‌کند — مالکیت Event Names در Catalog باقی می‌ماند.

---

## مفهوم کلیدی

```text
Event Catalog = فقط معنی و قرارداد (خوانایی انسانی)
Proto         = فقط ساختار Envelope (Code Generation)
NATS          = فقط حمل‌کننده پیام
```

کاتالوگ رویدادها تنها مرجع تعریف **معنی، نام، مالکیت و مصرف‌کنندگان** رویدادها است.
Proto (`envelope.proto`) فقط ساختار Event Envelope را تعریف می‌کند.
NATS صرفاً نقش **حمل‌کننده پیام** را دارد.

---

## 1. هدف

کاتالوگ رویدادها (Event Catalog) مرجع رسمی تعریف، نسخه‌بندی و نگهداری رویدادهای پلتفرم است.

این بخش نام رویدادها، مالک، مصرف‌کنندگان، قوانین نام‌گذاری و الزامات سازگاری را تعریف می‌کند و به Message Broker خاصی وابسته نیست.

کاتالوگ مسئول انتشار یا دریافت رویداد نیست.

---

## 2. محل نگهداری

Event Catalog به صورت فایل‌های انسانی (YAML یا JSON) نگهداری می‌شود:

```text
catalog/
└── events/
    ├── index.yaml          ← فهرست همه رویدادها
    ├── auth/
    │   └── events.yaml
    ├── order/
    │   └── events.yaml
    ├── payment/
    │   └── events.yaml
    ├── wallet/
    │   └── events.yaml
    ├── settlement/
    │   └── events.yaml
    └── ...
```

هر سرویس مالک رویدادهای خود را در فایل مربوطه تعریف می‌کند.

---

## 3. ساختار تعریف رویداد

### Event Envelope — در Proto

```protobuf
// contracts/envelope.proto
// فقط ساختار حمل پیام — نه نام رویدادها
message EventEnvelope {
  string id = 1;
  string subject = 2;
  string version = 3;
  string timestamp = 4;
  string source = 5;
  string trace_id = 6;
  bytes payload = 7;
}
```

### نام رویدادها — در Catalog

```yaml
# nons-api/catalog/events/order/events.yaml
events:
  - name: nons.order.created
    version: 1
    owner: order-service
    description: Order successfully created
    consumers:
      - payment-service
      - notification-service
    payload:
      orderId: string
      buyerId: string
      sellerId: string
      amount: number
      createdAt: string
```

---

## 4. محتوای هر رویداد

هر رویداد باید شامل اطلاعات زیر باشد:

```yaml
name: nons.order.created.v1

owner: order-service

version: 1

description: Order successfully created

consumers:
  - payment-service
  - notification-service

payload:
  orderId: string

  buyerId: string

  sellerId: string

  amount: number
```

---

## 5. مالکیت رویداد

هر رویداد فقط یک مالک دارد.

مثال:

```text
nons.order.created.v1
```

مالک:

```text
order-service
```

تنها سرویس مالک مجاز به انتشار این رویداد است.

سایر سرویس‌ها فقط مجاز به مصرف آن هستند.

---

## 6. فرآیند ایجاد رویداد جدید

قبل از ایجاد رویداد جدید باید بررسی شود:

1. آیا رویداد مشابهی از قبل وجود دارد؟
2. آیا رویداد متعلق به سرویس فعلی است؟
3. آیا نام رویداد با استاندارد نام‌گذاری سازگار است؟
4. آیا نسخه مشخص شده است؟

پس از تأیید:

```text
1. ثبت رویداد در Catalog (فایل YAML)

2. تعریف Payload در مستندات

3. مشخص کردن مالک

4. ثبت مصرف‌کنندگان احتمالی
```

> توجه: Event Nameها در Proto به Enum تبدیل نمی‌شوند. آنها در Catalog باقی می‌مانند تا خوانایی انسانی و مستندسازی بهتر حفظ شود.

---

## 7. فرآیند تغییر رویداد

تغییرات غیرمخرب:

```text
افزودن توضیحات
افزودن مصرف‌کننده جدید
اصلاح مستندات
```

نیازی به نسخه جدید ندارند.

---

تغییرات مخرب:

```text
حذف فیلد
تغییر نام فیلد
تغییر نوع فیلد
افزودن فیلد اجباری
```

باید نسخه جدید ایجاد کنند.

مثال:

```text
nons.order.created.v1
```

↓

```text
nons.order.created.v2
```

---

## 8. حذف رویداد

حذف رویداد ممنوع است.

رویدادها فقط می‌توانند:

```text
Deprecated
```

شوند.

مثال:

```yaml
status: deprecated
replacement: order.created.v2
```

---

## 9. ثبت مصرف‌کنندگان

تمام مصرف‌کنندگان شناخته‌شده باید در مستند رویداد ثبت شوند.

مثال:

```yaml
consumers:
  - payment-service
  - notification-service
  - audit-service
```

این اطلاعات برای تحلیل اثر تغییرات الزامی است.

---

## 10. کشف رویدادها

توسعه‌دهندگان قبل از:

- Publish
- Subscribe
- ایجاد Event جدید

باید ابتدا کاتالوگ رویدادها را بررسی کنند.

هیچ رویدادی نباید خارج از Event Catalog ایجاد یا استفاده شود.

---

## 11. ساختار پیشنهادی Catalog

```text
catalog/
└── events/
    ├── index.yaml
    ├── auth/
    │   └── events.yaml
    ├── order/
    │   └── events.yaml
    ├── payment/
    │   └── events.yaml
    ├── wallet/
    │   └── events.yaml
    ├── settlement/
    │   └── events.yaml
    ├── review/
    │   └── events.yaml
    └── platform/
        └── events.yaml      # رویدادهای سطح پلتفرم (heartbeat, registry)
```

---

## 12. اصل مرجع واحد

کاتالوگ رویدادها:

```text
Single Source of Truth
```

برای نام، مالکیت، نسخه و مصرف‌کنندگان Eventهای سیستم است.

Proto (`envelope.proto`):

```text
Single Source of Truth
```

برای ساختار Event Envelope است.

این دو مکمل یکدیگر هستند — نه رقیب.

---

## 13. رویدادهای جدید دامنه مالی

### ۱۳.۱ سفارش

| رویداد                 | Owner         | Consumers          | Payload                                              |
| ---------------------- | ------------- | ------------------ | ---------------------------------------------------- |
| `nons.order.delivered` | order-service | settlement-service | `{ orderId, sellerId, amountUsdCents, deliveredAt }` |

### ۱۳.۲ پرداخت

| رویداد                   | Owner           | Consumers                             | Payload                                                                       |
| ------------------------ | --------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| `nons.payment.confirmed` | payment-service | settlement-service, analytics-service | `{ orderId, amountUsdCents, amountLocal, currency, rateAtPayment, provider }` |

### ۱۳.۳ تسویه

| رویداد                                  | Owner              | Consumers                                               | Payload                                                                       |
| --------------------------------------- | ------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `nons.settlement.completed`             | settlement-service | wallet-service, notification-service, analytics-service | `{ sellerId, amountUsdCents, commissionUsdCents, settledAt }`                 |
| `nons.settlement.refund.initiated`      | settlement-service | wallet-service, notification-service                    | `{ orderId, buyerId, amountUsdCents, reason }`                                |
| `nons.settlement.commission.calculated` | settlement-service | analytics-service                                       | `{ sellerId, orderId, rate, amountUsdCents, commissionUsdCents, sellerTier }` |

### ۱۳.۴ پلتفرم

| رویداد | Owner | Consumers | Payload |
|---|---|---|---|
| `platform.service.status_changed` | core-service (Go) | notification-service, analytics-service | `{ serviceName, version, environment, oldStatus, newStatus, timestamp }` |

### ۱۳.۵ احراز هویت

| رویداد | Owner | Consumers | Payload |
|---|---|---|---|
| `nons.auth.user.registered` | auth-service | iam-service, notification-service | `{ id, email, name, registeredAt }` |
| `nons.auth.user.logged_in` | auth-service | iam-service, notification-service | `{ id, email, loggedInAt }` |
| `nons.auth.user.logged_out` | auth-service | iam-service | `{ id, loggedOutAt }` |
| `nons.auth.user.password_changed` | auth-service | notification-service | `{ id, changedAt }` |

### ۱۳.۶ توکن (Token Service)

| رویداد | Owner | Consumers | Payload |
|---|---|---|---|
| `nons.token.issued` | token-service | audit-service, analytics-service | `{ sub, client_id, scope, grantedAt }` |
| `nons.token.revoked` | token-service | audit-service, iam-service | `{ sub, client_id, revokedAt }` |

