---
layout: doc
title: راهنمای طراحی API
description: استاندارد رسمی طراحی API برای تمام سرویس‌های پلتفرم نونز
version: 1.0.0
status: APPROVED
author: Platform Team
owner: Platform Team
created_at: 2026-07-02
updated_at: 2026-07-02
tags:
  - Platform
  - API
  - Standard
  - Contract
reviewers:
  - Backend Team
  - Frontend Team
  - Platform Team
---

# راهنمای طراحی API

**API Design Guidelines**

نسخه 1.0 | الزامی برای تمام سرویس‌های پلتفرم

> این سند مرجع رسمی طراحی API است. تمام سرویس‌ها موظف به رعایت این استاندارد هستند. هرگونه انحراف نیاز به ADR جدید دارد.

---

## ۱. خط‌مشی نسخه‌گذاری (Versioning Policy)

نسخه API همیشه درون URL قرار می‌گیرد:

```
/v1/{resource}
/v2/{resource}
```

**قوانین:**

- نسخه‌گذاری Path-based (`/v1/*`) تنها روش مجاز است
- Header Versioning و Media Type Versioning در حال حاضر استفاده نمی‌شوند
- نسخه‌گذاری API مستقل از ابزار کلاینت است — هماهنگی از طریق Service Manifest انجام می‌شود (مطابق [ADR-Platform-004](../ADR/ADR-Platform-004))
- تغییرات غیرشکننده (افزودن فیلد، افزودن اندپوینت) نیاز به افزایش نسخه ندارند
- تغییرات شکننده (حذف فیلد، تغییر نام، تغییر تایپ) نیاز به افزایش نسخه دارند

---

## ۲. پوسته پاسخ (Response Envelope)

تمام پاسخ‌های موفق باید ساختار یکسان داشته باشند:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

- `success`: boolean — برای پاسخ موفق `true`
- `data`: محتوای اصلی پاسخ (object یا array)
- `meta`: فراداده (اختیاری) — شامل pagination، execution time، warnings، request id

**پاسخ موفق — لیست:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "request_id": "req_abc123",
    "took_ms": 45
  }
}
```

**پاسخ موفق — ایجاد (Created):**
```json
{
  "success": true,
  "data": {
    "id": "01901234-5678-7abc-def0-123456789abc"
  }
}
```

**کد HTTP:** `200` (GET, PATCH), `201` (POST), `204` (DELETE)

---

## ۳. قرارداد خطا (Error Contract)

تمام خطاها باید ساختار یکسان داشته باشند:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CODE",
    "message": "Invalid code",
    "details": {}
  }
}
```

| فیلد | نوع | قانون |
|------|------|--------|
| `success` | boolean | همیشه `false` |
| `error.code` | string | `SCREAMING_SNAKE_CASE` — ثابت و ماشین‌خوان |
| `error.message` | string | انگلیسی، قابل خواندن توسط انسان، ایمن برای نمایش |
| `error.details` | object/array | اختیاری — فقط برای Validation Errors |

**قوانین:**

- `code` ثابت و ماشین‌خوان باشد — هرگز کد HTTP را به عنوان `code` استفاده نکنید
- `message` برای نمایش مناسب باشد — هرگز stack trace یا جزئیات داخلی را نشان ندهد
- `details` اختیاری است — برای Validation Errors می‌تواند آرایه‌ای از `{ field, message }` باشد
- کدهای خطای پلتفرم (مشترک) در `nons-api/contracts/errors.proto` تعریف می‌شوند
- کدهای خطای دامنه (اختصاصی هر سرویس) در همان سرویس تعریف می‌شوند

**نمونه Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "message": "Must be a valid email address" },
      { "field": "age", "message": "Must be at least 18" }
    ]
  }
}
```

---

## ۴. قرارداد صفحه‌بندی (Pagination Contract)

روش پیش‌فرض صفحه‌بندی در تمام سرویس‌ها **Cursor-Based** است.

**درخواست:**
```
GET /v1/users?limit=50&cursor=xxxxx
```

| پارامتر | نوع | پیش‌فرض | قانون |
|---------|------|---------|--------|
| `limit` | integer | 20 | حداکثر ۱۰۰ |
| `cursor` | string | — | opaque — client نباید ساختار داخلی آن را تحلیل کند |

**پاسخ:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "pagination": {
      "next_cursor": "abc123...",
      "prev_cursor": "def456...",
      "has_more": true,
      "limit": 50
    }
  }
}
```

| فیلد | نوع | قانون |
|------|------|--------|
| `next_cursor` | string\|null | کاتسور برای صفحه بعد — `null` اگر صفحه بعدی نباشد |
| `prev_cursor` | string\|null | کاتسور برای صفحه قبل — `null` اگر در صفحه اول باشیم |
| `has_more` | boolean | **الزامی** — آیا داده بیشتری وجود دارد |
| `limit` | integer | تعداد درخواست‌شده در این صفحه |

**قوانین:**
- Cursor باید opaque باشد — Client نباید ساختار داخلی آن را تحلیل کند
- وجود `has_more` الزامی است
- Offset-based pagination (`page`, `offset`) مجاز نیست — مگر با توجیه فنی مستند در ADR

---

## ۵. فیلترگذاری (Filtering)

Backend فقط **قرارداد فیلتر** را تعریف می‌کند — یعنی اعلام می‌کند چه فیلدهایی قابل فیلتر هستند و چه عملگرهایی پشتیبانی می‌شوند.

Frontend نحوه ساخت Query را توسعه می‌دهد. یعنی:
- Registry می‌تواند پارامترهای مختلف را قبل از ارسال Request به API اضافه کند
- Backend صرفاً Query نهایی را دریافت می‌کند

**نمونه:**
```
GET /v1/products?category=gold&min_price=100&max_price=500
```

**قوانین:**
- Backend عملگرهای پشتیبانی‌شده را در OpenAPI اعلام می‌کند
- Frontend تصمیم می‌گیرد چه پارامترهایی ارسال شود
- Backend هرگز منطق UI را برای ساخت فیلتر پیاده‌سازی نمی‌کند

---

## ۶. مرتب‌سازی (Sorting)

Backend قابلیت Sort را پشتیبانی می‌کند، اما Frontend تصمیم می‌گیرد چه پارامترهایی ارسال شود.

```
GET /v1/products?sort=created_at:desc,price:asc
```

**پیش‌فرض:** `created_at desc` — اما قابل Override توسط کلاینت.

**قوانین:**
- Sort نباید داخل Backend هاردکد شود
- Backend فیلدهای قابل Sort را در OpenAPI اعلام می‌کند
- فرمت: `{field}:{direction}` — جهت‌های مجاز: `asc`, `desc`
- چندین فیلد با کاما جدا می‌شوند

---

## ۷. قرارداد جستجو (Search Convention)

جستجوی متن در تمام سرویس‌ها با پارامتر `q` انجام می‌شود:

```
GET /v1/products?q=gold+coin
```

**قوانین:**
- پارامتر `q` در تمام سرویس‌ها برای جستجوی متن استفاده شود
- Backend دامنه و فیلدهای جستجو را در OpenAPI اعلام می‌کند
- سرویس‌ها در پیاده‌سازی جستجو آزادند (مثلاً Elasticsearch، ILIKE، ...)

---

## ۸. فرمت تاریخ (Date Format)

تمام تاریخ‌ها در ورودی و خروجی API باید به فرمت **ISO8601 UTC** باشند:

```
2026-07-01T12:00:00Z
```

**قوانین:**
- تمام تاریخ‌ها با پسوند `Z` (UTC) ارسال شوند
- کلاینت مسئول تبدیل به منطقه زمانی محلی است
- نام فیلدهای تاریخ: `created_at`, `updated_at`, `deleted_at` — بدون prefix `date` یا `time`

---

## ۹. خط‌مشی شناسه (ID Policy)

تمام شناسه‌های عمومی (Public IDs) که در API نمایان می‌شوند باید **UUID v7** باشند:

```
01901234-5678-7abc-def0-123456789abc
```

**قوانین:**
- تمام Primary Keys در API از نوع UUID هستند
- Backend در صورت نیاز می‌تواند شناسه داخلی متفاوتی داشته باشد (auto-increment integer و ...)
- شناسه داخلی هرگز به کلاینت نشان داده نمی‌شود
- UUID v7 (time-ordered) ترجیح داده می‌شود — سازگار با ایندکس‌های B-tree

---

## ۱۰. احراز هویت (Authentication)

پلتفرم از سه روش احراز هویت پشتیبانی می‌کند:

| روش | موارد استفاده |
|------|---------------|
| **Cookie Session** | پنل ادمین — پیش‌فرض |
| **Bearer JWT** | سرویس‌ها، CLI، موبایل |
| **API Key** | Integrationهای خارجی (اختیاری) |

**قانون مهم — پنل ادمین:**
- API باید از Cookie Authentication پشتیبانی کند
- پنل ادمین به صورت پیش‌فرض با Cookie کار می‌کند
- Bearer Token و API Key برای Clientهای دیگر (CLI، سرویس‌ها، موبایل و ...) قابل استفاده هستند

**تعیین روش در OpenAPI:**
- هر سرویس فقط Schemeهای مورد نیاز خود را اعلان می‌کند
- الزامی نیست همه سرویس‌ها همه روش‌ها را همزمان پیاده‌سازی کنند

---

## ۱۱. قراردادهای نام‌گذاری (Naming Convention)

### ۱۱.۱ OperationId
- camelCase — فعل + اسم
- نمونه: `login`, `logout`, `listUsers`, `createUser`, `getUserById`, `updateUser`, `deleteUser`

### ۱۱.۲ Tags
- PascalCase — اسم مفرد
- نمونه: `Users`, `Orders`, `Products`, `Auth`

### ۱۱.۳ Schema Names
- PascalCase
- نمونه: `User`, `Order`, `CreateUserRequest`, `UserResponse`

### ۱۱.۴ Property Names
- camelCase
- نمونه: `firstName`, `createdAt`, `orderStatus`, `totalAmountUsd`

### ۱۱.۵ Query Parameters
- camelCase یا snake_case (یکسان در کل سرویس)
- نمونه: `sortBy`, `createdAfter`, `status`, `q`

---

## ۱۲. کدهای وضعیت HTTP (Status Codes)

کدهای مجاز در تمام سرویس‌ها:

| کد | نام | زمان استفاده |
|-----|------|-------------|
| `200` | OK | موفقیت با بدنه — GET منبع، GET لیست، PATCH موفق |
| `201` | Created | منبع جدید ایجاد شد — POST موفق |
| `204` | No Content | موفقیت بدون بدنه — DELETE، بروزرسانی وضعیت بدون بازگشت بدنه |
| `400` | Bad Request | ورودی نامعتبر — validation error، JSON نامعتبر |
| `401` | Unauthorized | احراز هویت نشده — توکن缺失 یا نامعتبر |
| `403` | Forbidden | احراز هویت شده اما مجاز نیست |
| `404` | Not Found | منبع یافت نشد |
| `409` | Conflict | تداخل — نام تکراری، انتقال وضعیت نامعتبر |
| `422` | Unprocessable Entity | ورودی structurally معتبر اما منطقاً نادرست |
| `424` | Failed Dependency | سرویس وابسته در دسترس نیست |
| `429` | Too Many Requests | محدودیت نرخ فراتر رفته |
| `500` | Internal Server Error | خطای غیرمنتظره سرور |

**قوانین طلایی:**
- هرگز برای خطا `200` برنگردانید
- هرگز برای اشتباه کلاینت `500` برنگردانید
- هرگز `5xx` را swallow نکنید
- از نزدیک‌ترین کد به ماهیت خطا استفاده کنید

---

## ۱۳. خط‌مشی Nullable (Nullable Policy)

تفاوت بین سه حالت زیر باید به صورت رسمی تعریف شود:

| حالت | معنی | مثال JSON |
|------|------|-----------|
| **وجود ندارد** | فیلد optional است و ارسال نشده | حذف کامل فیلد از body |
| `null` | فیلد وجود دارد اما مقدارش مشخص نیست / حذف شده | `"avatar": null` |
| `""` (empty string) | مقدار خالی معتبر | `"middleName": ""` |

**قوانین:**
- `null` یعنی «مقدار ندارد» — مثلاً «تصویر پروفایل حذف شده»
- عدم وجود فیلد یعنی «ارسال نشده» — برای PATCH، فیلدهای ارسال‌نشده تغییر نمی‌کنند
- `""` یعنی «مقدار خالی معتبر» — مثلاً «نام وسط وجود ندارد»
- در OpenAPI، فیلدهای nullable باید صریحاً علامت‌گذاری شوند: `nullable: true`

---

## ۱۴. خط‌مشی منسوخ‌سازی (Deprecation Policy)

هر اندپوینت منسوخ باید:

```yaml
deprecated: true
x-deprecated-date: "2026-07-01"
x-sunset-date: "2026-10-01"
x-replacement: "/v2/orders"
```

**قوانین:**
- اندپوینت‌های منسوخ حداقل **یک نسخه کامل** (major version) قبل از حذف باید اعلام شوند
- `deprecated: true` در OpenAPI الزامی است
- `x-deprecated-date` و `x-sunset-date` و `x-replacement` به عنوان metadata اضافی توصیه می‌شوند
- اندپوینت قدیمی تا زمان sunset-date باید کار کند
- پس از sunset-date، اندپوینت می‌تواند `410 Gone` برگرداند یا حذف شود
- تغییرات در CHANGELOG سرویس ثبت شود

---

## مستندات مرتبط

| سند | توضیح |
|-----|--------|
| [OpenAPI Guidelines](./openapi-guidelines) | استاندارد تولید OpenAPI |
| [فرمت پاسخ API (جزئیات)](../../backend/standard/api-response-format) | جزئیات بیشتر Response Envelope |
| [کدهای وضعیت HTTP (جزئیات)](../../backend/standard/http-status-codes) | جزئیات بیشتر Status Codes |
| [ADR-Platform-004](../ADR/ADR-Platform-004) | استراتژی مدیریت Registry و تولید مصنوعات |
| [استاندارد نام‌گذاری](../standards/naming-conventions) | قراردادهای نام‌گذاری کامل |
