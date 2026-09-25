---
layout: doc
title: استاندارد چرخه فروش، پرداخت و تسویه
description: مدل نهایی Order–Payment–Settlement–Wallet Flow — جداسازی کامل چهار دامنه
version: 1.1.0
status: PRIVATE
author: Platform Team
owner: Platform Team
created_at: 2026-06-10
updated_at: 2026-06-11
tags:
  - Platform
  - Architecture
  - Order
  - Payment
  - Wallet
reviewers:
  - Backend Team
  - Product Team
  - Devops
---

# استاندارد چرخه فروش، پرداخت و تسویه
**Order–Payment–Settlement–Wallet Flow**

نسخه 1.0 | جایگزین مدل‌های قبلی OrderStatus و PaymentFlow پراکنده

---

## 1. هدف سند

این سند، مدل استاندارد و نهایی چرخه کامل فروش در سیستم NONS را تعریف می‌کند و جایگزین تمام برداشت‌های قبلی از:

- Order Statusهای ترکیبی (حاوی Escrow)
- Escrow در Order Service
- تسویه مستقیم در Payment Service

می‌شود.

---

## 2. اصل معماری (Core Principle)

### ❗ جداسازی کامل سه دامنه مستقل

سیستم فروش از 3 دامنه کاملاً جدا تشکیل می‌شود:

```text
1. Order Domain        → وضعیت کسب‌وکار معامله
2. Payment Domain      → مدیریت پرداخت و Escrow
3. Settlement Domain   → کمیسیون، تسویه فروشنده، مدیریت refund
4. Wallet Domain       → نگهداری و مدیریت موجودی مالی
```

---

## 3. Wallet Service (سرویس کیف پول)

### نقش

Wallet Service **تنها منبع حقیقت (Source of Truth)** برای موجودی مالی کاربران است.

### مسئولیت‌ها

- نگهداری موجودی کاربران (Balance)
- ثبت تراکنش‌های مالی (Ledger)
- مدیریت ورود و خروج پول
- نگهداری درآمد فروشندگان
- مدیریت برداشت (Withdrawal)

### ❌ چه کاری انجام نمی‌دهد

- پردازش پرداخت (Payment Processing)
- اتصال به درگاه پرداخت
- مدیریت سفارش
- مدیریت اختلاف

### ارتباط Wallet با Payment

```text
Payment Service → Wallet Service (only for balance mutation)
```

---

## 4. Payment Service (اصلاح شده)

### نقش

Payment Service فقط مسئول:

- دریافت پول از کاربر
- نگهداری پول در حالت Escrow
- آزادسازی یا برگشت پول به Wallet

### Payment مالک پول نیست
Wallet مالک پول است. Payment فقط پول را بین حالت‌ها جابه‌جا می‌کند.

### وضعیت‌های Payment

```ts
enum PaymentStatus {
  PENDING = 'PENDING',
  ESCROW_HELD = 'ESCROW_HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}
```

---

## 5. Order Service (اصلاح شده)

### نقش

Order فقط نماینده «فرآیند تجاری معامله» است.

### Order چه چیزی نیست

- مسئول پول نیست
- مسئول escrow نیست
- مسئول کیف پول نیست

### وضعیت‌های Order

```ts
enum OrderStatus {
  CREATED = 'CREATED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}
```

---

## 6. چرخه کامل فروش (Final Flow)

### 🟢 مرحله 1: ایجاد سفارش

```text
Order: CREATED
```

Event: `nons.order.created`

---

### 🟡 مرحله 2: پرداخت و قفل پول (Escrow)

```text
Payment: PENDING → ESCROW_HELD
```

Event: `nons.payment.escrow.held`

---

### 🟡 مرحله 3: تحویل کالا

```text
Order: CREATED → ACTIVE
```

Event: `nons.order.fulfillment.completed`

---

### 🟠 مرحله 4: تأیید

سه حالت تأیید:

- **A: تأیید کاربر** — `buyer.confirmed = true`
- **B: تأیید ادمین** — پس از پایان دوره ضمانت ۲۴ ساعته، `system.confirmed = true`
- **C: Auto-confirm** — این رویکرد وجود دارد ولی در این فاز فعال نیست. توسط ادمین در پرفورمنس فعال می‌شود

---

### 🟢 مرحله 5: آزادسازی پول

```text
Payment:  ESCROW_HELD → RELEASED
Wallet:   balance(seller) += amount
```

Events:
- `nons.payment.released`
- `nons.wallet.credit.posted`

---

### 🟢 مرحله 6: تسویه فروشنده (Settlement)

```text
Settlement: commission calculated → seller settled
TigerBeetle: escrow → seller_wallet
TigerBeetle: escrow → platform_revenue
```

Events:
- `nons.settlement.completed`
- `nons.settlement.commission.calculated`

همچنین این رویداد از سمت payment-service شنیده می‌شود:
- `nons.payment.confirmed` (contains rate_at_payment, amount_local, provider)

> settlement-service پس از آزادسازی پول از Escrow، کمیسیون پلتفرم را کسر می‌کند و باقی را به seller_wallet تسویه می‌کند. تسویه به صورت دوره‌ای (خودکار) یا با درخواست دستی فروشنده انجام می‌شود.

---

### 🔴 مرحله 7: لغو سفارش (قبل از تحویل)

```text
Payment:  ESCROW_HELD → REFUNDED
Wallet:   balance(buyer) += amount
```

Event: `nons.payment.refunded`

---

### ⚠️ مرحله 8: اختلاف (Dispute)

```text
Order:    → DISPUTED
Payment:  → FROZEN
Wallet:   → no change
```

تصمیم نهایی توسط: `dispute-service`

پس از رأی:
- به نفع خریدار → `Payment: REFUNDED` → `Wallet: balance(buyer) += amount`
- به نفع فروشنده → `Payment: RELEASED` → `Wallet: balance(seller) += amount`

---

## 7. قوانین مهم معماری (Critical Rules)

| قانون | توضیح |
|---|---|
| ❌ Order پول را مدیریت نمی‌کند | Order هیچ اطلاعی از escrow، wallet، balance ندارد |
| ❌ Payment مالک پول نیست | Payment فقط پول را بین حالت‌ها جابه‌جا می‌کند |
| ❌ Wallet تنها منبع پول است | تمام balanceها فقط در Wallet است |

---

## 8. تغییر مهم (Breaking Change)

### 🧨 حذف مفهوم Escrow از Order

```text
❌ قبلی: OrderStatus.ESCROW_LOCKed
✅ جدید: PaymentStatus.ESCROW_HELD
```

---

## 9. رویدادهای سیستم

### Domain: Order

| رویداد | توضیح |
|---|---|
| `nons.order.created` | سفارش جدید ایجاد شد |
| `nons.order.fulfillment.completed` | کالا تحویل داده شد |
| `nons.order.completed` | سفارش تکمیل شد |
| `nons.order.cancelled` | سفارش لغو شد |
| `nons.order.disputed` | سفارش وارد اختلاف شد |

### Domain: Payment

| رویداد | توضیح |
|---|---|
| `nons.payment.escrow.held` | وجه در Escrow قفل شد |
| `nons.payment.released` | وجه از Escrow آزاد شد |
| `nons.payment.refunded` | وجه به خریدار برگشت داده شد |

### Domain: Settlement

| رویداد | توضیح |
|---|---|
| `nons.payment.confirmed` | پرداخت تأیید شد — آغازگر settlement |
| `nons.settlement.completed` | تسویه فروشنده انجام شد |
| `nons.settlement.refund.initiated` | برگشت وجه شروع شد |
| `nons.settlement.commission.calculated` | کمیسیون محاسبه شد |

### Domain: Wallet

| رویداد | توضیح |
|---|---|
| `nons.wallet.credit.posted` | بستانکاری به حساب واریز شد |
| `nons.wallet.debit.posted` | بدهکاری از حساب کسر شد |
| `nons.wallet.withdrawal.requested` | درخواست برداشت ثبت شد |

---

## 10. جایگاه Wallet Service در معماری

```text
لایه کسب‌وکار (Business Layer):
- Marketplace Service
- Order Service
- Payment Service
- Wallet Service
- Currency Service      ← NEW
- Settlement Service    ← NEW
- Chat Service
```

---

## 11. تعامل بین سرویس‌ها

```text
Order Service ──→ Payment Service       (trigger payment)
Payment Service ──→ Currency Service    (currency conversion at payment)
Payment Service ──→ Wallet Service      (balance mutation)
Payment Service ──→ Settlement Service  (payment.confirmed → trigger settlement)
Settlement Service ──→ Currency Service (currency conversion for settlement)
Settlement Service ──→ Wallet Service   (commission + seller balance)
Dispute Service ──→ Payment + Wallet    (override decisions)
```

---

## 12. اصل طلایی جدید سیستم

```text
Order ≠ Money
Payment ≠ Ownership
Wallet = Truth of Funds
```

---

## 13. معماری نهایی سرویس‌های مالی

```text
payment-service
      │
      ├── currency-service   ← تبدیل ارز
      │
      ├── wallet-service     ← pass-through کیف پول
      │         │
      │         ▼
      │   TigerBeetle
      │   buyer_wallet → escrow
      │
      └── NATS: payment.confirmed.v1
                │
                ▼
        settlement-service
              │
              ├── currency-service   ← تبدیل ارز تسویه
              │
              ├── TigerBeetle
              │   escrow → seller_wallet
              │   escrow → platform_revenue
              │
              └── NATS: settlement.completed.v1
```
