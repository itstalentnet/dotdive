---
layout: doc
title: Currency Service
description: تنها مرجع نرخ ارز و تبدیل مبلغ در پلتفرم
version: 1.0.0
status: BLUEPRINT
author: xoxxel
owner: xoxxel
created_at: 2026-06-11
updated_at: 2026-06-11
tags:
  - Backend
  - Service
  - Currency
  - Blueprint
reviewers:
  - Backend Team
---

# Currency Service

> **Blueprint v1.0 — پیش از توسعه**

---

## 1. هدف سرویس

تنها مرجع نرخ ارز و تبدیل مبلغ در کل پلتفرم. هر سرویسی که نیاز به تبدیل ارز دارد فقط با این سرویس صحبت می‌کند. نرخ‌ها از منابع خارجی (Nobitex، fixer.io) دریافت و در Redis cache می‌شوند.

---

## 2. مسئولیت‌ها

- دریافت نرخ زنده از منابع خارجی (Nobitex برای IRR، fixer.io برای سایر ارزها) هر ۵ دقیقه
- کش کردن نرخ‌ها در Redis
- ارائه نرخ خام از طریق `GET /rates`
- تبدیل مبلغ با rounding صحیح و مدیریت precision از طریق `POST /convert`
- مدیریت fallback: در صورت عدم دسترسی به منبع خارجی، از آخرین نرخ کش شده استفاده کند

---

## 3. حوزه (Scope)

**در این سرویس:**
- دریافت و کش نرخ ارز
- تبدیل مبلغ با rounding صحیح
- مدیریت precision/decimal rules به ازای هر ارز

**نیست در این سرویس:**
- منطق پرداخت
- ذخیره تاریخچه نرخ (مسئولیت analytics-service)
- نمایش قیمت به کاربر

---

## 3.۱. مرز مسئولیت با Pool Service

> **تصمیم معماری (C9):** هیچ همپوشانی مسئولیتی بین Currency Service و Pool Service وجود ندارد.

- **Pool Service** مالک **Reference Data** ارز است: کدهای ISO 4217، نام ارزها، نماد (Symbol)، دقت اعشار (Precision) و نگاشت کشور (Country Mapping).
- **Currency Service** مالک **نرخ** است: نرخ تبدیل، نرخ لحظه‌ای (Live Rate)، نرخ‌های تاریخی (Historical Rates) و داده‌های بازار (Market Data).

Currency Service برای نمایش لیست/انوم ارزها از Pool Service استفاده می‌کند؛ اما محاسبه و نگهداری نرخ زنده صرفاً در این سرویس انجام می‌شود.

---

## 4. تکنولوژی

| مؤلفه | فناوری |
|---|---|
| زبان | Node.js / NestJS |
| کش | Redis (TTL: ۵ دقیقه) |
| دیتابیس | ندارد |
| منابع خارجی | Nobitex (IRR), fixer.io (سایر ارزها) |

---

## 5. API

### `GET /rates`

دریافت نرخ تمام ارزهای پشتیبانی‌شده.

```typescript
interface GetRatesResponse {
  USD_IRR: number
  USD_TRY: number
  USD_EUR: number
  updatedAt: string
}
```

### `POST /convert`

تبدیل مبلغ از یک ارز به ارز دیگر.

```typescript
interface ConvertRequest {
  amount: bigint        // integer — lowest unit (e.g. cents)
  from: Currency
  to: Currency
}

interface ConvertResponse {
  result: bigint        // converted amount — integer
  rate: number          // applied rate
  rateAt: string        // timestamp of the rate
}
```

**خطاها:**

| کد | وضعیت | توضیح |
|---|---|---|
| `UNSUPPORTED_PAIR` | 422 | جفت‌ارز پشتیبانی نمی‌شود |
| `RATE_UNAVAILABLE` | 424 | نرخ در دسترس نیست |
| `INVALID_AMOUNT` | 422 | مبلغ نامعتبر (صفر یا منفی) |

---

## 6. ارزهای پشتیبانی‌شده

| جفت | وضعیت |
|---|---|
| `USD/IRR` | فعلی |
| `USD/TRY` | آینده |
| `USD/EUR` | آینده |

---

## 7. مصرف‌کنندگان

| سرویس | دلیل |
|---|---|
| marketplace-service | تبدیل ارز فروشنده به USD هنگام ثبت قیمت |
| payment-service | تبدیل USD به ارز gateway هنگام پرداخت |
| search-service | فیلتر قیمت بر اساس ارز کاربر |
| settlement-service | تبدیل مبلغ تسویه به ارز فروشنده |

---

## 8. وابستگی‌ها

| وابستگی | نوع |
|---|---|
| Redis | کش نرخ |
| Nobitex API | منبع نرخ IRR |
| fixer.io API | منبع نرخ سایر ارزها |

---

## 9. رویدادها

این سرویس **رویدادی منتشر نمی‌کند**. کاملاً synchronous API است.

---

## 10. خطا و Fallback

| سناریو | رفتار |
|---|---|
| سرویس در دسترس نیست، Redis کش دارد | استفاده از آخرین نرخ کش شده |
| سرویس در دسترس نیست، Redis هم در دسترس نیست | **توقف پرداخت** — رویداد به DLQ |
| کش منقضی شده (TTL) | تلاش مجدد برای نرخ جدید؛ در صورت失敗 → DLQ |
| جفت‌ارز پشتیبانی نمی‌شود | خطای `UNSUPPORTED_PAIR` |

**Retry policy:**

| تلاش | تأخیر | اقدام |
|---|---|---|
| ۱ | ۱ ثانیه | درخواست مجدد به منبع خارجی |
| ۲ | ۵ ثانیه | تلاش مجدد + استفاده از کش |
| ۳ | ۳۰ ثانیه | اجبار به استفاده از کش |
| پس از ۳ تلاش | — | اگر کش نبود → DLQ |

---

## 11. مسیر توسعه

| مرحله | وضعیت |
|---|---|
| Blueprint | ✅ تکمیل |
| Demo | ⏳ در انتظار |
| توسعه | ❌ شروع نشده |
| تست | ❌ شروع نشده |
| انتشار | ❌ شروع نشده |
