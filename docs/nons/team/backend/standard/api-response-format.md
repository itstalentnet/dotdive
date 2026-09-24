---
layout: doc
title: فرمت پاسخ API
description: ساختار استاندارد پاسخ‌های موفق و خطا — single resource، list، error
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - API
  - Contract
reviewers:
  - Backend Team
---

# فرمت پاسخ API
**API Response Format**

نسخه 2.0 | الزامی برای همه سرویس‌ها

> **مرجع اصلی:** [راهنمای طراحی API](../../platform/api/api-design-guidelines) — این سند جزئیات فنی بیشتری ارائه می‌دهد.

---

## 1. ساختار یکتا

همه پاسخ‌های API از یک ساختار ثابت پیروی می‌کنند:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

- `success` (boolean): `true` برای موفق، `false` برای خطا
- `data`: محتوای اصلی پاسخ (object یا array)
- `meta`: فراداده (اختیاری) — pagination, request_id, warnings

برای خطاها به جای `data` و `meta` از `error` استفاده می‌شود.

---

## 2. پاسخ موفق — منبع تکی (Single Resource)

```json
{
  "success": true,
  "data": {
    "id": "01901234-5678-7abc-def0-123456789abc",
    "status": "pending",
    "amount": 150.00,
    "createdAt": "2026-07-01T12:00:00.000Z"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

**کد HTTP:** `200`

---

## 3. پاسخ موفق — لیست (Collection)

```json
{
  "success": true,
  "data": [
    {
      "id": "01901234-...",
      "status": "pending",
      "amount": 150.00
    },
    {
      "id": "01901234-...",
      "status": "paid",
      "amount": 250.00
    }
  ],
  "meta": {
    "pagination": {
      "next_cursor": "abc123...",
      "prev_cursor": null,
      "has_more": true,
      "limit": 20
    },
    "request_id": "req_abc123"
  }
}
```

| فیلد meta.pagination | نوع | توضیح |
|---|---|---|
| `next_cursor` | string\|null | کاتسور برای صفحه بعد — `null` اگر صفحه بعدی نباشد |
| `prev_cursor` | string\|null | کاتسور برای صفحه قبل — `null` اگر در صفحه اول باشیم |
| `has_more` | boolean | **الزامی** — آیا داده بیشتری وجود دارد |
| `limit` | integer | تعداد درخواست‌شده |

> **تغییر از نسخه ۱:** سیستم صفحه‌بندی از Offset-based (`page`, `total`) به Cursor-based تغییر کرده است. جزئیات در [راهنمای طراحی API](../../platform/api/api-design-guidelines#۴-قرارداد-صفحه‌بندی-pagination-contract).

**کد HTTP:** `200`

---

## 4. پاسخ موفق — ایجاد (Created)

```json
{
  "success": true,
  "data": {
    "id": "01901234-5678-7abc-def0-123456789abc",
    "status": "pending"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

**کد HTTP:** `201`  
**Header:** `Location: /v1/orders/01901234-...`

---

## 5. پاسخ موفق — بدون بدنه (No Content)

```json
// بدون بدنه — فقط status code
```

**کد HTTP:** `204`  
**موارد استفاده:** DELETE, برخی PATCHها

---

## 6. پاسخ خطا (Error)

```json
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "The requested order does not exist",
    "details": [
      {
        "field": "orderId",
        "message": "Must be a valid UUID"
      }
    ]
  }
}
```

| فیلد | نوع | قانون |
|---|---|---|
| `code` | string | `SCREAMING_SNAKE_CASE` — Platform codes از Proto (nons-api/contracts/errors.proto)، Domain codes از سرویس مربوطه |
| `message` | string | انگلیسی، قابل خواندن توسط انسان، ایمن برای نمایش |
| `details` | array | فقط برای خطاهای اعتبارسنجی — در غیر این صورت آرایه خالی `[]` |

**قوانین:**
- هرگز stack trace به کلاینت نشان ندهید
- هرگز مسیرهای داخلی یا خطاهای دیتابیس را به کلاینت نشان ندهید
- `details` فقط برای Validation Errors استفاده شود

---

## 7. خطای اعتبارسنجی (Validation Error)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      },
      {
        "field": "age",
        "message": "Must be at least 18"
      }
    ]
  }
}
```

---

## 8. خطای کسب‌وکار (Business Error)

```json
{
  "success": false,
  "error": {
    "code": "ORDER_INVALID_STATUS",
    "message": "Cannot transition order from 'pending' to 'completed'",
    "details": []
  }
}
```

---

## 9. قوانین کلی

| قانون | ✅ درست | ❌ غلط |
|---|---|---|
| کلید سطح بالا | `success` + `data` یا `success` + `error` | `data` و `error` همزمان |
| کد خطا | `ORDER_NOT_FOUND` | `404`, `not_found` |
| زبان خطا | انگلیسی | فارسی |
| stack trace | هرگز | `"message": "Error: at OrderService.getById (...)"` |
| خطای دیتابیس | `"message": "Internal server error"` | `"message": "Duplicate key violation on table orders"` |
| خطای ۲۰۰ | هرگز برای خطا | `{ "data": null, "error": {...} }` |
| `success` | همیشه `true` یا `false` | absence یا `null` |

---

## 10. مثال‌های سریع

| سناریو | کد | body |
|---|---|---|
| دریافت کاربر | 200 | `{ "success": true, "data": { "id": "...", "name": "..." }, "meta": {} }` |
| لیست کاربران | 200 | `{ "success": true, "data": [...], "meta": { "pagination": {...} } }` |
| ایجاد کاربر | 201 | `{ "success": true, "data": { "id": "..." }, "meta": {} }` |
| حذف کاربر | 204 | — |
| کاربر یافت نشد | 404 | `{ "success": false, "error": { "code": "USER_NOT_FOUND", "message": "...", "details": [] } }` |
| ورودی نامعتبر | 400 | `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }` |

---

## 11. پاسخ خطاهای Currency Service

Currency Service از ساختار خطای استاندارد پیروی می‌کند، با کدهای خطای زیر:

```json
// 422 — جفت ارز پشتیبانی‌نشده
{
  "success": false,
  "error": {
    "code": "UNSUPPORTED_PAIR",
    "message": "Currency pair IRR/USDT is not supported",
    "details": []
  }
}

// 424 — سرویس وابسته در دسترس نیست (Failed Dependency)
{
  "success": false,
  "error": {
    "code": "RATE_UNAVAILABLE",
    "message": "Exchange rate source is unavailable and no cached rate exists",
    "details": []
  }
}

// 400 — مقدار نامعتبر
{
  "success": false,
  "error": {
    "code": "INVALID_AMOUNT",
    "message": "Amount must be a positive integer",
    "details": [{ "field": "amount", "message": "Must be greater than zero" }]
  }
}
```

| کد خطا | HTTP Status | سناریو |
|--------|-------------|--------|
| `UNSUPPORTED_PAIR` | 422 | جفت ارز درخواستی پشتیبانی نمی‌شود |
| `RATE_UNAVAILABLE` | 424 | منبع نرخ ارز در دسترس نیست و cache موجود نیست |
| `INVALID_AMOUNT` | 400 | مقدار ورودی منفی، صفر یا نامعتبر است |
