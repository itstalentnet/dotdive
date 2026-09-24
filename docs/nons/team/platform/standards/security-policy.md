---
layout: doc
title: سیاست امنیت
description: امنیت کد، متغیرهای محیط، دیتابیس، JWT، Docker و پاسخ به خطا
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - Security
reviewers:
  - Backend Team
  - Devops
---

# سیاست امنیت
**Security Policy**

نسخه 1.0 | الزامی برای همه سرویس‌ها و مشارکت‌کنندگان

---

## 1. اصل اول

**هیچ رازی در کد — هرگز.**

---

## 2. متغیرهای محیطی (Environment Variables)

| قانون | توضیح |
|---|---|
| `.env.example` | باید با همه کلیدها و مقادیر placeholder وجود داشته باشد |
| `.env` در gitignore | `.env` و `.env.*` (به جز `.env.example` و `.env.test`) در `.gitignore` هستند |
| هیچ مقدار واقعی | در `.env.example` هرگز مقدار واقعی نگذارید |

```bash
# ✅ درست — .env.example
AUTH_DB_URL=postgres://user:password@localhost:5432/auth_db
AUTH_JWT_SECRET=your-secret-key-here
AUTH_JWT_EXPIRY=15m

# ❌ غلط — .env.example با کلید واقعی
AUTH_JWT_SECRET=my-real-production-secret-12345
```

---

## 3. ممنوعیت‌های کد

| ممنوعیت | توضیح | مثال ❌ |
|---|---|---|
| ID سخت‌کد شده | هیچ شناسه، توکن یا رمز عبور در کد | `const API_KEY = "sk-12345"` |
| آدرس داخلی سخت‌کد شده | آدرس‌های دیتابیس یا سرویس در کد | `const DB_URL = "postgres://..."` |
| `console.log` از داده‌های حساس | لاگ کردن توکن، رمز، email | `console.log("Token:", token)` |
| رمز عبور در لاگ | هرگز رمز عبور یا توکن را لاگ نکنید | `logger.info("Login: " + password)` |
| comment شامل راز | کامنت‌های حاوی API Key | `// TODO: use key sk-xxxx` |

---

## 4. امنیت دیتابیس

| قانون | توضیح |
|---|---|
| **Parameterized Queries** | همه کوئری‌ها از binding parameter استفاده کنند — بدون الحاق رشته |
| **حداقل دسترسی** | کاربر دیتابیس فقط دسترسی لازم را داشته باشد |
| **بدون SQL خام** | از ORM یا query builder استفاده کنید |

```typescript
// ✅ درست — Parameterized Query
const result = await db.query(
  'SELECT * FROM orders WHERE id = $1 AND seller_id = $2',
  [orderId, sellerId]
);

// ❌ غلط — String Concatenation
const result = await db.query(
  `SELECT * FROM orders WHERE id = '${orderId}'`
);
```

---

## 5. امنیت API

| قانون | توضیح |
|---|---|
| **Authentication** | همه endpoints (به جز Public) نیاز به توکن معتبر دارند |
| **Authorization** | بررسی مجوز در IAM از طریق `POST /v1/iam/authorization/check` — هر سرویس Permissions خود را در IAM ثبت می‌کند |
| **Rate Limiting** | محدودیت نرخ برای همه endpoints |
| **Input Validation** | اعتبارسنجی همه ورودی‌ها در gateway یا middleware |
| **CORS** | فقط دامنه‌های مجاز |

> **قاعده Permission Contract:** هر سرویس Permissions مورد نیاز خود را در IAM ثبت می‌کند. IAM را مستقیماً لاگین/نقش ذخیره نمی‌کند. مطالعه کامل: [استاندارد قرارداد مجوز](permission-contract-standard.md)

---

## 6. امنیت JWT

| مورد | مقدار |
|---|---|
| الگوریتم | `RS256` یا `HS256` |
| طول توکن دسترسی | حداکثر **۱۵ دقیقه** |
| طول توکن Refresh | حداکثر **۷ روز** |
| ذخیره سمت کلاینت | `HttpOnly` cookie (برای وب) |
| چرخش | هر بار استفاده از Refresh Token، توکن جدید صادر شود |

```typescript
// ✅ درست
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

// ❌ غلط — توکن طولانی
const accessToken = jwt.sign(payload, secret, { expiresIn: '30d' });
```

---

## 7. امنیت Cookie

| قانون | توضیح |
|---|---|
| `HttpOnly` | غیرقابل دسترسی از جاوااسکریپت |
| `Secure` | فقط از طریق HTTPS ارسال شود |
| `SameSite` | `Strict` یا `Lax` |
| `Path` | محدود به مسیرهای ضروری |

```typescript
// ✅ درست
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

---

## 8. امنیت Docker

| قانون | توضیح |
|---|---|
| **Non-root user** | کانتینر با کاربر `node` یا کاربر اختصاصی اجرا شود |
| **Alpine/Slim** | از تصاویر پایه حداقلی استفاده کنید |
| **اسکن امنیتی** | تصویر نهایی از نظر آسیب‌پذیری اسکن شود |
| **بدون راز در تصویر** | هیچ `.env` یا فایل راز در تصویر نباشد |

```dockerfile
# ✅ درست
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
```

---

## 9. پاسخ به خطا

| قانون | توضیح |
|---|---|
| بدون stack trace | هرگز stack trace یا خطاهای دیتابیس را نشان ندهید |
| پیام generic | `Internal server error` به جای جزئیات فنی |
| خطاهای امنیتی generic | `Invalid credentials` به جای `User not found` (جلوگیری از تشخیص username) |

```json
// ✅ درست
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid email or password", "details": [] } }

// ❌ غلط — بیش از حد اطلاعات
{ "error": { "code": "USER_NOT_FOUND", "message": "User with email x@y.com does not exist", "details": [] } }
```

---

## خلاصه

| حوزه | قانون اصلی |
|---|---|
| کد | هیچ رازی در کد نباشد |
| .env | `.env.example` با placeholder |
| دیتابیس | Parameterized Queries |
| JWT | Access Token: ۱۵m, Refresh Token: ۷d |
| Cookie | HttpOnly + Secure + SameSite |
| Docker | Non-root user |
| خطا | هرگز stack trace یا جزئیات فنی |
| Rate Limit | همه endpoints |

---

## 10. پیکربندی برون‌ریز (Externalized Configuration)

**Externalized Configuration**

### ۱۰.۱ تفاوت Configuration و Secret

Secrets (رمزها، کلیدها) با Configurations (timeout، retry، delay) تفاوت دارند — هر دو باید خارج از کد باشند اما جدا از هم مدیریت می‌شوند:

| نوع | ویژگی | مثال |
|-----|--------|------|
| **Secret** | محرمانه، دسترسی محدود، هرگز در git | `DB_PASSWORD`، `JWT_SECRET`، `API_KEY` |
| **Configuration** | غیرمحرمانه، مقدار پیش‌فرض دارد، در `.env.example` | `APP_TIMEOUT_MS`، `APP_MAX_RETRY`، `LOG_LEVEL`، `APP_ESCROW_RELEASE_DELAY_MS` |

> **فرمت env var:** مطابق [قراردادهای نام‌گذاری](../standards/naming-conventions#3-%D9%85%D8%AA%D8%BA%DB%8C%D8%B1%D9%87%D8%A7%DB%8C-%D9%85%D8%AD%DB%8C%D8%B7%DB%8C-environment-variables)، فرمت متغیرهای محیطی `{SERVICE}_{CATEGORY}_{NAME}` با `SCREAMING_SNAKE_CASE` است. در مثال‌های بالا `APP_` به عنوان پیشوند generic استفاده شده — در سرویس واقعی با نام سرویس جایگزین شود (مثلاً `ORDER_TIMEOUT_MS`).

### ۱۰.۲ فایل‌های env

هر سرویس باید دو فایل داشته باشد:

| فایل | در git | توضیح |
|------|--------|-------|
| `.env.example` | بله | مرجع توسعه‌دهنده — شامل همه کلیدها با مقادیر placeholder |
| `.env` | خیر | مقادیر واقعی محیط — مخصوص هر محیط (توسعه، استیجینگ، تولید) |

```bash
# .env.example — مرجع توسعه‌دهنده
APP_DB_HOST=localhost
APP_DB_PORT=5432
APP_DB_NAME=myapp_db
APP_DB_USER=user
APP_DB_PASSWORD=your-password-here

APP_TIMEOUT_MS=5000
APP_MAX_RETRY=3
LOG_LEVEL=debug
```

### ۱۰.۳ قانون hardcode

**اگر تغییر یک مقدار نیاز به build مجدد دارد، باید env var باشد.**

```typescript
// ❌ غلط — hardcoded configuration
const TIMEOUT = 5000;
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// ✅ درست — externalized
const TIMEOUT = parseInt(process.env.APP_TIMEOUT_MS ?? '5000', 10);
const MAX_RETRIES = parseInt(process.env.APP_MAX_RETRY ?? '3', 10);
```
