---
layout: doc
title: قوانین زبانی
description: زبان رسمی کد، موارد مجاز فارسی، ممنوعیت‌ها و استثناها
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - Language
reviewers:
  - Backend Team
---

# قوانین زبانی
**Language Policy**

نسخه 1.0 | الزامی برای همه سرویس‌ها، پکیج‌ها و مشارکت‌کنندگان

---

## 1. زبان رسمی کد (Canonical Language)

زبان رسمی و یکتای بکند **انگلیسی** است. تمام کدها، نام‌ها، کامنت‌ها، لاگ‌ها، پیام‌های خطا، متغیرها، توابع، کلاس‌ها، فایل‌ها، برنچ‌ها و کامیت‌ها باید به زبان انگلیسی باشند.

```typescript
// ✅ درست
logger.info('Order created successfully', { orderId });
throw new Error('Payment escrow lock failed');

// ❌ غلط
logger.info('سفارش با موفقیت ایجاد شد', { orderId });
throw new Error('قفل Escrow ناموفق بود');
```

---

## 2. موارد مجاز برای فارسی

فارسی فقط در این موارد مجاز است:

| مورد | توضیح | مثال |
|---|---|---|
| مستندات محصول | فایل‌های داخل `/docs` | این راهنما، استایل گاید، آموزش‌ها |
| فایل‌های i18n | متن‌های رابط کاربری | `fa.json`, `en.json` |
| ابزارهای مدیریت پروژه | پلتفرم‌های تیمی | Jira, Notion, Linear tasks |
| مستندات کسب‌وکار | توضیحات دامنه و فرآیند | ADRها، نیازمندی‌ها |

---

## 3. ممنوعیت‌های قطعی

هیچ متن فارسی در فایل‌های زیر مجاز نیست:

| نوع فایل | مثال |
|---|---|
| TypeScript / JavaScript | `*.ts`, `*.js`, `*.tsx`, `*.jsx` |
| Go | `*.go` |
| Python | `*.py` |
| YAML | `*.yml`, `*.yaml` |
| JSON | `*.json` |
| Environment | `.env`, `.env.*` (جز `.env.example`) |
| Shell Script | `*.sh`, `*.bash` |
| Dockerfile | `Dockerfile`, `*.dockerfile` |
| Makefile | `Makefile` |
| Database | فایل‌های SQL, Migration |

```yaml
# ✅ درست
environment:
  NODE_ENV: production
  LOG_LEVEL: info

# ❌ غلط
environment:
  NODE_ENV: تولید
  LOG_LEVEL: اطلاعات
```

---

## 4. مقادیر و ثابت‌ها

همه مقادیر وضعیت‌ها، نقش‌ها، مجوزها، رویدادها، کدهای خطا و مقادیر `enum` به زبان انگلیسی هستند:

```typescript
// ✅ درست
enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}

enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

// ❌ غلط
enum OrderStatus {
  PENDING = 'در_انتظار',
  PAID = 'پرداخت_شده'
}
```

---

## 5. لاگ‌ها و پیام‌های خطا

همه لاگ‌ها و خطاها به انگلیسی هستند:

```typescript
// ✅ درست - لاگ
logger.warn('Payment timeout exceeded', {
  orderId: 'abc-123',
  timeoutMs: 30000
});

// ✅ درست - خطا
throw new AppError('ORDER_NOT_FOUND', 'The requested order does not exist');

// ❌ غلط - لاگ
logger.warn('مدت زمان پرداخت تمام شد', { orderId: 'abc-123' });
```

---

## 6. کامیت‌ها و برنچ‌ها

پیام کامیت و نام برنچ باید انگلیسی باشد. توضیحات فارسی در کامیت ممنوع است:

```
✅ feat(order): add guarantee timer with 24h default
✅ fix(payment): prevent double escrow release
❌ feat(order): اضافه کردن تایمر گارانتی
❌ fix(payment): رفع باگ انتشار دوبرابر
```

---

## 7. استثناها (Exception)

تنها استثنا برای فارسی در کد، **کامنت‌های توضیحی برای قطعات کد بسیار پیچیده** است که می‌تواند به صورت دوزبانه (فارسی + انگلیسی) نوشته شود، اما ترجیح با انگلیسی است.

---

## خلاصه

| محیط | زبان | اجباری |
|---|---|---|
| کد منبع (`src/`) | انگلیسی | بله |
| کامنت‌ها | انگلیسی | ترجیح |
| لاگ‌ها | انگلیسی | بله |
| خطاها | انگلیسی | بله |
| نام متغیرها | انگلیسی | بله |
| نام فایل‌ها | انگلیسی | بله |
| کامیت‌ها | انگلیسی | بله |
| برنچ‌ها | انگلیسی | بله |
| مستندات (`docs/`) | فارسی | بله |
| i18n | فارسی | بله |
| Jira / Notion | فارسی | آزاد |
