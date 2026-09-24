---
layout: doc
title: قراردادهای نام‌گذاری
description: استاندارد نام‌گذاری فایل‌ها، دیتابیس، متغیرهای محیط، Docker، NATS، API و کد
version: 1.0.0
status: PRIVATE
author: xoxxel
owner: xoxxel
created_at: 2026-06-07
updated_at: 2026-06-15
tags:
  - Backend
  - Standard
  - Naming
  - Convention
reviewers:
  - Backend Team
---

# قراردادهای نام‌گذاری
**Naming Conventions**

نسخه 1.0 | الزامی برای همه سرویس‌ها، پکیج‌ها و مشارکت‌کنندگان

---

## 1. فایل‌ها و پوشه‌ها

| زمینه | قرارداد | مثال |
|---|---|---|
| پوشه‌ها | `kebab-case` | `order-service/`, `auth-service/` |
| فایل‌های TypeScript | `kebab-case` | `order.controller.ts`, `create-order.dto.ts` |
| فایل‌های Go | `snake_case` | `order_handler.go`, `create_order.go` |
| فایل‌های Python | `snake_case` | `order_service.py`, `create_order.py` |
| فایل‌های تنظیمات | `kebab-case` | `tsconfig.json`, `jest.config.ts` |
| فایل‌های محیطی | `.env.{environment}` | `.env.development`, `.env.test` |
| فایل‌های تست | `{name}.test/spec.{ext}` | `order.service.test.ts` |
| فایل‌های مهاجرت | `{timestamp}_{description}` | `20240101_create_orders_table.sql` |

> **نکته:** نام فایل‌ها و پوشه‌ها همیشه انگلیسی و ترجیحاً تک‌کلمه‌ای یا با خط تیره هستند.

---

## 2. پایگاه داده

| زمینه | قرارداد | مثال |
|---|---|---|
| نام دیتابیس | `{service}_db` | `auth_db`, `order_db`, `payment_db` |
| نام جدول | `snake_case` جمع | `orders`, `product_versions`, `escrow_holds` |
| نام ستون | `snake_case` | `created_at`, `seller_id`, `escrow_amount_cents` |
| نام ایندکس | `idx_{table}_{column}` | `idx_orders_seller_id` |
| کلید خارجی | `fk_{table}_{ref_table}` | `fk_orders_products` |
| کلید اصلی | همیشه `id` | `id UUID PRIMARY KEY` |
| کلید یکتا | `uq_{table}_{column}` | `uq_users_email` |
| ستون زمان | `{action}_at` | `created_at`, `updated_at`, `deleted_at` |

```sql
-- ✅ درست
CREATE TABLE order_snapshots (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_version_id UUID NOT NULL,
    escrow_amount_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_snapshots_order_id ON order_snapshots(order_id);
ALTER TABLE order_snapshots ADD CONSTRAINT fk_order_snapshots_orders
    FOREIGN KEY (order_id) REFERENCES orders(id);

-- ❌ غلط
CREATE TABLE OrderSnapshot (
    OrderID uuid,
    productVersion uuid,
    createdAt timestamp
);
```

---

## 3. متغیرهای محیطی (Environment Variables)

فرمت: `{SERVICE}_{CATEGORY}_{NAME}` — همیشه `SCREAMING_SNAKE_CASE`

```bash
# ✅ درست
AUTH_DB_URL=postgres://localhost:5432/auth_db
AUTH_JWT_SECRET=my-secret-key
AUTH_JWT_EXPIRY=15m
AUTH_REFRESH_TOKEN_EXPIRY=7d
ORDER_DB_URL=postgres://localhost:5432/order_db
ORDER_REDIS_URL=redis://localhost:6379
ORDER_GUARANTEE_TIMEOUT_HOURS=24
PAYMENT_DB_URL=postgres://localhost:5432/payment_db
PAYMENT_ESCROW_RELEASE_DELAY_MS=5000
NATS_URL=nats://localhost:4222
NATS_CLUSTER_ID=nons-cluster

# ❌ غلط
DATABASE_URL=                    # مشخص نیست متعلق به کدام سرویس است
jwtSecret=my-secret-key          # فرمت اشتباه
db_url=postgres://localhost:5432 # فرمت اشتباه
PAYMENT_escrow_url=              # فرمت ترکیبی
```

**قوانین:**
- همه متغیرها با نام سرویس شروع می‌شوند
- از زیرخط (`_`) برای جداکننده استفاده کنید
- مقدار پیش‌فرض در `.env.example` قرار می‌گیرد
- هیچوقت مقدار واقعی در `.env.example` نگذارید

---

## 4. ایمیج‌های داکر (Docker Images)

فرمت: `nons/{service-name}:{version}`

```
nons/auth:1.0.0
nons/marketplace:1.0.0
nons/order:1.0.0
nons/payment:1.0.0
nons/chat:1.0.0
nons/dispute:1.0.0
nons/notification:1.0.0
```

**قوانین:**
- همیشه از `nons/` به عنوان namespace استفاده کنید
- تگ `latest` ممنوع — همیشه از نسخه دقیق استفاده کنید
- برای پیش‌نمایش از تگ `{version}-alpha` یا `{version}-rc` استفاده کنید

---

## 5. موضوعات NATS (رویدادها)

فرمت: `nons.<domain>.<entity>.<past_action>`

```
nons.auth.user.registered
nons.auth.user.logged_in
nons.auth.user.password_changed
nons.iam.user.suspended
nons.order.created
nons.order.fulfillment.completed
nons.payment.escrow.held
nons.payment.released
nons.product.published
nons.wallet.credit.posted
nons.dispute.opened
nons.dispute.resolved
nons.review.submitted
nons.moderation.user.flagged
nons.zone.score_updated
nons.boost.activated
nons.kyc.verified
```

**قوانین:**
- همیشه با `nons.` شروع شود
- domain و entity به صورت مفرد (`order` نه `orders`, `user` نه `users`)
- فعل در زمان گذشته ساده (`created` نه `create`)
- برای چندکلمه‌ای از زیرخط استفاده کنید (`score_updated`, `password_changed`)
- entity اختیاری است — برای domainهای ساده حذف می‌شود (`nons.order.completed`)
- sub-entity با dot اضافه می‌شود (`nons.payment.escrow.held`)
- حداکثر عمق: ۴ بخش بعد از `nons.`
- domain جدید فقط با ADR جدید قابل اضافه شدن است

> **نکته:** استاندارد کامل در `ADR-EVENT-001` ثبت شده است. این بخش خلاصه‌ای از آن تصمیم است.

---

## 6. مسیرهای API

فرمت: `/v{n}/{resource}/{id?}/{sub-resource?}`

```
GET    /v1/products
GET    /v1/products/:id
POST   /v1/products
PATCH  /v1/products/:id
DELETE /v1/products/:id
GET    /v1/orders/:id
POST   /v1/orders
PATCH  /v1/orders/:id/status
POST   /v1/disputes
GET    /v1/disputes/:id
POST   /v1/disputes/:id/verdict
```

**قوانین:**
| قانون | ✅ درست | ❌ غلط |
|---|---|---|
| اسم جمع | `/products` | `/product` |
| خط تیره برای چندکلمه‌ای | `/product-versions` | `/productVersions` |
| بدون فعل | `/orders/:id/status` | `/orders/:id/updateStatus` |
| زیر-منبع برای اقدامات خاص | `/orders/:id/dispute` | `/orders/:id/createDispute` |
| نسخه‌بندی | `/v1/products` | `/api/products` |

---

## 7. کدهای خطا (Error Codes)

فرمت: `SCREAMING_SNAKE_CASE` — Platform Error Codes از `nons-api/contracts/errors.proto`، Domain Error Codes از هر سرویس

```
ORDER_NOT_FOUND
ORDER_INVALID_STATUS
ORDER_PAYMENT_TIMEOUT
PAYMENT_ESCROW_LOCK_FAILED
PAYMENT_INSUFFICIENT_BALANCE
AUTH_TOKEN_EXPIRED
AUTH_INVALID_CREDENTIALS
USER_NOT_FOUND
USER_ALREADY_EXISTS
PRODUCT_NOT_FOUND
PRODUCT_INSUFFICIENT_STOCK
DISPUTE_ALREADY_RESOLVED
RATE_LIMIT_EXCEEDED
VALIDATION_ERROR
INTERNAL_ERROR
```

---

## 8. ساختار کلی

| موجودیت | قرارداد | مثال |
|---|---|---|
| پکیج / ماجول | `kebab-case` | `@nons/contracts`, `@nons/events` |
| فایل Proto | `snake_case` | `envelope.proto`, `registry.proto` |
| Proto package name | `reverse_domain.team.component` | `nons.platform.contracts.v1` |
| کلاس | `PascalCase` | `OrderService`, `PaymentGateway` |
| تابع | `camelCase` | `createOrder()`, `getUserById()` |
| متغیر | `camelCase` | `orderId`, `sellerWallet` |
| ثابت | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT` |
| اینترفیس TypeScript | `PascalCase` | `Order`, `UserPayload` |
| تایپ TypeScript | `PascalCase` | `OrderStatus`, `ApiResponse` |
| enum | `PascalCase` با مقادیر `snake_case` | `OrderStatus.PENDING` |
| فایل تست | `{name}.test.{ext}` | `order.service.test.ts` |
