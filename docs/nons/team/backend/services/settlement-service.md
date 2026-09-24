---
layout: doc
title: Settlement Service
description: کمیسیون، تسویه فروشنده و مدیریت refund
version: 1.0.0
status: BLUEPRINT
author: xoxxel
owner: xoxxel
created_at: 2026-06-11
updated_at: 2026-06-11
tags:
  - Backend
  - Service
  - Settlement
  - Blueprint
reviewers:
  - Backend Team
---

# Settlement Service

> **Blueprint v1.0 — پیش از توسعه**

---

## 1. هدف سرویس

مدیریت چرخه مالی پس از تحویل سفارش: محاسبه کمیسیون پلتفرم بر اساس seller_tier، انتقال سهم فروشنده از escrow به seller_wallet از طریق TigerBeetle، تسویه دوره‌ای خودکار و دستی، و مدیریت refund و برگشت وجه.

---

## 2. مسئولیت‌ها

- گوش دادن به رویداد `nons.order.delivered` و شروع فرآیند تسویه
- محاسبه کمیسیون پلتفرم بر اساس seller_tier (standard ۱۰٪، premium ۷٪، enterprise ۵٪)
- انتقال سهم فروشنده از escrow به seller_wallet در TigerBeetle
- انتقال کمیسیون از escrow به platform_revenue در TigerBeetle
- تسویه دوره‌ای خودکار (هفتگی/ماهانه) از طریق cron job
- تسویه دستی به درخواست فروشنده
- مدیریت refund و chargeback
- انتشار رویدادهای `nons.settlement.completed`، `nons.settlement.refund.initiated`، `nons.settlement.commission.calculated`
- استفاده از currency-service برای تبدیل ارز تسویه

---

## 3. حوزه (Scope)

**در این سرویس:**
- محاسبه کمیسیون سکو به ازای هر سفارش
- انتقال سهم فروشنده از escrow به seller_wallet
- تسویه خودکار دوره‌ای
- تسویه دستی به درخواست فروشنده
- مدیریت refund و chargeback
- صدور صورت‌حساب برای فروشنده

**نیست در این سرویس:**
- دریافت وجه از gateway (مسئولیت payment-service)
- مدیریت کیف پول کاربر (مسئولیت wallet-service)
- نرخ ارز (مسئولیت currency-service)

---

## 4. تکنولوژی

| مؤلفه | فناوری |
|---|---|
| زبان | Node.js / NestJS |
| دیتابیس | TigerBeetle (Double-Entry Ledger) |
| کش | Redis (queues) |

---

## 5. قراردادهای داده

### CommissionRule

```typescript
interface CommissionRule {
  sellerTier: 'standard' | 'premium' | 'enterprise'
  rate: number              // درصد کمیسیون (مثلاً ۱۰ = ۱۰%)
  minAmountUsdCents: bigint // حداقل کمیسیون
  maxAmountUsdCents: bigint // حداکثر کمیسیون
}
```

### SettlementRequest

```typescript
interface SettlementRequest {
  sellerId: string
  type: 'automatic' | 'manual'
  periodStart?: string
  periodEnd?: string
}
```

### RefundRequest

```typescript
interface RefundRequest {
  orderId: string
  reason: string
  initiatedBy: 'system' | 'admin' | 'dispute'
}
```

---

## 6. رویدادها

### مصرف‌شونده (Inbound)

| رویداد | مالک | توضیح |
|---|---|---|
| `nons.order.delivered` | order-service | سفارش تحویل شد — شروع تسویه |
| `nons.payment.confirmed` | payment-service | پرداخت تأیید شد |

### منتشرشونده (Outbound)

| رویداد | مصرف‌کنندگان | توضیح |
|---|---|---|
| `nons.settlement.completed` | wallet-service, notification-service, analytics-service | تسویه انجام شد |
| `nons.settlement.refund.initiated` | wallet-service, notification-service | فرآیند refund شروع شد |
| `nons.settlement.commission.calculated` | analytics-service | کمیسیون محاسبه شد |

---

## 7. تراکنش‌های TigerBeetle

```
debit:  escrow
credit: seller_wallet
credit: platform_revenue
```

| حساب | توضیح |
|---|---|
| escrow | وجه منتظر تحویل سفارش |
| seller_wallet | کیف پول فروشنده |
| platform_revenue | درآمد سکو (کمیسیون) |

---

## 8. نرخ کمیسیون بر اساس Seller Tier

| Tier | نرخ | حداقل (cents) | حداکثر (cents) |
|---|---|---|---|
| standard | ۱۰٪ | ۱۰۰۰ | ۵۰۰۰۰ |
| premium | ۷٪ | ۵۰۰ | ۱۰۰۰۰۰ |
| enterprise | ۵٪ | ۰ | نامحدود |

settlement-service سطح فروشنده را از IAM-service دریافت می‌کند.

---

## 9. وابستگی‌ها

| وابستگی | نوع |
|---|---|
| order-service | رویداد `nons.order.delivered` |
| payment-service | رویداد `nons.payment.confirmed` |
| currency-service | تبدیل ارز تسویه |
| wallet-service | به‌روزرسانی موجودی seller_wallet |
| IAM-service | دریافت seller_tier |
| TigerBeetle | ثبت تراکنش‌های مالی |

---

## 10. الزامات Idempotency

هر `settlement_id` باید فقط یکبار پردازش شود. اگر تسویه失敗 شد، سفارش در وضعیت `RELEASED` می‌ماند و تسویه در صف بعدی مجدداً تلاش می‌شود.

---

## 11. خطا و Retry

**TigerBeetle:**

| سناریو | رفتار |
|---|---|
| TigerBeetle در دسترس نیست (connection refused) | Retry با backoff |
| TigerBeetle timeout | Retry با backoff |
| تراکنش تکراری | تشخیص توسط unique `id` — نادیده گرفته می‌شود (idempotency) |
| موجودی ناکافی در حساب | خطای کسب‌وکار — بررسی دستی |
| عدم تطابق debit/credit | خطای بحرانی — لاگ + اخطار تیم |

**Retry policy:**

| تلاش | تأخیر | اقدام |
|---|---|---|
| ۱ | ۲ ثانیه | Retry تراکنش TigerBeetle |
| ۲ | ۱۰ ثانیه | Retry |
| ۳ | ۶۰ ثانیه | آخرین تلاش |
| پس از ۳ تلاش | — | رویداد به DLQ + اخطار DevOps |

---

## 12. مسیر توسعه

| مرحله | وضعیت |
|---|---|
| Blueprint | ✅ تکمیل |
| Demo | ⏳ در انتظار |
| توسعه | ❌ شروع نشده |
| تست | ❌ شروع نشده |
| انتشار | ❌ شروع نشده |
