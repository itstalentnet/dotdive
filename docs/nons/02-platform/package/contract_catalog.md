# سیاست قراردادها

**Contract Catalog Policy**

نسخه 2.0 | مرجع رسمی قراردادهای ارتباطی سیستم

> **به‌روزرسانی:** با تصویب ADR-Platform-001، قراردادهای مشترک پلتفرم از TypeScript به Protocol Buffers مهاجرت کرده‌اند. این سند بر اساس معماری جدید به‌روز شده است.

---

## 1. هدف

Contract Catalog مرجع رسمی تعریف و نگهداری قراردادهای ارتباطی بین سرویس‌ها است — شامل ساختار درخواست‌ها و پاسخ‌ها، قرارداد خطاها و قوانین نسخه‌بندی.

قراردادهای مشترک پلتفرم در قالب **Protocol Buffers** در `nons-api/contracts/` تعریف می‌شوند (منبع حقیقت). Bindingهای TypeScript و Go از طریق Code Generation (Buf) تولید می‌شوند.

---

## 2. لایه‌های قرارداد

### ۲.۱ Platform Contracts — `nons-api/contracts/`

قراردادهای مشترک پلتفرم که توسط Proto تعریف می‌شوند:

```text
contracts/
├── envelope.proto      # Event Envelope
├── registry.proto      # Service Registry
├── errors.proto        # Platform Error Codes
└── permissions.proto   # Permissions
```

منبع حقیقت: فایل‌های `.proto`
ابزار: Buf (lint, break check, generate)
Bindingها: در CI تولید و به عنوان Artifact توزیع می‌شوند

### ۲.۲ Domain Contracts — داخل سرویس‌ها

قراردادهای دامنه‌ای (مانند `CreateOrderRequest`, `PaymentResponse`) در داخل همان سرویس تعریف می‌شوند و به لایه پلتفرم منتقل نمی‌شوند.

```text
nons-api/services/order-service/contracts/
nons-api/services/payment-service/contracts/
```

مالک هر Domain Contract همان سرویس است.

---

## 3. قرارداد چیست؟

قرارداد مشخص می‌کند:

```text
چه داده‌ای

با چه ساختاری

بین چه اجزایی

مبادله می‌شود
```

---

## 4. فرمت قرارداد (Platform Contracts)

قراردادهای پلتفرم با **Protocol Buffers** تعریف می‌شوند:

```protobuf
// contracts/envelope.proto
message EventEnvelope {
  string event_name = 1;
  string event_version = 2;
  string trace_id = 3;
  string correlation_id = 4;
  int64 timestamp = 5;
  string producer = 6;
  bytes payload = 7;
}
```

```protobuf
// contracts/errors.proto
enum PlatformErrorCode {
  PLATFORM_ERROR_UNSPECIFIED = 0;
  PLATFORM_INTERNAL_ERROR = 1;
  PLATFORM_VALIDATION_ERROR = 2;
  PLATFORM_RATE_LIMIT_EXCEEDED = 3;
  PLATFORM_SERVICE_UNAVAILABLE = 4;
}
```

> Bindingهای TypeScript و Go از این فایل‌ها به صورت خودکار تولید می‌شوند. هیچ‌کس فایل‌های تولیدشده را دستی ویرایش نمی‌کند.

---

## 5. قراردادهای دامنه (Domain Contracts)

قراردادهای دامنه مختص هر سرویس هستند و در داخل آن سرویس تعریف می‌شوند. این بخش در مستندات سرویس مربوطه ثبت می‌شود.

مثال — سفارش:

```text
nons-api/services/order-service/docs/contracts.md
```

**مالک:** order-service

مثال — پرداخت:

```text
nons-api/services/payment-service/docs/contracts.md
```

**مالک:** payment-service

---

## 6. نسخه‌بندی

همان سیاست Semantic Versioning موجود اعمال می‌شود (نیاز به ایجاد سیاست جدید نیست).

تغییر در Proto:

```text
- افزودن فیلد جدید ← MINOR (غیرمخرب)
- حذف یا تغییر فیلد ← MAJOR (مخرب)
```

تغییر در Domain Contract:

```text
- هر سرویس طبق سیاست نسخه‌بندی خود
```

---

## 7. مالکیت

| قرارداد                | مالک             | لایه     |
| ---------------------- | ---------------- | -------- |
| EventEnvelope          | Platform Team    | Platform |
| Error Codes (Platform) | Platform Team    | Platform |
| Permissions            | Platform Team    | Platform |
| CreateOrder            | order-service    | Domain   |
| PaymentRequest         | payment-service  | Domain   |
| ConvertRequest         | currency-service | Domain   |

---

## 8. حذف قرارداد

حذف مستقیم ممنوع است.

قرارداد فقط می‌تواند:

```text
Deprecated
```

شود.

---

## 9. اصل مرجع واحد

Contract Catalog تنها مرجع معتبر برای تمام قراردادهای ارتباطی سیستم است.

هیچ سرویسی نباید قرارداد اختصاصی و مستندسازی‌نشده ایجاد کند.

---

## 10. قراردادهای جدید — Currency Service

### GET /rates

دریافت نرخ‌های لحظه‌ای همه ارزهای پشتیبانی‌شده.

**مالک:** currency-service — domain contract

```ts
// services/currency-service/docs/contracts.md
export interface GetRatesResponse {
  USD_IRR: number;
  USD_TRY: number;
  USD_EUR: number;
  updatedAt: string;
}
```

### POST /convert

**مالک:** currency-service — domain contract

```ts
export interface ConvertRequest {
  amount: number;
  from: "USD" | "IRR" | "TRY" | "EUR";
  to: "USD" | "IRR" | "TRY" | "EUR";
}

export interface ConvertResponse {
  result: number;
  rate: number;
  rateAt: string;
}

export interface ConvertError {
  code: "UNSUPPORTED_PAIR" | "RATE_UNAVAILABLE" | "INVALID_AMOUNT";
  message: string;
}
```

---

## 11. قراردادهای جدید — Settlement Service

### CommissionRule

**مالک:** settlement-service — domain contract

```ts
export interface CommissionRule {
  sellerTier: "standard" | "premium" | "enterprise";
  rate: number;
  minAmountUsdCents: number;
  maxAmountUsdCents: number;
}
```

### SettlementRequest

**مالک:** settlement-service — domain contract

```ts
export interface SettlementRequest {
  sellerId: string;
  type: "automatic" | "manual";
  periodStart?: string;
  periodEnd?: string;
}
```

### RefundRequest

**مالک:** settlement-service — domain contract

```ts
export interface RefundRequest {
  orderId: string;
  reason: string;
  initiatedBy: "system" | "admin" | "dispute";
}
```
