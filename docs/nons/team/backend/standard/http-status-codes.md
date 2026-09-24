---
layout: doc
title: کدهای وضعیت HTTP
description: کدهای مجاز و ممنوعه — راهنمای استفاده از HTTP Status Codes در API
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
  - HTTP
reviewers:
  - Backend Team
---

# کدهای وضعیت HTTP
**HTTP Status Codes**

نسخه 2.0 | الزامی برای همه سرویس‌ها

> **مرجع اصلی:** [راهنمای طراحی API](../../platform/api/api-design-guidelines#۱۲-کدهای-وضعیت-http-status-codes) — این سند جزئیات فنی بیشتری ارائه می‌دهد.
>
> منبع اصلی کدهای خطا (Error Codes) در [nons-api/contracts/errors.proto](/docs/team/platform/package/contract_catalog) (Platform) و هر سرویس (Domain) — این سند فقط HTTP Status Codes را مشخص می‌کند

---

## 1. جدول کدهای مجاز

| کد | نام | زمان استفاده |
|---|---|---|
| `200` | OK | موفقیت با بدنه — دریافت منبع، لیست |
| `201` | Created | منبع جدید ایجاد شد — POST |
| `204` | No Content | موفقیت بدون بدنه — DELETE، بروزرسانی وضعیت |
| `400` | Bad Request | ورودی نامعتبر — validation error |
| `401` | Unauthorized | احراز هویت نشده — توکن缺失 یا نامعتبر |
| `403` | Forbidden | احراز هویت شده اما مجاز نیست |
| `404` | Not Found | منبع یافت نشد |
| `409` | Conflict | تداخل — نام تکراری، انتقال وضعیت نامعتبر |
| `422` | Unprocessable Entity | ورودی معتبر اما منطقاً نادرست |
| `424` | Failed Dependency | وابستگی سرویس در دسترس نیست — خطای تبدیل ارز |
| `429` | Too Many Requests | محدودیت نرخ فراتر رفته |
| `500` | Internal Server Error | خطای غیرمنتظره سرور |

---

## 2. قوانین طلایی

| قانون | توضیح |
|---|---|
| **هرگز برای خطا `200` برنگردانید** | خطا همیشه با کد خطا (4xx/5xx) برگردانده شود |
| **هرگز برای اشتباه کلاینت `500` برنگردانید** | خطای کلاینت = 4xx |
| **هرگز `5xx` را swallow نکنید** | خطای سرور باید ثبت و گزارش شود |
| **کد دقیق** | از نزدیک‌ترین کد به ماهیت خطا استفاده کنید |

---

## 3. توضیح هر کد

### 2xx — موفقیت

| کد | سناریوی دقیق | مثال |
|---|---|---|
| `200` | GET منبع, GET لیست, PATCH موفق | دریافت جزئیات سفارش |
| `201` | POST موفق — ایجاد منبع | ایجاد سفارش جدید |
| `204` | DELETE موفق, بروزرسانی وضعیت (بدون بازگشت بدنه) | حذف سفارش |

### 4xx — خطای کلاینت

| کد | سناریوی دقیق | مثال |
|---|---|---|
| `400` | JSON نامعتبر, validation, فیلد缺失 | `email` فرمت اشتباه دارد |
| `401` | بدون توکن, توکن منقضی, توکن نامعتبر | درخواست بدون `Authorization` header |
| `403` | نقش کاربر مجاز نیست | کاربر عادی می‌خواهد ادمین کند |
| `404` | منبع با این ID وجود ندارد | `GET /orders/0000` |
| `409` | نام تکراری, وضعیت غیرمجاز, شرط failed | تلاش برای پرداخت سفارش قبلاً پرداخت شده |
| `422` | ورودی structurally معتبر اما منطقاً غلط | موجودی کافی نیست |
| `424` | سرویس وابسته (مثلاً currency-service) در دسترس نیست | تبدیل ارز ناموفق |
| `429` | محدودیت rate limit | بیش از ۱۰۰ درخواست در دقیقه |

### 5xx — خطای سرور

| کد | سناریوی دقیق | مثال |
|---|---|---|
| `500` | خطای غیرمنتظره, دیتابیس Down, Null Pointer | اتصال به دیتابیس قطع شده |

---

## 4. مثال خطاها با کد مناسب

```json
// 400 — Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}

// 401 — Unauthorized
{
  "success": false,
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Access token has expired",
    "details": []
  }
}

// 403 — Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action",
    "details": []
  }
}

// 404 — Not Found
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "The requested order does not exist",
    "details": []
  }
}

// 409 — Conflict
{
  "success": false,
  "error": {
    "code": "ORDER_INVALID_STATUS",
    "message": "Cannot pay an already paid order",
    "details": []
  }
}

// 422 — Unprocessable Entity
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Buyer does not have sufficient balance",
    "details": []
  }
}

// 429 — Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later",
    "details": []
  }
}
```

---

## 5. کدهای ممنوعه

| کد | دلیل ممنوعیت |
|---|---|
| `402` | Payment Required — رزرو شده، برای پروژه ما معنی ندارد |
| `406` | Not Acceptable — از content negotiation استفاده نمی‌کنیم |
| `413` | Payload Too Large — با validation در 400 مدیریت می‌شود |
| `415` | Unsupported Media Type — همه سرویس‌ها JSON می‌گیرند |
| `423` | Locked — با 409 مدیریت می‌شود |
| `502` | Bad Gateway — پروکسی معکوس مدیریت می‌کند |
| `503` | Service Unavailable — با 500 مدیریت می‌شود |
| `504` | Gateway Timeout — پروکسی معکوس مدیریت می‌کند |

---

## خلاصه

| دسته | کدها |
|---|---|
| موفقیت | `200`, `201`, `204` |
| خطای کلاینت | `400`, `401`, `403`, `404`, `409`, `422`, `424`, `429` |
| خطای سرور | `500` |
