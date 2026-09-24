---
layout: doc
title: استاندارد لاگ‌نویسی
description: JSON ساختاریافته، سطوح لاگ، فیلدهای اجباری و قوانین PII
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-07
tags:
  - Backend
  - Standard
  - Logging
  - Observability
reviewers:
  - Backend Team
  - Devops
---

# استاندارد لاگ‌نویسی

**Logging Standard**

نسخه 1.0 | الزامی برای همه سرویس‌ها

> **تفکیک قرارداد از پیاده‌سازی:**  
> این سند **قرارداد (Logging Contract)** را تعریف می‌کند — یعنی لاگ‌ها **باید** چه ساختاری داشته باشند.  
> این بخش تنها قرارداد، ساختار و فیلدهای اجباری را تعریف می‌کند.  
> **پیاده‌سازی لاگر نیست** — انتخاب کتابخانه و نحوه پیاده‌سازی لاگر (Logger Implementation) **آزاد** است.  
> پیشنهاد: Go ← `slog`، Node.js ← `pino`، Python ← `structlog`  
> قرارداد نهایی در `nons-api/packages/logging` به صورت types و interfaces پیاده‌سازی می‌شود. هیچ پیاده‌سازی اجرایی در این پکیج وجود ندارد.
> **نکته:** Logging Contract خارج از محدوده ADR-Platform-001 است و به Proto مهاجرت نمی‌کند. این یک قرارداد استاندارد خروجی است، نه قرارداد انتقال داده بین سرویس‌ها.

---

## Log Contract (قرارداد ثبت وقایع)

### 1. منطق قرارداد

هر لاگ یک **شی JSON** است با ساختار زیر. این قرارداد بین همه سرویس‌ها الزامی است.

```typescript
// قرارداد LogEntry — مبنای اعتبارسنجی همه لاگ‌ها
interface LogEntry {
  // MUST — همیشه وجود داشته باشد
  level: "debug" | "info" | "warn" | "error";
  timestamp: string; // ISO 8601 UTC, مثال: "2024-01-01T12:00:00.000Z"
  service: string; // نام سرویس, مثال: "order-service"
  traceId: string; // شناسه یکتای ردیابی — MUST در همه لاگ‌ها
  message: string; // پیام انگلیسی, بدون placeholder

  // SHOULD — در صورت وجود، الزامات زیر را رعایت کند
  context?: Record<string, unknown>; // داده‌های ساختاریافته, بدون PII
  error?: {
    // فقط در سطح error
    code: string; // کد خطای یکپارچه
    message: string; // پیام خطا
    stack?: string; // stack trace (فقط در توسعه)
  };

  // MUST NOT — هرگز وجود نداشته باشد
  // email, phone, name, password, token, secret, creditCard
}
```

### 2. فیلدهای قرارداد

| فیلد                | سطح الزام                | نوع                                   | اعتبارسنجی                                                   | مثال                                                 |
| ------------------- | ------------------------ | ------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `level`             | **MUST**                 | `enum("debug","info","warn","error")` | یکی از ۴ مقدار مجاز                                          | `"info"`                                             |
| `timestamp`         | **MUST**                 | `string`                              | الگوی `ISO 8601 UTC` با پسوند Z                              | `"2024-01-01T12:00:00.000Z"`                         |
| `service`           | **MUST**                 | `string`                              | نام سرویس مطابق با repository-structure                      | `"order-service"`                                    |
| `traceId`           | **MUST**                 | `string`                              | شناسه ردیابی — propagate شده از درخواست اولیه                | `"trace_abc123def456"`                               |
| `message`           | **MUST**                 | `string`                              | حداکثر ۲۰۰ کاراکتر، انگلیسی، بدون interpolated data          | `"Order created successfully"`                       |
| `context`           | **SHOULD**               | `object`                              | بدون PII، بدون توکن/رمز                                      | `{ "orderId": "...", "amount": 150 }`                |
| `error`             | **SHOULD** (error level) | `object`                              | فقط در سطح `error`                                           | `{ "code": "ESCROW_LOCK_FAILED", "message": "..." }` |
| ~~`correlationId`~~ | ~~**MUST**~~             | ~~`string`~~                          | **منسوخ (Deprecated)** — به جای آن از `traceId` استفاده کنید | —                                                    |

> **MUST** = الزامی - رعایت نشدن مساوی نقض قرارداد  
> **SHOULD** = توصیه‌شده - در صورت وجود باید مطابق استاندارد باشد  
> **MUST NOT** = ممنوع - لاگ حاوی این مقادیر مردود است

### 3. خروجی مورد انتظار (Expected Output)

هر سرویس باید لاگ‌هایی با **دقیقاً** این ساختار تولید کند:

```json
{
  "level": "info",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "order-service",
  "traceId": "trace_abc123def456",
  "message": "Order created successfully",
  "context": {
    "orderId": "018e1234-...",
    "sellerId": "018e1234-...",
    "amount": 150.0
  }
}
```

**خطا:**

```json
{
  "level": "error",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "service": "order-service",
  "traceId": "trace_abc123def456",
  "message": "Failed to process order payment",
  "context": {
    "orderId": "018e1234-..."
  },
  "error": {
    "code": "ESCROW_LOCK_FAILED",
    "message": "Insufficient balance",
    "stack": "at PaymentService.lock (payment.ts:42)"
  }
}
```

---

## 4. سطوح لاگ (Log Levels)

| سطح     | مقدار `level` | الزام              | زمان استفاده                    |
| ------- | ------------- | ------------------ | ------------------------------- |
| `debug` | `"debug"`     | SHOULD (فقط توسعه) | جزئیات عیب‌یابی — هرگز در تولید |
| `info`  | `"info"`      | MUST               | رویدادهای عادی کسب‌وکار         |
| `warn`  | `"warn"`      | MUST               | غیرمنتظره اما قابل بازیابی      |
| `error` | `"error"`     | MUST               | شکست‌هایی که نیاز به توجه دارند |

```typescript
// ✅ مطابق قرارداد
logger.info("Order created", { orderId, sellerId, amount });
logger.warn("Payment gateway timeout", { orderId, retryCount: 3 });
logger.error("Failed to release escrow", { orderId, error: err.message });

// ❌ نقض قرارداد
logger.log("Order created"); // بدون level
console.log("Order created", orderId); // بدون ساختار JSON
logger.info(`Order ${orderId} created`); // interpolated data در message
```

---

## 5. قوانین قرارداد

| قانون                      | سطح الزام | توضیح                                                             |
| -------------------------- | --------- | ----------------------------------------------------------------- |
| **JSON ساختاریافته**       | MUST      | همه لاگ‌ها در تولید JSON باشند                                    |
| **همه فیلدهای MUST**       | MUST      | وجود `level`, `timestamp`, `service`, `traceId`, `message` الزامی |
| **بدون PII**               | MUST NOT  | ایمیل، تلفن، نام، آدرس، اطلاعات پرداخت ممنوع                      |
| **بدون رمز/توکن**          | MUST NOT  | password, token, secret, apiKey, creditCard ممنوع                 |
| **message بدون داده**      | MUST      | داده‌ها در `context` قرار گیرند، نه درون `message`                |
| **UTC timestamp**          | MUST      | همه timestampها با پسوند Z                                        |
| **debug غیرفعال در تولید** | SHOULD    | با متغیر `LOG_LEVEL` کنترل شود                                    |
| **خطا شامل error object**  | SHOULD    | خطاهای `error` level شامل `code` و `message`                      |

```typescript
// ✅ مطابق قرارداد — بدون PII
logger.info("User registered", { userId, role });

// ❌ نقض قرارداد — شامل PII
logger.info("User registered", { email: "user@example.com", phone: "0912..." });

// ❌ نقض قرارداد — شامل رمز
logger.info("Login successful", { password: "12345" });
```

---

## 6. Logger Implementation (پیاده‌سازی)

انتخاب کتابخانه لاگر **آزاد** است. جدول زیر صرفاً پیشنهاد است:

| زبان               | کتابخانه پیشنهادی       |
| ------------------ | ----------------------- |
| Go                 | `slog`, `zap`, `logrus` |
| TypeScript/Node.js | `pino`, `winston`       |
| Python             | `structlog`, `loguru`   |

> هر کتابخانه‌ای که انتخاب شود، خروجی نهایی **باید** با Log Contract تعریف‌شده در بخش‌های ۱-۳ مطابقت داشته باشد.

---

## 7. پیکربندی

| متغیر محیط  | مقدار پیش‌فرض | توضیح                                           |
| ----------- | ------------- | ----------------------------------------------- |
| `LOG_LEVEL` | `info`        | فیلتر سطح لاگ: `debug`, `info`, `warn`, `error` |

```bash
# توسعه محلی — همه لاگ‌ها
LOG_LEVEL=debug

# تولید — رویدادها، هشدارها و خطاها
LOG_LEVEL=info
```

---

## خلاصه قرارداد

| مورد            | سطح الزام | قانون                                                 |
| --------------- | --------- | ----------------------------------------------------- |
| فرمت            | MUST      | JSON ساختاریافته                                      |
| فیلدهای MUST    | MUST      | `level`, `timestamp`, `service`, `traceId`, `message` |
| فیلدهای SHOULD  | SHOULD    | `context`, `error`                                    |
| PII             | MUST NOT  | ایمیل، تلفن، نام، اطلاعات پرداخت ممنوع                |
| رمز/توکن        | MUST NOT  | هرگز لاگ نشود                                         |
| سطوح مجاز       | MUST      | فقط `debug`, `info`, `warn`, `error`                  |
| داده در context | MUST      | `message` بدون interpolated data                      |
| خطاها           | SHOULD    | شامل `error.code` و `error.message`                   |
